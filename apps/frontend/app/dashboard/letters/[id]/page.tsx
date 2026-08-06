"use client";

import { useEffect, useState } from "react";
import { Button, Space, Typography, Skeleton, Tag, Card } from "antd";
import { ArrowLeft, Printer } from "lucide-react";
import { apiFetch } from "../../../context/auth";
import { useParams, useRouter } from "next/navigation";
import dayjs from "dayjs";
import { LETTER_TYPE_META, LETTER_BODY, letterTypeLabel, letterTypeColor } from "../constants";

const { Title, Text } = Typography;

interface LetterDetail {
  _id: string;
  letterType: string;
  letterNumber: string;
  date: string;
  subject?: string;
  notes?: string;
  ownerSignature?: string;
  ownerSignedName?: string;
  signedAt?: string;
  petId?: {
    name: string;
    kind?: string;
    breed?: string;
    gender?: string;
    initialAge?: { value: number; unit: "month" | "year" };
  };
  customerId?: { name: string; whatsapp?: string; address?: string; province?: string; regency?: string; district?: string; village?: string; hamlet?: string };
  doctorId?: { name: string };
}

function formatAge(age?: { value: number; unit: "month" | "year" }) {
  if (!age) return "-";
  const v = age.value;
  const u = age.unit === "year" ? "tahun" : "bulan";
  return `${v} ${u}`;
}

function formatAddress(c?: { address?: string; hamlet?: string; village?: string; district?: string; regency?: string; province?: string }) {
  if (!c) return "-";
  const parts = [c.address, c.hamlet ? `Dusun ${c.hamlet}` : "", c.village, c.district, c.regency, c.province].filter(Boolean);
  return parts.join(", ") || "-";
}

export default function LetterDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<LetterDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ data: LetterDetail }>(`/api/letters/${params.id}`)
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  const meta = data ? LETTER_TYPE_META[data.letterType] : undefined;

  const infoRows: [string, string][] = data
    ? [
        ["Nama Hewan", data.petId?.name ?? "-"],
        [
          "Jenis / Ras",
          `${data.petId?.kind ?? "-"}${data.petId?.breed ? ` / ${data.petId.breed}` : ""}`,
        ],
        ["Umur", formatAge(data.petId?.initialAge)],
        ["Pemilik", data.customerId?.name ?? "-"],
        ["Alamat", formatAddress(data.customerId)],
        ["No. WhatsApp", data.customerId?.whatsapp || "-"],
      ]
    : [];

  return (
    <div>
      <Space style={{ marginBottom: 16 }} className="no-print">
        <Button icon={<ArrowLeft size={16} />} onClick={() => router.push("/dashboard/letters")}>
          Kembali
        </Button>
        <Button type="primary" icon={<Printer size={16} />} onClick={() => window.print()}>
          Cetak / Print
        </Button>
      </Space>

      <style>{`
        @media print {
          .ant-layout-sider, .ant-layout-header { display: none !important; }
          .ant-layout { background: #fff !important; }
          .ant-layout-content { padding: 0 !important; margin: 0 !important; }
          .no-print { display: none !important; }
          .letter-doc { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      {loading || !data ? (
        <Card>
          <Skeleton active />
        </Card>
      ) : (
        <div
          className="letter-doc"
          style={{
            maxWidth: 794,
            margin: "0 auto",
            background: "#fff",
            padding: 40,
            borderRadius: 8,
            boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
            fontFamily: "Georgia, 'Times New Roman', serif",
            color: "#000",
            fontSize: 14,
            lineHeight: 1.7,
          }}
        >
          {/* Kop surat */}
          <div
            style={{
              textAlign: "center",
              borderBottom: "3px double #000",
              paddingBottom: 12,
              marginBottom: 20,
            }}
          >
            <Title level={3} style={{ margin: 0, letterSpacing: 2, fontFamily: "inherit" }}>
              WEDI ANIMAL CARE
            </Title>
            <Text style={{ fontSize: 12, fontFamily: "inherit" }}>
              Klinik Hewan — Praktek Dokter Hewan
            </Text>
          </div>

          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <Title
              level={4}
              style={{ margin: 0, textDecoration: "underline", fontFamily: "inherit" }}
            >
              {meta?.label ?? letterTypeLabel(data.letterType)}
            </Title>
            <Text style={{ fontSize: 12, fontFamily: "inherit" }}>Nomor: {data.letterNumber}</Text>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
            <tbody>
              {infoRows.map(([label, value]) => (
                <tr key={label}>
                  <td style={{ padding: "4px 12px 4px 0", width: 170, verticalAlign: "top" }}>
                    {label}
                  </td>
                  <td style={{ padding: "4px 0", width: 20, verticalAlign: "top" }}>:</td>
                  <td style={{ padding: "4px 0", verticalAlign: "top" }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginBottom: 16 }}>
            <Text style={{ fontFamily: "inherit" }}>{LETTER_BODY[data.letterType] ?? ""}</Text>
          </div>

          {data.subject && (
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontFamily: "inherit" }}>
                {meta?.subjectLabel}:{" "}
              </Text>
              <Text style={{ fontFamily: "inherit" }}>{data.subject}</Text>
            </div>
          )}

          {data.notes && (
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontFamily: "inherit" }}>
                Catatan / Keterangan:{" "}
              </Text>
              <Text style={{ fontFamily: "inherit", whiteSpace: "pre-wrap" }}>{data.notes}</Text>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <Text style={{ fontFamily: "inherit" }}>
              Demikian surat ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.
            </Text>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
            <div style={{ textAlign: "center", width: 250 }}>
              <Text style={{ fontFamily: "inherit", fontSize: 12 }}>
                {data.signedAt
                  ? `Dibuat & ditandatangani, ${dayjs(data.signedAt).format("DD/MM/YYYY")}`
                  : "Pemilik / Penanggung Jawab,"}
              </Text>
              <div style={{ height: 90, marginTop: 8 }}>
                {data.ownerSignature ? (
                  <img
                    src={data.ownerSignature}
                    alt="Tanda tangan pemilik"
                    style={{ maxHeight: 90, maxWidth: 220, borderBottom: "1px solid #000" }}
                  />
                ) : (
                  <div
                    style={{
                      height: 90,
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "center",
                    }}
                  >
                    <div style={{ borderBottom: "1px solid #000", width: 180, paddingBottom: 4 }} />
                  </div>
                )}
              </div>
              <Text strong style={{ fontFamily: "inherit" }}>
                ({data.ownerSignedName || "-"})
              </Text>
            </div>

            <div style={{ textAlign: "center", width: 250 }}>
              <Text style={{ fontFamily: "inherit", fontSize: 12 }}>Dokter Hewan,</Text>
              <div style={{ height: 90, marginTop: 8 }} />
              <Text strong style={{ fontFamily: "inherit" }}>
                ({data.doctorId?.name ?? "-"})
              </Text>
            </div>
          </div>

          <div style={{ marginTop: 24, textAlign: "center" }}>
            <Tag color={letterTypeColor(data.letterType)}>{letterTypeLabel(data.letterType)}</Tag>
          </div>
        </div>
      )}
    </div>
  );
}
