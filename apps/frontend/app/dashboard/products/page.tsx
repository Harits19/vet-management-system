"use client";

import { useGetProducts } from "@/api/product.api";
import useQueryParams from "@/hooks/useQueryParam";
import { Button, Table } from "antd";
import TableFilter from "@/components/TableFilter";
import { ProductFilter } from "../../../../shared/types/product.type";

export default function ProductsPage() {
  const { debounceQuery, setQuery, query } = useQueryParams<ProductFilter>({
    page: 1,
    limit: 10,
    search: "",
    category: "",
    sortBy: "createdAt",
    order: "desc",
  });

  const { data, loading } = useGetProducts(debounceQuery);

  const products = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div>
      {/* 🔍 REUSABLE FILTER */}
      <TableFilter
        query={query}
        setQuery={setQuery}
        searchKey="search"
        searchPlaceholder="Search product..."
        filters={[
          {
            key: "category",
            placeholder: "Category",
            options: [
              { label: "Makanan", value: "makanan" },
              { label: "Obat", value: "obat" },
              { label: "Aksesoris", value: "aksesoris" },
            ],
          },
        ]}
      />

      {/* 📊 TABLE */}
      <Table
        loading={loading}
        dataSource={products}
        rowKey="_id"
        pagination={{
          current: query.page,
          pageSize: query.limit,
          total: meta?.total,
          showSizeChanger: true,
        }}
        onChange={(pag, _, sorter: any) => {
          setQuery((prev) => ({
            ...prev,
            page: pag.current ?? prev.page,
            limit: pag.pageSize ?? prev.limit,
            sortBy: sorter.field ?? "createdAt",
            order: sorter.order === "ascend" ? "asc" : "desc",
          }));
        }}
        columns={[
          {
            title: "Nama Produk",
            dataIndex: "product.name",
            render: (_, p) => p.product.name,
            sorter: true,
          },
          {
            title: "Kategori",
            render: (_, p) => p.category,
          },
          {
            title: "Harga",
            dataIndex: "pricing.selling",
            render: (_, p) => p.pricing.selling,
            sorter: true,
          },
          {
            title: "Stok",
            dataIndex: "inventory.quantity",
            render: (_, p) => p.inventory.quantity,
            sorter: true,
          },
          {
            title: "Created At",
            render: (_, p) => p.createdAt.toString(),
            sorter: true,
          },
        ]}
      />
    </div>
  );
}
