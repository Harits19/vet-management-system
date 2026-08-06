"use client";

import { useEffect, useState } from "react";
import { Card, Table, Button, Input, Space, Tag, Typography, Modal, Form, Select, Descriptions } from "antd";
import { Eye, Trash2, Wallet, Info } from "lucide-react";
import { apiFetch } from "../../context/auth";
import { useAntdMessage } from "../../hooks/useAntdMessage";
import { useAntdModal } from "../../hooks/useAntdModal";
import dayjs from "dayjs";

const { Title, Text } = Typography;

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

// Hanya transaksi berkaitan rekam medis (type=vet). Fitur POS (type=shop) disembunyikan.
export default function TransactionsPage() {
  const msg = useAntdMessage();
  const modal = useAntdModal();

  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("timestamp");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [detail, setDetail] = useState<Transaction | null>(null);
  const [payTxn, setPayTxn] = useState<Transaction | null>(null);
  const [paying, setPaying] = useState(false);
  const [payForm] = Form.useForm();
  const paidInput = Form.useWatch("paidAmount", payForm);
  const paySisa = payTxn ? Math.max(0, payTxn.summary.total - payTxn.summary.paid) : 0;
  const payKembalian = paidInput ? (Number(paidInput) || 0) - paySisa : 0;

  const fetchData = async (p = page, s = search, sb = sortBy, od = order) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "10", search: s, sortBy: sb, order: od, type: "vet" });
      const res = await apiFetch<{ data: any; meta: { total: number } }>(`/api/transactions?${params}`);
      setData(res.data);
      setTotal(res.meta.total);
    } catch (err: any) {
      msg.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page]);

  const handleSearch = () => { setPage(1); fetchData(1); };

  const handlePay = async () => {
    if (!payTxn) return;
    try {
      const values = await payForm.validateFields();
      setPaying(true);
      await apiFetch(`/api/transactions/${payTxn._id}/pay`, {
        method: "POST",
        body: JSON.stringify({ paidAmount: values.paidAmount, paymentMethod: values.paymentMethod }),
      });
      msg.success("Pembayaran berhasil");
      setPayTxn(null);
      fetchData();
    } catch (err: any) {
      if (err.message) msg.error(err.message);
    } finally {
      setPaying(false);
    }
  };

  const columns = [
    { title: "No. Struk", dataIndex: "receiptNumber", sorter: true, width: 160 },
    { title: "Tanggal", dataIndex: "timestamp", sorter: true, render: (v: string) => dayjs(v).format("DD/MM/YY HH:mm"), width: 130 },
    { title: "Customer", key: "customer", render: (_: any, r: Transaction) => r.customer?.name || "-", width: 150 },
    { title: "Pasien", key: "pet", render: (_: any, r: Transaction) => r.pet ? `${r.pet.name} (${r.pet.kind})` : "-" },
    { title: "Total", key: "total", dataIndex: "summary.total", sorter: true, render: (_: any, r: Transaction) => formatPrice(r.summary.total) },
    { title: "Status", dataIndex: "paymentStatus", render: (v: string) => <Tag color={statusColors[v]}>{statusLabels[v]}</Tag> },
    { title: "Kasir", key: "kasir", render: (_: any, r: Transaction) => r.cashier?.name },
    {
      title: "Aksi", key: "action", width: 190,
      render: (_: any, r: Transaction) => (
        <Space>
          {r.paymentStatus !== "paid" && (
            <Button size="small" type="primary" icon={<Wallet size={14} />} onClick={() => {
              payForm.setFieldsValue({ paidAmount: r.summary.total - r.summary.paid, paymentMethod: "Tunai" });
              setPayTxn(r);
            }}>Bayar</Button>
          )}
          <Button size="small" icon={<Eye size={14} />} onClick={() => setDetail(r)} />
          <Button size="small" danger icon={<Trash2 size={14} />} onClick={() => {
            modal.confirm({
              title: "Hapus transaksi?",
              onOk: async () => { await apiFetch(`/api/transactions/${r._id}`, { method: "DELETE" }); msg.success("Dihapus"); fetchData(); },
            });
          }} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>Transaksi Dokter</Title>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Input.Search placeholder="Cari no. struk..." value={search} onChange={(e) => setSearch(e.target.value)} onSearch={handleSearch} enterButton style={{ width: 250 }} />
        </Space>
        <Table dataSource={data} columns={columns} rowKey="_id" loading={loading} scroll={{ x: 900 }}
          onChange={(_, __, sorter) => {
            const s: any = Array.isArray(sorter) ? sorter[0] : sorter;
            const sb = s?.order ? String(s.field) : "timestamp";
            const od = s?.order === "ascend" ? "asc" : s?.order === "descend" ? "desc" : "desc";
            setSortBy(sb); setOrder(od); setPage(1); fetchData(1, search, sb, od);
          }}
          pagination={{ current: page, total, pageSize: 10, onChange: (p) => { setPage(p); fetchData(p); } }} />
      </Card>

      <Modal title="Detail Transaksi" open={!!detail} onCancel={() => setDetail(null)} footer={null} width={650}>
        {detail && (
          <>
            <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
              <Descriptions.Item label="No. Struk">{detail.receiptNumber}</Descriptions.Item>
              <Descriptions.Item label="Tanggal">{dayjs(detail.timestamp).format("DD/MM/YY HH:mm")}</Descriptions.Item>
              <Descriptions.Item label="Customer">{detail.customer?.name || "-"}</Descriptions.Item>
              <Descriptions.Item label="Pasien">{detail.pet ? `${detail.pet.name} (${detail.pet.kind})` : "-"}</Descriptions.Item>
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

      <Modal title="Bayar Transaksi" open={!!payTxn} onCancel={() => setPayTxn(null)} onOk={handlePay}
        confirmLoading={paying} okText="Bayar" width={420}>
        {payTxn && (
          <Form form={payForm} layout="vertical">
            <Descriptions column={1} size="small" style={{ marginBottom: 8 }}>
              <Descriptions.Item label="No. Struk">{payTxn.receiptNumber}</Descriptions.Item>
              <Descriptions.Item label="Total">{formatPrice(payTxn.summary.total)}</Descriptions.Item>
              <Descriptions.Item label="Sudah Dibayar">{formatPrice(payTxn.summary.paid)}</Descriptions.Item>
              <Descriptions.Item label="Sisa"><Text strong style={{ color: "#cf1322" }}>{formatPrice(payTxn.summary.total - payTxn.summary.paid)}</Text></Descriptions.Item>
            </Descriptions>
            <Form.Item name="paidAmount" label="Jumlah Dibayar" rules={[{ required: true, message: "Masukkan nominal" }]}>
              <Input type="number" min={1} placeholder="Masukkan nominal" />
            </Form.Item>
            {payKembalian > 0 && (
              <div style={{ textAlign: "right", marginBottom: 12, color: "#52c41a", fontSize: 14 }}>
                <Info size={14} style={{ marginRight: 4 }} />Kembalian: {formatPrice(payKembalian)}
              </div>
            )}
            <Form.Item name="paymentMethod" label="Metode Bayar" rules={[{ required: true, message: "Pilih metode" }]}>
              <Select options={[
                { value: "Tunai", label: "Tunai" },
                { value: "Transfer", label: "Transfer" },
                { value: "QRIS", label: "QRIS" },
                { value: "Debit", label: "Kartu Debit" },
                { value: "Kredit", label: "Kartu Kredit" },
              ]} />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
}
