import { ServiceModel } from "../models/index.js";
import type { ServiceCreateRequest, ServiceUpdateRequest, ServiceFilter } from "@vet/shared";

export async function listServices(filter: ServiceFilter) {
  const { page, limit, search, sortBy, order } = filter;
  const query: any = { isActive: true };
  if (search) {
    query.name = { $regex: search, $options: "i" };
  }
  const total = await ServiceModel.countDocuments(query);
  const data = await ServiceModel.find(query)
    .sort({ [sortBy]: order === "asc" ? 1 : -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  return { data: data as any, total, page, limit };
}

export async function getService(id: string) {
  const service = await ServiceModel.findById(id).lean();
  if (!service) throw Object.assign(new Error("Service not found"), { status: 404 });
  return service as any;
}

export async function createService(input: ServiceCreateRequest) {
  const service = await ServiceModel.create(input);
  return service.toObject() as any;
}

export async function updateService(id: string, input: ServiceUpdateRequest) {
  const service = await ServiceModel.findByIdAndUpdate(id, { $set: input }, { new: true, runValidators: true }).lean();
  if (!service) throw Object.assign(new Error("Service not found"), { status: 404 });
  return service as any;
}

export async function deleteService(id: string) {
  const service = await ServiceModel.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true }).lean();
  if (!service) throw Object.assign(new Error("Service not found"), { status: 404 });
  return service as any;
}
