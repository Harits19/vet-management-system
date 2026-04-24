"use client";

import useQueryParams from "@/hooks/useQueryParam";
import { Table, Tag } from "antd";
import TableFilter from "@/components/TableFilter";
import { SalesFilter } from "../../../../shared/types/sale.type";
import { useGetSales } from "@/api/sale.api";
import { ISale } from "../../../../shared/types/sale.type";

const formatCurrency = (val: number) => `Rp ${val.toLocaleString("id-ID")}`;

const formatDate = (val: Date | string) =>
  new Date(val).toLocaleString("id-ID");

export default function SalesPage() {
  const { debounceQuery, query, setQuery } = useQueryParams<SalesFilter>({
    page: 1,
    limit: 10,
    search: "",
    sortBy: "timestamp",
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
      <Table<ISale>
        loading={loading}
        dataSource={sales}
        rowKey="externalId"
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
            dataIndex: "receiptNumber",
            sorter: true,
          },
          {
            title: "Tanggal",
            dataIndex: "timestamp",
            render: (val) => formatDate(val),
            sorter: true,
          },
          {
            title: "Kasir",
            dataIndex: "cashier",
          },
          {
            title: "Customer",
            dataIndex: "customer",
            render: (val) => val || "-",
          },
          {
            title: "Payment",
            dataIndex: "paymentMethod",
            render: (val) => (
              <Tag color={val === "Cash" ? "green" : "blue"}>{val}</Tag>
            ),
          },
          {
            title: "Status",
            dataIndex: "paymentStatus",
            render: (val) => (
              <Tag color={val === "Lunas" ? "green" : "orange"}>{val}</Tag>
            ),
          },

          // 💰 PRICING
          {
            title: "Modal",
            dataIndex: "pricing.cost",
            render: (_, r) => formatCurrency(r.pricing.cost),
            sorter: true,
          },

          {
            title: "Harga Jual",
            dataIndex: "pricing.selling",
            render: (_, r) => formatCurrency(r.pricing.selling),
            sorter: true,
          },
          {
            title: "Profit",
            dataIndex: "pricing.profit",
            render: (_, r) => formatCurrency(r.pricing.profit),
            sorter: true,
          },
        ]}
        scroll={{ x: "max-content" }}
      />
    </div>
  );
}
