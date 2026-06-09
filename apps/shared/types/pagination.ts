import { z } from "zod";

export interface GeneralFilter {
  page: number;
  limit: number;
  search: "";
}

/**
 * @deprecated not clean
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string(),
});

/**
 * 
 * @deprecated code not client
 */
export function generateSortFilterSchema<
  TList extends Readonly<string[]>,
  TDefaultFilter extends TList[number],
>({ defaultSort, sortList }: { sortList: TList; defaultSort: TDefaultFilter }) {
  return paginationQuerySchema.extend({
    search: z.string(),
    sortBy: z.enum(sortList).default(defaultSort),

    order: z.enum(["asc", "desc"]).default("desc"),
  });
}
