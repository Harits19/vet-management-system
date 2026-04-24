import { ProductModel } from "src/models/product.model";
import { Request, Response } from "express";
import { sendResponse } from "src/services/response.service";
import {
  productSchema,
  productsFilterSchema,
} from "../../../shared/types/product.type";
import { parse } from "csv-parse/sync";

export const getProducts = async (req: Request, res: Response) => {
  const parsed = productsFilterSchema.parse(req.query);

  const { page, limit, search, category, sortBy, order } = parsed;

  const skip = (page - 1) * limit;

  // 🧠 build query dinamis
  const query: any = {};

  // 🔍 SEARCH (name + barcode)
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { barcode: { $regex: search, $options: "i" } },
    ];
  }

  // 🏷️ FILTER category
  if (category) {
    query.category = category;
  }

  // 🔃 SORT
  const sort: any = {
    [sortBy]: order === "asc" ? 1 : -1,
  };

  const [data, total] = await Promise.all([
    ProductModel.find(query).skip(skip).limit(limit).sort(sort).lean(),
    ProductModel.countDocuments(query),
  ]);

  return sendResponse(res, {
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const postProduct = async (req: Request, res: Response) => {
  const body = productSchema.parse(req.body);
  const product = await ProductModel.create(body);

  return sendResponse(res, {
    success: true,
    data: product,
  });
};

export const importProducts = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File CSV wajib diupload",
      });
    }

    const csvString = req.file.buffer.toString("utf-8");

    // 🧾 parse CSV
    const rows: any[] = parse(csvString, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      delimiter: ";",
    });

    const successData: any[] = [];
    const errors: any[] = [];

    // 🔁 loop per row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        // 🧩 mapping flat CSV → nested schema
        const mapped = {
          category: row["Kategori"],

          product: {
            code: row["Kode Produk"],
            name: row["Nama Produk"],
            weight: row["Berat (Gram)"],
          },

          pricing: {
            cost: row["Harga Pokok"],
            selling: row["Harga Jual"],
            online: row["Harga Online"],
          },

          inventory: {
            quantity: row["Stok Jumlah"],
          },

          unit: row["Nama Satuan"],
        };

        // ✅ validasi Zod
        const validated = productSchema.parse(mapped);

        successData.push(validated);
      } catch (err: any) {
        errors.push({
          row: i + 1,
          data: row,
          message: err.errors?.[0]?.message || err.message,
        });
      }
    }

    // 🚫 kalau semua gagal
    if (successData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Semua data gagal diimport",
        errors,
      });
    }

    // 💾 insert ke MongoDB
    const inserted = await ProductModel.insertMany(successData);

    return res.json({
      success: true,
      message: "Import selesai",
      data: {
        inserted: inserted.length,
        failed: errors.length,
        errors,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
