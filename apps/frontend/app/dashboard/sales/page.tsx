"use client";

import { useEffect, useState } from "react";
import { Card, Table, Button, Input, Space, Modal, Form, Select, Typography, Row, Col, Tag, Descriptions } from "antd";
import { Plus, Search, Eye, Trash2 } from "lucide-react";
import { apiFetch } from "../../context/auth";
import { useAntdMessage } from "../../hooks/useAntdMessage";
import dayjs from "dayjs";

const { Title } = Typography;

interface Sale {
  _id: string;
  receiptNumber: string;
  timestamp: string;
  paymentStatus: "paid" | "debt" | "dp";
  paymentMethod: string;
  customer?: { _id: string; name: string };
  cashier: { userId: string; name: string };
  summary: { total: number; downPayment: number; debt: number };
  items: any[];
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

export default function SalesPage() {
  const [data, setData] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<Sale | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [cart, setCart] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const paidAmount = Form.useWatch("paidAmount", form);
  const msg = useAntdMessage();

  const fetchData = async (p = page, s = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "10", search: s, sortBy: "timestamp", order: "desc" });
      const res = await apiFetch<{ data: any[]; meta: { total: number } }>(`/api/transactions?${params}`);
      setData(res.data);
      setTotal(res.meta.total);
    } catch (err: any) {
      msg.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSearch = () => { setPage(1); fetchData(1, search); };

  const openCreate = async () => {
    setCreateOpen(true);
    setCart([]);
    form.resetFields();
    const [custRes, prodRes] = await Promise.all([
      apiFetch<{ data: any[] }>("/api/customers?page=1&limit=100"),
      apiFetch<{ data: any[] }>("/api/products/physical?page=1&limit=100"),
    ]);
    setCustomers(custRes.data);
    setProducts(prodRes.data);
  };

  const addToCart = (value: string | number) => {
    const prodId = String(value);
    const prod = products.find((p) => p._id === prodId);
    if (!prod) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === prodId);
      if (existing) {
        return prev.map((item) =>
          item.productId === prodId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { productId: prod._id, name: prod.product.name, quantity: 1, price: prod.pricing.selling }];
    });
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty < 1) { setCart((prev) => prev.filter((i) => i.productId !== productId)); return; }
    setCart((prev) => prev.map((i) => i.productId === productId ? { ...i, quantity: qty } : i));
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleCreateSale = async () => {
    if (cart.length === 0) { msg.warning("Pilih minimal 1 produk"); return; }
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await apiFetch("/api/transactions/shop", {
        method: "POST",
        body: JSON.stringify({
          customerId: values.customerId || undefined,
          paymentMethod: values.paymentMethod,
          paidAmount: parseFloat(values.paidAmount) || cartTotal,
          items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });
      msg.success("Transaksi berhasil!");
      setCreateOpen(false);
      fetchData();
    } catch (err: any) {
      if (err.message) msg.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { title: "No. Struk", dataIndex: "receiptNumber", key: "receiptNumber" },
    { title: "Tanggal", dataIndex: "timestamp", key: "timestamp", render: (v: string) => dayjs(v).format("DD/MM/YY HH:mm") },
    { title: "Customer", key: "customer", render: (_: any, r: Sale) => r.customer?.name || "-" },
    { title: "Total", key: "total", render: (_: any, r: Sale) => formatPrice(r.summary.total) },
    { title: "Status", dataIndex: "paymentStatus", key: "status", render: (v: string) => {
      const colors: Record<string, string> = { paid: "green", debt: "red", dp: "orange" };
      const labels: Record<string, string> = { paid: "Lunas", debt: "Hutang", dp: "DP" };
      return <Tag color={colors[v]}>{labels[v]}</Tag>;
    }},
    { title: "Kasir", key: "cashier", render: (_: any, r: Sale) => r.cashier?.name },
    {
      title: "Aksi", key: "action",
      render: (_: any, r: Sale) => (
        <Space>
          <Button size="small" icon={<Eye size={14} />} onClick={() => setDetail(r)} />
          <Button size="small" danger icon={<Trash2 size={14} />} onClick={() => {
            Modal.confirm({ title: "Hapus transaksi?", onOk: async () => { await apiFetch(`/api/transactions/${r._id}`, { method: "DELETE" }); msg.success("Dihapus"); fetchData(); } });
          }} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>Penjualan</Title>
      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col flex="auto">
            <Input.Search placeholder="Cari no. struk..." value={search} onChange={(e) => setSearch(e.target.value)} onSearch={handleSearch} enterButton />
          </Col>
          <Col>
            <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>Transaksi Baru</Button>
          </Col>
        </Row>
        <Table dataSource={data} columns={columns} rowKey="_id" loading={loading}
          pagination={{ current: page, total, pageSize: 10, onChange: (p) => { setPage(p); fetchData(p); } }} />
      </Card>

      <Modal title="Transaksi Baru" open={createOpen} onCancel={() => setCreateOpen(false)} width={700} footer={null}>
        <Form form={form} layout="vertical">
          <Form.Item name="customerId" label="Customer (opsional)">
            <Select showSearch placeholder="Cari customer..." filterOption={(input, option) => (option?.label as string || "").toLowerCase().includes(input.toLowerCase())}
              options={customers.map((c) => ({ value: c._id, label: c.name }))} allowClear />
          </Form.Item>

          <Space direction="vertical" style={{ width: "100%" }}>
            <Select showSearch placeholder="Tambah produk..." filterOption={(input, option) => (option?.label as string || "").toLowerCase().includes(input.toLowerCase())}
              options={products.map((p) => ({ value: p._id, label: `${p.product.name} - ${formatPrice(p.pricing.selling)}` }))}
              onChange={(val) => { if (val) addToCart(val as string); }} value={undefined} style={{ width: "100%" }} />

            {cart.map((item) => (
              <Row key={item.productId} gutter={8} align="middle">
                <Col flex="auto"><strong>{item.name}</strong></Col>
                <Col><Input type="number" value={item.quantity} onChange={(e) => updateQty(item.productId, parseInt(e.target.value) || 1)} style={{ width: 60 }} min={1} /></Col>
                <Col>{formatPrice(item.price * item.quantity)}</Col>
                <Col><Button size="small" danger onClick={() => setCart((prev) => prev.filter((i) => i.productId !== item.productId))}>X</Button></Col>
              </Row>
            ))}
          </Space>

          <div style={{ textAlign: "right", margin: "16px 0", fontSize: 18, fontWeight: "bold" }}>Total: {formatPrice(cartTotal)}
            {(() => {
              const paid = parseFloat(paidAmount) || 0;
              const change = paid > cartTotal ? paid - cartTotal : 0;
              return change > 0 ? <div style={{ fontSize: 14, color: "#52c41a", fontWeight: "normal" }}>Kembalian: {formatPrice(change)}</div> : null;
            })()}
          </div>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="paymentMethod" label="Metode Pembayaran" rules={[{ required: true, message: "Pilih metode" }]}>
                <Select options={[
                  { value: "Tunai", label: "Tunai" },
                  { value: "Transfer", label: "Transfer" },
                  { value: "QRIS", label: "QRIS" },
                  { value: "Debit", label: "Kartu Debit" },
                  { value: "Kredit", label: "Kartu Kredit" },
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="paidAmount" label="Jumlah Dibayar" rules={[{ required: true, message: "Masukkan nominal" }]}>
                <Input type="number" />
              </Form.Item>
            </Col>
          </Row>

          <Button type="primary" block size="large" loading={submitting} onClick={handleCreateSale}>Proses Pembayaran</Button>
        </Form>
      </Modal>

      <Modal title="Detail Transaksi" open={!!detail} onCancel={() => setDetail(null)} footer={null} width={600}>
        {detail && (
          <>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="No. Struk">{detail.receiptNumber}</Descriptions.Item>
              <Descriptions.Item label="Tanggal">{dayjs(detail.timestamp).format("DD/MM/YY HH:mm")}</Descriptions.Item>
              <Descriptions.Item label="Customer">{detail.customer?.name || "-"}</Descriptions.Item>
              <Descriptions.Item label="Kasir">{detail.cashier.name}</Descriptions.Item>
              <Descriptions.Item label="Metode">{detail.paymentMethod}</Descriptions.Item>
              <Descriptions.Item label="Status"><Tag color={detail.paymentStatus === "paid" ? "green" : "red"}>{detail.paymentStatus}</Tag></Descriptions.Item>
              <Descriptions.Item label="Total">{formatPrice(detail.summary.total)}</Descriptions.Item>
              <Descriptions.Item label="Dibayar">{formatPrice(detail.summary.downPayment)}</Descriptions.Item>
              <Descriptions.Item label="Hutang">{formatPrice(detail.summary.debt)}</Descriptions.Item>
            </Descriptions>
            <Table dataSource={detail.items} columns={[
              { title: "Produk", key: "product", render: (_: any, r: any) => r.product?.name },
              { title: "Qty", dataIndex: "quantity", key: "qty" },
              { title: "Harga", key: "price", render: (_: any, r: any) => formatPrice(r.pricing.selling) },
              { title: "Subtotal", key: "subtotal", render: (_: any, r: any) => formatPrice(r.pricing.total) },
            ]} rowKey={(r: any) => r.product?._id} pagination={false} size="small" style={{ marginTop: 16 }} />
          </>
        )}
      </Modal>
    </div>
  );
}
