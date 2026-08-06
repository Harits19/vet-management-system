"use client";

import { useEffect, useState } from "react";
import { Card, Table, Button, Input, Space, Typography, Tag, Row, Col } from "antd";
import { Search, Eye } from "lucide-react";
import { apiFetch } from "../../context/auth";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

const { Title } = Typography;

interface MHRecord {
  _id: string;
  petId: { _id: string; name: string; kind: string };
  visitDate: string;
  diagnosis: string;
  doctorId: { _id: string; name: string };
  treatments: any[];
  prescriptions: any[];
  createdAt: string;
}

export default function MedicalHistoriesPage() {
  const [data, setData] = useState<MHRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("visitDate");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const router = useRouter();

  const fetchData = async (p = page, s = search, sb = sortBy, od = order) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "10", search: s, sortBy: sb, order: od });
      const res = await apiFetch<{ data: MHRecord[]; meta: { total: number } }>(`/api/medical-histories?${params}`);
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
    { title: "Tanggal", dataIndex: "visitDate", sorter: true, render: (v: string) => dayjs(v).format("DD/MM/YYYY") },
    { title: "Pasien", key: "pet", render: (_: any, r: MHRecord) => `${r.petId?.name || "-"} (${r.petId?.kind || "-"})` },
    { title: "Diagnosis", dataIndex: "diagnosis", ellipsis: true },
    { title: "Tindakan", key: "treatments", render: (_: any, r: MHRecord) => <Tag>{r.treatments?.length || 0} item</Tag> },
    { title: "Resep", key: "prescriptions", render: (_: any, r: MHRecord) => <Tag>{r.prescriptions?.length || 0} item</Tag> },
    { title: "Dokter", key: "doctor", render: (_: any, r: MHRecord) => r.doctorId?.name || "-" },
    {
      title: "Aksi", key: "action",
      render: (_: any, r: MHRecord) => (
        <Button size="small" icon={<Eye size={14} />} onClick={() => router.push(`/dashboard/medical-histories/${r._id}`)} />
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>Rekam Medis</Title>
      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col flex="auto">
            <Input.Search placeholder="Cari..." value={search} onChange={(e) => setSearch(e.target.value)} onSearch={() => fetchData(1)} enterButton />
          </Col>
        </Row>
        <Table dataSource={data} columns={columns} rowKey="_id" loading={loading}
          onChange={(_, __, sorter) => {
            const s: any = Array.isArray(sorter) ? sorter[0] : sorter;
            const sb = s?.order ? String(s.field) : "visitDate";
            const od = s?.order === "ascend" ? "asc" : s?.order === "descend" ? "desc" : "desc";
            setSortBy(sb); setOrder(od); setPage(1); fetchData(1, search, sb, od);
          }}
          pagination={{ current: page, total, pageSize: 10, onChange: (p) => { setPage(p); fetchData(p); } }} />
      </Card>
    </div>
  );
}
