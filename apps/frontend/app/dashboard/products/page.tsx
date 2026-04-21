"use client";

import useGetProducts from "@/api/product";
import { Button, Table } from "antd";

export default function ProductsPage() {
  const { data, loading } = useGetProducts();
  const products = data?.data ?? [];
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
