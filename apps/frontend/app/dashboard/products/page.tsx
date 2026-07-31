"use client";

import { useEffect, useState } from "react";
import { Card, Table, Button, Input, Space, Modal, Form, Typography, Row, Col, Tag } from "antd";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { apiFetch } from "../../context/auth";
import { useAntdMessage } from "../../hooks/useAntdMessage";

const { Title } = Typography;

interface Product {
  _id: string;
  category: string;
  product: { code?: string; name: string; weight?: number };
  pricing: { cost?: number; selling: number; online?: number };
  inventory: { quantity?: number };
  unit?: string;
  isActive: boolean;
}

export default function ProductsPage() {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const msg = useAntdMessage();

  const fetchData = async (p = page, s = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "10", search: s });
      const res = await apiFetch<{ data: Product[]; meta: { total: number } }>(`/api/products?${params}`);
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

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (p: Product) => { setEditing(p); form.setFieldsValue(p); setModalOpen(true); };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await apiFetch(`/api/products/${editing._id}`, { method: "PUT", body: JSON.stringify(values) });
        msg.success("Barang diupdate");
      } else {
        await apiFetch("/api/products", { method: "POST", body: JSON.stringify(values) });
        msg.success("Barang dibuat");
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      if (err.message) msg.error(err.message);
    }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({ title: "Non-aktifkan barang?", onOk: async () => { await apiFetch(`/api/products/${id}`, { method: "DELETE" }); msg.success("Dinonaktifkan"); fetchData(); } });
  };

  const fmt = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

  const columns = [
    { title: "Nama", key: "name", render: (_: any, r: Product) => r.product?.name },
    { title: "Kategori", dataIndex: "category", key: "category" },
    { title: "Kode", key: "code", render: (_: any, r: Product) => r.product?.code || "-" },
    { title: "Harga Jual", key: "selling", render: (_: any, r: Product) => fmt(r.pricing.selling) },
    { title: "Stok", key: "qty", render: (_: any, r: Product) => <Tag color={(r.inventory?.quantity ?? 0) <= 0 ? "red" : "green"}>{r.inventory?.quantity ?? 0}</Tag> },
    {
      title: "Aksi", key: "action",
      render: (_: any, r: Product) => (
        <Space>
          <Button size="small" icon={<Edit size={14} />} onClick={() => openEdit(r)} />
          <Button size="small" danger icon={<Trash2 size={14} />} onClick={() => handleDelete(r._id)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>Barang</Title>
      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col flex="auto">
            <Input.Search placeholder="Cari barang..." value={search} onChange={(e) => setSearch(e.target.value)} onSearch={handleSearch} enterButton style={{ width: 250 }} />
          </Col>
          <Col>
            <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>Tambah Barang</Button>
          </Col>
        </Row>
        <Table dataSource={data} columns={columns} rowKey="_id" loading={loading}
          pagination={{ current: page, total, pageSize: 10, onChange: (p) => { setPage(p); fetchData(p); } }} />
      </Card>

      <Modal title={editing ? "Edit Barang" : "Tambah Barang"} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="category" label="Kategori" rules={[{ required: true, message: "Wajib" }]}>
            <Input placeholder="Contoh: Makanan, Obat, Aksesoris" />
          </Form.Item>
          <Form.Item name={["product", "name"]} label="Nama" rules={[{ required: true, message: "Wajib" }]}>
            <Input />
          </Form.Item>
          <Form.Item name={["product", "code"]} label="Kode Produk">
            <Input />
          </Form.Item>
          <Form.Item name={["product", "weight"]} label="Berat (gram)">
            <Input type="number" />
          </Form.Item>
          <Form.Item name={["pricing", "cost"]} label="Harga Modal">
            <Input type="number" />
          </Form.Item>
          <Form.Item name={["pricing", "selling"]} label="Harga Jual" rules={[{ required: true, message: "Wajib" }]}>
            <Input type="number" />
          </Form.Item>
          <Form.Item name={["pricing", "online"]} label="Harga Online">
            <Input type="number" />
          </Form.Item>
          <Form.Item name={["inventory", "quantity"]} label="Stok Awal">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="unit" label="Satuan">
            <Input placeholder="pcs, kg, botol" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
