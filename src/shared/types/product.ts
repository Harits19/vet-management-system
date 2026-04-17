export interface Product {
  id: string;
  kategori: string;
  kode: string;
  nama: string;
  deskripsi: string;
  stok: number;
  pokok: number;
  jual: number;
  online: number;
  tampil: boolean;
  createdAt: string;
}

export interface ProductInput extends Omit<Product, "id" | "createdAt"> {}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
}

export type ProductsResponse = ApiSuccess<Product[]>;
export type ProductResponse = ApiSuccess<Product>;
