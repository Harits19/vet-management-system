"use client";

import { useEffect, useState } from "react";
import { Card, Descriptions, Table, Typography, Button, Space, Tag } from "antd";
import { FileText } from "lucide-react";
import { apiFetch } from "../../../context/auth";
import { useAntdMessage } from "../../../hooks/useAntdMessage";
import { useParams, useRouter } from "next/navigation";
import dayjs from "dayjs";
import { computePetAge } from "@vet/shared";

const { Title } = Typography;

interface MedicalRecord {
  _id: string;
  visitDate: string;
  diagnosis: string;
  doctorId: { _id: string; name: string };
  treatments: any[];
  prescriptions: any[];
  weight?: number;
  temperature?: number;
}

interface PetDetail {
  _id: string;
  name: string;
  kind: string;
  breed?: string;
  gender: string;
  birthDate?: string;
  initialAge?: { value: number; unit: "month" | "year" };
  notes?: string;
  customerId: { _id: string; name: string };
}

export default function PetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [pet, setPet] = useState<PetDetail | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
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

  if (!pet) return null;

  const petAge = computePetAge(pet);

  const mhColumns = [
    { title: "Tanggal", dataIndex: "visitDate", render: (v: string) => dayjs(v).format("DD/MM/YYYY") },
    { title: "Diagnosis", dataIndex: "diagnosis" },
    {
      title: "BB / Suhu",
      key: "exam",
      render: (_: any, r: MedicalRecord) =>
        r.weight !== undefined || r.temperature !== undefined
          ? `${r.weight ?? "-"} kg / ${r.temperature ?? "-"} °C`
          : "-",
    },
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
      router.push(`/dashboard/consultations/new?customerId=${pet.customerId._id}&petId=${pet._id}`);
    }
  };

  return (
    <div>
      <Title level={4}>Detail Pasien</Title>
      <Card loading={loading}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="Nama">{pet.name}</Descriptions.Item>
          <Descriptions.Item label="Jenis">{pet.kind}</Descriptions.Item>
          <Descriptions.Item label="Ras">{pet.breed || "-"}</Descriptions.Item>
          <Descriptions.Item label="Gender">{pet.gender === "male" ? "Jantan" : "Betina"}</Descriptions.Item>
          <Descriptions.Item label="Umur">
            {petAge ? <Tag color="green">{petAge.label}</Tag> : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Pemilik">{pet.customerId?.name}</Descriptions.Item>
          <Descriptions.Item label="Catatan" span={2}>{pet.notes || "-"}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        title="Riwayat Medis"
        style={{ marginTop: 16 }}
        extra={
          <Space>
            <Button type="primary" icon={<FileText size={16} />} onClick={handleStartConsultation}>Konsultasi Baru (SOAP)</Button>
          </Space>
        }
      >
        <Table dataSource={records} columns={mhColumns} rowKey="_id" pagination={false} size="small" loading={loading} />
      </Card>
    </div>
  );
}
