"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, Table, Tag, Typography, Input, Select, DatePicker, Space, Alert } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useAuth, apiFetch } from "../../../context/auth";
import { useAntdMessage } from "../../../hooks/useAntdMessage";

const { Title, Text } = Typography;

interface HistoryRow {
  _id: string;
  method: "face" | "qr";
  type: "in" | "out";
  timestamp: string;
  date: string;
  location?: { lat: number; lng: number; accuracy?: number };
  faceDistance?: number;
  userName?: string;
  userRole?: string;
}

const ROLE_TAG: Record<string, { color: string; label: string }> = {
  superadmin: { color: "red", label: "Super Admin" },
  cashier: { color: "blue", label: "Kasir" },
  doctor: { color: "green", label: "Dokter" },
};

const fmtTime = (ts: string) =>
  new Date(ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

export default function AttendanceHistoryPage() {
  const { user, loading } = useAuth();
  const msg = useAntdMessage();
  const [data, setData] = useState<HistoryRow[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [range, setRange] = useState<[Dayjs, Dayjs]>([dayjs(), dayjs()]);
  const [method, setMethod] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [search, setSearch] = useState("");

  const fetchData = useCallback(
    async (from: string, to: string, m: string, t: string, q: string) => {
      setLoadingData(true);
      try {
        const params = new URLSearchParams({ startDate: from, endDate: to });
        if (m) params.set("method", m);
        if (t) params.set("type", t);
        if (q) params.set("search", q);
        const res = await apiFetch<{ data: HistoryRow[] }>(
          `/api/attendance/list?${params.toString()}`
        );
        setData(res.data);
      } catch (e: any) {
        msg.error(e.message || "Gagal memuat riwayat absen");
      } finally {
        setLoadingData(false);
      }
    },
    [msg]
  );

  useEffect(() => {
    if (loading || !user) return;
    fetchData(range[0].format("YYYY-MM-DD"), range[1].format("YYYY-MM-DD"), method, type, search);
  }, [loading, user, range, method, type, search, fetchData]);

  if (loading) return null;
  if (!user) return null;

  if (user.role !== "superadmin") {
    return (
      <Card>
        <Alert type="error" showIcon message="Halaman ini hanya untuk superadmin." />
      </Card>
    );
  }

  const columns = [
    { title: "Waktu", dataIndex: "timestamp", render: (v: string) => fmtTime(v) },
    {
      title: "Karyawan",
      key: "user",
      render: (_: unknown, r: HistoryRow) => (
        <Space>
          <Text strong>{r.userName || "-"}</Text>
          {r.userRole && (
            <Tag color={ROLE_TAG[r.userRole]?.color || "default"}>
              {ROLE_TAG[r.userRole]?.label || r.userRole}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Metode",
      dataIndex: "method",
      render: (v: string) =>
        v === "qr" ? <Tag color="geekblue">QR</Tag> : <Tag color="purple">Wajah</Tag>,
    },
    {
      title: "Tipe",
      dataIndex: "type",
      render: (v: string) =>
        v === "in" ? <Tag color="green">Masuk</Tag> : <Tag color="orange">Pulang</Tag>,
    },
    {
      title: "Kecocokan Wajah",
      dataIndex: "faceDistance",
      render: (v?: number) => (typeof v === "number" ? v.toFixed(2) : "-"),
    },
    {
      title: "Lokasi (lat, lng)",
      key: "location",
      render: (_: unknown, r: HistoryRow) =>
        r.location ? `${r.location.lat.toFixed(5)}, ${r.location.lng.toFixed(5)}` : "-",
    },
  ];

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <Card>
        <Title level={4}>Riwayat Absensi Karyawan</Title>
        <Space wrap>
          <DatePicker.RangePicker
            value={range}
            onChange={(v) => v && v[0] && v[1] && setRange([v[0], v[1]])}
            allowClear={false}
            style={{ width: 260 }}
          />
          <Select
            placeholder="Semua Metode"
            value={method || undefined}
            onChange={setMethod}
            allowClear
            style={{ width: 150 }}
            options={[
              { value: "qr", label: "QR" },
              { value: "face", label: "Wajah" },
            ]}
          />
          <Select
            placeholder="Semua Tipe"
            value={type || undefined}
            onChange={setType}
            allowClear
            style={{ width: 150 }}
            options={[
              { value: "in", label: "Masuk" },
              { value: "out", label: "Pulang" },
            ]}
          />
          <Input.Search
            placeholder="Cari nama karyawan..."
            allowClear
            onSearch={setSearch}
            style={{ width: 220 }}
          />
        </Space>
      </Card>
      <Card size="small">
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={data}
          loading={loadingData}
          pagination={false}
          scroll={{ x: 900 }}
          locale={{ emptyText: "Belum ada catatan absensi pada rentang tanggal ini" }}
        />
      </Card>
    </Space>
  );
}
