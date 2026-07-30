import { TransactionModel, ProductModel, CustomerModel, PetModel, MedicalHistoryModel } from "../models/index.js";
import type { TransactionCreateRequest, ShopCreateRequest, TransactionFilter } from "@vet/shared";
import mongoose from "mongoose";

function generateReceiptNumber(type: "shop" | "vet"): string {
  const prefix = type === "vet" ? "VET" : "INV";
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${datePart}${rand}`;
}

// ──────────────────────────────────────────
// Shop transaction — simplified productId input
// ──────────────────────────────────────────
export async function createShopTransaction(input: ShopCreateRequest, cashierId: string, cashierName: string) {
  const items: TransactionCreateRequest["items"] = [];
  let totalCost = 0;
  let totalSelling = 0;

  for (const item of input.items) {
    const product = await ProductModel.findById(item.productId);
    if (!product) throw Object.assign(new Error(`Product ${item.productId} not found`), { status: 404 });
    if (product.type !== "physical") throw Object.assign(new Error(`${product.product.name} not a physical product`), { status: 400 });
    if ((product.inventory.quantity ?? 0) < item.quantity)
      throw Object.assign(new Error(`Insufficient stock for ${product.product.name}`), { status: 400 });

    const cost = (product.pricing.cost ?? 0) * item.quantity;
    const selling = product.pricing.selling * item.quantity;
    totalCost += cost;
    totalSelling += selling;

    items.push({
      product: { _id: product._id.toString(), name: product.product.name, type: "physical", code: product.product.code },
      quantity: item.quantity,
      pricing: { cost, selling, total: selling },
    });

    await ProductModel.updateOne({ _id: product._id }, { $inc: { "inventory.quantity": -item.quantity } });
  }

  const customerData = input.customerId
    ? await CustomerModel.findById(input.customerId).select("name").lean()
    : null;

  return createTransaction(
    {
      type: "shop",
      customerId: input.customerId,
      paymentMethod: input.paymentMethod,
      paidAmount: input.paidAmount,
      items,
    },
    cashierId, cashierName
  );
}

// ──────────────────────────────────────────
// Vet transaction — full item product data
// ──────────────────────────────────────────
export async function createVetTransaction(input: TransactionCreateRequest, cashierId: string, cashierName: string) {
  return createTransaction({ ...input, type: "vet" }, cashierId, cashierName);
}

// ──────────────────────────────────────────
// Core create
// ──────────────────────────────────────────
async function createTransaction(input: TransactionCreateRequest, cashierId: string, cashierName: string) {
  let customerData: { _id: mongoose.Types.ObjectId; name: string } | undefined;
  if (input.customerId && input.customerId !== "000000000000000000000000") {
    const customer = await CustomerModel.findById(input.customerId);
    if (!customer) throw Object.assign(new Error("Customer not found"), { status: 404 });
    customerData = { _id: customer._id, name: customer.name };
  }

  let petData: { _id: mongoose.Types.ObjectId; name: string; kind: string } | undefined;
  if (input.petId) {
    const pet = await PetModel.findById(input.petId);
    if (!pet) throw Object.assign(new Error("Pet not found"), { status: 404 });
    petData = { _id: pet._id, name: pet.name, kind: pet.kind };
  }

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
      product: { _id: product._id, name: product.product.name, type: product.type, code: product.product.code },
      quantity: item.quantity,
      pricing: { cost, selling, total: selling },
      dosage: item.dosage,
    });

    if (product.type === "physical" && (product.inventory.quantity ?? 0) >= item.quantity) {
      await ProductModel.updateOne({ _id: product._id }, { $inc: { "inventory.quantity": -item.quantity } });
    }
  }

  const profit = totalSelling - totalCost;
  const paid = input.paidAmount;
  const debt = Math.max(0, totalSelling - paid);
  const paymentStatus: "paid" | "debt" | "dp" = paid >= totalSelling ? "paid" : debt > 0 ? "debt" : "dp";

  const txn = await TransactionModel.create({
    type: input.type,
    receiptNumber: generateReceiptNumber(input.type),
    timestamp: new Date(),
    customer: customerData,
    pet: petData,
    medicalHistoryId: input.medicalHistoryId ? new mongoose.Types.ObjectId(input.medicalHistoryId) : undefined,
    cashier: { _id: new mongoose.Types.ObjectId(cashierId), name: cashierName },
    items,
    summary: { total: totalSelling, profit, cost: totalCost, paid },
    paymentStatus,
    paymentMethod: input.paymentMethod,
  });

  return txn.toObject() as any;
}

// ──────────────────────────────────────────
// Generate from medical history
// ──────────────────────────────────────────
export async function createVetTransactionFromMedicalHistory(
  medicalHistoryId: string, paidAmount: number, paymentMethod: string,
  cashierId: string, cashierName: string
) {
  const mh = await MedicalHistoryModel.findById(medicalHistoryId).populate("petId", "name kind customerId").lean();
  if (!mh) throw Object.assign(new Error("Medical history not found"), { status: 404 });

  const pet = mh.petId as any;
  const customerId = pet?.customerId?.toString();
  if (!customerId) throw Object.assign(new Error("Pet has no owner"), { status: 400 });

  const items: TransactionCreateRequest["items"] = [
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

  return createVetTransaction(
    { type: "vet", customerId, petId: pet?._id?.toString(), medicalHistoryId: mh._id.toString(), paymentMethod, paidAmount, items },
    cashierId, cashierName
  );
}

// ──────────────────────────────────────────
// List / Get / Delete
// ──────────────────────────────────────────
export async function listTransactions(filter: TransactionFilter) {
  const { page, limit, search, type, petId, customerId, startDate, endDate, paymentMethod, sortBy, order } = filter;
  const query: any = {};
  if (type) query.type = type;
  if (search) query.receiptNumber = { $regex: search, $options: "i" };
  if (petId) query["pet._id"] = petId;
  if (customerId) query["customer._id"] = customerId;
  if (paymentMethod) query.paymentMethod = paymentMethod;
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  const total = await TransactionModel.countDocuments(query);
  const data = await TransactionModel.find(query)
    .sort({ [sortBy]: order === "asc" ? 1 : -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  return { data: data as any, total, page, limit };
}

export async function getTransaction(id: string) {
  const txn = await TransactionModel.findById(id).lean();
  if (!txn) throw Object.assign(new Error("Transaction not found"), { status: 404 });
  return txn as any;
}

export async function deleteTransaction(id: string) {
  const txn = await TransactionModel.findByIdAndDelete(id).lean();
  if (!txn) throw Object.assign(new Error("Transaction not found"), { status: 404 });
  return txn as any;
}

// ──────────────────────────────────────────
// Dashboard
// ──────────────────────────────────────────
export async function getDashboardSummary() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [todaySales, weekSales, monthSales] = await Promise.all([
    TransactionModel.aggregate([
      { $match: { timestamp: { $gte: startOfDay } } },
      { $group: { _id: null, total: { $sum: "$summary.total" }, count: { $sum: 1 } } },
    ]),
    TransactionModel.aggregate([
      { $match: { timestamp: { $gte: startOfWeek } } },
      { $group: { _id: null, total: { $sum: "$summary.total" }, count: { $sum: 1 } } },
    ]),
    TransactionModel.aggregate([
      { $match: { timestamp: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$summary.total" }, count: { $sum: 1 } } },
    ]),
  ]);

  const lowStock = await ProductModel.find({ type: "physical", isActive: true, "inventory.quantity": { $lte: 5 } })
    .select("product.name inventory.quantity pricing.selling")
    .sort({ "inventory.quantity": 1 })
    .limit(10)
    .lean();

  return {
    today: { total: todaySales[0]?.total ?? 0, count: todaySales[0]?.count ?? 0 },
    week: { total: weekSales[0]?.total ?? 0, count: weekSales[0]?.count ?? 0 },
    month: { total: monthSales[0]?.total ?? 0, count: monthSales[0]?.count ?? 0 },
    lowStock: lowStock as any[],
  };
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
