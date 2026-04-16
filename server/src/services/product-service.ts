import { Product, ProductInput } from "@/shared/types";

const now = () => new Date().toISOString();

const products: Product[] = [
  {
    id: "prod-001",
    kategori: "Obat",
    kode: "OBT-001",
    nama: "Salep Antiseptik",
    deskripsi: "Salep untuk membantu perawatan luka ringan pada hewan.",
    stok: 18,
    pokok: 25000,
    jual: 40000,
    online: 38000,
    tampil: true,
    createdAt: now(),
  },
  {
    id: "prod-002",
    kategori: "Makanan",
    kode: "MKN-002",
    nama: "Dry Food Adult 1kg",
    deskripsi: "Makanan kering premium untuk anjing dan kucing dewasa.",
    stok: 32,
    pokok: 58000,
    jual: 76000,
    online: 73000,
    tampil: true,
    createdAt: now(),
  },
];

class ProductService {
  getAll() {
    return [...products];
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

    products.unshift(product);

    return product;
  }
}

export const productService = new ProductService();
