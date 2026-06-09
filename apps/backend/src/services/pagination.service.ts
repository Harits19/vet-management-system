import { Model, FilterQuery } from "mongoose";
import { ZodObject } from "zod";
import { Request } from "express";
import { LeafNestedKeys, NestedKeys } from "../../../shared/types/common.type";
import { BaseFilter } from "src/models/filter.model";

interface PaginationResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function paginate<T>(
  {
    query: baseParams,
    model,
    searchKeys
  }: {
    model: Model<T>,
    query: BaseFilter<T>,
    searchKeys: readonly LeafNestedKeys<T>[],
  }
): Promise<PaginationResult<T>> {
  const { search, ...params } = baseParams;
  const query = buildSearchQuery<T>(search, searchKeys);
  const { page, limit, sortBy = "createdAt", order = "desc" } = params;

  const skip = (page - 1) * limit;

  const sort: Record<string, 1 | -1> = {
    [sortBy]: order === "asc" ? 1 : -1,
  };

  const [data, total] = await Promise.all([
    model.find(query).skip(skip).limit(limit).sort(sort).lean(),
    model.countDocuments(query),
  ]);

  return {
    data: data as any,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export function buildSearchQuery<T>(
  search: string | undefined,
  fields: readonly LeafNestedKeys<T>[],
) {

  if (!search) return {};

  return {
    $or: fields.map((field) => ({
      [field]: {
        $regex: search,
        $options: "i",
      },
    })),
  };
}
