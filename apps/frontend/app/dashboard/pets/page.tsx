"use client";

import { useEffect, useState } from "react";
import { Card, Table, Button, Input, Space, Modal, Form, Select, Typography, Row, Col, Tag, Empty } from "antd";
import { Plus, Search, Edit, Trash2, UserPlus, Eye } from "lucide-react";
import { apiFetch } from "../../context/auth";
import { useAntdMessage } from "../../hooks/useAntdMessage";
import { useRouter } from "next/navigation";

const { Title } = Typography;

interface Pet {
  _id: string;
  name: string;
  kind: string;
  gender: "male" | "female";
  notes?: string;
  customerId: { _id: string; name: string; whatsapp?: string };
  createdAt: string;
}

export default function PetsPage() {
  const [data, setData] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Pet | null>(null);
  const [customers, setCustomers] = useState<{ _id: string; name: string }[]>([]);
  const [form] = Form.useForm();
  const msg = useAntdMessage();
  const router = useRouter();

  const fetchData = async (p = page, s = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "10", search: s });
      const res = await apiFetch<{ data: Pet[]; meta: { total: number } }>(`/api/pets?${params}`);
      setData(res.data);
      setTotal(res.meta.total);
    } catch (err: any) {
      msg.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async (q = "") => {
    const params = new URLSearchParams({ page: "1", limit: "20", search: q });
    const res = await apiFetch<{ data: any[] }>(`/api/customers?${params}`);
    setCustomers(res.data);
  };

  useEffect(() => { fetchData(); fetchCustomers(); }, []);

  const handleSearch = () => { setPage(1); fetchData(1, search); };

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (p: Pet) => {
    setEditing(p);
    form.setFieldsValue({ ...p, customerId: p.customerId._id });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await apiFetch(`/api/pets/${editing._id}`, { method: "PUT", body: JSON.stringify(values) });
        msg.success("Pasien diupdate");
      } else {
        await apiFetch("/api/pets", { method: "POST", body: JSON.stringify(values) });
        msg.success("Pasien ditambahkan");
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      if (err.message) msg.error(err.message);
    }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({ title: "Hapus pasien?", onOk: async () => { await apiFetch(`/api/pets/${id}`, { method: "DELETE" }); msg.success("Dihapus"); fetchData(); } });
  };

  const columns = [
    { title: "Nama", dataIndex: "name", key: "name" },
    { title: "Jenis", dataIndex: "kind", key: "kind" },
    { title: "Gender", dataIndex: "gender", key: "gender", render: (v: string) => v === "male" ? "Jantan" : "Betina" },
    { title: "Pemilik", key: "owner", render: (_: any, r: Pet) => r.customerId?.name || "-" },
    { title: "Catatan", dataIndex: "notes", key: "notes", render: (v?: string) => v ? <Tag color="blue">{v}</Tag> : "-" },
    {
      title: "Aksi", key: "action",
      render: (_: any, r: Pet) => (
        <Space>
          <Button size="small" icon={<Eye size={14} />} onClick={() => router.push(`/dashboard/pets/${r._id}`)} />
          <Button size="small" icon={<Edit size={14} />} onClick={() => openEdit(r)} />
          <Button size="small" danger icon={<Trash2 size={14} />} onClick={() => handleDelete(r._id)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>Pasien Hewan</Title>
      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col flex="auto">
            <Input.Search placeholder="Cari pasien..." value={search} onChange={(e) => setSearch(e.target.value)} onSearch={handleSearch} enterButton />
          </Col>
          <Col>
            <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>Tambah Pasien</Button>
          </Col>
        </Row>
        <Table dataSource={data} columns={columns} rowKey="_id" loading={loading}
          pagination={{ current: page, total, pageSize: 10, onChange: (p) => { setPage(p); fetchData(p); } }} />
      </Card>

      <Modal title={editing ? "Edit Pasien" : "Tambah Pasien"} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)} width={500}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Nama Hewan" rules={[{ required: true, message: "Wajib" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="kind" label="Jenis" rules={[{ required: true, message: "Wajib" }]}>
            <Select showSearch placeholder="Pilih jenis" options={[
              { value: "Kucing", label: "Kucing" },
              { value: "Anjing", label: "Anjing" },
              { value: "Kelinci", label: "Kelinci" },
              { value: "Hamster", label: "Hamster" },
              { value: "Burung", label: "Burung" },
              { value: "Reptil", label: "Reptil" },
              { value: "Ikan", label: "Ikan" },
              { value: "Lainnya", label: "Lainnya" },
            ]} />
          </Form.Item>
          <Form.Item name="gender" label="Gender" rules={[{ required: true, message: "Wajib" }]}>
            <Select options={[{ value: "male", label: "Jantan" }, { value: "female", label: "Betina" }]} />
          </Form.Item>
          <Form.Item name="customerId" label="Pemilik" rules={[{ required: true, message: "Pilih pemilik" }]}>
            <Select
              showSearch
              placeholder="Cari pemilik..."
              onSearch={fetchCustomers}
              filterOption={false}
              options={customers.map((c) => ({ value: c._id, label: c.name }))}
              notFoundContent={
                <Empty
                  description="Tidak ada pemilik"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                  <Button type="link" icon={<UserPlus size={14} />} onClick={() => { setModalOpen(false); router.push("/dashboard/customers"); }}>
                    Tambah Pemilik Baru
                  </Button>
                </Empty>
              }
            />
          </Form.Item>
          <Form.Item name="notes" label="Catatan">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
