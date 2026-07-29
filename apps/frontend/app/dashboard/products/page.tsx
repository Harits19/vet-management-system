"use client";

import { useEffect, useState } from "react";
import { Card, Table, Button, Input, Space, Modal, Form, Select, message, Typography, Row, Col, Tag, Switch } from "antd";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { apiFetch } from "../../context/auth";

const { Title } = Typography;

interface Product {
  _id: string;
  type: "physical" | "service";
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
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const [productType, setProductType] = useState<"physical" | "service">("physical");

  const fetchData = async (p = page, s = search, t = typeFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "10", search: s });
      if (t) params.set("type", t);
      const res = await apiFetch<{ data: Product[]; meta: { total: number } }>(`/api/products?${params}`);
      setData(res.data);
      setTotal(res.meta.total);
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSearch = () => { setPage(1); fetchData(1, search, typeFilter); };
  const handleTypeFilter = (val: string | undefined) => { setTypeFilter(val); setPage(1); fetchData(1, search, val); };

  const openCreate = (type: "physical" | "service") => {
    setEditing(null);
    setProductType(type);
    form.resetFields();
    form.setFieldsValue({ type });
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setProductType(p.type);
    form.setFieldsValue(p);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await apiFetch(`/api/products/${editing._id}`, { method: "PUT", body: JSON.stringify(values) });
        message.success("Produk diupdate");
      } else {
        await apiFetch("/api/products", { method: "POST", body: JSON.stringify(values) });
        message.success("Produk dibuat");
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      if (err.message) message.error(err.message);
    }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({ title: "Non-aktifkan produk?", onOk: async () => { await apiFetch(`/api/products/${id}`, { method: "DELETE" }); message.success("Dinonaktifkan"); fetchData(); } });
  };

  const columns = [
    { title: "Tipe", dataIndex: "type", key: "type", render: (v: string) => v === "service" ? <Tag color="blue">Jasa</Tag> : <Tag>Barang</Tag> },
    { title: "Nama", key: "name", render: (_: any, r: Product) => r.product?.name },
    { title: "Kategori", dataIndex: "category", key: "category" },
    { title: "Kode", key: "code", render: (_: any, r: Product) => r.product?.code || "-" },
    { title: "Harga Jual", key: "selling", render: (_: any, r: Product) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(r.pricing.selling) },
    { title: "Stok", key: "qty", render: (_: any, r: Product) => r.type === "physical" ? (r.inventory?.quantity ?? 0) : "N/A" },
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
      <Title level={4}>Produk & Jasa</Title>
      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col flex="auto">
            <Space>
              <Input.Search placeholder="Cari..." value={search} onChange={(e) => setSearch(e.target.value)} onSearch={handleSearch} enterButton style={{ width: 250 }} />
              <Select allowClear placeholder="Filter tipe" style={{ width: 140 }} value={typeFilter} onChange={handleTypeFilter}
                options={[{ value: "physical", label: "Barang" }, { value: "service", label: "Jasa" }]} />
            </Space>
          </Col>
          <Col>
            <Space>
              <Button type="primary" icon={<Plus size={16} />} onClick={() => openCreate("physical")}>Tambah Barang</Button>
              <Button icon={<Plus size={16} />} onClick={() => openCreate("service")}>Tambah Jasa</Button>
            </Space>
          </Col>
        </Row>
        <Table dataSource={data} columns={columns} rowKey="_id" loading={loading}
          pagination={{ current: page, total, pageSize: 10, onChange: (p) => { setPage(p); fetchData(p); } }} />
      </Card>

      <Modal title={editing ? "Edit Produk/Jasa" : `Tambah ${productType === "service" ? "Jasa" : "Barang"}`}
        open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="type" hidden><Input /></Form.Item>
          <Form.Item name="category" label="Kategori" rules={[{ required: true, message: "Wajib" }]}>
            <Input placeholder={productType === "service" ? "Contoh: Jasa, Vaksinasi, Grooming" : "Contoh: Makanan, Obat, Aksesoris"} />
          </Form.Item>
          <Form.Item name={["product", "name"]} label="Nama" rules={[{ required: true, message: "Wajib" }]}>
            <Input />
          </Form.Item>
          {productType === "physical" && (
            <>
              <Form.Item name={["product", "code"]} label="Kode Produk">
                <Input />
              </Form.Item>
              <Form.Item name={["product", "weight"]} label="Berat (gram)">
                <Input type="number" />
              </Form.Item>
              <Form.Item name={["pricing", "cost"]} label="Harga Modal">
                <Input type="number" />
              </Form.Item>
              <Form.Item name={["inventory", "quantity"]} label="Stok Awal">
                <Input type="number" />
              </Form.Item>
              <Form.Item name="unit" label="Satuan">
                <Input placeholder="pcs, kg, botol" />
              </Form.Item>
            </>
          )}
          <Form.Item name={["pricing", "selling"]} label="Harga Jual" rules={[{ required: true, message: "Wajib" }]}>
            <Input type="number" />
          </Form.Item>
          {productType === "physical" && (
            <Form.Item name={["pricing", "online"]} label="Harga Online">
              <Input type="number" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}
