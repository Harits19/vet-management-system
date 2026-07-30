"use client";

import { useEffect, useState } from "react";
import { Card, Descriptions, Table, Typography, Tag, Button, Space } from "antd";
import { Printer } from "lucide-react";
import { apiFetch } from "../../../context/auth";
import { useParams } from "next/navigation";
import dayjs from "dayjs";

const { Title } = Typography;

function formatPrice(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

interface VetSaleDetail {
  _id: string;
  receiptNumber: string;
  timestamp: string;
  customer: { _id: string; name: string };
  pet?: { _id: string; name: string; kind: string };
  medicalHistoryId?: string;
  cashier: { _id: string; name: string };
  items: {
    product: { _id: string; name: string; type: string };
    quantity: number;
    pricing: { cost?: number; selling: number; total: number };
    dosage?: string;
  }[];
  summary: { total: number; profit: number; cost: number; paid: number };
  paymentStatus: string;
  paymentMethod: string;
}

export default function VetSaleDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [sale, setSale] = useState<VetSaleDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ data: any }>(`/api/transactions/${id}`)
      .then((res) => setSale(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (!sale) return null;

  const itemColumns = [
    { title: "Tipe", key: "type", render: (_: any, r: any) => r.product.type === "service" ? <Tag color="blue">Jasa</Tag> : <Tag>Obat</Tag> },
    { title: "Nama", key: "name", render: (_: any, r: any) => r.product.name },
    { title: "Qty", dataIndex: "quantity" },
    { title: "Harga", key: "price", render: (_: any, r: any) => formatPrice(r.pricing.selling) },
    { title: "Total", key: "total", render: (_: any, r: any) => formatPrice(r.pricing.total) },
    { title: "Dosis", dataIndex: "dosage", render: (v?: string) => v || "-" },
  ];

  return (
    <div>
      <Title level={4}>Detail Transaksi Dokter</Title>
      <Card loading={loading}>
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="No. Struk">{sale.receiptNumber}</Descriptions.Item>
          <Descriptions.Item label="Tanggal">{dayjs(sale.timestamp).format("DD/MM/YY HH:mm")}</Descriptions.Item>
          <Descriptions.Item label="Customer">{sale.customer?.name}</Descriptions.Item>
          <Descriptions.Item label="Pasien">{sale.pet ? `${sale.pet.name} (${sale.pet.kind})` : "-"}</Descriptions.Item>
          <Descriptions.Item label="Status"><Tag color={sale.paymentStatus === "paid" ? "green" : "red"}>{sale.paymentStatus}</Tag></Descriptions.Item>
          <Descriptions.Item label="Metode">{sale.paymentMethod}</Descriptions.Item>
          <Descriptions.Item label="Total">{formatPrice(sale.summary.total)}</Descriptions.Item>
          <Descriptions.Item label="Dibayar">{formatPrice(sale.summary.paid)}</Descriptions.Item>
          {sale.summary.paid > sale.summary.total && (
            <Descriptions.Item label="Kembalian"><span style={{ color: "#52c41a" }}>{formatPrice(sale.summary.paid - sale.summary.total)}</span></Descriptions.Item>
          )}
          <Descriptions.Item label="Kasir">{sale.cashier?.name}</Descriptions.Item>
        </Descriptions>
        <Table dataSource={sale.items} columns={itemColumns} rowKey={(r: any) => r.product._id} pagination={false} size="small" style={{ marginTop: 16 }} />
      </Card>
    </div>
  );
}
