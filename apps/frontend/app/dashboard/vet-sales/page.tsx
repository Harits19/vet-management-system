"use client";

import { useEffect, useState } from "react";
import { Card, Table, Button, Input, Space, Typography, Tag, Row, Col } from "antd";
import { Search, Eye, Plus } from "lucide-react";
import { apiFetch } from "../../context/auth";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

const { Title } = Typography;

function formatPrice(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

interface VetSale {
  _id: string;
  receiptNumber: string;
  timestamp: string;
  customer: { _id: string; name: string };
  pet?: { _id: string; name: string; kind: string };
  cashier: { _id: string; name: string };
  summary: { total: number; paid: number };
  paymentStatus: string;
  paymentMethod: string;
  items: any[];
}

export default function VetSalesPage() {
  const [data, setData] = useState<VetSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const fetchData = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "10", search, sortBy: "timestamp", order: "desc" });
      const res = await apiFetch<{ data: any; meta: { total: number } }>(`/api/transactions?${params}`);
      setData(res.data);
      setTotal(res.meta.total);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const columns = [
    { title: "No. Struk", dataIndex: "receiptNumber" },
    { title: "Tanggal", dataIndex: "timestamp", render: (v: string) => dayjs(v).format("DD/MM/YY HH:mm") },
    { title: "Customer", key: "customer", render: (_: any, r: VetSale) => r.customer?.name || "-" },
    { title: "Pasien", key: "pet", render: (_: any, r: VetSale) => r.pet ? `${r.pet.name} (${r.pet.kind})` : "-" },
    { title: "Total", key: "total", render: (_: any, r: VetSale) => formatPrice(r.summary.total) },
    { title: "Status", dataIndex: "paymentStatus", render: (v: string) => {
      const colors: Record<string, string> = { paid: "green", debt: "red", dp: "orange" };
      const labels: Record<string, string> = { paid: "Lunas", debt: "Hutang", dp: "DP" };
      return <Tag color={colors[v]}>{labels[v]}</Tag>;
    }},
    { title: "Metode", dataIndex: "paymentMethod" },
    { title: "Kasir", key: "kasir", render: (_: any, r: VetSale) => r.cashier?.name },
    {
      title: "Aksi", key: "action",
      render: (_: any, r: VetSale) => (
        <Button size="small" icon={<Eye size={14} />} onClick={() => router.push(`/dashboard/vet-sales/${r._id}`)} />
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>Transaksi Dokter</Title>
      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col flex="auto">
            <Input.Search placeholder="Cari no. struk..." value={search} onChange={(e) => setSearch(e.target.value)} onSearch={() => fetchData(1)} enterButton />
          </Col>
          <Col>
            <Button type="primary" icon={<Plus size={16} />} onClick={() => router.push("/dashboard/vet-sales/create")}>Transaksi Baru</Button>
          </Col>
        </Row>
        <Table dataSource={data} columns={columns} rowKey="_id" loading={loading}
          pagination={{ current: page, total, pageSize: 10, onChange: (p) => { setPage(p); fetchData(p); } }} />
      </Card>
    </div>
  );
}
