"use client";

import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  message,
} from "antd";
import { useRouter } from "next/navigation";

const { Option } = Select;

export default function CreateProductPage() {
  const [form] = Form.useForm();
  const router = useRouter();

  

  const onFinish = (values: any) => {
    message.success("Produk berhasil ditambahkan");
    router.push("/dashboard/products");
  };

  return (
    <Card title="Tambah Produk">
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        {/* Nama Produk */}
        <Form.Item
          label="Nama Produk"
          name="name"
          rules={[{ required: true, message: "Nama produk wajib diisi" }]}
        >
          <Input placeholder="Contoh: Whiskas 500g" />
        </Form.Item>

        {/* Barcode */}
        <Form.Item label="Barcode" name="barcode">
          <Input placeholder="Scan / input barcode" />
        </Form.Item>

        {/* Kategori */}
        <Form.Item
          label="Kategori"
          name="category"
          rules={[{ required: true, message: "Kategori wajib dipilih" }]}
        >
          <Select placeholder="Pilih kategori">
            <Option value="makanan">Makanan</Option>
            <Option value="obat">Obat</Option>
            <Option value="aksesoris">Aksesoris</Option>
          </Select>
        </Form.Item>

        {/* Harga */}
        <Form.Item label="Harga">
          <Input.Group compact>
            <Form.Item
              name="cost_price"
              noStyle
              rules={[{ required: true, message: "Harga beli wajib diisi" }]}
            >
              <InputNumber
                style={{ width: "50%" }}
                placeholder="Harga Beli"
                min={0}
              />
            </Form.Item>
            <Form.Item
              name="sell_price"
              noStyle
              rules={[{ required: true, message: "Harga jual wajib diisi" }]}
            >
              <InputNumber
                style={{ width: "50%" }}
                placeholder="Harga Jual"
                min={0}
              />
            </Form.Item>
          </Input.Group>
        </Form.Item>

        {/* Stok */}
        <Form.Item
          label="Stok Awal"
          name="stock"
          rules={[{ required: true, message: "Stok wajib diisi" }]}
        >
          <InputNumber style={{ width: "100%" }} min={0} />
        </Form.Item>

        {/* Satuan */}
        <Form.Item
          label="Satuan"
          name="unit"
          rules={[{ required: true, message: "Satuan wajib diisi" }]}
        >
          <Select placeholder="Pilih satuan">
            <Option value="pcs">PCS</Option>
            <Option value="box">BOX</Option>
            <Option value="pack">PACK</Option>
          </Select>
        </Form.Item>

        {/* Expired Date */}
        <Form.Item label="Tanggal Kadaluarsa" name="expired_date">
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>

        {/* Status */}
        <Form.Item
          label="Status Aktif"
          name="is_active"
          valuePropName="checked"
          initialValue={true}
        >
          <Switch />
        </Form.Item>

        {/* Submit */}
        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Simpan Produk
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
