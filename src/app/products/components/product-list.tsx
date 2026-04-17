"use client";

import Link from "next/link";
import useFetch from "@/hooks/useFetch";
import { ProductsResponse } from "@/shared/types";

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default function ProductList() {
  const { data, isLoading, errorMessage } = useFetch<ProductsResponse>({
    path: "/api/products",
  });

  const products = data?.data ?? [];

  if (isLoading) {
    return <div className="panel">Memuat produk dari backend...</div>;
  }

  if (errorMessage) {
    return <div className="panel error">{errorMessage}</div>;
  }

  return (
    <div className="stack-lg">
      <div className="hero-card">
        <div>
          <p className="eyebrow">Product Dashboard</p>
          <h1>Kelola katalog produk klinik dari frontend yang fresh.</h1>
          <p className="muted">
            Frontend Next.js ini terhubung langsung ke Express API untuk baca
            dan tambah produk.
          </p>
        </div>
        <Link className="button" href="/products/new">
          Tambah Produk
        </Link>
      </div>

      <div className="panel">
        <div className="table-header">
          <h2>Daftar Produk</h2>
          <span>{products.length} item</span>
        </div>

        {products.length === 0 ? (
          <p className="muted">Belum ada produk.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Nama</th>
                  <th>Kategori</th>
                  <th>Stok</th>
                  <th>Pokok</th>
                  <th>Jual</th>
                  <th>Online</th>
                  <th>Tampil</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.code}>
                    <td>{product.code}</td>
                    <td>
                      <strong>{product.name}</strong>
                    </td>
                    <td>{product.category}</td>
                    <td>{product.stock}</td>
                    <td>{currencyFormatter.format(product.price.cost)}</td>
                    <td>{currencyFormatter.format(product.price.sale)}</td>
                    <td>{currencyFormatter.format(product.price.online)}</td>
                    <td>{product.isVisible ? "Ya" : "Tidak"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
