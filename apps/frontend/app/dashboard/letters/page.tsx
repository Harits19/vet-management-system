"use client";

import { useEffect, useState } from "react";
import { Card, Table, Button, Input, Space, Select, Typography, Tag } from "antd";
import { Plus, Eye, Trash2 } from "lucide-react";
import { apiFetch } from "../../context/auth";
import { useAntdMessage } from "../../hooks/useAntdMessage";
import { useAntdModal } from "../../hooks/useAntdModal";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { LETTER_TYPE_OPTIONS, letterTypeLabel, letterTypeColor } from "./constants";

const { Title } = Typography;

interface LetterRow {
  _id: string;
  letterType: string;
  letterNumber: string;
  date: string;
  petId: { _id: string; name: string; kind?: string };
  customerId: { _id: string; name: string };
  doctorId: { _id: string; name: string };
  ownerSignature?: string;
  subject?: string;
}

export default function LettersPage() {
  const router = useRouter();
  const msg = useAntdMessage();
  const modal = useAntdModal();
  const [data, setData] = useState<LetterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [letterType, setLetterType] = useState<string | undefined>();

  const fetchData = async (p = page, s = search, t = letterType) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "10", search: s });
      if (t) params.set("letterType", t);
      const res = await apiFetch<{ data: LetterRow[]; meta: { total: number } }>(`/api/letters?${params}`);
      setData(res.data);
      setTotal(res.meta.total);
    } catch (err: any) {
      msg.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = (id: string) => {
    modal.confirm({
      title: "Hapus surat ini?",
      onOk: async () => {
        try {
          await apiFetch(`/api/letters/${id}`, { method: "DELETE" });
          msg.success("Surat dihapus");
          fetchData();
        } catch (err: any) {
          msg.error(err.message);
        }
      },
    });
  };

  const columns = [
    { title: "Nomor Surat", dataIndex: "letterNumber", key: "letterNumber" },
    { title: "Jenis", dataIndex: "letterType", key: "letterType", render: (t: string) => <Tag color={letterTypeColor(t)}>{letterTypeLabel(t)}</Tag> },
    { title: "Pasien", key: "pet", render: (_: any, r: LetterRow) => r.petId?.name || "-" },
    { title: "Pemilik", key: "customer", render: (_: any, r: LetterRow) => r.customerId?.name || "-" },
    { title: "Tanggal", dataIndex: "date", key: "date", render: (d: string) => dayjs(d).format("DD/MM/YYYY") },
    { title: "Tanda Tangan", key: "signed", render: (_: any, r: LetterRow) => (r.ownerSignature ? <Tag color="green">Sudah</Tag> : <Tag color="orange">Belum</Tag>) },
    {
      title: "Aksi", key: "action",
      render: (_: any, r: LetterRow) => (
        <Space>
          <Button size="small" icon={<Eye size={14} />} onClick={() => router.push(`/dashboard/letters/${r._id}`)} />
          <Button size="small" danger icon={<Trash2 size={14} />} onClick={() => handleDelete(r._id)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>Surat Klinik</Title>
      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input.Search
            placeholder="Cari nomor / isi surat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={() => { setPage(1); fetchData(1, search, letterType); }}
            enterButton
            style={{ width: 260 }}
          />
          <Select
            placeholder="Filter jenis"
            allowClear
            style={{ width: 260 }}
            options={LETTER_TYPE_OPTIONS}
            value={letterType}
            onChange={(v) => { setLetterType(v); setPage(1); fetchData(1, search, v); }}
          />
          <Button type="primary" icon={<Plus size={16} />} onClick={() => router.push("/dashboard/letters/create")}>
            Buat Surat
          </Button>
        </Space>
        <Table
          dataSource={data}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ current: page, total, pageSize: 10, onChange: (p) => { setPage(p); fetchData(p); } }}
        />
      </Card>
    </div>
  );
}
