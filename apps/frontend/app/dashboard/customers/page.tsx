"use client";

import { useEffect, useState } from "react";
import { Card, Table, Button, Input, Space, Modal, Form, message, Tag, Typography, Row, Col } from "antd";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import { apiFetch } from "../../context/auth";
import { useRouter } from "next/navigation";

const { Title } = Typography;

interface Customer {
  _id: string;
  name: string;
  whatsapp?: string;
  address?: string;
  createdAt: string;
}

export default function CustomersPage() {
  const [data, setData] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form] = Form.useForm();
  const router = useRouter();

  const fetchData = async (p = page, s = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "10", search: s });
      const res = await apiFetch<{ data: Customer[]; meta: { total: number } }>(`/api/customers?${params}`);
      setData(res.data);
      setTotal(res.meta.total);
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSearch = () => { setPage(1); fetchData(1, search); };

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (c: Customer) => { setEditing(c); form.setFieldsValue(c); setModalOpen(true); };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await apiFetch(`/api/customers/${editing._id}`, { method: "PUT", body: JSON.stringify(values) });
        message.success("Customer diupdate");
      } else {
        await apiFetch("/api/customers", { method: "POST", body: JSON.stringify(values) });
        message.success("Customer dibuat");
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      if (err.message) message.error(err.message);
    }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: "Hapus customer?",
      onOk: async () => {
        await apiFetch(`/api/customers/${id}`, { method: "DELETE" });
        message.success("Customer dihapus");
        fetchData();
      },
    });
  };

  const columns = [
    { title: "Nama", dataIndex: "name", key: "name" },
    { title: "WhatsApp", dataIndex: "whatsapp", key: "whatsapp", render: (v?: string) => v || "-" },
    { title: "Alamat", dataIndex: "address", key: "address", render: (v?: string) => v || "-" },
    {
      title: "Aksi", key: "action",
      render: (_: any, record: Customer) => (
        <Space>
          <Button size="small" icon={<Eye size={14} />} onClick={() => router.push(`/dashboard/customers/${record._id}`)} />
          <Button size="small" icon={<Edit size={14} />} onClick={() => openEdit(record)} />
          <Button size="small" danger icon={<Trash2 size={14} />} onClick={() => handleDelete(record._id)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>Customer</Title>
      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col flex="auto">
            <Input.Search placeholder="Cari customer..." value={search} onChange={(e) => setSearch(e.target.value)} onSearch={handleSearch} enterButton />
          </Col>
          <Col>
            <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>Tambah Customer</Button>
          </Col>
        </Row>
        <Table dataSource={data} columns={columns} rowKey="_id" loading={loading}
          pagination={{ current: page, total, pageSize: 10, onChange: (p) => { setPage(p); fetchData(p); } }} />
      </Card>

      <Modal title={editing ? "Edit Customer" : "Tambah Customer"} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Nama" rules={[{ required: true, message: "Nama wajib" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="whatsapp" label="WhatsApp">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Alamat">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
