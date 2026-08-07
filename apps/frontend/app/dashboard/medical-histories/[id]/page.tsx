"use client";

import { useEffect, useState } from "react";
import { Card, Descriptions, Table, Typography, Tag, Timeline, Button, Space } from "antd";
import { ArrowLeft, Printer } from "lucide-react";
import { apiFetch } from "../../../context/auth";
import { useParams, useRouter } from "next/navigation";
import dayjs from "dayjs";
import { computePetAge } from "@vet/shared";

const { Title, Text } = Typography;

function formatPrice(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

// ── Komponen dokumen cetak formal (kop surat, gaya seperti surat) ──
const docCell = { padding: "6px 8px", border: "1px solid #000", verticalAlign: "top" as const };

function DocSection({ title, rows }: { title: string; rows: [string, string][] }) {
  if (rows.every(([, v]) => !v || v === "-")) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: "bold", marginBottom: 8 }}>{title}</div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <td style={{ padding: "4px 12px 4px 0", width: 190, verticalAlign: "top" }}>{label}</td>
              <td style={{ padding: "4px 0", width: 20, verticalAlign: "top" }}>:</td>
              <td style={{ padding: "4px 0", verticalAlign: "top" }}>{value || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DocTable({ title, headers, rows }: { title: string; headers: string[]; rows: (string | number)[][] }) {
  if (rows.length === 0) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: "bold", marginBottom: 8 }}>{title}</div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>{headers.map((h) => <th key={h} style={{ ...docCell, textAlign: "left" }}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j} style={docCell}>{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface MHDetail {
  _id: string;
  petId: {
    _id: string;
    name: string;
    kind: string;
    breed?: string;
    furColor?: string;
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
  const router = useRouter();
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

  const infoRows: [string, string][] = [
    ["Nama Hewan", pet?.name || "-"],
    ["Jenis / Ras", `${pet?.kind || "-"}${pet?.breed ? ` / ${pet.breed}` : ""}`],
    ["Warna Bulu", pet?.furColor || "-"],
    ["Umur", petAge ? petAge.label : "-"],
    ["Pemilik", pet?.customerId?.name || "-"],
    ["Dokter", record.doctorId?.name || "-"],
    ["Berat Badan", showExamValue("weight")],
    ["Suhu Tubuh", showExamValue("temperature")],
  ];

  const soapRows: [string, string][] = [
    ["S — Keluhan (Subjective)", record.soap?.subjective?.complaint || "-"],
    ["O — Berat Badan", showExamValue("weight")],
    ["O — Suhu Tubuh", showExamValue("temperature")],
    ["O — Hasil Pemeriksaan Laboratorium", record.soap?.objective?.labResult || "-"],
    ["A — Diagnosis Banding", record.soap?.assessment?.differentialDiagnosis || "-"],
    ["A — Pemeriksaan Fisik (catatan)", record.soap?.assessment?.physicalExamNote || "-"],
    ["P — Rencana Penanganan", record.soap?.plan?.treatmentPlan || "-"],
    ["P — Catatan Dokter", record.soap?.plan?.doctorNotes || "-"],
    ["P — Catatan untuk Pemilik", record.soap?.plan?.ownerNote || "-"],
    ["P — Catatan untuk Paramedis", record.soap?.plan?.paramedicNote || "-"],
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }} className="no-print">
        <Button icon={<ArrowLeft size={16} />} onClick={() => router.back()}>Kembali</Button>
        <Button type="primary" icon={<Printer size={16} />} onClick={() => window.print()}>Cetak / Print</Button>
      </Space>
      <Title level={4} className="no-print">Detail Rekam Medis</Title>

      <style>{`
        .rm-doc { display: none; }
        @media print {
          html, body { height: auto !important; }
          html { color-scheme: light !important; }
          * { color: #000 !important; background-color: #fff !important; box-shadow: none !important; text-shadow: none !important; }
          .ant-layout-sider, .ant-layout-header { display: none !important; }
          .ant-layout { background: #fff !important; min-height: 0 !important; height: auto !important; }
          .ant-layout-content { padding: 0 !important; margin: 0 !important; min-height: 0 !important; }
          .no-print { display: none !important; }
          .screen-only { display: none !important; }
          .rm-doc { display: block !important; }
        }
      `}</style>

      <div className="screen-only">
      <Card loading={loading} title="Informasi Pasien">
        <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
          <Descriptions.Item label="Nama Hewan">{pet?.name || "-"}</Descriptions.Item>
          <Descriptions.Item label="Pemilik">{pet?.customerId?.name || "-"}</Descriptions.Item>
          <Descriptions.Item label="Jenis Hewan">{pet?.kind || "-"}</Descriptions.Item>
          <Descriptions.Item label="Ras">{pet?.breed || "-"}</Descriptions.Item>
          <Descriptions.Item label="Warna Bulu">{pet?.furColor || "-"}</Descriptions.Item>
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

      {/* ── Dokumen cetak formal (hanya tampil saat print) ── */}
      <div
        className="rm-doc"
        style={{
          maxWidth: 794,
          margin: "0 auto",
          background: "#fff",
          padding: 40,
          fontFamily: "Georgia, 'Times New Roman', serif",
          color: "#000",
          fontSize: 14,
          lineHeight: 1.7,
        }}
      >
        {/* Kop surat */}
        <div style={{ textAlign: "center", borderBottom: "3px double #000", paddingBottom: 12, marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: "bold", letterSpacing: 2 }}>WEDI ANIMAL CARE</div>
          <div style={{ fontSize: 12 }}>Klinik Hewan — Praktek Dokter Hewan</div>
        </div>

        {/* Judul dokumen */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: "bold", textDecoration: "underline" }}>REKAM MEDIS</div>
          <div style={{ fontSize: 12 }}>Tanggal: {dayjs(record.visitDate).format("DD/MM/YYYY HH:mm")}</div>
        </div>

        <DocSection title="DATA PASIEN" rows={infoRows} />
        <DocSection title="ANAMNESA (SOAP)" rows={soapRows} />

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: "bold", marginBottom: 8 }}>DIAGNOSIS</div>
          <div>{record.diagnosis || "-"}</div>
        </div>

        <DocTable
          title="TINDAKAN (JASA)"
          headers={["Nama Tindakan", "Jumlah", "Harga", "Subtotal", "Catatan"]}
          rows={(record.treatments || []).map((t) => [t.name, t.quantity, formatPrice(t.price), formatPrice(t.price * t.quantity), t.notes || "-"])}
        />

        <DocTable
          title="RESEP OBAT"
          headers={["Nama Obat", "Jumlah", "Dosis", "Aturan Pakai", "Harga", "Subtotal", "Catatan"]}
          rows={(record.prescriptions || []).map((p) => [p.name, p.quantity, p.dosage || "-", p.usage || "-", formatPrice(p.price), formatPrice(p.price * p.quantity), p.notes || "-"])}
        />

        <DocTable
          title="BARANG (NON-OBAT)"
          headers={["Nama Barang", "Jumlah", "Harga", "Subtotal", "Catatan"]}
          rows={((record as any).goods || []).map((g: any) => [g.name, g.quantity, formatPrice(g.price), formatPrice(g.price * g.quantity), g.notes || "-"])}
        />

        {/* Tanda tangan */}
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginTop: 32 }}>
          <div style={{ textAlign: "center", width: 250 }}>
            <div style={{ fontSize: 12 }}>Pemilik / Penanggung Jawab,</div>
            <div style={{ height: 80 }} />
            <div style={{ borderBottom: "1px solid #000", width: 180, margin: "0 auto" }} />
            <div>({pet?.customerId?.name || "-"})</div>
          </div>
          <div style={{ textAlign: "center", width: 250 }}>
            <div style={{ fontSize: 12 }}>Dokter Hewan,</div>
            <div style={{ height: 80 }} />
            <div style={{ borderBottom: "1px solid #000", width: 180, margin: "0 auto" }} />
            <div>({record.doctorId?.name || "-"})</div>
          </div>
        </div>
      </div>
    </div>
  );
}
