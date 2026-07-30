"use client";

import { useEffect, useState } from "react";
import { Card, Descriptions, Table, Typography, Tag, Button, Space, Modal, Form, Input, Select, DatePicker, message, Timeline } from "antd";
import { Plus, FileText, Activity, Clock } from "lucide-react";
import { apiFetch } from "../../../context/auth";
import { useParams, useRouter } from "next/navigation";
import dayjs from "dayjs";
import { Row, Col } from "antd";

const { Title, Text } = Typography;

interface MedicalRecord {
  _id: string;
  visitDate: string;
  diagnosis: string;
  doctorId: { _id: string; name: string };
  treatments: { productId: string; name: string; price: number; notes?: string }[];
  prescriptions: { productId: string; name: string; quantity: number; price: number; dosage?: string; notes?: string }[];
  notes?: string;
  createdAt: string;
}

interface PetDetail {
  _id: string;
  name: string;
  kind: string;
  gender: string;
  notes?: string;
  customerId: { _id: string; name: string; whatsapp?: string; address?: string };
  createdAt: string;
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

export default function PetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [pet, setPet] = useState<PetDetail | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [mhOpen, setMhOpen] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [petRes, mhRes] = await Promise.all([
        apiFetch<{ data: PetDetail }>(`/api/pets/${id}`),
        apiFetch<{ data: { records: MedicalRecord[]; totalVisits: number } }>(`/api/medical-histories/by-pet/${id}`),
      ]);
      setPet(petRes.data);
      setRecords(mhRes.data.records);
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const openCreateMH = async () => {
    setTreatments([]);
    setPrescriptions([]);
    form.resetFields();
    const [srvRes, medRes] = await Promise.all([
      apiFetch<{ data: any[] }>("/api/products/services?limit=100"),
      apiFetch<{ data: any[] }>("/api/products/physical?limit=100"),
    ]);
    setServices(srvRes.data);
    setMedicines(medRes.data);
    setMhOpen(true);
  };

  const addTreatment = (productId: string) => {
    const prod = services.find((s) => s._id === productId);
    if (!prod) return;
    setTreatments((prev) => {
      if (prev.find((t) => t.productId === productId)) return prev;
      return [...prev, { productId: prod._id, name: prod.product.name, price: prod.pricing.selling, notes: "" }];
    });
  };

  const addPrescription = (productId: string) => {
    const prod = medicines.find((m) => m._id === productId);
    if (!prod) return;
    setPrescriptions((prev) => [...prev, { productId: prod._id, name: prod.product.name, quantity: 1, price: prod.pricing.selling, dosage: "", notes: "" }]);
  };

  const handleSubmitMH = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await apiFetch("/api/medical-histories", {
        method: "POST",
        body: JSON.stringify({
          petId: id,
          visitDate: values.visitDate.toISOString(),
          diagnosis: values.diagnosis,
          treatments: treatments.map((t) => ({ productId: t.productId, name: t.name, price: t.price, notes: t.notes })),
          prescriptions: prescriptions.map((p) => ({ productId: p.productId, name: p.name, quantity: p.quantity, price: p.price, dosage: p.dosage, notes: p.notes })),
          notes: values.notes,
        }),
      });
      message.success("Rekam medis ditambahkan");
      setMhOpen(false);
      fetchData();
    } catch (err: any) {
      if (err.message) message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!pet) return null;

  const mhColumns = [
    { title: "Tanggal", dataIndex: "visitDate", render: (v: string) => dayjs(v).format("DD/MM/YYYY") },
    { title: "Diagnosis", dataIndex: "diagnosis", ellipsis: true },
    { title: "Tindakan", key: "treatments", render: (_: any, r: MedicalRecord) => <span>{r.treatments?.length || 0} item</span> },
    { title: "Resep", key: "prescriptions", render: (_: any, r: MedicalRecord) => <span>{r.prescriptions?.length || 0} item</span> },
    { title: "Dokter", key: "doctor", render: (_: any, r: MedicalRecord) => r.doctorId?.name || "-" },
    {
      title: "Aksi", key: "action",
      render: (_: any, r: MedicalRecord) => (
        <Button size="small" onClick={() => router.push(`/dashboard/medical-histories/${r._id}`)}>
          Detail
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>Detail Pasien</Title>
      <Card loading={loading}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="Nama">{pet.name}</Descriptions.Item>
          <Descriptions.Item label="Jenis">{pet.kind}</Descriptions.Item>
          <Descriptions.Item label="Gender">{pet.gender === "male" ? "Jantan" : "Betina"}</Descriptions.Item>
          <Descriptions.Item label="Catatan">{pet.notes || "-"}</Descriptions.Item>
          <Descriptions.Item label="Pemilik">{pet.customerId?.name}</Descriptions.Item>
          <Descriptions.Item label="WhatsApp">{pet.customerId?.whatsapp || "-"}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        title="Riwayat Medis"
        style={{ marginTop: 16 }}
        extra={<Button type="primary" icon={<FileText size={16} />} onClick={openCreateMH}>Tambah Rekam Medis</Button>}
      >
        <Table dataSource={records} columns={mhColumns} rowKey="_id" pagination={false} size="small" />
      </Card>

      {/* Modal Create Medical History */}
      <Modal title="Tambah Rekam Medis" open={mhOpen} onOk={handleSubmitMH} onCancel={() => setMhOpen(false)} width={700} confirmLoading={submitting}>
        <Form form={form} layout="vertical">
          <Form.Item name="visitDate" label="Tanggal Kunjungan" rules={[{ required: true, message: "Pilih tanggal" }]}>
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="diagnosis" label="Diagnosis" rules={[{ required: true, message: "Wajib" }]}>
            <Input.TextArea rows={2} />
          </Form.Item>

          <Title level={5}>Tindakan (Jasa)</Title>
          <Select showSearch placeholder="Tambah tindakan..." style={{ width: "100%", marginBottom: 8 }}
            filterOption={(input, option) => (option?.label as string || "").toLowerCase().includes(input.toLowerCase())}
            options={services.map((s) => ({ value: s._id, label: `${s.product.name} - ${formatPrice(s.pricing.selling)}` }))}
            onChange={addTreatment}
          />
          {treatments.map((t, i) => (
            <Card key={t.productId} size="small" style={{ marginBottom: 4 }}>
              <Space style={{ width: "100%", justifyContent: "space-between" }}>
                <Text strong>{t.name}</Text>
                <Text>{formatPrice(t.price)}</Text>
                <Button size="small" danger onClick={() => setTreatments((prev) => prev.filter((_, idx) => idx !== i))}>X</Button>
              </Space>
            </Card>
          ))}

          <Title level={5} style={{ marginTop: 16 }}>Resep Obat</Title>
          <Select showSearch placeholder="Tambah obat..." style={{ width: "100%", marginBottom: 8 }}
            filterOption={(input, option) => (option?.label as string || "").toLowerCase().includes(input.toLowerCase())}
            options={medicines.map((m) => ({ value: m._id, label: `${m.product.name} - ${formatPrice(m.pricing.selling)}` }))}
            onChange={addPrescription}
          />
          {prescriptions.map((p, i) => (
            <Row key={p.productId} gutter={8} style={{ marginBottom: 4 }} align="middle">
              <Col flex="auto"><Text strong>{p.name}</Text></Col>
              <Col><Input type="number" value={p.quantity} onChange={(e) => {
                setPrescriptions((prev) => prev.map((item, idx) => idx === i ? { ...item, quantity: parseInt(e.target.value) || 1 } : item));
              }} style={{ width: 50 }} min={1} /></Col>
              <Col><Input placeholder="Dosis" value={p.dosage} onChange={(e) => {
                setPrescriptions((prev) => prev.map((item, idx) => idx === i ? { ...item, dosage: e.target.value } : item));
              }} style={{ width: 100 }} /></Col>
              <Col><Text>{formatPrice(p.price * p.quantity)}</Text></Col>
              <Col><Button size="small" danger onClick={() => setPrescriptions((prev) => prev.filter((_, idx) => idx !== i))}>X</Button></Col>
            </Row>
          ))}

          <Form.Item name="notes" label="Catatan Dokter" style={{ marginTop: 16 }}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

