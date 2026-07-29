import { SaleModel, ProductModel } from "../models/index.js";
import type { SaleCreateRequest, SaleFilter } from "@vet/shared";
import mongoose from "mongoose";

function generateReceiptNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV${datePart}${rand}`;
}

export async function createSale(input: SaleCreateRequest, cashierId: string, cashierName: string) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const items: any[] = [];
    let totalCost = 0;
    let totalSelling = 0;

    for (const item of input.items) {
      const product = await ProductModel.findById(item.productId).session(session);
      if (!product) throw Object.assign(new Error(`Product ${item.productId} not found`), { status: 404 });
      if (product.type !== "physical") throw Object.assign(new Error(`${product.product.name} is not a physical product`), { status: 400 });
      if ((product.inventory.quantity ?? 0) < item.quantity)
        throw Object.assign(new Error(`Insufficient stock for ${product.product.name}`), { status: 400 });

      const cost = (product.pricing.cost ?? 0) * item.quantity;
      const selling = product.pricing.selling * item.quantity;
      totalCost += cost;
      totalSelling += selling;

      items.push({
        product: { _id: product._id, name: product.product.name, code: product.product.code },
        quantity: item.quantity,
        pricing: { cost, selling, total: selling },
      });

      await ProductModel.updateOne(
        { _id: product._id },
        { $inc: { "inventory.quantity": -item.quantity } },
        { session }
      );
    }

    const profit = totalSelling - totalCost;
    const paidAmount = input.paidAmount;
    const debt = Math.max(0, totalSelling - paidAmount);
    const downPayment = paidAmount >= totalSelling ? 0 : paidAmount;
    const paymentStatus = paidAmount >= totalSelling ? "paid" : debt > 0 ? "debt" : "dp";
    const customerId = input.customerId ? new mongoose.Types.ObjectId(input.customerId) : undefined;

    const [sale] = await SaleModel.create(
      [{
        receiptNumber: generateReceiptNumber(),
        timestamp: new Date(),
        paymentStatus,
        pricing: { cost: totalCost, profit, total: totalSelling, selling: totalSelling },
        additional: { serviceCharge: 0, discount: 0, tax: 0, shipping: 0 },
        summary: { total: totalSelling, downPayment, debt },
        paymentMethod: input.paymentMethod,
        customer: customerId,
        cashier: { userId: new mongoose.Types.ObjectId(cashierId), name: cashierName },
        items,
      }],
      { session }
    );

    await session.commitTransaction();
    return sale.toObject() as any;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

export async function listSales(filter: SaleFilter) {
  const { page, limit, search, startDate, endDate, paymentMethod, sortBy, order } = filter;
  const query: any = {};
  if (search) query.receiptNumber = { $regex: search, $options: "i" };
  if (paymentMethod) query.paymentMethod = paymentMethod;
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  const total = await SaleModel.countDocuments(query);
  const data = await SaleModel.find(query)
    .sort({ [sortBy]: order === "asc" ? 1 : -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("customer", "name")
    .lean();
  return { data: data as any, total, page, limit };
}

export async function getSale(id: string) {
  const sale = await SaleModel.findById(id).populate("customer", "name whatsapp").lean();
  if (!sale) throw Object.assign(new Error("Sale not found"), { status: 404 });
  return sale as any;
}

export async function deleteSale(id: string) {
  const sale = await SaleModel.findByIdAndDelete(id).lean();
  if (!sale) throw Object.assign(new Error("Sale not found"), { status: 404 });
  return sale as any;
}

export async function getDashboardSummary() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const todaySales = await SaleModel.aggregate([
    { $match: { timestamp: { $gte: startOfDay } } },
    { $group: { _id: null, total: { $sum: "$summary.total" }, count: { $sum: 1 } } },
  ]);

  const weekSales = await SaleModel.aggregate([
    { $match: { timestamp: { $gte: startOfWeek } } },
    { $group: { _id: null, total: { $sum: "$summary.total" }, count: { $sum: 1 } } },
  ]);

  const monthSales = await SaleModel.aggregate([
    { $match: { timestamp: { $gte: startOfMonth } } },
    { $group: { _id: null, total: { $sum: "$summary.total" }, count: { $sum: 1 } } },
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
