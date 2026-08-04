import { PetModel } from "../models/index.js";
import type { PetCreateRequest, PetUpdateRequest, PetFilter } from "@vet/shared";

export async function listPets(filter: PetFilter) {
  const { page, limit, search, customerId, sortBy, order } = filter;
  const query: any = {};
  if (search) {
    query.name = { $regex: search, $options: "i" };
  }
  if (customerId) {
    query.customerId = customerId;
  }
  const total = await PetModel.countDocuments(query);
  const data = await PetModel.find(query)
    .populate("customerId", "name whatsapp")
    .sort({ [sortBy]: order === "asc" ? 1 : -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  return { data: data as any, total, page, limit };
}

export async function getPet(id: string) {
  const pet = await PetModel.findById(id).populate("customerId", "name whatsapp address").lean();
  if (!pet) throw Object.assign(new Error("Pet not found"), { status: 404 });
  return pet as any;
}

export async function createPet(input: PetCreateRequest) {
  const pet = await PetModel.create(input);
  return pet.toObject() as any;
}

export async function updatePet(id: string, input: PetUpdateRequest) {
  const pet = await PetModel.findByIdAndUpdate(id, { $set: input }, { new: true, runValidators: true }).lean();
  if (!pet) throw Object.assign(new Error("Pet not found"), { status: 404 });
  return pet as any;
}

export async function deletePet(id: string) {
  const pet = await PetModel.findByIdAndDelete(id).lean();
  if (!pet) throw Object.assign(new Error("Pet not found"), { status: 404 });
  return pet as any;
}

export async function searchCustomerPets(customerId: string) {
  return PetModel.find({ customerId }).select("name kind breed gender birthDate initialAge createdAt").lean();
}

// Nilai unik untuk autocomplete (kind, breed, notes)
export async function getDistinctPetValues(field: string) {
  const allowed = new Set(["kind", "breed", "notes"]);
  if (!allowed.has(field)) throw Object.assign(new Error("Field tidak didukung"), { status: 400 });
  const values = await PetModel.distinct(field);
  return values.filter((v: unknown) => typeof v === "string" && (v as string).trim() !== "");
}
