"use client";

import { useEffect, useState } from "react";
import { Card, Button, Form, Select, Input, Space, Typography, Row, Col, message, Tag } from "antd";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "../../../context/auth";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

function formatPrice(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

interface CartItem {
  product: { _id: string; name: string; type: string };
  quantity: number;
  pricing: { cost: number; selling: number; total: number };
  dosage?: string;
}

export default function CreateVetSalePage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [customers, setCustomers] = useState<any[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch<{ data: any[] }>("/api/customers?page=1&limit=100"),
      apiFetch<{ data: any[] }>("/api/products/services?limit=100"),
      apiFetch<{ data: any[] }>("/api/products/physical?limit=100"),
    ]).then(([c, s, m]) => {
      setCustomers(c.data);
      setServices(s.data);
      setMedicines(m.data);
    }).catch(console.error);
  }, []);

  const loadPets = async (customerId: string) => {
    const res = await apiFetch<{ data: any[] }>(`/api/pets/by-customer/${customerId}`);
    setPets(res.data);
  };

  const addToCart = (productId: string, type: "service" | "physical") => {
    const list = type === "service" ? services : medicines;
    const prod = list.find((p) => p._id === productId);
    if (!prod) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.product._id === productId);
      if (existing) return prev.map((i) => i.product._id === productId ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, {
        product: { _id: prod._id, name: prod.product.name, type: prod.type },
        quantity: 1,
        pricing: { cost: prod.pricing.cost || 0, selling: prod.pricing.selling, total: prod.pricing.selling },
        dosage: type === "physical" ? "" : undefined,
      }];
    });
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty < 1) { setCart((prev) => prev.filter((i) => i.product._id !== productId)); return; }
    setCart((prev) => prev.map((i) => i.product._id === productId ? { ...i, quantity: qty, pricing: { ...i.pricing, total: i.pricing.selling * qty } } : i));
  };

  const updateDosage = (productId: string, dosage: string) => {
    setCart((prev) => prev.map((i) => i.product._id === productId ? { ...i, dosage } : i));
  };

  const cartTotal = cart.reduce((s, i) => s + i.pricing.total, 0);

  const handleSubmit = async () => {
    if (cart.length === 0) { message.warning("Minimal 1 item"); return; }
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const res = await apiFetch<{ data: any }>("/api/vet-sales", {
        method: "POST",
        body: JSON.stringify({
          customerId: values.customerId,
          petId: values.petId || undefined,
          paymentMethod: values.paymentMethod,
          paidAmount: parseFloat(values.paidAmount) || cartTotal,
          items: cart.map((i) => ({
            product: { _id: i.product._id, name: i.product.name, type: i.product.type },
            quantity: i.quantity,
            pricing: { cost: i.pricing.cost, selling: i.pricing.selling, total: i.pricing.total },
            dosage: i.dosage || undefined,
          })),
        }),
      });
      message.success(`Transaksi berhasil: ${res.data.receiptNumber}`);
      router.push(`/dashboard/vet-sales/${res.data._id}`);
    } catch (err: any) {
      if (err.message) message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeft size={16} />} onClick={() => router.back()}>Kembali</Button>
        <Title level={4} style={{ margin: 0 }}>Transaksi Dokter Baru</Title>
      </Space>

      <Card>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="customerId" label="Customer" rules={[{ required: true, message: "Pilih customer" }]}>
                <Select showSearch placeholder="Cari customer..." filterOption={(input, option) => (option?.label as string || "").toLowerCase().includes(input.toLowerCase())}
                  options={customers.map((c) => ({ value: c._id, label: c.name }))}
                  onChange={(val) => { form.setFieldsValue({ petId: undefined }); loadPets(val); }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="petId" label="Pasien">
                <Select showSearch placeholder="Pilih pasien..." allowClear
                  options={pets.map((p) => ({ value: p._id, label: `${p.name} (${p.kind})` }))} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="paymentMethod" label="Metode Bayar" rules={[{ required: true }]}>
                <Select options={[{ value: "Tunai", label: "Tunai" }, { value: "Transfer", label: "Transfer" }, { value: "QRIS", label: "QRIS" }, { value: "Debit", label: "Debit" }]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="paidAmount" label="Dibayar" rules={[{ required: true }]}>
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card title="Item Transaksi" style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Select showSearch placeholder="Tambah jasa dokter..." style={{ width: "100%" }}
            filterOption={(input, option) => (option?.label as string || "").toLowerCase().includes(input.toLowerCase())}
            options={services.map((s) => ({ value: s._id, label: `${s.product.name} - ${formatPrice(s.pricing.selling)}` }))}
            onChange={(val) => addToCart(val, "service")}
          />
          <Select showSearch placeholder="Tambah obat..." style={{ width: "100%" }}
            filterOption={(input, option) => (option?.label as string || "").toLowerCase().includes(input.toLowerCase())}
            options={medicines.map((m) => ({ value: m._id, label: `${m.product.name} - ${formatPrice(m.pricing.selling)}` }))}
            onChange={(val) => addToCart(val, "physical")}
          />

          {cart.map((item) => (
            <Row key={item.product._id} gutter={8} align="middle" style={{ marginTop: 4 }}>
              <Col flex="auto">
                <Text strong>{item.product.name}</Text>
                <Tag color={item.product.type === "service" ? "blue" : "green"} style={{ marginLeft: 8 }}>{item.product.type === "service" ? "Jasa" : "Obat"}</Tag>
              </Col>
              <Col><Input type="number" value={item.quantity} onChange={(e) => updateQty(item.product._id, parseInt(e.target.value) || 1)} style={{ width: 50 }} min={1} /></Col>
              {item.product.type === "physical" && (
                <Col><Input placeholder="Dosis" value={item.dosage || ""} onChange={(e) => updateDosage(item.product._id, e.target.value)} style={{ width: 100 }} /></Col>
              )}
              <Col><Text>{formatPrice(item.pricing.total)}</Text></Col>
              <Col><Button size="small" danger onClick={() => setCart((prev) => prev.filter((i) => i.product._id !== item.product._id))}>X</Button></Col>
            </Row>
          ))}
        </Space>

        <div style={{ textAlign: "right", fontSize: 18, margin: "16px 0", fontWeight: "bold" }}>
          Total: {formatPrice(cartTotal)}
        </div>

        <Button type="primary" size="large" block loading={submitting} onClick={handleSubmit}>
          Proses Pembayaran
        </Button>
      </Card>
    </div>
  );
}
