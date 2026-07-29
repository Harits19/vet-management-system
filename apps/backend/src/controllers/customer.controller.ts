import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../config/auth.js";
import { listCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } from "../services/customer.service.js";
import { customerCreateSchema, customerUpdateSchema, customerFilterSchema } from "@vet/shared";

export async function getAll(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const filter = customerFilterSchema.parse(req.query);
    const result = await listCustomers(filter);
    res.json({ success: true, data: result.data, meta: { page: result.page, limit: result.data.length, total: result.total, totalPages: Math.ceil(result.total / filter.limit) } });
  } catch (err) { next(err); }
}

export async function getOne(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await getCustomer(req.params.id as string);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = customerCreateSchema.parse(req.body);
    const data = await createCustomer(input);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const input = customerUpdateSchema.parse(req.body);
    const data = await updateCustomer(req.params.id as string, input);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await deleteCustomer(req.params.id as string);
    res.json({ success: true, data: null, message: "Deleted" });
  } catch (err) { next(err); }
}
