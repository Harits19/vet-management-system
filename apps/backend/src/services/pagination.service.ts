import { Model, FilterQuery } from "mongoose";

interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  order?: "asc" | "desc";
}

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
  model: Model<T>,
  query: FilterQuery<T>,
  params: PaginationParams,
): Promise<PaginationResult<T>> {
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

export function buildSearchQuery(search: string | undefined, fields: string[]) {
  if (!search) return {};

  return {
    $or: fields.map((field) => ({
      [field]: { $regex: search, $options: "i" },
    })),
  };
}
