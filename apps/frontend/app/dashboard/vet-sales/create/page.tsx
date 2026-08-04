"use client";

import { useEffect, useState } from "react";
import { Card, Button, Form, Select, Input, Space, Typography, Row, Col, Tag, Empty, Divider, InputNumber } from "antd";
import { ArrowLeft, Plus, Info } from "lucide-react";
import { apiFetch } from "../../../context/auth";
import { useAntdMessage } from "../../../hooks/useAntdMessage";
import { useRouter, useSearchParams } from "next/navigation";
import dayjs from "dayjs";

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
  const searchParams = useSearchParams();
  const [form] = Form.useForm();
  const [customers, setCustomers] = useState<any[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [selectedPet, setSelectedPet] = useState<string>("");
  const [paidAmount, setPaidAmount] = useState(0);
  const msg = useAntdMessage();

  const [mhRecords, setMhRecords] = useState<any[]>([]);
  const [mhLoading, setMhLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch<{ data: any[] }>("/api/customers?page=1&limit=100"),
      apiFetch<{ data: any[] }>("/api/services?limit=100"),
      apiFetch<{ data: any[] }>("/api/products?limit=100"),
    ]).then(async ([c, s, m]) => {
      setCustomers(c.data);
      // Service (jasa) & Product (barang) sekarang collection terpisah dengan bentuk berbeda
      setServices(s.data.map((x: any) => ({ _id: x._id, name: x.name, price: x.price, cost: x.cost ?? 0, type: "service" })));
      setMedicines(m.data.map((x: any) => ({ _id: x._id, name: x.product?.name, price: x.pricing?.selling ?? 0, cost: x.pricing?.cost ?? 0, type: "physical" })));

      // Auto-select from URL params
      const customerId = searchParams.get("customerId");
      const petId = searchParams.get("petId");
      if (customerId) {
        form.setFieldsValue({ customerId });
        setSelectedCustomer(customerId);
        await loadPets(customerId);
        if (petId) {
          form.setFieldsValue({ petId });
          setSelectedPet(petId);
          loadMedicalHistory(petId);
        }
      }
    }).catch(console.error);
  }, []);

  const loadPets = async (customerId: string) => {
    const res = await apiFetch<{ data: any[] }>(`/api/pets/by-customer/${customerId}`);
    setPets(res.data);
  };

  // Server-side search (backend bisa punya >100 data, search client-side tidak cukup)
  const searchCustomers = async (q = "") => {
    const res = await apiFetch<{ data: any[] }>(`/api/customers?search=${encodeURIComponent(q)}&limit=100`);
    setCustomers(res.data);
  };
  const searchServices = async (q = "") => {
    const res = await apiFetch<{ data: any[] }>(`/api/services?search=${encodeURIComponent(q)}&limit=100`);
    setServices(res.data.map((x: any) => ({ _id: x._id, name: x.name, price: x.price, cost: x.cost ?? 0, type: "service" })));
  };
  const searchMedicines = async (q = "") => {
    const res = await apiFetch<{ data: any[] }>(`/api/products?search=${encodeURIComponent(q)}&limit=100`);
    setMedicines(res.data.map((x: any) => ({ _id: x._id, name: x.product?.name, price: x.pricing?.selling ?? 0, cost: x.pricing?.cost ?? 0, type: "physical" })));
  };

  const loadMedicalHistory = async (petId: string) => {
    if (!petId) { setMhRecords([]); return; }
    setMhLoading(true);
    try {
      const res = await apiFetch<{ data: { records: any[] } }>(`/api/medical-histories/by-pet/${petId}`);
      setMhRecords(res.data.records || []);
    } catch { setMhRecords([]); } finally { setMhLoading(false); }
  };

  const cartTotal = cart.reduce((s, i) => s + i.pricing.total, 0);
  const kembalian = paidAmount > cartTotal ? paidAmount - cartTotal : 0;

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

  const handleSubmit = async () => {
    if (cart.length === 0) { msg.warning("Minimal 1 item"); return; }
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      // Validate diagnosis for vet transaction
      if (!values.diagnosis) { msg.error("Diagnosis wajib diisi"); setSubmitting(false); return; }

      const res = await apiFetch<{ data: any }>("/api/transactions/vet", {
        method: "POST",
        body: JSON.stringify({
          customerId: values.customerId,
          petId: values.petId || undefined,
          diagnosis: values.diagnosis,
          mhNotes: values.notes || undefined,
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
      msg.success(`Transaksi + Rekam Medis berhasil: ${res.data.receiptNumber}`);
      router.push(`/dashboard/transactions`);
    } catch (err: any) {
      if (err.message) msg.error(err.message);
    } finally { setSubmitting(false); }
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeft size={16} />} onClick={() => router.back()}>Kembali</Button>
        <Title level={4} style={{ margin: 0 }}>Konsultasi Dokter Baru</Title>
      </Space>

      <Card>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="customerId" label="Pemilik" rules={[{ required: true }]}>
                <Select showSearch placeholder="Cari pemilik..." onSearch={searchCustomers} onFocus={() => searchCustomers()} filterOption={false}
                  options={customers.map((c) => ({ value: c._id, label: c.name }))}
                  onChange={(val) => { setSelectedCustomer(val); setSelectedPet(""); form.setFieldsValue({ petId: undefined }); loadPets(val); }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="petId" label="Pasien" rules={[{ required: true, message: "Pilih pasien" }]}>
                <Select showSearch placeholder="Pilih pasien..." allowClear disabled={!selectedCustomer}
                  options={pets.map((p) => ({ value: p._id, label: `${p.name} (${p.kind})` }))}
                  onChange={(val) => { setSelectedPet(val || ""); loadMedicalHistory(val || ""); }}
                  notFoundContent={<Empty description="Belum ada pasien" image={Empty.PRESENTED_IMAGE_SIMPLE}><Button type="link" icon={<Plus size={14} />} onClick={() => router.push("/dashboard/pets")}>Tambah Pasien Baru</Button></Empty>} />
              </Form.Item>
            </Col>
          </Row>

          {selectedPet && (
            <Card size="small" title="Riwayat Rekam Medis" style={{ marginBottom: 16 }}>
              {mhRecords.length === 0 ? <Text type="secondary">Belum ada riwayat</Text> : (
                <Space direction="vertical" style={{ width: "100%" }}>
                  {mhRecords.slice(0, 3).map((r: any) => (
                    <Row key={r._id} gutter={8}>
                      <Col span={6}><Text type="secondary">{dayjs(r.visitDate).format("DD/MM/YY")}</Text></Col>
                      <Col span={12}><Text ellipsis>{r.diagnosis}</Text></Col>
                      <Col span={6}><Text type="secondary">{r.treatments?.length || 0} tnd, {r.prescriptions?.length || 0} rsp</Text></Col>
                    </Row>
                  ))}
                </Space>
              )}
            </Card>
          )}

          <Form.Item name="diagnosis" label="Diagnosis" rules={[{ required: true, message: "Diagnosis wajib" }]}>
            <Input.TextArea rows={2} placeholder="Hasil pemeriksaan, diagnosis dokter..." />
          </Form.Item>
          <Form.Item name="notes" label="Catatan Dokter">
            <Input.TextArea rows={2} placeholder="Catatan tambahan (opsional)" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="paymentMethod" label="Metode Bayar" rules={[{ required: true }]}>
                <Select options={[{ value: "Tunai", label: "Tunai" }, { value: "Transfer", label: "Transfer" }, { value: "QRIS", label: "QRIS" }, { value: "Debit", label: "Debit" }]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="paidAmount" label="Dibayar" rules={[{ required: true }]}>
                <Input type="number" onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card title="Item Transaksi" style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Select showSearch placeholder="Tambah jasa dokter..." style={{ width: "100%" }}
            onSearch={searchServices}
            onFocus={() => searchServices()}
            filterOption={false}
            options={services.map((s) => ({ value: s._id, label: `${s.name} - ${formatPrice(s.price)}` }))}
            onChange={(val) => addToCart(val, "service")} />
          <Select showSearch placeholder="Tambah obat..." style={{ width: "100%" }}
            onSearch={searchMedicines}
            onFocus={() => searchMedicines()}
            filterOption={false}
            options={medicines.map((m) => ({ value: m._id, label: `${m.name} - ${formatPrice(m.price)}` }))}
            onChange={(val) => addToCart(val, "physical")} />
          {cart.map((item) => (
            <Row key={item.product._id} gutter={8} align="middle" style={{ marginTop: 4 }}>
              <Col flex="auto"><Text strong>{item.product.name}</Text><Tag color={item.product.type === "service" ? "blue" : "green"} style={{ marginLeft: 8 }}>{item.product.type === "service" ? "Jasa" : "Obat"}</Tag></Col>
              <Col><Input type="number" value={item.quantity} onChange={(e) => updateQty(item.product._id, parseInt(e.target.value) || 1)} style={{ width: 50 }} min={1} /></Col>
              {item.product.type === "physical" && <Col><Input placeholder="Dosis" value={item.dosage || ""} onChange={(e) => updateDosage(item.product._id, e.target.value)} style={{ width: 100 }} /></Col>}
              <Col><Text>{formatPrice(item.pricing.total)}</Text></Col>
              <Col><Button size="small" danger onClick={() => setCart((prev) => prev.filter((i) => i.product._id !== item.product._id))}>X</Button></Col>
            </Row>
          ))}
        </Space>
        <Divider />
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 18, fontWeight: "bold" }}>Total: {formatPrice(cartTotal)}</div>
          {kembalian > 0 && <div style={{ fontSize: 14, color: "#52c41a" }}><Info size={14} style={{ marginRight: 4 }} />Kembalian: {formatPrice(kembalian)}</div>}
        </div>
        <Button type="primary" size="large" block loading={submitting} onClick={handleSubmit} style={{ marginTop: 16 }}>Proses Pembayaran</Button>
      </Card>
    </div>
  );
}
