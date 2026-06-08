"use client";

import useQueryParams from "@/hooks/useQueryParam";
import { Table, Tag } from "antd";
import TableFilter from "@/components/TableFilter";
import { useGetSales } from "@/api/sale.api";
import {
  IVetSale,
  VetSaleFilter,
} from "../../../../shared/types/vet.sale.type";

const formatCurrency = (val?: number) =>
  `Rp ${val?.toLocaleString("id-ID") ?? ""}`;

const formatDate = (val: Date | string) =>
  new Date(val).toLocaleString("id-ID");

export default function SalesPage() {
  const { debounceQuery, query, setQuery } = useQueryParams<VetSaleFilter>({
    page: 1,
    limit: 10,
    search: "",
    sortBy: "createdAt",
    order: "desc",
  });

  const { data, loading } = useGetSales(debounceQuery);

  const sales = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div>
      {/* 🔍 FILTER */}
      <TableFilter
        query={query}
        setQuery={setQuery}
        searchKey="search"
        searchPlaceholder="Search receipt / cashier..."
      />

      {/* 📊 TABLE */}
      <Table<IVetSale>
        loading={loading}
        dataSource={sales}
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
            sortBy: sorter.field ?? prev.sortBy,
            order: sorter.order === "ascend" ? "asc" : "desc",
          }));
        }}
        columns={[
          {
            title: "No Struk",
            dataIndex: "_id",
            sorter: true,
          },
          {
            title: "Tanggal",
            dataIndex: "createdAt",
            render: (val) => formatDate(val),
            sorter: true,
          },
          {
            title: "Kasir",
            dataIndex: "cashier.name",
            render: (_, row) => row.cashier.name,
          },
          {
            title: "Customer",
            dataIndex: "customer.name",
            render: (_, row) => row.customer.name,
          },

          // 💰 PRICING
          {
            title: "Modal",
            dataIndex: "summary.cost",
            render: (_, row) => formatCurrency(row.summary.cost),
            sorter: true,
          },

          {
            title: "Harga Jual",
            dataIndex: "summary.selling",
            render: (_, row) => formatCurrency(row.summary.total),
            sorter: true,
          },
          {
            title: "Profit",
            dataIndex: "summary.profit",
            render: (_, row) => formatCurrency(row.summary.profit),
            sorter: true,
          },
        ]}
        scroll={{ x: "max-content" }}
      />
    </div>
  );
}
