import { TransactionModel, ProductModel, ServiceModel, CustomerModel, PetModel, MedicalHistoryModel } from "../models/index.js";
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
// Stock sync — kembalikan stok item fisik saat transaksi dihapus/disinkron.
// Hanya item physical (obat/barang) yang mengurangi stok; jasa tidak.
// ──────────────────────────────────────────
async function restoreStockFromItems(items: any[]) {
  for (const item of items) {
    if (item.product?.type === "physical" && item.product?._id) {
      await ProductModel.updateOne({ _id: item.product._id }, { $inc: { "inventory.quantity": item.quantity } });
    }
  }
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
    const isService = item.product.type === "service";
    const service = isService ? await ServiceModel.findById(item.product._id) : null;
    const product = isService ? null : await ProductModel.findById(item.product._id);
    if (isService && !service) throw Object.assign(new Error(`Service ${item.product._id} not found`), { status: 404 });
    if (!isService && !product) throw Object.assign(new Error(`Product ${item.product._id} not found`), { status: 404 });

    const cost = (isService ? (service!.cost ?? 0) : (product!.pricing.cost ?? 0)) * item.quantity;
    const selling = item.pricing.selling * item.quantity;
    totalCost += cost;
    totalSelling += selling;

    items.push({
      product: {
        _id: isService ? service!._id : product!._id,
        name: isService ? service!.name : product!.product.name,
        type: item.product.type,
        code: isService ? undefined : product!.product.code,
      },
      quantity: item.quantity,
      pricing: { cost, selling, total: selling },
      dosage: item.dosage,
    });

    if (!isService && (product!.inventory.quantity ?? 0) >= item.quantity) {
      await ProductModel.updateOne({ _id: product!._id }, { $inc: { "inventory.quantity": -item.quantity } });
    }
  }

  const profit = totalSelling - totalCost;
  const paid = input.paidAmount;
  const debt = Math.max(0, totalSelling - paid);
  const paymentStatus: "paid" | "debt" | "dp" = paid >= totalSelling ? "paid" : debt > 0 ? "debt" : "dp";

  // Auto-create medical history for vet transactions
  let mhId: mongoose.Types.ObjectId | undefined;
  if (input.type === "vet" && petData && input.diagnosis) {
    const services = items
      .filter((i: any) => i.product.type === "service")
      .map((i: any) => ({
        productId: i.product._id,
        name: i.product.name,
        price: i.pricing.selling,
      }));
    const prescriptions = items
      .filter((i: any) => i.product.type === "physical")
      .map((i: any) => ({
        productId: i.product._id,
        name: i.product.name,
        quantity: i.quantity,
        price: i.pricing.selling,
        dosage: i.dosage || undefined,
      }));

    const mh = await MedicalHistoryModel.create({
      petId: petData._id,
      visitDate: new Date(),
      diagnosis: input.diagnosis,
      doctorId: new mongoose.Types.ObjectId(cashierId),
      treatments: services,
      prescriptions,
      notes: input.mhNotes || undefined,
    });
    mhId = mh._id as mongoose.Types.ObjectId;
  }

  const txn = await TransactionModel.create({
    type: input.type,
    receiptNumber: generateReceiptNumber(input.type),
    timestamp: new Date(),
    customer: customerData,
    pet: petData,
    medicalHistoryId: input.medicalHistoryId ? new mongoose.Types.ObjectId(input.medicalHistoryId) : mhId,
    cashier: { _id: new mongoose.Types.ObjectId(cashierId), name: cashierName },
    items,
    summary: { total: totalSelling, profit, cost: totalCost, paid },
    paymentStatus,
    paymentMethod: input.paymentMethod,
  });

  return txn.toObject() as any;
}

// ──────────────────────────────────────────
// Transaction sync from Medical History
// Menyimpan rekam medis otomatis membuat/memperbarui transaksi (type: vet).
// Tindakan → item jasa (service), Resep Obat → item obat (physical).
// Transaksi yang sudah lunas tidak diubah (financial record tetap).
// ──────────────────────────────────────────
interface MhItemInput {
  productId: string | mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
  dosage?: string;
  usage?: string;
  notes?: string;
}

export async function buildTransactionItemsFromMh(
  treatments: MhItemInput[],
  prescriptions: MhItemInput[],
  goods: MhItemInput[] = []
) {
  const items: any[] = [];
  let totalCost = 0;
  let totalSelling = 0;

  for (const t of treatments) {
    const service = await ServiceModel.findById(t.productId);
    if (!service) throw Object.assign(new Error(`Tindakan ${t.name || t.productId} tidak ditemukan`), { status: 404 });
    const cost = (service.cost ?? 0) * t.quantity;
    const selling = t.price * t.quantity;
    totalCost += cost;
    totalSelling += selling;
    items.push({
      product: { _id: service._id, name: service.name, type: "service" },
      quantity: t.quantity,
      pricing: { cost, selling, total: selling },
    });
  }

  // Obat (medicine) + Barang (good) — keduanya item physical dari ProductModel
  for (const p of [...prescriptions, ...goods]) {
    const product = await ProductModel.findById(p.productId);
    if (!product) throw Object.assign(new Error(`Produk ${p.name || p.productId} tidak ditemukan`), { status: 404 });
    const cost = (product.pricing.cost ?? 0) * p.quantity;
    const selling = p.price * p.quantity;
    totalCost += cost;
    totalSelling += selling;
    items.push({
      product: { _id: product._id, name: product.product.name, type: "physical", code: product.product.code },
      quantity: p.quantity,
      pricing: { cost, selling, total: selling },
      dosage: (p as any).dosage || undefined,
    });
    if ((product.inventory.quantity ?? 0) >= p.quantity) {
      await ProductModel.updateOne({ _id: product._id }, { $inc: { "inventory.quantity": -p.quantity } });
    }
  }

  return { items, totalCost, totalSelling };
}

export async function createTransactionFromMedicalHistory(input: {
  medicalHistoryId: string;
  pet: { _id: mongoose.Types.ObjectId; name: string; kind: string };
  customer?: { _id: mongoose.Types.ObjectId; name: string } | null;
  treatments: MhItemInput[];
  prescriptions: MhItemInput[];
  goods?: MhItemInput[];
  cashierId: string;
  cashierName: string;
}) {
  const { items, totalCost, totalSelling } = await buildTransactionItemsFromMh(input.treatments, input.prescriptions, input.goods ?? []);
  if (items.length === 0) return null;

  const profit = totalSelling - totalCost;
  const paymentStatus: "paid" | "debt" | "dp" = "debt"; // pembayaran menyusul di halaman transaksi

  const txn = await TransactionModel.create({
    type: "vet",
    receiptNumber: generateReceiptNumber("vet"),
    timestamp: new Date(),
    customer: input.customer || undefined,
    pet: input.pet,
    medicalHistoryId: new mongoose.Types.ObjectId(input.medicalHistoryId),
    cashier: { _id: new mongoose.Types.ObjectId(input.cashierId), name: input.cashierName },
    items,
    summary: { total: totalSelling, profit, cost: totalCost, paid: 0 },
    paymentStatus,
    paymentMethod: "Utang",
  });
  return txn.toObject() as any;
}

export async function syncTransactionFromMedicalHistory(input: {
  medicalHistoryId: string;
  treatments: MhItemInput[];
  prescriptions: MhItemInput[];
  goods?: MhItemInput[];
}) {
  const txn = await TransactionModel.findOne({ medicalHistoryId: input.medicalHistoryId });
  if (!txn) return null;
  if (txn.paymentStatus === "paid") return txn.toObject() as any; // jangan ubah transaksi lunas

  // Kembalikan stok item lama dulu — buildTransactionItemsFromMh akan
  // mengurangi lagi sesuai item baru (hindari double decrement tiap update MH)
  await restoreStockFromItems(txn.items ?? []);

  const { items, totalCost, totalSelling } = await buildTransactionItemsFromMh(input.treatments, input.prescriptions, input.goods ?? []);
  if (items.length === 0) {
    await TransactionModel.deleteOne({ _id: txn._id });
    return null;
  }

  const profit = totalSelling - totalCost;
  const paid = txn.summary.paid ?? 0;
  const paymentStatus: "paid" | "debt" | "dp" = paid >= totalSelling ? "paid" : "debt";

  const updated = await TransactionModel.findByIdAndUpdate(
    txn._id,
    {
      $set: {
        items,
        summary: { total: totalSelling, profit, cost: totalCost, paid },
        paymentStatus,
      },
    },
    { new: true, runValidators: true }
  ).lean();
  return updated as any;
}

export async function deleteTransactionForMedicalHistory(medicalHistoryId: string) {
  const txn = await TransactionModel.findOne({ medicalHistoryId });
  if (!txn) return null;
  if (txn.paymentStatus === "paid") return txn.toObject() as any; // jangan hapus transaksi lunas
  const removed = await TransactionModel.findByIdAndDelete(txn._id).lean();
  if (removed) await restoreStockFromItems((removed as any).items ?? []);
  return removed as any;
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
  await restoreStockFromItems((txn as any).items ?? []);
  return txn as any;
}

// ──────────────────────────────────────────
// Pay debt — bayar transaksi yang masih hutang/DP
// ──────────────────────────────────────────
export async function payTransaction(id: string, input: { paidAmount: number; paymentMethod: string }) {
  const txn = await TransactionModel.findById(id);
  if (!txn) throw Object.assign(new Error("Transaction not found"), { status: 404 });
  if (txn.paymentStatus === "paid") throw Object.assign(new Error("Transaksi sudah lunas"), { status: 400 });

  const newPaid = (txn.summary.paid ?? 0) + input.paidAmount;
  const paymentStatus: "paid" | "debt" | "dp" = newPaid >= txn.summary.total ? "paid" : "dp";

  const updated = await TransactionModel.findByIdAndUpdate(
    id,
    { $set: { "summary.paid": newPaid, paymentStatus, paymentMethod: input.paymentMethod } },
    { new: true, runValidators: true }
  ).lean();
  return updated as any;
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
