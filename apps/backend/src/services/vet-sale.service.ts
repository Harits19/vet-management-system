import { VetSaleModel, ProductModel, CustomerModel, PetModel, MedicalHistoryModel } from "../models/index.js";
import type { VetSaleCreateRequest, VetSaleFilter } from "@vet/shared";
import mongoose from "mongoose";

function generateReceiptNumber(prefix = "VET"): string {
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${datePart}${rand}`;
}

export async function createVetSale(input: VetSaleCreateRequest, cashierId: string, cashierName: string) {
  // Resolve customer
  const customer = await CustomerModel.findById(input.customerId);
  if (!customer) throw Object.assign(new Error("Customer not found"), { status: 404 });

  // Resolve pet if provided
  let petData: { _id: mongoose.Types.ObjectId; name: string; kind: string } | undefined;
  if (input.petId) {
    const pet = await PetModel.findById(input.petId);
    if (!pet) throw Object.assign(new Error("Pet not found"), { status: 404 });
    petData = { _id: pet._id, name: pet.name, kind: pet.kind };
  }

  // Build items
  const items: any[] = [];
  let totalCost = 0;
  let totalSelling = 0;

  for (const item of input.items) {
    const product = await ProductModel.findById(item.product._id);
    if (!product) throw Object.assign(new Error(`Product ${item.product._id} not found`), { status: 404 });

    const cost = (product.pricing.cost ?? 0) * item.quantity;
    const selling = item.pricing.selling * item.quantity;
    totalCost += cost;
    totalSelling += selling;

    items.push({
      product: { _id: product._id, name: product.product.name, type: product.type },
      quantity: item.quantity,
      pricing: { cost, selling, total: selling },
      dosage: item.dosage,
    });

    // Deduct stock only for physical products
    if (product.type === "physical" && (product.inventory.quantity ?? 0) >= item.quantity) {
      await ProductModel.updateOne({ _id: product._id }, { $inc: { "inventory.quantity": -item.quantity } });
    }
  }

  const profit = totalSelling - totalCost;
  const paid = input.paidAmount;
  const debt = Math.max(0, totalSelling - paid);
  const paymentStatus: "paid" | "debt" | "dp" = paid >= totalSelling ? "paid" : debt > 0 ? "debt" : "dp";

  const sale = await VetSaleModel.create({
    receiptNumber: generateReceiptNumber(),
    timestamp: new Date(),
    customer: { _id: customer._id, name: customer.name },
    pet: petData,
    medicalHistoryId: input.medicalHistoryId ? new mongoose.Types.ObjectId(input.medicalHistoryId) : undefined,
    cashier: { _id: new mongoose.Types.ObjectId(cashierId), name: cashierName },
    items,
    summary: { total: totalSelling, profit, cost: totalCost, paid },
    paymentStatus,
    paymentMethod: input.paymentMethod,
  });

  return sale.toObject() as any;
}

export async function createVetSaleFromMedicalHistory(
  medicalHistoryId: string,
  paidAmount: number,
  paymentMethod: string,
  cashierId: string,
  cashierName: string
) {
  const mh = await MedicalHistoryModel.findById(medicalHistoryId).populate("petId", "name kind customerId").lean();
  if (!mh) throw Object.assign(new Error("Medical history not found"), { status: 404 });

  const pet = mh.petId as any;
  const customerId = pet?.customerId?.toString();
  if (!customerId) throw Object.assign(new Error("Pet has no owner"), { status: 400 });

  const items: VetSaleCreateRequest["items"] = [
    ...(mh.treatments || []).map((t: any) => ({
      product: { _id: t.productId.toString(), name: t.name, type: "service" as const },
      quantity: 1,
      pricing: { cost: 0, selling: t.price, total: t.price },
    })),
    ...(mh.prescriptions || []).map((p: any) => ({
      product: { _id: p.productId.toString(), name: p.name, type: "physical" as const },
      quantity: p.quantity,
      pricing: { cost: 0, selling: p.price, total: p.price * p.quantity },
      dosage: p.dosage,
    })),
  ];

  return createVetSale(
    { customerId, petId: pet?._id?.toString(), medicalHistoryId: mh._id.toString(), paymentMethod, paidAmount, items },
    cashierId,
    cashierName
  );
}

export async function listVetSales(filter: VetSaleFilter) {
  const { page, limit, search, petId, customerId, startDate, endDate, sortBy, order } = filter;
  const query: any = {};
  if (search) query.receiptNumber = { $regex: search, $options: "i" };
  if (petId) query["pet._id"] = petId;
  if (customerId) query["customer._id"] = customerId;
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  const total = await VetSaleModel.countDocuments(query);
  const data = await VetSaleModel.find(query)
    .sort({ [sortBy]: order === "asc" ? 1 : -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  return { data: data as any, total, page, limit };
}

export async function getVetSale(id: string) {
  const sale = await VetSaleModel.findById(id).lean();
  if (!sale) throw Object.assign(new Error("Vet sale not found"), { status: 404 });
  return sale as any;
}

export async function deleteVetSale(id: string) {
  const sale = await VetSaleModel.findByIdAndDelete(id).lean();
  if (!sale) throw Object.assign(new Error("Vet sale not found"), { status: 404 });
  return sale as any;
}

export async function getDoctorDashboard() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const todayVisits = await MedicalHistoryModel.countDocuments({ visitDate: { $gte: startOfDay } });
  const recentRecords = await MedicalHistoryModel.find()
    .populate("petId", "name kind")
    .populate("doctorId", "name")
    .sort({ visitDate: -1 })
    .limit(10)
    .lean();
  const totalVisits = await MedicalHistoryModel.countDocuments();

  return { todayVisits, totalVisits, recentRecords: recentRecords as any };
}
