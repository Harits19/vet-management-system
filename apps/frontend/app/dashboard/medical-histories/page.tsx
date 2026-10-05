"use client";

import { useState } from "react";
import { Card, Table, Button, Input, Space, Typography, Tag, Row, Col } from "antd";
import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { MHRecord, useGetMedicalHistories } from "@/api/useGetMedicalHistories";

const { Title } = Typography;

export default function MedicalHistoriesPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("visitDate");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const router = useRouter();

  const { data, isLoading: loading } = useGetMedicalHistories({ page, limit, search, sortBy, order });

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
            <Input.Search placeholder="Cari..." value={search} onChange={(e) => setSearch(e.target.value)} onSearch={() => setPage(1)} enterButton />
          </Col>
        </Row>
        <Table dataSource={data?.data ?? []} columns={columns} rowKey="_id" loading={loading} scroll={{ x: 900 }}
          onChange={(_, __, sorter, extra) => {
            // Ant Design memanggil onChange ini JUGA saat pindah halaman (extra.action === "paginate").
            // Tanpa guard, setPage(1) menimpa halaman yang baru dipilih → indikator balik ke 1.
            if (extra?.action !== "sort") return;
            const s: any = Array.isArray(sorter) ? sorter[0] : sorter;
            const sb = s?.order ? String(s.field) : "visitDate";
            const od = s?.order === "ascend" ? "asc" : s?.order === "descend" ? "desc" : "desc";
            setSortBy(sb); setOrder(od); setPage(1);
          }}
          pagination={{
            current: page,
            total: data?.meta.total ?? 0,
            pageSize: limit,
            onChange: (p, l) => { setPage(p); setLimit(l); },
          }} />
      </Card>
    </div>
  );
}
