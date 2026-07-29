import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../config/auth.js";
import { listPets, getPet, createPet, updatePet, deletePet, searchCustomerPets } from "../services/pet.service.js";
import { petCreateSchema, petUpdateSchema, petFilterSchema } from "@vet/shared";

export async function getAll(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const filter = petFilterSchema.parse(req.query);
    const result = await listPets(filter);
    res.json({ success: true, data: result.data, meta: { page: result.page, limit: result.data.length, total: result.total, totalPages: Math.ceil(result.total / filter.limit) } });
  } catch (err) { next(err); }
}

export async function getOne(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await getPet(req.params.id as string);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = petCreateSchema.parse(req.body);
    const data = await createPet(input);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = petUpdateSchema.parse(req.body);
    const data = await updatePet(req.params.id as string, input);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await deletePet(req.params.id as string);
    res.json({ success: true, data: null, message: "Deleted" });
  } catch (err) { next(err); }
}

export async function getByCustomer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await searchCustomerPets(req.params.customerId as string);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
