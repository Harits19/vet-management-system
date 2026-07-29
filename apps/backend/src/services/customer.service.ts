import { CustomerModel } from "../models/index.js";
import type { CustomerCreateRequest, CustomerUpdateRequest, CustomerFilter } from "@vet/shared";

export async function listCustomers(filter: CustomerFilter) {
  const { page, limit, search, sortBy, order } = filter;
  const query: any = {};
  if (search) {
    query.name = { $regex: search, $options: "i" };
  }
  const total = await CustomerModel.countDocuments(query);
  const data = await CustomerModel.find(query)
    .sort({ [sortBy]: order === "asc" ? 1 : -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  return { data: data as any, total, page: filter.page, limit };
}

export async function getCustomer(id: string) {
  const customer = await CustomerModel.findById(id).lean();
  if (!customer) throw Object.assign(new Error("Customer not found"), { status: 404 });
  return customer as any;
}

export async function createCustomer(input: CustomerCreateRequest) {
  const customer = await CustomerModel.create(input);
  return customer.toObject() as any;
}

export async function updateCustomer(id: string, input: CustomerUpdateRequest) {
  const customer = await CustomerModel.findByIdAndUpdate(id, { $set: input }, { new: true, runValidators: true }).lean();
  if (!customer) throw Object.assign(new Error("Customer not found"), { status: 404 });
  return customer as any;
}

export async function deleteCustomer(id: string) {
  const customer = await CustomerModel.findByIdAndDelete(id).lean();
  if (!customer) throw Object.assign(new Error("Customer not found"), { status: 404 });
  return customer as any;
}
