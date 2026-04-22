import { z } from "zod";

export interface GeneralFilter {
  page: number;
  limit: number;
  search: "";
}

export const paginationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  
});
