"use client";

import {
  Button,
  Card,
  Input,
  Select,
  Row,
  Col,
  Typography,
  Divider,
  AutoComplete,
} from "antd";
import { useForm, useFieldArray } from "react-hook-form";
import VetForm from "@/components/VetForm";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  SaleCreateRequest,
  salesCreateSchema,
} from "../../../../../shared/types/sale.type";
import { useGetProducts } from "@/api/product.api";
import { useState } from "react";
import useDebounce from "@/hooks/useDebounce";
import { IProduct } from "../../../../../shared/types/product.type";
import { usePostSale } from "@/api/sale.api";

const { Title, Text } = Typography;

export default function CreateSalePage() {
  const { control, handleSubmit, watch, setValue, getValues } =
    useForm<SaleCreateRequest>({
      resolver: zodResolver(salesCreateSchema) as any,
      defaultValues: {
        paymentMethod: "Cash",
        items: [],
      },
    });

  const { loading, mutate } = usePostSale();

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "items",
  });

  const [search, setSearch] = useState("");
  const debounceSearch = useDebounce(search);

  const { data } = useGetProducts({
    limit: 10,
    page: 1,
    search: debounceSearch,
    order: "desc",
    sortBy: "createdAt",
  });

  const items = watch("items") ?? [];
  const paid = watch("paidAmount") ?? 0;

  // 🧮 TOTAL
  const total = items.reduce(
    (acc, item) => acc + item.quantity * item.pricing.selling,
    0,
  );

  const change = paid - total;

  // 🧾 HANDLE BARCODE
  const handleScan = (product: IProduct) => {
    if (!product) return;

    append({ product: product.product, pricing: product.pricing, quantity: 1 });
  };

  const onSubmit = (data: SaleCreateRequest) => {
    const payload = {
      ...data,
      summary: {
        total,
        downPayment: paid,
        debt: change < 0 ? Math.abs(change) : 0,
      },
    };

    console.log("FINAL:", payload);
    mutate({ body: data });
  };

  const options = data?.data.map((p) => ({
    value: p.product.name,
    label: (
      <div>
        <div>{p.product.name}</div>
        <small>Rp {p.pricing.selling.toLocaleString("id-ID")}</small>
      </div>
    ),
    product: p,
  }));

  return (
    <Row gutter={16}>
      {/* 🛒 LEFT: ITEMS */}
      <Col span={16}>
        <Card title="POS / Penjualan">
          {/* 🔍 BARCODE */}
          <AutoComplete
            value={search}
            style={{ width: "100%" }}
            options={options}
            showSearch={{ searchValue: search, onSearch: setSearch }}
            onSelect={(_, option) => {
              setSearch("");
              handleScan(option.product);
            }}
            placeholder="Scan / cari produk..."
            allowClear
          />

          {/* 🧾 LIST ITEM */}
          {fields.length === 0 && <Text type="secondary">Belum ada item</Text>}

          {fields.map((field, i) => {
            const qty = items[i]?.quantity ?? 0;
            const price = items[i]?.pricing?.selling ?? 0;
            const subtotal = qty * price;

            return (
              <Card
                key={field.id}
                size="small"
                style={{ marginBottom: 8, marginTop: 8 }}
                styles={{ body: { padding: 12 } }}
              >
                <Row gutter={12} align="middle">
                  {/* 🏷️ Produk */}
                  <Col span={10}>
                    <VetForm
                      control={control}
                      name={`items.${i}.product.name`}
                      noStyle
                    >
                      {(f) => <Input {...f} placeholder="Nama produk" />}
                    </VetForm>
                  </Col>

                  {/* 🔢 Qty */}
                  <Col span={4}>
                    <VetForm
                      control={control}
                      name={`items.${i}.quantity`}
                      noStyle
                    >
                      {(f) => (
                        <Input
                          type="number"
                          {...f}
                          style={{ textAlign: "center" }}
                        />
                      )}
                    </VetForm>
                  </Col>

                  {/* 💰 Harga */}
                  <Col span={5}>
                    <VetForm
                      control={control}
                      name={`items.${i}.pricing.selling`}
                      noStyle
                    >
                      {(f) => <Input type="number" {...f} prefix="Rp" />}
                    </VetForm>
                  </Col>

                  {/* 🧾 Subtotal */}
                  <Col span={3}>
                    <div
                      style={{
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>
                        Rp {subtotal.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </Col>

                  {/* ❌ Delete */}
                  <Col span={2}>
                    <div
                      style={{
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Button danger type="text" onClick={() => remove(i)}>
                        ✕
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Card>
            );
          })}
        </Card>
      </Col>

      {/* 💰 RIGHT: SUMMARY */}
      <Col span={8}>
        <Card>
          <Title level={4}>Ringkasan</Title>

          <Divider />

          {/* 💰 TOTAL */}
          <Row align="middle" style={{ marginBottom: 8 }}>
            <Col span={10}>
              <Text>Total</Text>
            </Col>
            <Col span={14} style={{ textAlign: "right" }}>
              <Title level={3} style={{ margin: 0 }}>
                Rp {total.toLocaleString("id-ID")}
              </Title>
            </Col>
          </Row>

          {/* 💵 BAYAR */}
          <Row align="middle" style={{ marginBottom: 12 }}>
            <Col span={10}>
              <Text>Bayar</Text>
            </Col>
            <Col span={14}>
              <VetForm control={control} name="paidAmount" noStyle>
                {(f) => <Input type="number" {...f} />}
              </VetForm>
            </Col>
          </Row>

          {/* 💸 KEMBALIAN */}
          <Row align="middle" style={{ marginBottom: 12 }}>
            <Col span={10}>
              <Text>Kembalian</Text>
            </Col>
            <Col span={14} style={{ textAlign: "right" }}>
              <Title level={4} style={{ margin: 0 }}>
                {Number.isNaN(change)
                  ? "-"
                  : `Rp ${change.toLocaleString("id-ID")}`}
              </Title>
            </Col>
          </Row>

          <Divider />

          {/* 💳 METODE */}
          <Row align="middle" style={{ marginBottom: 12 }}>
            <Col span={10}>
              <Text>Metode</Text>
            </Col>
            <Col span={14}>
              <VetForm control={control} name="paymentMethod" noStyle>
                {(f) => (
                  <Select
                    {...f}
                    style={{ width: "100%" }}
                    options={[
                      { label: "Cash", value: "Cash" },
                      { label: "Transfer", value: "Transfer" },
                    ]}
                  />
                )}
              </VetForm>
            </Col>
          </Row>

          {/* 👤 CUSTOMER */}
          <Row align="middle">
            <Col span={10}>
              <Text>Customer</Text>
            </Col>
            <Col span={14}>
              <VetForm control={control} name="customer" noStyle>
                {(f) => <Input {...f} />}
              </VetForm>
            </Col>
          </Row>

          {/* 🚀 BUTTON */}
          <Button
            type="primary"
            block
            size="large"
            loading={loading}
            onClick={handleSubmit(onSubmit)}
            style={{ marginTop: 16 }}
          >
            Bayar
          </Button>
        </Card>
      </Col>
    </Row>
  );
}
