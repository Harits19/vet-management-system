export interface Product {
  id: string;
  kategori: string;
  kode: string;
  nama: string;
  stok: number;
  pokok: number;
  jual: number;
  online: number;
  tampil: boolean;
}

export interface ProductsResponse {
  success: boolean;
  message: string;
  data: Product[];
}
