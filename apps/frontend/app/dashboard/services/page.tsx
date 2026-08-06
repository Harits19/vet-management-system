"use client";

import { useEffect, useState } from "react";
import { Card, Table, Button, Input, Space, Modal, Form, Typography, Row, Col, Tag } from "antd";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { apiFetch } from "../../context/auth";
import { useAntdMessage } from "../../hooks/useAntdMessage";
import { useAntdModal } from "../../hooks/useAntdModal";

const { Title } = Typography;

interface Service {
  _id: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  isActive: boolean;
}

export default function ServicesPage() {
  const [data, setData] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form] = Form.useForm();
  const msg = useAntdMessage();
  const modal = useAntdModal();

  const fetchData = async (p = page, s = search, sb = sortBy, od = order) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "10", search: s, sortBy: sb, order: od });
      const res = await apiFetch<{ data: Service[]; meta: { total: number } }>(`/api/services?${params}`);
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
  const openEdit = (s: Service) => { setEditing(s); form.setFieldsValue(s); setModalOpen(true); };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await apiFetch(`/api/services/${editing._id}`, { method: "PUT", body: JSON.stringify(values) });
        msg.success("Jasa diupdate");
      } else {
        await apiFetch("/api/services", { method: "POST", body: JSON.stringify(values) });
        msg.success("Jasa dibuat");
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      if (err.message) msg.error(err.message);
    }
  };

  const handleDelete = (id: string) => {
    modal.confirm({
      title: "Non-aktifkan jasa?",
      onOk: async () => {
        try {
          await apiFetch(`/api/services/${id}`, { method: "DELETE" });
          msg.success("Dinonaktifkan");
          fetchData();
        } catch (err: any) {
          msg.error(err.message);
        }
      },
    });
  };

  const fmt = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

  const columns = [
    { title: "Nama", dataIndex: "name", key: "name", sorter: true },
    { title: "Deskripsi", dataIndex: "description", key: "description", render: (v?: string) => v || "-" },
    { title: "Harga", dataIndex: "price", key: "price", sorter: true, render: (v: number) => fmt(v) },
    { title: "Status", dataIndex: "isActive", key: "active", render: (v: boolean) => v ? <Tag color="green">Aktif</Tag> : <Tag color="red">Nonaktif</Tag> },
    {
      title: "Aksi", key: "action",
      render: (_: any, r: Service) => (
        <Space>
          <Button size="small" icon={<Edit size={14} />} onClick={() => openEdit(r)} />
          <Button size="small" danger icon={<Trash2 size={14} />} onClick={() => handleDelete(r._id)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>Jasa / Tindakan</Title>
      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col flex="auto">
            <Input.Search placeholder="Cari jasa..." value={search} onChange={(e) => setSearch(e.target.value)} onSearch={handleSearch} enterButton style={{ width: 250 }} />
          </Col>
          <Col>
            <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>Tambah Jasa</Button>
          </Col>
        </Row>
        <Table dataSource={data} columns={columns} rowKey="_id" loading={loading}
          onChange={(_, __, sorter) => {
            const s: any = Array.isArray(sorter) ? sorter[0] : sorter;
            const sb = s?.order ? String(s.field) : "createdAt";
            const od = s?.order === "ascend" ? "asc" : s?.order === "descend" ? "desc" : "desc";
            setSortBy(sb); setOrder(od); setPage(1); fetchData(1, search, sb, od);
          }}
          pagination={{ current: page, total, pageSize: 10, onChange: (p) => { setPage(p); fetchData(p); } }} />
      </Card>

      <Modal title={editing ? "Edit Jasa" : "Tambah Jasa"} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)} width={500}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Nama Jasa / Tindakan" rules={[{ required: true, message: "Wajib" }]}>
            <Input placeholder="Contoh: Konsultasi, Vaksinasi, Grooming, Operasi" />
          </Form.Item>
          <Form.Item name="description" label="Deskripsi">
            <Input.TextArea rows={2} placeholder="Deskripsi singkat (opsional)" />
          </Form.Item>
          <Form.Item name="price" label="Harga" rules={[{ required: true, message: "Wajib" }]}>
            <Input type="number" addonBefore="Rp" />
          </Form.Item>
          <Form.Item name="cost" label="Modal">
            <Input type="number" addonBefore="Rp" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
