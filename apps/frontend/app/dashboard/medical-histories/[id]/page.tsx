"use client";

import { useEffect, useState } from "react";
import { Card, Descriptions, Table, Typography, Tag, Timeline } from "antd";
import { apiFetch } from "../../../context/auth";
import { useParams } from "next/navigation";
import dayjs from "dayjs";
import { computePetAge } from "@vet/shared";

const { Title, Text } = Typography;

function formatPrice(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

interface MHDetail {
  _id: string;
  petId: {
    _id: string;
    name: string;
    kind: string;
    breed?: string;
    gender?: string;
    birthDate?: string;
    initialAge?: { value: number; unit: "month" | "year" };
    createdAt?: string;
    customerId?: { _id: string; name: string; whatsapp?: string };
  };
  visitDate: string;
  soap?: {
    subjective: { complaint: string };
    objective: { physicalExam: { key: string; label: string; value?: number; unit?: string }[]; labResult?: string };
    assessment: { differentialDiagnosis: string; physicalExamNote?: string };
    plan: { treatmentPlan: string; doctorNotes?: string; ownerNote?: string; paramedicNote?: string };
  };
  diagnosis: string;
  doctorId: { _id: string; name: string };
  treatments: { productId: string; name: string; quantity: number; price: number; notes?: string }[];
  prescriptions: { productId: string; name: string; quantity: number; price: number; dosage?: string; usage?: string; notes?: string }[];
}

interface HistoryItem {
  _id: string;
  visitDate: string;
  weight?: number;
  temperature?: number;
}

export default function MedicalHistoryDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [record, setRecord] = useState<MHDetail | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch<{ data: MHDetail }>(`/api/medical-histories/${id}`);
        setRecord(res.data);
        const petId = res.data.petId?._id;
        if (petId) {
          const hRes = await apiFetch<{ data: { records: HistoryItem[] } }>(`/api/medical-histories/by-pet/${petId}`);
          setHistory(hRes.data.records || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (!record) return null;

  const pet = record.petId;
  const petAge = computePetAge(pet);
  const exam = record.soap?.objective?.physicalExam ?? [];
  const weight = exam.find((i) => i.key === "weight")?.value;
  const temperature = exam.find((i) => i.key === "temperature")?.value;

  const showExamValue = (key: string) => {
    const item = exam.find((i) => i.key === key);
    return item?.value !== undefined ? `${item.value} ${item.unit || ""}`.trim() : "-";
  };

  return (
    <div>
      <Title level={4}>Detail Rekam Medis</Title>
      <Card loading={loading} title="Informasi Pasien">
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="Nama Hewan">{pet?.name || "-"}</Descriptions.Item>
          <Descriptions.Item label="Pemilik">{pet?.customerId?.name || "-"}</Descriptions.Item>
          <Descriptions.Item label="Jenis Hewan">{pet?.kind || "-"}</Descriptions.Item>
          <Descriptions.Item label="Ras">{pet?.breed || "-"}</Descriptions.Item>
          <Descriptions.Item label="Umur">{petAge ? <Tag color="green">{petAge.label}</Tag> : "-"}</Descriptions.Item>
          <Descriptions.Item label="Tanggal Kunjungan">{dayjs(record.visitDate).format("DD/MM/YYYY HH:mm")}</Descriptions.Item>
          <Descriptions.Item label="Berat Badan (kunjungan ini)">{showExamValue("weight")}</Descriptions.Item>
          <Descriptions.Item label="Suhu Tubuh (kunjungan ini)">{showExamValue("temperature")}</Descriptions.Item>
          <Descriptions.Item label="Dokter">{record.doctorId?.name || "-"}</Descriptions.Item>
        </Descriptions>
      </Card>

      {history.length > 1 && (
        <Card title="Riwayat Berat Badan & Suhu Tubuh" size="small" style={{ marginTop: 16 }}>
          <Timeline
            items={history.map((h) => ({
              key: h._id,
              color: h._id === record._id ? "green" : "gray",
              children: (
                <Text>
                  <Text strong>{dayjs(h.visitDate).format("DD/MM/YYYY")}</Text>
                  {" — "}BB: <Text strong>{h.weight ?? "-"} kg</Text>, Suhu: <Text strong>{h.temperature ?? "-"} °C</Text>
                  {h._id === record._id && <Tag color="green" style={{ marginLeft: 8 }}>Rekam ini</Tag>}
                </Text>
              ),
            }))}
          />
        </Card>
      )}

      <Card title="SOAP" style={{ marginTop: 16 }}>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="S — Keluhan (Subjective)">
            {record.soap?.subjective?.complaint || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="O — Berat Badan">
            {showExamValue("weight")}
          </Descriptions.Item>
          <Descriptions.Item label="O — Suhu Tubuh">
            {showExamValue("temperature")}
          </Descriptions.Item>
          <Descriptions.Item label="A — Diagnosis Banding (Assessment)">
            {record.soap?.assessment?.differentialDiagnosis || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="A — Pemeriksaan Fisik (catatan)">
            {record.soap?.assessment?.physicalExamNote || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="P — Rencana Penanganan (Plan)">
            {record.soap?.plan?.treatmentPlan || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="P — Catatan Dokter (Plan)">
            {record.soap?.plan?.doctorNotes || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="P — Catatan Dokter Untuk Pemilik">
            {record.soap?.plan?.ownerNote || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="P — Catatan Dokter Untuk Paramedis">
            {record.soap?.plan?.paramedicNote || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="O — Hasil Pemeriksaan Laboratorium">
            {record.soap?.objective?.labResult || "-"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Diagnosis (Penegakan Diagnosis)" style={{ marginTop: 16 }}>
        <Text>{record.diagnosis || "-"}</Text>
      </Card>

      <Card title="Tindakan (Jasa)" style={{ marginTop: 16 }}>
        {record.treatments?.length > 0 ? (
          <Table
            dataSource={record.treatments}
            rowKey={(r) => `${r.productId}-${r.name}`}
            pagination={false}
            size="small"
            columns={[
              { title: "Nama Tindakan", dataIndex: "name" },
              { title: "Jumlah", dataIndex: "quantity" },
              { title: "Harga", dataIndex: "price", render: (v: number) => formatPrice(v) },
              { title: "Subtotal", key: "subtotal", render: (_: any, r: any) => formatPrice(r.price * r.quantity) },
              { title: "Catatan", dataIndex: "notes", render: (v?: string) => v || "-" },
            ]}
          />
        ) : (
          <Text type="secondary">Tidak ada tindakan</Text>
        )}
      </Card>

      <Card title="Resep Obat" style={{ marginTop: 16 }}>
        {record.prescriptions?.length > 0 ? (
          <Table
            dataSource={record.prescriptions}
            rowKey={(r) => `${r.productId}-${r.name}`}
            pagination={false}
            size="small"
            columns={[
              { title: "Nama Obat", dataIndex: "name" },
              { title: "Jumlah", dataIndex: "quantity" },
              { title: "Dosis", dataIndex: "dosage", render: (v?: string) => v || "-" },
              { title: "Aturan Pakai", dataIndex: "usage", render: (v?: string) => v || "-" },
              { title: "Harga", dataIndex: "price", render: (v: number) => formatPrice(v) },
              { title: "Subtotal", key: "subtotal", render: (_: any, r: any) => formatPrice(r.price * r.quantity) },
              { title: "Catatan", dataIndex: "notes", render: (v?: string) => v || "-" },
            ]}
          />
        ) : (
          <Text type="secondary">Tidak ada resep obat</Text>
        )}
      </Card>

      <Card title="Barang (Non-Obat)" style={{ marginTop: 16 }}>
        {(record as any).goods?.length > 0 ? (
          <Table
            dataSource={(record as any).goods}
            rowKey={(r: any) => `${r.productId}-${r.name}`}
            pagination={false}
            size="small"
            columns={[
              { title: "Nama Barang", dataIndex: "name" },
              { title: "Jumlah", dataIndex: "quantity" },
              { title: "Harga", dataIndex: "price", render: (v: number) => formatPrice(v) },
              { title: "Subtotal", key: "subtotal", render: (_: any, r: any) => formatPrice(r.price * r.quantity) },
              { title: "Catatan", dataIndex: "notes", render: (v?: string) => v || "-" },
            ]}
          />
        ) : (
          <Text type="secondary">Tidak ada barang</Text>
        )}
      </Card>
    </div>
  );
}
