"use client";

import { useEffect, useState } from "react";
import { Card, Button, Form, Select, Input, Space, Typography, Row, Col, Tag, Empty, Divider, Modal, DatePicker, Collapse, Table } from "antd";
import { ArrowLeft, Plus, Info, FileText } from "lucide-react";
import { apiFetch } from "../../../context/auth";
import { useAntdMessage } from "../../../hooks/useAntdMessage";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Panel } = Collapse;

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
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [selectedPet, setSelectedPet] = useState<string>("");
  const [paidAmount, setPaidAmount] = useState(0);
  const msg = useAntdMessage();

  // Medical history modal state
  const [mhRecords, setMhRecords] = useState<any[]>([]);
  const [mhLoading, setMhLoading] = useState(false);
  const [mhModalOpen, setMhModalOpen] = useState(false);
  const [mhForm] = Form.useForm();
  const [mhServices, setMhServices] = useState<any[]>([]);
  const [mhMedicines, setMhMedicines] = useState<any[]>([]);
  const [mhTreatments, setMhTreatments] = useState<any[]>([]);
  const [mhPrescriptions, setMhPrescriptions] = useState<any[]>([]);
  const [mhSubmitting, setMhSubmitting] = useState(false);

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

  const loadMedicalHistory = async (petId: string) => {
    if (!petId) { setMhRecords([]); return; }
    setMhLoading(true);
    try {
      const res = await apiFetch<{ data: { records: any[] } }>(`/api/medical-histories/by-pet/${petId}`);
      setMhRecords(res.data.records || []);
    } catch {
      setMhRecords([]);
    } finally {
      setMhLoading(false);
    }
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
      const res = await apiFetch<{ data: any }>("/api/transactions/vet", {
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
      msg.success(`Transaksi berhasil: ${res.data.receiptNumber}`);
      router.push(`/dashboard/transactions`);
    } catch (err: any) {
      if (err.message) msg.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Medical history modal
  const openMhModal = async () => {
    const [srvRes, medRes] = await Promise.all([
      apiFetch<{ data: any[] }>("/api/products/services?limit=100"),
      apiFetch<{ data: any[] }>("/api/products/physical?limit=100"),
    ]);
    setMhServices(srvRes.data);
    setMhMedicines(medRes.data);
    setMhTreatments([]);
    setMhPrescriptions([]);
    mhForm.resetFields();
    setMhModalOpen(true);
  };

  const addMhTreatment = (productId: string) => {
    const prod = mhServices.find((s) => s._id === productId);
    if (!prod) return;
    setMhTreatments((prev) => {
      if (prev.find((t) => t.productId === productId)) return prev;
      return [...prev, { productId: prod._id, name: prod.product.name, price: prod.pricing.selling, notes: "" }];
    });
  };

  const addMhPrescription = (productId: string) => {
    const prod = mhMedicines.find((m) => m._id === productId);
    if (!prod) return;
    setMhPrescriptions((prev) => [...prev, { productId: prod._id, name: prod.product.name, quantity: 1, price: prod.pricing.selling, dosage: "", notes: "" }]);
  };

  const handleSubmitMh = async () => {
    try {
      const values = await mhForm.validateFields();
      setMhSubmitting(true);
      await apiFetch("/api/medical-histories", {
        method: "POST",
        body: JSON.stringify({
          petId: selectedPet,
          visitDate: values.visitDate.toISOString(),
          diagnosis: values.diagnosis,
          treatments: mhTreatments.map((t) => ({ productId: t.productId, name: t.name, price: t.price, notes: t.notes })),
          prescriptions: mhPrescriptions.map((p) => ({ productId: p.productId, name: p.name, quantity: p.quantity, price: p.price, dosage: p.dosage, notes: p.notes })),
          notes: values.notes,
        }),
      });
      msg.success("Rekam medis ditambahkan");
      setMhModalOpen(false);
      loadMedicalHistory(selectedPet);
    } catch (err: any) {
      if (err.message) msg.error(err.message);
    } finally {
      setMhSubmitting(false);
    }
  };

  const mhColumns = [
    { title: "Tanggal", dataIndex: "visitDate", render: (v: string) => dayjs(v).format("DD/MM/YYYY") },
    { title: "Diagnosis", dataIndex: "diagnosis", ellipsis: true },
    { title: "Tindakan", key: "t", render: (_: any, r: any) => <Tag>{r.treatments?.length || 0}</Tag> },
    { title: "Resep", key: "p", render: (_: any, r: any) => <Tag>{r.prescriptions?.length || 0}</Tag> },
  ];

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
              <Form.Item name="customerId" label="Pemilik" rules={[{ required: true, message: "Pilih pemilik" }]}>
                <Select showSearch placeholder="Cari pemilik..." filterOption={(input, option) => (option?.label as string || "").toLowerCase().includes(input.toLowerCase())}
                  options={customers.map((c) => ({ value: c._id, label: c.name }))}
                  onChange={(val) => { setSelectedCustomer(val); setSelectedPet(""); form.setFieldsValue({ petId: undefined }); loadPets(val); }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="petId" label="Pasien">
                <Select showSearch placeholder="Pilih pasien..." allowClear disabled={!selectedCustomer}
                  options={pets.map((p) => ({ value: p._id, label: `${p.name} (${p.kind})` }))}
                  onChange={(val) => { setSelectedPet(val || ""); loadMedicalHistory(val || ""); }}
                  notFoundContent={
                    <Empty description="Belum ada pasien" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                      <Button type="link" icon={<Plus size={14} />} onClick={() => router.push("/dashboard/pets")}>Tambah Pasien Baru</Button>
                    </Empty>
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          {selectedPet && (
            <Card size="small" title="Riwayat Rekam Medis" extra={<Button size="small" icon={<FileText size={14} />} onClick={openMhModal}>Tambah Rekam Medis</Button>} style={{ marginBottom: 16 }}>
              <Table dataSource={mhRecords} columns={mhColumns} rowKey="_id" pagination={false} size="small" loading={mhLoading} />
            </Card>
          )}

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
          {kembalian > 0 && <div style={{ fontSize: 14, color: "#52c41a", marginTop: 4 }}><Info size={14} style={{ marginRight: 4 }} />Kembalian: {formatPrice(kembalian)}</div>}
        </div>
        <Button type="primary" size="large" block loading={submitting} onClick={handleSubmit} style={{ marginTop: 16 }}>Proses Pembayaran</Button>
      </Card>

      <Modal title="Tambah Rekam Medis" open={mhModalOpen} onOk={handleSubmitMh} onCancel={() => setMhModalOpen(false)} width={700} confirmLoading={mhSubmitting}>
        <Form form={mhForm} layout="vertical">
          <Form.Item name="visitDate" label="Tanggal Kunjungan" rules={[{ required: true, message: "Pilih tanggal" }]}><DatePicker style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="diagnosis" label="Diagnosis" rules={[{ required: true, message: "Wajib" }]}><Input.TextArea rows={2} /></Form.Item>
          <Title level={5}>Tindakan (Jasa)</Title>
          <Select showSearch placeholder="Tambah tindakan..." style={{ width: "100%", marginBottom: 8 }}
            filterOption={(input, option) => (option?.label as string || "").toLowerCase().includes(input.toLowerCase())}
            options={mhServices.map((s) => ({ value: s._id, label: `${s.product.name} - ${formatPrice(s.pricing.selling)}` }))}
            onChange={addMhTreatment} />
          {mhTreatments.map((t, i) => (
            <Card key={t.productId} size="small" style={{ marginBottom: 4 }}>
              <Space style={{ width: "100%", justifyContent: "space-between" }}><Text strong>{t.name}</Text><Text>{formatPrice(t.price)}</Text><Button size="small" danger onClick={() => setMhTreatments((prev) => prev.filter((_, idx) => idx !== i))}>X</Button></Space>
            </Card>
          ))}
          <Title level={5} style={{ marginTop: 16 }}>Resep Obat</Title>
          <Select showSearch placeholder="Tambah obat..." style={{ width: "100%", marginBottom: 8 }}
            filterOption={(input, option) => (option?.label as string || "").toLowerCase().includes(input.toLowerCase())}
            options={mhMedicines.map((m) => ({ value: m._id, label: `${m.product.name} - ${formatPrice(m.pricing.selling)}` }))}
            onChange={addMhPrescription} />
          {mhPrescriptions.map((p, i) => (
            <Row key={p.productId} gutter={8} style={{ marginBottom: 4 }} align="middle">
              <Col flex="auto"><Text strong>{p.name}</Text></Col>
              <Col><Input type="number" value={p.quantity} onChange={(e) => { setMhPrescriptions((prev) => prev.map((item, idx) => idx === i ? { ...item, quantity: parseInt(e.target.value) || 1 } : item)); }} style={{ width: 50 }} min={1} /></Col>
              <Col><Input placeholder="Dosis" value={p.dosage} onChange={(e) => { setMhPrescriptions((prev) => prev.map((item, idx) => idx === i ? { ...item, dosage: e.target.value } : item)); }} style={{ width: 100 }} /></Col>
              <Col><Text>{formatPrice(p.price * p.quantity)}</Text></Col>
              <Col><Button size="small" danger onClick={() => setMhPrescriptions((prev) => prev.filter((_, idx) => idx !== i))}>X</Button></Col>
            </Row>
          ))}
          <Form.Item name="notes" label="Catatan Dokter" style={{ marginTop: 16 }}><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
