"use client";

import { useEffect, useState } from "react";
import { Card, Table, Button, Input, Space, Modal, Form, Select, Switch, Tag, Typography, Row, Col } from "antd";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { apiFetch } from "../../context/auth";
import { useAntdMessage } from "../../hooks/useAntdMessage";
import { useAntdModal } from "../../hooks/useAntdModal";
import dayjs from "dayjs";

const { Title } = Typography;

interface UserRecord {
  _id: string;
  name: string;
  username: string;
  email: string;
  role: "superadmin" | "admin" | "cashier" | "doctor";
  isActive: boolean;
  doctorSignature?: string;
  createdAt: string;
}

const ROLE_LABELS: Record<UserRecord["role"], string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  cashier: "Kasir",
  doctor: "Dokter",
};

const ROLE_COLORS: Record<UserRecord["role"], string> = {
  superadmin: "red",
  admin: "orange",
  cashier: "blue",
  doctor: "green",
};

export default function UsersPage() {
  const [data, setData] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UserRecord | null>(null);
  const [form] = Form.useForm();
  const msg = useAntdMessage();
  const modal = useAntdModal();

  const fetchData = async (p = page, s = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "10", search: s });
      const res = await apiFetch<{ data: UserRecord[]; meta: { total: number } }>(`/api/users?${params}`);
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

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ role: "cashier", isActive: true });
    setModalOpen(true);
  };

  const openEdit = (u: UserRecord) => {
    setEditing(u);
    form.resetFields();
    form.setFieldsValue({ name: u.name, username: u.username, email: u.email, role: u.role, isActive: u.isActive });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        // Password kosong saat edit = tidak diganti
        const { password, ...rest } = values;
        await apiFetch(`/api/users/${editing._id}`, { method: "PUT", body: JSON.stringify(password ? { ...rest, password } : rest) });
        msg.success("User diupdate");
      } else {
        await apiFetch("/api/users", { method: "POST", body: JSON.stringify(values) });
        msg.success("User dibuat");
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      if (err.message) msg.error(err.message);
    }
  };

  const handleDelete = (u: UserRecord) => {
    modal.confirm({
      title: "Nonaktifkan user?",
      content: `${u.name} tidak bisa login lagi. Riwayat transaksi/rekam medis tetap tersimpan.`,
      onOk: async () => {
        try {
          await apiFetch(`/api/users/${u._id}`, { method: "DELETE" });
          msg.success("User dinonaktifkan");
          fetchData();
        } catch (err: any) {
          msg.error(err.message);
        }
      },
    });
  };

  const columns = [
    { title: "Nama", dataIndex: "name", key: "name" },
    { title: "Username", dataIndex: "username", key: "username" },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Role", dataIndex: "role", key: "role",
      render: (v: UserRecord["role"]) => <Tag color={ROLE_COLORS[v]}>{ROLE_LABELS[v]}</Tag>,
    },
    {
      title: "Status", dataIndex: "isActive", key: "isActive",
      render: (v: boolean) => v ? <Tag color="green">Aktif</Tag> : <Tag color="default">Nonaktif</Tag>,
    },
    { title: "Dibuat", dataIndex: "createdAt", key: "createdAt", render: (v: string) => dayjs(v).format("DD/MM/YYYY") },
    {
      title: "Aksi", key: "action",
      render: (_: any, r: UserRecord) => (
        <Space>
          <Button size="small" icon={<Edit size={14} />} onClick={() => openEdit(r)} />
          <Button size="small" danger icon={<Trash2 size={14} />} onClick={() => handleDelete(r)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>Manajemen User</Title>
      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col flex="auto">
            <Input.Search placeholder="Cari nama / username / email..." value={search} onChange={(e) => setSearch(e.target.value)} onSearch={handleSearch} enterButton />
          </Col>
          <Col>
            <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>Tambah User</Button>
          </Col>
        </Row>
        <Table dataSource={data} columns={columns} rowKey="_id" loading={loading} scroll={{ x: 900 }}
          pagination={{ current: page, total, pageSize: 10, onChange: (p) => { setPage(p); fetchData(p); } }} />
      </Card>

      <Modal title={editing ? "Edit User" : "Tambah User"} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)} width={500}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Nama Lengkap" rules={[{ required: true, message: "Wajib" }]}>
            <Input placeholder="Contoh: drh. Budi" />
          </Form.Item>
          <Form.Item name="username" label="Username" rules={[{ required: true, message: "Wajib" }]}>
            <Input placeholder="Dipakai untuk login" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email", message: "Email tidak valid" }]}>
            <Input placeholder="nama@klinik.com" />
          </Form.Item>
          <Form.Item
            name="password"
            label={editing ? "Password Baru (kosongkan jika tidak diganti)" : "Password"}
            rules={editing ? [{ min: 6, message: "Minimal 6 karakter" }] : [{ required: true, message: "Wajib" }, { min: 6, message: "Minimal 6 karakter" }]}
          >
            <Input.Password placeholder={editing ? "Biarkan kosong" : "Minimal 6 karakter"} />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true, message: "Pilih role" }]}>
            <Select options={[
              { value: "superadmin", label: "Super Admin" },
              { value: "admin", label: "Admin" },
              { value: "cashier", label: "Kasir" },
              { value: "doctor", label: "Dokter" },
            ]} />
          </Form.Item>
          <Form.Item name="isActive" label="Aktif" valuePropName="checked">
            <Switch checkedChildren="Aktif" unCheckedChildren="Nonaktif" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
