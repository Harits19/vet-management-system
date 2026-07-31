"use client";

import { useEffect, useState } from "react";
import { Card, Button, Form, Select, Input, Space, Typography, Row, Col, Tag, Divider } from "antd";
import { ArrowLeft, Info } from "lucide-react";
import { apiFetch } from "../../../context/auth";
import { useAntdMessage } from "../../../hooks/useAntdMessage";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

function formatPrice(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export default function CreateShopPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);
  const msg = useAntdMessage();

  useEffect(() => {
    Promise.all([
      apiFetch<{ data: any[] }>("/api/customers?page=1&limit=100"),
      apiFetch<{ data: any[] }>("/api/products?limit=100"),
    ]).then(([c, p]) => {
      setCustomers(c.data);
      setProducts(p.data);
    }).catch(console.error);
  }, []);

  const addToCart = (productId: string) => {
    const prod = products.find((p) => p._id === productId);
    if (!prod) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) return prev.map((i) => i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: prod._id, name: prod.product.name, quantity: 1, price: prod.pricing.selling }];
    });
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty < 1) { setCart((prev) => prev.filter((i) => i.productId !== productId)); return; }
    setCart((prev) => prev.map((i) => i.productId === productId ? { ...i, quantity: qty } : i));
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const kembalian = paidAmount > cartTotal ? paidAmount - cartTotal : 0;

  const handleSubmit = async () => {
    if (cart.length === 0) { msg.warning("Pilih minimal 1 produk"); return; }
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await apiFetch("/api/transactions/shop", {
        method: "POST",
        body: JSON.stringify({
          customerId: values.customerId || undefined,
          paymentMethod: values.paymentMethod,
          paidAmount: parseFloat(values.paidAmount) || cartTotal,
          items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });
      msg.success("Transaksi berhasil!");
      router.push("/dashboard/transactions");
    } catch (err: any) {
      if (err.message) msg.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeft size={16} />} onClick={() => router.back()}>Kembali</Button>
        <Title level={4} style={{ margin: 0 }}>Transaksi Barang Baru</Title>
      </Space>

      <Card>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="customerId" label="Klien (opsional)">
                <Select showSearch placeholder="Cari klien..." allowClear
                  filterOption={(input, option) => (option?.label as string || "").toLowerCase().includes(input.toLowerCase())}
                  options={customers.map((c) => ({ value: c._id, label: c.name }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="paymentMethod" label="Metode Bayar" rules={[{ required: true, message: "Pilih metode" }]}>
                <Select options={[
                  { value: "Tunai", label: "Tunai" },
                  { value: "Transfer", label: "Transfer" },
                  { value: "QRIS", label: "QRIS" },
                  { value: "Debit", label: "Kartu Debit" },
                  { value: "Kredit", label: "Kartu Kredit" },
                ]} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card title="Item" style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Select showSearch placeholder="Tambah produk..." style={{ width: "100%" }}
            filterOption={(input, option) => (option?.label as string || "").toLowerCase().includes(input.toLowerCase())}
            options={products.map((p) => ({ value: p._id, label: `${p.product.name} - ${formatPrice(p.pricing.selling)}  (stok: ${p.inventory?.quantity ?? 0})` }))}
            onChange={(val) => { if (val) addToCart(val as string); }}
          />

          {cart.map((item) => (
            <Row key={item.productId} gutter={8} align="middle">
              <Col flex="auto"><Text strong>{item.name}</Text></Col>
              <Col><Input type="number" value={item.quantity} onChange={(e) => updateQty(item.productId, parseInt(e.target.value) || 1)} style={{ width: 60 }} min={1} /></Col>
              <Col><Text>{formatPrice(item.price * item.quantity)}</Text></Col>
              <Col><Button size="small" danger onClick={() => setCart((prev) => prev.filter((i) => i.productId !== item.productId))}>X</Button></Col>
            </Row>
          ))}
        </Space>

        <Divider />
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 18, fontWeight: "bold" }}>Total: {formatPrice(cartTotal)}</div>
          {kembalian > 0 && (
            <div style={{ fontSize: 14, color: "#52c41a", marginTop: 4 }}>
              <Info size={14} style={{ marginRight: 4 }} />Kembalian: {formatPrice(kembalian)}
            </div>
          )}
        </div>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Jumlah Dibayar">
              <Input type="number" onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)} placeholder="Masukkan nominal" />
            </Form.Item>
          </Col>
        </Row>
        <Button type="primary" size="large" block loading={submitting} onClick={handleSubmit}>
          Proses Pembayaran
        </Button>
      </Card>
    </div>
  );
}
