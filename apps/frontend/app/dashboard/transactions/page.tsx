"use client";

import { useEffect, useState } from "react";
import { Card, Table, Button, Input, Space, Tabs, Tag, Typography, Row, Col, Modal, Form, Select, Descriptions, Dropdown } from "antd";
import { Plus, Search, Eye, Trash2, ShoppingBag, Stethoscope } from "lucide-react";
import { apiFetch, useAuth } from "../../context/auth";
import { useAntdMessage } from "../../hooks/useAntdMessage";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

const { Title } = Typography;

function formatPrice(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

interface Transaction {
  _id: string;
  type: "shop" | "vet";
  receiptNumber: string;
  timestamp: string;
  customer?: { _id: string; name: string };
  pet?: { _id: string; name: string; kind: string };
  cashier: { _id: string; name: string };
  summary: { total: number; paid: number };
  paymentStatus: string;
  paymentMethod: string;
  items: any[];
}

const statusColors: Record<string, string> = { paid: "green", debt: "red", dp: "orange" };
const statusLabels: Record<string, string> = { paid: "Lunas", debt: "Hutang", dp: "DP" };

export default function TransactionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const msg = useAntdMessage();

  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<string>("all");
  const [detail, setDetail] = useState<Transaction | null>(null);

  const typeFilter = tab === "all" ? undefined : tab === "shop" ? "shop" : "vet";

  // Default tab based on role
  useEffect(() => {
    if (!user) return;
    if (user.role === "cashier") setTab("shop");
    else if (user.role === "doctor") setTab("vet");
  }, [user]);

  const fetchData = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "10", search, sortBy: "timestamp", order: "desc" });
      if (typeFilter) params.set("type", typeFilter);
      const res = await apiFetch<{ data: any; meta: { total: number } }>(`/api/transactions?${params}`);
      setData(res.data);
      setTotal(res.meta.total);
    } catch (err: any) {
      msg.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [tab, page]);

  const handleSearch = () => { setPage(1); fetchData(1); };

  const baseColumns = [
    { title: "No. Struk", dataIndex: "receiptNumber", width: 160 },
    { title: "Tanggal", dataIndex: "timestamp", render: (v: string) => dayjs(v).format("DD/MM/YY HH:mm"), width: 130 },
    { title: "Customer", key: "customer", render: (_: any, r: Transaction) => r.customer?.name || "-", width: 150 },
  ];

  const shopColumns = [
    ...baseColumns,
    { title: "Total", key: "total", render: (_: any, r: Transaction) => formatPrice(r.summary.total) },
    { title: "Status", dataIndex: "paymentStatus", render: (v: string) => <Tag color={statusColors[v]}>{statusLabels[v]}</Tag> },
    { title: "Metode", dataIndex: "paymentMethod" },
    { title: "Kasir", key: "kasir", render: (_: any, r: Transaction) => r.cashier?.name },
  ];

  const vetColumns = [
    ...baseColumns,
    { title: "Pasien", key: "pet", render: (_: any, r: Transaction) => r.pet ? `${r.pet.name} (${r.pet.kind})` : "-" },
    { title: "Total", key: "total", render: (_: any, r: Transaction) => formatPrice(r.summary.total) },
    { title: "Status", dataIndex: "paymentStatus", render: (v: string) => <Tag color={statusColors[v]}>{statusLabels[v]}</Tag> },
    { title: "Kasir", key: "kasir", render: (_: any, r: Transaction) => r.cashier?.name },
  ];

  const allColumns = [
    { title: "Tipe", dataIndex: "type", render: (v: string) => v === "shop" ? <Tag>Barang</Tag> : <Tag color="blue">Dokter</Tag>, width: 80 },
    ...baseColumns,
    { title: "Pasien", key: "pet", render: (_: any, r: Transaction) => r.pet ? `${r.pet.name} (${r.pet.kind})` : "-" },
    { title: "Total", key: "total", render: (_: any, r: Transaction) => formatPrice(r.summary.total) },
    { title: "Status", dataIndex: "paymentStatus", render: (v: string) => <Tag color={statusColors[v]}>{statusLabels[v]}</Tag> },
    { title: "Metode", dataIndex: "paymentMethod" },
    { title: "Kasir", key: "kasir", render: (_: any, r: Transaction) => r.cashier?.name },
  ];

  const getColumns = () => {
    const actionCol = {
      title: "Aksi", key: "action", width: 100,
      render: (_: any, r: Transaction) => (
        <Space>
          <Button size="small" icon={<Eye size={14} />} onClick={() => setDetail(r)} />
          <Button size="small" danger icon={<Trash2 size={14} />} onClick={() => {
            Modal.confirm({
              title: "Hapus transaksi?",
              onOk: async () => { await apiFetch(`/api/transactions/${r._id}`, { method: "DELETE" }); msg.success("Dihapus"); fetchData(); },
            });
          }} />
        </Space>
      ),
    };

    if (tab === "all") return [...allColumns, actionCol];
    if (tab === "shop") return [...shopColumns, actionCol];
    return [...vetColumns, actionCol];
  };

  const tabItems = [
    { key: "all", label: "Semua" },
    { key: "shop", label: "Barang" },
    { key: "vet", label: "Dokter" },
  ];

  const createMenuItems = [
    { key: "shop", icon: <ShoppingBag size={14} />, label: "Transaksi Barang", onClick: () => router.push("/dashboard/sales") },
    { key: "vet", icon: <Stethoscope size={14} />, label: "Konsultasi Dokter", onClick: () => router.push("/dashboard/vet-sales/create") },
  ];

  return (
    <div>
      <Title level={4}>Transaksi</Title>
      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col flex="auto">
            <Space>
              <Input.Search placeholder="Cari no. struk..." value={search} onChange={(e) => setSearch(e.target.value)} onSearch={handleSearch} enterButton style={{ width: 250 }} />
              <Tabs activeKey={tab} onChange={(k) => { setTab(k); setPage(1); }} items={tabItems} style={{ marginBottom: 0 }} />
            </Space>
          </Col>
          <Col>
            <Dropdown menu={{ items: createMenuItems }}>
              <Button type="primary" icon={<Plus size={16} />}>Transaksi Baru</Button>
            </Dropdown>
          </Col>
        </Row>
        <Table dataSource={data} columns={getColumns()} rowKey="_id" loading={loading} scroll={{ x: 900 }}
          pagination={{ current: page, total, pageSize: 10, onChange: (p) => { setPage(p); fetchData(p); } }} />
      </Card>

      <Modal title="Detail Transaksi" open={!!detail} onCancel={() => setDetail(null)} footer={null} width={650}>
        {detail && (
          <>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="No. Struk">{detail.receiptNumber}</Descriptions.Item>
              <Descriptions.Item label="Tanggal">{dayjs(detail.timestamp).format("DD/MM/YY HH:mm")}</Descriptions.Item>
              <Descriptions.Item label="Customer">{detail.customer?.name || "-"}</Descriptions.Item>
              <Descriptions.Item label="Pasien">{detail.pet ? `${detail.pet.name} (${detail.pet.kind})` : "-"}</Descriptions.Item>
              <Descriptions.Item label="Tipe"><Tag color={detail.type === "vet" ? "blue" : "default"}>{detail.type === "vet" ? "Dokter" : "Barang"}</Tag></Descriptions.Item>
              <Descriptions.Item label="Status"><Tag color={statusColors[detail.paymentStatus]}>{statusLabels[detail.paymentStatus]}</Tag></Descriptions.Item>
              <Descriptions.Item label="Metode">{detail.paymentMethod}</Descriptions.Item>
              <Descriptions.Item label="Kasir">{detail.cashier?.name}</Descriptions.Item>
              <Descriptions.Item label="Total">{formatPrice(detail.summary.total)}</Descriptions.Item>
              <Descriptions.Item label="Dibayar">{formatPrice(detail.summary.paid)}</Descriptions.Item>
              {detail.summary.paid > detail.summary.total && (
                <Descriptions.Item label="Kembalian"><span style={{ color: "#52c41a" }}>{formatPrice(detail.summary.paid - detail.summary.total)}</span></Descriptions.Item>
              )}
            </Descriptions>
            <Table dataSource={detail.items}
              columns={[
                { title: "Produk", key: "product", render: (_: any, r: any) => r.product?.name },
                { title: "Tipe", key: "type", render: (_: any, r: any) => r.product.type === "service" ? <Tag color="blue">Jasa</Tag> : <Tag>Obat</Tag> },
                { title: "Qty", dataIndex: "quantity" },
                { title: "Harga", key: "price", render: (_: any, r: any) => formatPrice(r.pricing.selling) },
                { title: "Total", key: "stotal", render: (_: any, r: any) => formatPrice(r.pricing.total) },
                { title: "Dosis", dataIndex: "dosage", render: (v?: string) => v || "-" },
              ]}
              rowKey={(r: any) => r.product?._id} pagination={false} size="small" style={{ marginTop: 16 }} />
          </>
        )}
      </Modal>
    </div>
  );
}
