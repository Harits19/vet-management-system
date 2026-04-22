import { Response } from "express";
import { ApiResponse } from "../../../shared/types/api";

export function sendResponse<T>(res: Response, data: ApiResponse<T>) {
  return res.json(data);
}
