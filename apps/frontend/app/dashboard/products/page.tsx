"use client";

import { useGetProducts } from "@/api/product.api";
import useQueryParams from "@/hooks/useQueryParam";
import { Button, Table, Input, Select, Row, Col } from "antd";
import { GeneralFilter } from "../../../../shared/types/pagination";
import { ProductFilter } from "../../../../shared/types/product.type";

export default function ProductsPage() {
  const [query, setQuery] = useQueryParams<ProductFilter>({
    page: 1,
    limit: 10,
    search: "",
    category: "",
    sortBy: "createdAt",
    order: "desc",
  });

  const { data, loading } = useGetProducts(query);

  const products = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div>
      {/* 🔍 SEARCH + FILTER */}
      {JSON.stringify(query, null, 2)}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Input.Search
            placeholder="Search product..."
            allowClear
            defaultValue={query.search}
            onChange={(e) => {
              setQuery((prev) => ({
                ...prev,
                search: e.target.value,
                page: 1,
              }));
            }}
          />
        </Col>

        <Col span={6}>
          <Select
            placeholder="Category"
            allowClear
            style={{ width: "100%" }}
            value={query.category || undefined}
            onChange={(value) =>
              setQuery((prev) => ({
                ...prev,
                category: value,
                page: 1,
              }))
            }
            options={[
              { label: "Makanan", value: "makanan" },
              { label: "Obat", value: "obat" },
              { label: "Aksesoris", value: "aksesoris" },
            ]}
          />
        </Col>

        <Col>
          <Button href="products/create" type="primary">
            Tambah Produk
          </Button>
        </Col>
      </Row>

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
            page: pag.current ?? prev.page,
            limit: pag.pageSize ?? prev.limit,
            sortBy: sorter.field ?? "createdAt",
            order: sorter.order === "ascend" ? "asc" : "desc",
          }));
        }}
        columns={[
          {
            title: "Nama Produk",
            key: "product.name",
            dataIndex: "product.name",
            render: (_val, product) => product.product.name,
            sorter: true,
          },
          {
            title: "Kategori",
            render: (_val, product) => product.category,
          },
          {
            title: "Harga",
            render: (_val, product) => product.pricing.selling,
            sorter: true,
            key: "pricing.selling",
            dataIndex: "pricing.selling",
          },

          {
            title: "Stok",
            render: (_val, product) => product.inventory.quantity,
            sorter: true,
            key: "inventory.quantity",
            dataIndex: "inventory.quantity",
          },
          {
            title: "Satuan",
            render: (_val, product) => product.unit,
          },
          {
            title: "Created At",
            render: (_val, product) => product.createdAt.toString(),
            sorter: true,
          },
        ]}
      />
    </div>
  );
}
