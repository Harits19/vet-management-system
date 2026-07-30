"use client";

import { useEffect, useState } from "react";
import { Card, Descriptions, Table, Typography, Button, Space, message, Tag } from "antd";
import { ShoppingCart } from "lucide-react";
import { apiFetch } from "../../../context/auth";
import { useParams, useRouter } from "next/navigation";
import dayjs from "dayjs";

const { Title, Text } = Typography;

function formatPrice(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

interface MHDetail {
  _id: string;
  petId: { _id: string; name: string; kind: string };
  visitDate: string;
  diagnosis: string;
  doctorId: { _id: string; name: string };
  treatments: { productId: string; name: string; price: number; notes?: string }[];
  prescriptions: { productId: string; name: string; quantity: number; price: number; dosage?: string; notes?: string }[];
  notes?: string;
  createdAt: string;
}

export default function MedicalHistoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [record, setRecord] = useState<MHDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    apiFetch<{ data: MHDetail }>(`/api/medical-histories/${id}`)
      .then((res) => setRecord(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleGenerateSale = async () => {
    setGenerating(true);
    try {
      const res = await apiFetch<{ data: any }>(`/api/vet-sales/from-medical-history/${id}`, {
        method: "POST",
        body: JSON.stringify({ paidAmount: calcTotal(), paymentMethod: "Tunai" }),
      });
      message.success(`Transaksi dibuat: ${res.data.receiptNumber}`);
      router.push(`/dashboard/vet-sales/${res.data._id}`);
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const calcTotal = () => {
    if (!record) return 0;
    const t = (record.treatments || []).reduce((s, i) => s + i.price, 0);
    const p = (record.prescriptions || []).reduce((s, i) => s + i.price * i.quantity, 0);
    return t + p;
  };

  if (!record) return null;

  const total = calcTotal();

  return (
    <div>
      <Title level={4}>Detail Rekam Medis</Title>
      <Card loading={loading}>
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="Pasien">{record.petId?.name} ({record.petId?.kind})</Descriptions.Item>
          <Descriptions.Item label="Tanggal">{dayjs(record.visitDate).format("DD/MM/YYYY")}</Descriptions.Item>
          <Descriptions.Item label="Dokter">{record.doctorId?.name}</Descriptions.Item>
          <Descriptions.Item label="Diagnosis" span={2}>{record.diagnosis}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Tindakan (Jasa)" style={{ marginTop: 16 }}>
        <Table dataSource={record.treatments || []}
          columns={[
            { title: "Nama", dataIndex: "name" },
            { title: "Harga", dataIndex: "price", render: (v: number) => formatPrice(v) },
            { title: "Catatan", dataIndex: "notes", render: (v?: string) => v || "-" },
          ]} rowKey="productId" pagination={false} size="small" />
      </Card>

      <Card title="Resep Obat" style={{ marginTop: 16 }}>
        <Table dataSource={record.prescriptions || []}
          columns={[
            { title: "Nama", dataIndex: "name" },
            { title: "Jumlah", dataIndex: "quantity" },
            { title: "Harga", dataIndex: "price", render: (v: number) => formatPrice(v) },
            { title: "Subtotal", key: "subtotal", render: (_: any, r: any) => formatPrice(r.price * r.quantity) },
            { title: "Dosis", dataIndex: "dosage", render: (v?: string) => v || "-" },
          ]} rowKey="productId" pagination={false} size="small" />
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <div style={{ textAlign: "right", fontSize: 18 }}>Total: <Text strong>{formatPrice(total)}</Text></div>
          <Button type="primary" icon={<ShoppingCart size={16} />} size="large" block loading={generating} onClick={handleGenerateSale}>
            Generate Transaksi & Checkout
          </Button>
        </Space>
      </Card>
    </div>
  );
}
