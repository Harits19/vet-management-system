"use client";

import { Button, Card, Form, Input, InputNumber } from "antd";
import { useForm } from "react-hook-form";
import VetForm from "@/components/VetForm";
import {
  ProductCreateRequest,
  productSchema,
} from "../../../../../shared/types/product.type";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePostProduct } from "@/api/product.api";
import { useRouter } from "next/navigation";

export default function CreateProductPage() {
  const { control, handleSubmit, watch } = useForm<ProductCreateRequest>({
    resolver: zodResolver(productSchema) as any,
  });

  const { loading, mutate } = usePostProduct();

  const router = useRouter();

  const onSubmit = async (values: ProductCreateRequest) => {
    await mutate({
      body: values,
      onSuccess: () => router.push("/dashboard/products"),
    });
  };

  return (
    <Card title="Tambah Produk">
      <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
        {JSON.stringify(watch(), null, 2)}
        {/* CATEGORY */}
        <VetForm control={control} name="category" label="Kategori">
          {(field) => <Input {...field} />}
        </VetForm>

        {/* PRODUCT */}
        <h3>Informasi Produk</h3>

        <VetForm control={control} name="product.code" label="Kode Produk">
          {(field) => <Input {...field} />}
        </VetForm>

        <VetForm control={control} name="product.name" label="Nama Produk">
          {(field) => <Input {...field} />}
        </VetForm>

        <VetForm control={control} name="product.weight" label="Berat (gram)">
          {(field) => (
            <InputNumber
              {...field}
              style={{ width: "100%" }}
              onChange={(val) => field.onChange(val)}
            />
          )}
        </VetForm>

        {/* PRICING */}
        <h3>Harga</h3>

        <VetForm control={control} name="pricing.cost" label="Harga Pokok">
          {(field) => (
            <InputNumber
              {...field}
              style={{ width: "100%" }}
              onChange={(val) => field.onChange(val)}
            />
          )}
        </VetForm>

        <VetForm control={control} name="pricing.selling" label="Harga Jual">
          {(field) => (
            <InputNumber
              {...field}
              style={{ width: "100%" }}
              onChange={(val) => field.onChange(val)}
            />
          )}
        </VetForm>

        <VetForm control={control} name="pricing.online" label="Harga Online">
          {(field) => (
            <InputNumber
              {...field}
              style={{ width: "100%" }}
              onChange={(val) => field.onChange(val)}
            />
          )}
        </VetForm>

        {/* INVENTORY */}
        <h3>Stok</h3>

        <VetForm
          control={control}
          name="inventory.quantity"
          label="Jumlah Stok"
        >
          {(field) => (
            <InputNumber
              {...field}
              style={{ width: "100%" }}
              onChange={(val) => field.onChange(val)}
            />
          )}
        </VetForm>

        {/* UNIT */}
        <VetForm control={control} name="unit" label="Satuan">
          {(field) => <Input {...field} />}
        </VetForm>

        <Button loading={loading} type="primary" htmlType="submit">
          Simpan
        </Button>
      </Form>
    </Card>
  );
}
