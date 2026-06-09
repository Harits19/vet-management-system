import { NestedKeys } from "../../../shared/types/common.type";
import { z } from 'zod'


export interface BaseFilter<T, TSort extends NestedKeys<T> = NestedKeys<T>> {
    page: number;
    limit: number;
    search: string;
    sortBy: TSort;
    order: "asc" | "desc";
}

export interface BuildFilterProps<T, TSort extends NestedKeys<T> = NestedKeys<T>> {

    sortList: TSort[];
    defaultSort: TSort;
}


const paginationSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string(),
});
export function buildFilterSchema<T, TSort extends NestedKeys<T> = NestedKeys<T>>({
    sortList,
    defaultSort,
}: BuildFilterProps<T, TSort>) {
    return paginationSchema.extend({
        sortBy: z.enum(sortList).default(defaultSort),
        order: z.enum(["asc", "desc"]).default("desc"),
    });
}