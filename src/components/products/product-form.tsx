"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import usePostProduct from "@/hooks/api/usePostProduct";
import { ProductInput } from "@/shared/types";

const defaultValues: ProductInput = {
  kategori: "Obat",
  kode: "",
  nama: "",
  deskripsi: "",
  stok: 0,
  pokok: 0,
  jual: 0,
  online: 0,
  tampil: true,
};

export default function ProductForm() {
  const router = useRouter();
  const { postProduct, isLoading, errorMessage } = usePostProduct();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProductInput>({ defaultValues });

  const stok = watch("stok") || 0;
  const pokok = watch("pokok") || 0;
  const jual = watch("jual") || 0;

  async function onSubmit(values: ProductInput) {
    await postProduct({
      ...values,
      kode: values.kode.trim().toUpperCase(),
      nama: values.nama.trim(),
      deskripsi: values.deskripsi.trim(),
    });

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
          <select {...register("kategori", { required: "Kategori wajib diisi." })}>
            <option value="Obat">Obat</option>
            <option value="Makanan">Makanan</option>
            <option value="Vitamin">Vitamin</option>
            <option value="Aksesoris">Aksesoris</option>
          </select>
          <small>{errors.kategori?.message}</small>
        </label>

        <label>
          <span>Kode</span>
          <input
            {...register("kode", {
              required: "Kode wajib diisi.",
              minLength: {
                value: 3,
                message: "Kode minimal 3 karakter.",
              },
            })}
            placeholder="PRD-001"
          />
          <small>{errors.kode?.message}</small>
        </label>

        <label className="full">
          <span>Nama</span>
          <input
            {...register("nama", {
              required: "Nama wajib diisi.",
            })}
            placeholder="Dry Food Premium"
          />
          <small>{errors.nama?.message}</small>
        </label>

        <label className="full">
          <span>Deskripsi</span>
          <textarea
            {...register("deskripsi", {
              required: "Deskripsi wajib diisi.",
              minLength: {
                value: 10,
                message: "Deskripsi minimal 10 karakter.",
              },
            })}
            rows={4}
            placeholder="Deskripsi singkat produk"
          />
          <small>{errors.deskripsi?.message}</small>
        </label>

        <label>
          <span>Stok</span>
          <input
            type="number"
            {...register("stok", {
              valueAsNumber: true,
              min: { value: 0, message: "Stok minimal 0." },
            })}
          />
          <small>{errors.stok?.message}</small>
        </label>

        <label>
          <span>Harga Pokok</span>
          <input
            type="number"
            {...register("pokok", {
              valueAsNumber: true,
              min: { value: 1, message: "Harga pokok minimal 1." },
            })}
          />
          <small>{errors.pokok?.message}</small>
        </label>

        <label>
          <span>Harga Jual</span>
          <input
            type="number"
            {...register("jual", {
              valueAsNumber: true,
              validate: (value) =>
                value >= pokok || "Harga jual tidak boleh lebih kecil dari pokok.",
            })}
          />
          <small>{errors.jual?.message}</small>
        </label>

        <label>
          <span>Harga Online</span>
          <input
            type="number"
            {...register("online", {
              valueAsNumber: true,
              validate: (value) =>
                value <= jual || "Harga online tidak boleh lebih besar dari jual.",
            })}
          />
          <small>{errors.online?.message}</small>
        </label>

        <label className="toggle">
          <input type="checkbox" {...register("tampil")} />
          <span>Tampilkan produk di daftar</span>
        </label>

        <div className="summary full">
          <div>
            <span>Nilai stok</span>
            <strong>
              Rp {(stok * pokok).toLocaleString("id-ID")}
            </strong>
          </div>
          <div>
            <span>Status submit</span>
            <strong>{isLoading ? "Menyimpan..." : "Siap disimpan"}</strong>
          </div>
        </div>

        {errorMessage ? <p className="error-text full">{errorMessage}</p> : null}

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
