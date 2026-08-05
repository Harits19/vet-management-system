"use client";

import { useEffect, useState } from "react";
import { Card, Table, Button, Input, Space, Modal, Form, Typography, Row, Col, Tag, AutoComplete } from "antd";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { apiFetch } from "../../context/auth";
import { useAntdMessage } from "../../hooks/useAntdMessage";
import { useAntdModal } from "../../hooks/useAntdModal";

const { Title } = Typography;

interface Product {
  _id: string;
  productType: "medicine" | "good";
  goodType?: "petshop" | "bmhp";
  category: string;
  subcategory?: string;
  product: { code?: string; name: string; weight?: number };
  pricing: { cost?: number; selling: number; online?: number };
  inventory: { quantity?: number };
  unit?: string;
  isActive: boolean;
}

interface ProductManagerProps {
  productTypeFilter?: "medicine" | "good";
  goodTypeFilter?: "petshop" | "bmhp";
  title?: string;
}

export default function ProductManager({ productTypeFilter = "good", goodTypeFilter, title }: ProductManagerProps) {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const msg = useAntdMessage();
  const modal = useAntdModal();

  const [categoryOptions, setCategoryOptions] = useState<{ value: string }[]>([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState<{ value: string }[]>([]);
  const [unitOptions, setUnitOptions] = useState<{ value: string }[]>([]);

  const label = title || "Barang";
  const isMedicine = productTypeFilter === "medicine";

  const loadDistinct = async (field: "category" | "subcategory" | "unit") => {
    try {
      const params = new URLSearchParams({ field });
      if (productTypeFilter) params.set("productType", productTypeFilter);
      if (goodTypeFilter) params.set("goodType", goodTypeFilter);
      const res = await apiFetch<{ data: string[] }>(`/api/products/distinct?${params}`);
      const opts = res.data.map((v) => ({ value: v }));
      if (field === "category") setCategoryOptions(opts);
      else if (field === "subcategory") setSubcategoryOptions(opts);
      else setUnitOptions(opts);
    } catch { /* ignore */ }
  };

  const fetchData = async (p = page, s = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "10", search: s });
      if (productTypeFilter) params.set("productType", productTypeFilter);
      if (goodTypeFilter) params.set("goodType", goodTypeFilter);
      const res = await apiFetch<{ data: Product[]; meta: { total: number } }>(`/api/products?${params}`);
      setData(res.data);
      setTotal(res.meta.total);
    } catch (err: any) {
      msg.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); loadDistinct("category"); loadDistinct("subcategory"); loadDistinct("unit"); }, []);

  const handleSearch = () => { setPage(1); fetchData(1, search); };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ productType: productTypeFilter || "good", goodType: goodTypeFilter });
    setModalOpen(true);
  };
  const openEdit = (p: Product) => { setEditing(p); form.setFieldsValue(p); setModalOpen(true); };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        productType: values.productType || productTypeFilter || "good",
        goodType: values.goodType || goodTypeFilter,
      };
      if (editing) {
        await apiFetch(`/api/products/${editing._id}`, { method: "PUT", body: JSON.stringify(payload) });
        msg.success(`${label} diupdate`);
      } else {
        await apiFetch("/api/products", { method: "POST", body: JSON.stringify(payload) });
        msg.success(`${label} dibuat`);
      }
      setModalOpen(false);
      fetchData();
      loadDistinct("category");
      loadDistinct("subcategory");
      loadDistinct("unit");
    } catch (err: any) {
      if (err.message) msg.error(err.message);
    }
  };

  const handleDelete = (id: string) => {
    modal.confirm({
      title: `Non-aktifkan ${label.toLowerCase()}?`,
      onOk: async () => {
        try {
          await apiFetch(`/api/products/${id}`, { method: "DELETE" });
          msg.success("Dinonaktifkan");
          fetchData();
        } catch (err: any) {
          msg.error(err.message);
        }
      },
    });
  };

  const fmt = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

  const catPlaceholder = isMedicine ? "Obat Injeksi, Obat Oral" : goodTypeFilter === "bmhp" ? "Medis" : "Pakan, Aksesoris";
  const subcatPlaceholder = isMedicine
    ? "Antibiotik, Vitamin, Anti Radang"
    : goodTypeFilter === "bmhp"
      ? "Botol Infus, Spuit, Kateter"
      : "Pakan Kucing, Aksesoris Kucing";

  const columns = [
    { title: "Nama", key: "name", render: (_: any, r: Product) => r.product?.name },
    { title: "Kategori", dataIndex: "category", key: "category" },
    { title: "Subkategori", key: "subcategory", render: (_: any, r: Product) => r.subcategory || "-" },
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
      <Title level={4}>{label}</Title>
      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col flex="auto">
            <Input.Search placeholder={`Cari ${label.toLowerCase()}...`} value={search} onChange={(e) => setSearch(e.target.value)} onSearch={handleSearch} enterButton style={{ width: 250 }} />
          </Col>
          <Col>
            <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>Tambah {label}</Button>
          </Col>
        </Row>
        <Table dataSource={data} columns={columns} rowKey="_id" loading={loading}
          pagination={{ current: page, total, pageSize: 10, onChange: (p) => { setPage(p); fetchData(p); } }} />
      </Card>

      <Modal title={editing ? `Edit ${label}` : `Tambah ${label}`} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="productType" hidden><Input /></Form.Item>
          <Form.Item name="goodType" hidden><Input /></Form.Item>
          <Form.Item name="category" label="Kategori" rules={[{ required: true, message: "Wajib" }]}>
            <AutoComplete
              options={categoryOptions}
              placeholder={catPlaceholder}
              filterOption={(input, option) => (option?.value || "").toLowerCase().includes(input.toLowerCase())}
            />
          </Form.Item>
          <Form.Item name="subcategory" label="Subkategori">
            <AutoComplete
              options={subcategoryOptions}
              placeholder={subcatPlaceholder}
              filterOption={(input, option) => (option?.value || "").toLowerCase().includes(input.toLowerCase())}
            />
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
            <AutoComplete
              options={unitOptions}
              placeholder="pcs, kg, botol, strip"
              filterOption={(input, option) => (option?.value || "").toLowerCase().includes(input.toLowerCase())}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
