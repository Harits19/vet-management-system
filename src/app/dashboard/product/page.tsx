"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  Typography,
  Button,
  CardBody,
  CardFooter,
  IconButton,
  Tooltip,
  Spinner,
} from "@material-tailwind/react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
} from "@heroicons/react/24/solid";
import useVetRouter from "@/hooks/useVetRouter";
import useFetch from "@/hooks/useFetch";
import useGetProducts from "@/hooks/api/useGetProducts";

const TABLE_HEAD = [
  "Action",
  "Kategori",
  "Kode",
  "Nama",
  "Stok",
  "Pokok",
  "Jual",
  "Online",
  "Stok",
  "Nilai Stok",
  "Tampil",
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const ITEMS_PER_PAGE = 5;

const ProductPage = () => {
  const router = useVetRouter();
  const [activePage, setActivePage] = useState(1);
  const { data: productsData, isLoading, errorMessage } = useGetProducts();
  const products = (productsData?.data ?? []).map((product) => ({
    id: product.id,
    kategori: product.kategori,
    kode: product.kode,
    nama: product.nama,
    stok1: product.stok,
    pokok: formatCurrency(product.pokok),
    jual: formatCurrency(product.jual),
    online: formatCurrency(product.online),
    stok2: product.stok,
    nilaiStok: formatCurrency(product.stok * product.pokok),
    tampil: product.tampil ? "Ya" : "Tidak",
  }));

  const totalPages = Math.max(1, Math.ceil(products.length / ITEMS_PER_PAGE));
  const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedRows = products.slice(startIndex, endIndex);

  useEffect(() => {
    if (activePage > totalPages) {
      setActivePage(totalPages);
    }
  }, [activePage, totalPages]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setActivePage(page);
  };

  return (
    <Card className="h-full w-full">
      <CardHeader floated={false} shadow={false} className="rounded-none">
        <div className="mb-4 flex items-center justify-between gap-8">
          <div>
            <Typography variant="h5" color="blue-gray">
              Daftar Produk
            </Typography>
            <Typography color="gray" className="mt-1 font-normal">
              Kelola informasi stok, harga, dan kategori produk Anda.
            </Typography>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Button
              onClick={() => router.push("/dashboard/product/create")}
              className="flex items-center gap-3"
              size="sm"
            >
              <PlusIcon strokeWidth={2} className="h-4 w-4" /> Tambah Produk
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardBody className="overflow-scroll px-0">
        {isLoading ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center gap-3">
            <Spinner className="h-8 w-8" color="blue" />
            <Typography color="gray" className="font-normal">
              Memuat data produk dari backend...
            </Typography>
          </div>
        ) : errorMessage ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 px-6 text-center">
            <Typography variant="h6" color="red">
              Data produk gagal dimuat
            </Typography>
            <Typography color="gray" className="font-normal">
              {errorMessage}
            </Typography>
          </div>
        ) : (
          <table className="mt-4 w-full min-w-max table-auto text-left">
            <thead>
              <tr>
                {TABLE_HEAD.map((head) => (
                  <th
                    key={head}
                    className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4"
                  >
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-normal leading-none opacity-70"
                    >
                      {head}
                    </Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={TABLE_HEAD.length} className="p-6 text-center">
                    <Typography color="gray" className="font-normal">
                      Belum ada produk dari backend.
                    </Typography>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, index) => {
                  const isLast = index === paginatedRows.length - 1;
                  const classes = isLast
                    ? "p-4"
                    : "p-4 border-b border-blue-gray-50";

                  return (
                    <tr key={row.id}>
                      <td className={classes}>
                        <div className="flex items-center gap-2">
                          <Tooltip content="Edit">
                            <IconButton variant="text" size="sm">
                              <PencilIcon className="h-4 w-4" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip content="Hapus">
                            <IconButton variant="text" size="sm" color="red">
                              <TrashIcon className="h-4 w-4" />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </td>
                      <td className={classes}>{row.kategori}</td>
                      <td className={classes}>{row.kode}</td>
                      <td className={classes}>{row.nama}</td>
                      <td className={classes}>{row.stok1}</td>
                      <td className={classes}>{row.pokok}</td>
                      <td className={classes}>{row.jual}</td>
                      <td className={classes}>{row.online}</td>
                      <td className={classes}>{row.stok2}</td>
                      <td className={classes}>{row.nilaiStok}</td>
                      <td className={classes}>{row.tampil}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </CardBody>
      <CardFooter className="flex items-center justify-between border-t border-blue-gray-50 p-4">
        <Typography variant="small" color="blue-gray" className="font-normal">
          Menampilkan {products.length === 0 ? 0 : startIndex + 1}-
          {Math.min(endIndex, products.length)} dari {products.length} produk
        </Typography>
        <div className="flex items-center gap-2">
          <Button
            variant="outlined"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => handlePageChange(activePage - 1)}
            disabled={activePage === 1 || isLoading || products.length === 0}
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Sebelumnya
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, index) => {
              const page = index + 1;

              return (
                <IconButton
                  key={page}
                  variant={activePage === page ? "filled" : "text"}
                  size="sm"
                  disabled={isLoading || products.length === 0}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </IconButton>
              );
            })}
          </div>
          <Button
            variant="outlined"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => handlePageChange(activePage + 1)}
            disabled={
              activePage === totalPages || isLoading || products.length === 0
            }
          >
            Selanjutnya
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProductPage;
