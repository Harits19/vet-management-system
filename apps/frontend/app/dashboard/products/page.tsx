"use client";

import useGetProducts from "@/api/product.api";
import useQueryParams from "@/hooks/useQueryParam";
import { Button, Table } from "antd";
import { useState } from "react";
import { Pagination } from "../../../../shared/types/pagination";

export default function ProductsPage() {
  const [pagination, setPagination] = useQueryParams<Pagination>({
    page: 1,
    limit: 10,
  });

  const { data, loading } = useGetProducts(pagination);

  const products = data?.data ?? [];
  const meta = data?.meta;
  return (
    <div>
      <Button
        href="products/create"
        type="primary"
        style={{ marginBottom: 16 }}
      >
        Tambah Produk
      </Button>

      <Table
        loading={loading}
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: meta?.total,
          showSizeChanger: true,
          onChange: (page, limit) => {
            setPagination({ page, limit });
          },
        }}
        columns={[
          { title: "Nama Produk", dataIndex: "name", key: "name" },
          { title: "Harga", dataIndex: "sell_price", key: "sell_price" },
          { title: "Stok", dataIndex: "stock", key: "stock" },
        ]}
        dataSource={products}
        rowKey="_id"
      />
    </div>
  );
}
