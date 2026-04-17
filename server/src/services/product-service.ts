import { Product, ProductInput } from "@/shared/types";
import { ProductDB } from "../models/product-model";
import { mongoDBService } from "./mongodb-service";

const now = () => new Date().toISOString();

class ProductService {
  async getAll() {
    const products = await ProductDB.find().lean();
    return products;
  }

  create(input: ProductInput) {
    const normalized: ProductInput = {
      kategori: input.kategori.trim(),
      kode: input.kode.trim().toUpperCase(),
      nama: input.nama.trim(),
      deskripsi: input.deskripsi.trim(),
      stok: Number(input.stok),
      pokok: Number(input.pokok),
      jual: Number(input.jual),
      online: Number(input.online),
      tampil: Boolean(input.tampil),
    };

    if (
      !normalized.kategori ||
      !normalized.kode ||
      !normalized.nama ||
      !normalized.deskripsi
    ) {
      throw new Error("Kategori, kode, nama, dan deskripsi wajib diisi.");
    }

    if (
      normalized.stok < 0 ||
      normalized.pokok < 1 ||
      normalized.jual < normalized.pokok ||
      normalized.online < 1 ||
      normalized.online > normalized.jual
    ) {
      throw new Error("Nilai stok atau harga produk tidak valid.");
    }

    const product: Product = {
      id: `prod-${Date.now()}`,
      createdAt: now(),
      ...normalized,
    };

    return product;
  }
}

export const productService = new ProductService();
