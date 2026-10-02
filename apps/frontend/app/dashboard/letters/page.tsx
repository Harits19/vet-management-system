"use client";

import { useState } from "react";
import { Card, Table, Button, Input, Space, Select, Typography, Tag } from "antd";
import { Plus, Eye, Trash2 } from "lucide-react";
import { apiFetch } from "../../context/auth";
import { useAntdMessage } from "../../hooks/useAntdMessage";
import { useAntdModal } from "../../hooks/useAntdModal";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { LETTER_TYPE_OPTIONS, letterTypeLabel, letterTypeColor } from "./constants";
import { LetterRow, useGetLetters } from "@/api/useGetLetters";

const { Title } = Typography;

export default function LettersPage() {
  const router = useRouter();
  const msg = useAntdMessage();
  const modal = useAntdModal();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [letterType, setLetterType] = useState<string | undefined>();

  const {
    invalidate,
    data,
    isLoading: loading,
  } = useGetLetters({ page, limit, search, sortBy, order, letterType });

  const handleDelete = (id: string) => {
    modal.confirm({
      title: "Hapus surat ini?",
      onOk: async () => {
        try {
          await apiFetch(`/api/letters/${id}`, { method: "DELETE" });
          msg.success("Surat dihapus");
          invalidate();
        } catch (err: any) {
          msg.error(err.message);
        }
      },
    });
  };

  const columns = [
    { title: "Nomor Surat", dataIndex: "letterNumber", key: "letterNumber", sorter: true },
    { title: "Jenis", dataIndex: "letterType", key: "letterType", render: (t: string) => <Tag color={letterTypeColor(t)}>{letterTypeLabel(t)}</Tag> },
    { title: "Pasien", key: "pet", render: (_: any, r: LetterRow) => r.petId?.name || "-" },
    { title: "Pemilik", key: "customer", render: (_: any, r: LetterRow) => r.customerId?.name || "-" },
    { title: "Tanggal", dataIndex: "date", key: "date", sorter: true, render: (d: string) => dayjs(d).format("DD/MM/YYYY") },
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
            onSearch={() => setPage(1)}
            enterButton
            style={{ width: 260 }}
          />
          <Select
            placeholder="Filter jenis"
            allowClear
            style={{ width: 260 }}
            options={LETTER_TYPE_OPTIONS}
            value={letterType}
            onChange={(v) => { setLetterType(v); setPage(1); }}
          />
          <Button type="primary" icon={<Plus size={16} />} onClick={() => router.push("/dashboard/letters/create")}>
            Buat Surat
          </Button>
        </Space>
        <Table
          dataSource={data?.data ?? []}
          columns={columns}
          rowKey="_id"
          loading={loading}
          onChange={(_, __, sorter, extra) => {
            // Ant Design memanggil onChange ini JUGA saat pindah halaman (extra.action === "paginate").
            // Tanpa guard, setPage(1) menimpa halaman yang baru dipilih → indikator balik ke 1.
            if (extra?.action !== "sort") return;
            const s: any = Array.isArray(sorter) ? sorter[0] : sorter;
            const sb = s?.order ? String(s.field) : "date";
            const od = s?.order === "ascend" ? "asc" : s?.order === "descend" ? "desc" : "desc";
            setSortBy(sb); setOrder(od); setPage(1);
          }}
          pagination={{
            current: page,
            total: data?.meta.total ?? 0,
            pageSize: limit,
            onChange: (p, l) => { setPage(p); setLimit(l); },
          }}
        />
      </Card>
    </div>
  );
}
