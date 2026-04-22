"use client";

import { useGetProducts } from "@/api/product.api";
import useQueryParams from "@/hooks/useQueryParam";
import { Button, Table, Input, Select, Row, Col } from "antd";
import { GeneralFilter } from "../../../../shared/types/pagination";
import { ProductFilter } from "../../../../shared/types/product";

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
            sortBy: sorter.field,
            order: sorter.order === "ascend" ? "asc" : "desc",
          }));
        }}
        columns={[
          {
            title: "Nama Produk",
            dataIndex: "name",
            key: "name",
            sorter: true,
          },
          {
            title: "Harga",
            dataIndex: "sell_price",
            key: "sell_price",
            sorter: true,
          },
          {
            title: "Stok",
            dataIndex: "stock",
            key: "stock",
            sorter: true,
          },
        ]}
      />
    </div>
  );
}
