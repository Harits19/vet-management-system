"use client";

import { usePostProduct } from "@/api/product.api";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  message,
} from "antd";
import { useRouter } from "next/navigation";
import { ProductCreateRequest } from "../../../../../shared/types/product";
import { Controller, useForm } from "react-hook-form";
import VetForm from "@/components/VetForm";

const { Option } = Select;

export default function CreateProductPage() {
  // const [form] = Form.useForm();
  const { watch, handleSubmit, control } = useForm<ProductCreateRequest>();
  const router = useRouter();

  const { loading, mutate } = usePostProduct();

  const onFinish = async (values: ProductCreateRequest) => {
    await mutate({
      body: values,
      onSuccess: () => {
        message.success("Produk berhasil ditambahkan");
        router.push("/dashboard/products");
      },
    });
  };

  return (
    <Card title="Tambah Produk">
      {JSON.stringify(watch(), null, 2)}
      <Form
        onFinish={handleSubmit(onFinish)}
        layout="vertical"
        autoComplete="off"
      >
        {/* Nama Produk */}
        <VetForm
          control={control}
          label="Nama Produk"
          name="name"
          rules={{ required: "Nama produk wajib diisi" }}
        >
          {(field) => {
            field.value;
            return <Input placeholder="Contoh: Whiskas 500g" {...field} />;
          }}
        </VetForm>

        {/* Barcode */}
        <VetForm control={control} label="Barcode" name="barcode">
          {(field) => <Input placeholder="Scan / input barcode" {...field} />}
        </VetForm>

        {/* Kategori */}
        <VetForm
          control={control}
          label="Kategori"
          name="category"
          rules={{ required: "Kategori wajib dipilih" }}
        >
          {(field) => (
            <Select placeholder="Pilih kategori" {...field}>
              <Option value="makanan">Makanan</Option>
              <Option value="obat">Obat</Option>
              <Option value="aksesoris">Aksesoris</Option>
            </Select>
          )}
        </VetForm>

        {/* Harga */}
        <Form.Item label="Harga">
          <Space.Compact>
            <VetForm
              control={control}
              name="costPrice"
              noStyle
              rules={{ required: "Harga beli wajib diisi" }}
            >
              {(field) => (
                <InputNumber
                  style={{ width: "50%" }}
                  placeholder="Harga Beli"
                  min={0}
                  {...field}
                />
              )}
            </VetForm>
            <VetForm
              control={control}
              name="sellPrice"
              noStyle
              rules={{ required: "Harga jual wajib diisi" }}
            >
              {(field) => (
                <InputNumber
                  style={{ width: "50%" }}
                  placeholder="Harga Jual"
                  min={0}
                  {...field}
                />
              )}
            </VetForm>
          </Space.Compact>
        </Form.Item>

        {/* Stok */}
        <VetForm
          control={control}
          label="Stok Awal"
          name="stock"
          rules={{ required: "Stok wajib diisi" }}
        >
          {(field) => (
            <InputNumber style={{ width: "100%" }} min={0} {...field} />
          )}
        </VetForm>

        {/* Satuan */}
        <VetForm
          control={control}
          label="Satuan"
          name="unit"
          rules={{ required: "Satuan wajib diisi" }}
        >
          {(field) => (
            <Select placeholder="Pilih satuan" {...field}>
              <Option value="pcs">PCS</Option>
              <Option value="box">BOX</Option>
              <Option value="pack">PACK</Option>
            </Select>
          )}
        </VetForm>

        {/* Expired Date */}
        <VetForm
          control={control}
          label="Tanggal Kadaluarsa"
          name="expiredDate"
        >
          {(field) => <DatePicker style={{ width: "100%" }} {...field} />}
        </VetForm>

        {/* Status */}
        <VetForm
          control={control}
          label="Status Aktif"
          name="isActive"
          defaultValue={true}
        >
          {(field) => <Switch {...field} />}
        </VetForm>

        {/* Submit */}
        <Form.Item>
          <Button loading={loading} type="primary" htmlType="submit" block>
            Simpan Produk
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
