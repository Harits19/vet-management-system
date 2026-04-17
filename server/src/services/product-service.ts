import { Product, ProductDB } from "@/shared/types";
import { PaginationQuery } from "@/shared/types/pagination";

class ProductService {
  async getAll(query: PaginationQuery) {
    const { page, limit, search } = query;

    const skip = (page - 1) * limit;

    const filter: any = {};

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const [data, total] = await Promise.all([
      ProductDB.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ProductDB.countDocuments(filter),
    ]);

    return {
      data: data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const productService = new ProductService();
