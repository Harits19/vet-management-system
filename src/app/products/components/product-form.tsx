"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import usePostProduct from "@/hooks/api/usePostProduct";
import { ProductRequest } from "@/shared/types";

export default function ProductForm() {
  const router = useRouter();
  const { postProduct, isLoading, errorMessage } = usePostProduct();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProductRequest>({
    defaultValues: {
      category: "Obat",
      isVisible: true,
      code: "",
      name: "",
      description: "",
      stock: 0,
      price: {
        cost: 0,
        sale: 0,
        online: 0,
      },
    },
  });

  const stock = watch("stock") || 0;
  const cost = watch("price.cost") || 0;
  const sale = watch("price.sale") || 0;

  async function onSubmit(values: ProductRequest) {
    await postProduct(values);

    router.push("/products");
    router.refresh();
  }

  return (
    <div className="stack-lg">
      <div className="hero-card">
        <div>
          <p className="eyebrow">Create Product</p>
          <h1>Tambah produk baru ke katalog.</h1>
          <p className="muted">
            Form ini langsung submit ke Express API menggunakan custom hook.
          </p>
        </div>
        <Link className="button secondary" href="/products">
          Kembali
        </Link>
      </div>

      <form className="panel form-grid" onSubmit={handleSubmit(onSubmit)}>
        <label>
          <span>Kategori</span>
          <select
            {...register("category", { required: "Kategori wajib diisi." })}
          >
            <option value="Obat">Obat</option>
            <option value="Makanan">Makanan</option>
            <option value="Vitamin">Vitamin</option>
            <option value="Aksesoris">Aksesoris</option>
          </select>
          <small>{errors.category?.message}</small>
        </label>

        <label>
          <span>Kode</span>
          <input
            {...register("code", {
              required: "Kode wajib diisi.",
              minLength: {
                value: 3,
                message: "Kode minimal 3 karakter.",
              },
            })}
            placeholder="PRD-001"
          />
          <small>{errors.code?.message}</small>
        </label>

        <label className="full">
          <span>Nama</span>
          <input
            {...register("name", {
              required: "Nama wajib diisi.",
            })}
            placeholder="Dry Food Premium"
          />
          <small>{errors.name?.message}</small>
        </label>

        <label className="full">
          <span>Deskripsi</span>
          <textarea
            {...register("description", {
              required: "Deskripsi wajib diisi.",
              minLength: {
                value: 10,
                message: "Deskripsi minimal 10 karakter.",
              },
            })}
            rows={4}
            placeholder="Deskripsi singkat produk"
          />
          <small>{errors.description?.message}</small>
        </label>

        <label>
          <span>Stok</span>
          <input
            type="number"
            {...register("stock", {
              valueAsNumber: true,
              min: { value: 0, message: "Stok minimal 0." },
            })}
          />
          <small>{errors.stock?.message}</small>
        </label>

        <label>
          <span>Harga Pokok</span>
          <input
            type="number"
            {...register("price.cost", {
              valueAsNumber: true,
              min: { value: 1, message: "Harga pokok minimal 1." },
            })}
          />
          <small>{errors.price?.cost?.message}</small>
        </label>

        <label>
          <span>Harga Jual</span>
          <input
            type="number"
            {...register("price.sale", {
              valueAsNumber: true,
              validate: (value) =>
                value >= cost ||
                "Harga jual tidak boleh lebih kecil dari pokok.",
            })}
          />
          <small>{errors.price?.sale?.message}</small>
        </label>

        <label>
          <span>Harga Online</span>
          <input
            type="number"
            {...register("price.online", {
              valueAsNumber: true,
              validate: (value) =>
                value <= sale ||
                "Harga online tidak boleh lebih besar dari jual.",
            })}
          />
          <small>{errors.price?.online?.message}</small>
        </label>

        <label className="toggle">
          <input type="checkbox" {...register("isVisible")} />
          <span>Tampilkan produk di daftar</span>
        </label>

        <div className="summary full">
          <div>
            <span>Nilai stok</span>
            <strong>Rp {(stock * cost).toLocaleString("id-ID")}</strong>
          </div>
          <div>
            <span>Status submit</span>
            <strong>{isLoading ? "Menyimpan..." : "Siap disimpan"}</strong>
          </div>
        </div>

        {errorMessage ? (
          <p className="error-text full">{errorMessage}</p>
        ) : null}

        <div className="actions full">
          <Link className="button secondary" href="/products">
            Batal
          </Link>
          <button className="button" disabled={isLoading} type="submit">
            {isLoading ? "Menyimpan..." : "Simpan Produk"}
          </button>
        </div>
      </form>
    </div>
  );
}
