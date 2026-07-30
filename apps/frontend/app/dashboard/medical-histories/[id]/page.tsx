"use client";

import { useEffect, useState } from "react";
import { Card, Descriptions, Table, Typography, Tag } from "antd";
import { apiFetch } from "../../../context/auth";
import { useParams } from "next/navigation";
import dayjs from "dayjs";

const { Title } = Typography;

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
}

export default function MedicalHistoryDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [record, setRecord] = useState<MHDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ data: MHDetail }>(`/api/medical-histories/${id}`)
      .then((res) => setRecord(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (!record) return null;

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

      {record.treatments?.length > 0 && (
        <Card title="Tindakan (Jasa)" style={{ marginTop: 16 }}>
          <Table dataSource={record.treatments}
            columns={[
              { title: "Nama", dataIndex: "name" },
              { title: "Harga", dataIndex: "price", render: (v: number) => formatPrice(v) },
              { title: "Catatan", dataIndex: "notes", render: (v?: string) => v || "-" },
            ]} rowKey="productId" pagination={false} size="small" />
        </Card>
      )}

      {record.prescriptions?.length > 0 && (
        <Card title="Resep Obat" style={{ marginTop: 16 }}>
          <Table dataSource={record.prescriptions}
            columns={[
              { title: "Nama", dataIndex: "name" },
              { title: "Jumlah", dataIndex: "quantity" },
              { title: "Harga", dataIndex: "price", render: (v: number) => formatPrice(v) },
              { title: "Subtotal", key: "subtotal", render: (_: any, r: any) => formatPrice(r.price * r.quantity) },
              { title: "Dosis", dataIndex: "dosage", render: (v?: string) => v || "-" },
            ]} rowKey="productId" pagination={false} size="small" />
        </Card>
      )}

      {record.notes && (
        <Card title="Catatan Dokter" style={{ marginTop: 16 }}>
          <Typography.Text>{record.notes}</Typography.Text>
        </Card>
      )}
    </div>
  );
}
