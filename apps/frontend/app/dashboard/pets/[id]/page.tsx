"use client";

import { useEffect, useState } from "react";
import { Card, Descriptions, Table, Typography, Tag, Button, Space, Modal, Form, Input, DatePicker, Row, Col } from "antd";
import { FileText } from "lucide-react";
import { apiFetch } from "../../../context/auth";
import { useAntdMessage } from "../../../hooks/useAntdMessage";
import { useParams, useRouter } from "next/navigation";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface MedicalRecord {
  _id: string;
  visitDate: string;
  diagnosis: string;
  doctorId: { _id: string; name: string };
  treatments: any[];
  prescriptions: any[];
  notes?: string;
}

interface PetDetail {
  _id: string;
  name: string;
  kind: string;
  gender: string;
  notes?: string;
  customerId: { _id: string; name: string };
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
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const msg = useAntdMessage();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [petRes, mhRes] = await Promise.all([
        apiFetch<{ data: PetDetail }>(`/api/pets/${id}`),
        apiFetch<{ data: { records: MedicalRecord[] } }>(`/api/medical-histories/by-pet/${id}`),
      ]);
      setPet(petRes.data);
      setRecords(mhRes.data.records || []);
    } catch (err: any) { msg.error(err.message); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [id]);

  const openCreateMH = () => { form.resetFields(); setMhOpen(true); };

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
          notes: values.notes,
        }),
      });
      msg.success("Rekam medis ditambahkan");
      setMhOpen(false);
      fetchData();
    } catch (err: any) { if (err.message) msg.error(err.message); } finally { setSubmitting(false); }
  };

  if (!pet) return null;

  const mhColumns = [
    { title: "Tanggal", dataIndex: "visitDate", render: (v: string) => dayjs(v).format("DD/MM/YYYY") },
    { title: "Diagnosis", dataIndex: "diagnosis" },
    { title: "Dokter", key: "doctor", render: (_: any, r: MedicalRecord) => r.doctorId?.name || "-" },
    {
      title: "Aksi", key: "action",
      render: (_: any, r: MedicalRecord) => (
        <Button size="small" onClick={() => router.push(`/dashboard/medical-histories/${r._id}`)}>Detail</Button>
      ),
    },
  ];

  const handleStartConsultation = () => {
    if (pet.customerId?._id) {
      router.push(`/dashboard/vet-sales/create?customerId=${pet.customerId._id}&petId=${pet._id}`);
    }
  };

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
        </Descriptions>
      </Card>

      <Card
        title="Riwayat Medis"
        style={{ marginTop: 16 }}
        extra={
          <Space>
            <Button type="primary" icon={<FileText size={16} />} onClick={handleStartConsultation}>Konsultasi Baru</Button>
          </Space>
        }
      >
        <Table dataSource={records} columns={mhColumns} rowKey="_id" pagination={false} size="small" loading={loading} />
      </Card>

      <Modal title="Tambah Rekam Medis (Catatan Manual)" open={mhOpen} onOk={handleSubmitMH} onCancel={() => setMhOpen(false)} width={500} confirmLoading={submitting}>
        <Form form={form} layout="vertical">
          <Form.Item name="visitDate" label="Tanggal Kunjungan" rules={[{ required: true }]}>
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="diagnosis" label="Diagnosis" rules={[{ required: true }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="notes" label="Catatan Dokter">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
        <Text type="secondary">Untuk menambahkan tindakan & resep, gunakan "Konsultasi Baru" yang akan membuat transaksi + rekam medis otomatis.</Text>
      </Modal>
    </div>
  );
}
