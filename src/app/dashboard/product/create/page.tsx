"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  CubeIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/solid";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Input,
  Option,
  Select,
  Switch,
  Textarea,
  Typography,
} from "@/components/Material";
import useVetRouter from "@/hooks/useVetRouter";

const CATEGORY_OPTIONS = ["Obat Luar", "Makanan", "Vitamin", "Aksesoris"];

type ProductFormValues = {
  kategori: string;
  kode: string;
  nama: string;
  deskripsi: string;
  stok: number;
  hargaPokok: number;
  hargaJual: number;
  hargaOnline: number;
  tampil: boolean;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const ProductCreatePage = () => {
  const router = useVetRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    defaultValues: {
      kategori: "",
      kode: "",
      nama: "",
      deskripsi: "",
      stok: 0,
      hargaPokok: 0,
      hargaJual: 0,
      hargaOnline: 0,
      tampil: true,
    },
  });

  const stok = watch("stok") || 0;
  const hargaPokok = watch("hargaPokok") || 0;
  const hargaJual = watch("hargaJual") || 0;
  const hargaOnline = watch("hargaOnline") || 0;
  const nilaiStok = stok * hargaPokok;

  const onSubmit = async (values: ProductFormValues) => {
    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 400));

      toast.success(
        `Produk ${values.nama} siap disimpan. Endpoint produk bisa disambungkan berikutnya.`,
        {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        },
      );

      reset({
        kategori: "",
        kode: "",
        nama: "",
        deskripsi: "",
        stok: 0,
        hargaPokok: 0,
        hargaJual: 0,
        hargaOnline: 0,
        tampil: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="h-full w-full">
        <CardHeader floated={false} shadow={false} className="rounded-none">
          <div className="flex flex-col gap-4 border-b border-blue-gray-50 pb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <Typography variant="h5" color="blue-gray">
                Tambah Produk
              </Typography>
              <Typography color="gray" className="mt-1 font-normal">
                Lengkapi detail produk baru agar stok, harga, dan visibilitasnya
                siap dikelola dari dashboard.
              </Typography>
            </div>
            <Button
              variant="outlined"
              className="flex items-center gap-2"
              onClick={() => router.push("/dashboard/product/")}
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Kembali ke Produk
            </Button>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardBody className="grid gap-6">
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="border border-blue-gray-50 shadow-sm">
                <CardBody className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                      <CubeIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <Typography variant="small" className="font-medium">
                        Stok Saat Ini
                      </Typography>
                      <Typography variant="h5" color="blue-gray">
                        {stok} item
                      </Typography>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="border border-blue-gray-50 shadow-sm">
                <CardBody className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-green-50 p-2 text-green-600">
                      <CurrencyDollarIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <Typography variant="small" className="font-medium">
                        Nilai Stok
                      </Typography>
                      <Typography variant="h5" color="blue-gray">
                        {formatCurrency(nilaiStok)}
                      </Typography>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="border border-blue-gray-50 shadow-sm">
                <CardBody className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                      <CheckCircleIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <Typography variant="small" className="font-medium">
                        Status Tampil
                      </Typography>
                      <Typography variant="h5" color="blue-gray">
                        {watch("tampil") ? "Aktif" : "Disembunyikan"}
                      </Typography>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
              <Card className="border border-blue-gray-50 shadow-sm">
                <CardBody className="grid gap-6">
                  <div>
                    <Typography variant="h6" color="blue-gray">
                      Informasi Utama
                    </Typography>
                    <Typography
                      color="gray"
                      className="mt-1 text-sm font-normal"
                    >
                      Field ini mengikuti kolom yang tampil pada daftar produk.
                    </Typography>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <Controller
                        name="kategori"
                        control={control}
                        rules={{ required: "Kategori wajib dipilih." }}
                        render={({ field }) => (
                          <Select
                            label="Kategori"
                            color="blue"
                            value={field.value}
                            onChange={(value) => field.onChange(value || "")}
                          >
                            {CATEGORY_OPTIONS.map((category) => (
                              <Option key={category} value={category}>
                                {category}
                              </Option>
                            ))}
                          </Select>
                        )}
                      />
                      {errors.kategori && (
                        <Typography
                          color="red"
                          className="mt-1 text-sm font-normal"
                        >
                          {errors.kategori.message}
                        </Typography>
                      )}
                    </div>

                    <div>
                      <Input
                        crossOrigin=""
                        color="blue"
                        label="Kode Produk"
                        error={Boolean(errors.kode)}
                        {...register("kode", {
                          required: "Kode produk wajib diisi.",
                          minLength: {
                            value: 3,
                            message: "Kode produk minimal 3 karakter.",
                          },
                          pattern: {
                            value: /^[A-Z0-9-]+$/,
                            message:
                              "Kode hanya boleh berisi huruf kapital, angka, atau tanda hubung.",
                          },
                        })}
                      />
                      {errors.kode && (
                        <Typography
                          color="red"
                          className="mt-1 text-sm font-normal"
                        >
                          {errors.kode.message}
                        </Typography>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <Input
                        crossOrigin=""
                        color="blue"
                        label="Nama Produk"
                        error={Boolean(errors.nama)}
                        {...register("nama", {
                          required: "Nama produk wajib diisi.",
                          minLength: {
                            value: 3,
                            message: "Nama produk minimal 3 karakter.",
                          },
                        })}
                      />
                      {errors.nama && (
                        <Typography
                          color="red"
                          className="mt-1 text-sm font-normal"
                        >
                          {errors.nama.message}
                        </Typography>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <Textarea
                        color="blue"
                        label="Deskripsi Produk"
                        error={Boolean(errors.deskripsi)}
                        {...register("deskripsi", {
                          required: "Deskripsi produk wajib diisi.",
                          minLength: {
                            value: 10,
                            message: "Deskripsi minimal 10 karakter.",
                          },
                        })}
                      />
                      {errors.deskripsi && (
                        <Typography
                          color="red"
                          className="mt-1 text-sm font-normal"
                        >
                          {errors.deskripsi.message}
                        </Typography>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="border border-blue-gray-50 shadow-sm">
                <CardBody className="grid gap-6">
                  <div>
                    <Typography variant="h6" color="blue-gray">
                      Stok dan Harga
                    </Typography>
                    <Typography
                      color="gray"
                      className="mt-1 text-sm font-normal"
                    >
                      Angka di bawah ini dipakai untuk stok, harga pokok, harga
                      jual, dan harga online.
                    </Typography>
                  </div>

                  <div className="grid gap-5">
                    <div>
                      <Input
                        crossOrigin=""
                        color="blue"
                        type="number"
                        label="Stok"
                        error={Boolean(errors.stok)}
                        {...register("stok", {
                          required: "Stok wajib diisi.",
                          valueAsNumber: true,
                          min: {
                            value: 0,
                            message: "Stok tidak boleh kurang dari 0.",
                          },
                        })}
                      />
                      {errors.stok && (
                        <Typography
                          color="red"
                          className="mt-1 text-sm font-normal"
                        >
                          {errors.stok.message}
                        </Typography>
                      )}
                    </div>

                    <div>
                      <Input
                        crossOrigin=""
                        color="blue"
                        type="number"
                        label="Harga Pokok"
                        error={Boolean(errors.hargaPokok)}
                        {...register("hargaPokok", {
                          required: "Harga pokok wajib diisi.",
                          valueAsNumber: true,
                          min: {
                            value: 1,
                            message: "Harga pokok minimal Rp 1.",
                          },
                        })}
                      />
                      {errors.hargaPokok && (
                        <Typography
                          color="red"
                          className="mt-1 text-sm font-normal"
                        >
                          {errors.hargaPokok.message}
                        </Typography>
                      )}
                    </div>

                    <div>
                      <Input
                        crossOrigin=""
                        color="blue"
                        type="number"
                        label="Harga Jual"
                        error={Boolean(errors.hargaJual)}
                        {...register("hargaJual", {
                          required: "Harga jual wajib diisi.",
                          valueAsNumber: true,
                          min: {
                            value: 1,
                            message: "Harga jual minimal Rp 1.",
                          },
                          validate: (value) =>
                            value >= hargaPokok ||
                            "Harga jual tidak boleh lebih kecil dari harga pokok.",
                        })}
                      />
                      {errors.hargaJual && (
                        <Typography
                          color="red"
                          className="mt-1 text-sm font-normal"
                        >
                          {errors.hargaJual.message}
                        </Typography>
                      )}
                    </div>

                    <div>
                      <Input
                        crossOrigin=""
                        color="blue"
                        type="number"
                        label="Harga Online"
                        error={Boolean(errors.hargaOnline)}
                        {...register("hargaOnline", {
                          required: "Harga online wajib diisi.",
                          valueAsNumber: true,
                          min: {
                            value: 1,
                            message: "Harga online minimal Rp 1.",
                          },
                          validate: (value) =>
                            value <= hargaJual ||
                            "Harga online tidak boleh lebih besar dari harga jual.",
                        })}
                      />
                      {errors.hargaOnline && (
                        <Typography
                          color="red"
                          className="mt-1 text-sm font-normal"
                        >
                          {errors.hargaOnline.message}
                        </Typography>
                      )}
                    </div>

                    <div className="rounded-xl border border-blue-gray-50 bg-blue-gray-50/40 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="font-medium"
                          >
                            Tampilkan di daftar produk
                          </Typography>
                          <Typography
                            color="gray"
                            className="mt-1 text-sm font-normal"
                          >
                            Produk aktif akan muncul dengan status tampil
                            seperti di halaman daftar produk.
                          </Typography>
                        </div>
                        <Controller
                          name="tampil"
                          control={control}
                          render={({ field }) => (
                            <Switch
                              color="green"
                              checked={field.value}
                              onChange={(event) =>
                                field.onChange(event.target.checked)
                              }
                              crossOrigin=""
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </CardBody>

          <CardFooter className="flex flex-col-reverse gap-3 border-t border-blue-gray-50 md:flex-row md:items-center md:justify-between">
            <Typography color="gray" className="text-sm font-normal">
              Validasi form akan memastikan data produk lebih rapi sebelum nanti
              dihubungkan ke backend.
            </Typography>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button
                type="button"
                variant="outlined"
                color="red"
                onClick={() => router.push("/dashboard/product/")}
              >
                Batal
              </Button>
              <Button type="submit" color="blue" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : "Simpan Produk"}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>

      <Card className="border border-blue-gray-50 shadow-sm">
        <CardBody>
          <Typography variant="h6" color="blue-gray">
            Ringkasan Preview
          </Typography>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <Typography variant="small" color="gray" className="font-medium">
                Kategori
              </Typography>
              <Typography color="blue-gray">
                {watch("kategori") || "-"}
              </Typography>
            </div>
            <div>
              <Typography variant="small" color="gray" className="font-medium">
                Kode
              </Typography>
              <Typography color="blue-gray">{watch("kode") || "-"}</Typography>
            </div>
            <div>
              <Typography variant="small" color="gray" className="font-medium">
                Harga Jual
              </Typography>
              <Typography color="blue-gray">
                {formatCurrency(hargaJual)}
              </Typography>
            </div>
            <div>
              <Typography variant="small" color="gray" className="font-medium">
                Harga Online
              </Typography>
              <Typography color="blue-gray">
                {formatCurrency(hargaOnline)}
              </Typography>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default ProductCreatePage;
