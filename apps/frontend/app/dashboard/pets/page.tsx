"use client";

import { useEffect, useState } from "react";
import { Card, Table, Button, Input, Space, Modal, Form, Select, Typography, Row, Col, Tag, Empty, DatePicker, InputNumber } from "antd";
import { Plus, Search, Edit, Trash2, UserPlus, Eye } from "lucide-react";
import { apiFetch } from "../../context/auth";
import { useAntdMessage } from "../../hooks/useAntdMessage";
import { useAntdModal } from "../../hooks/useAntdModal";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { computePetAge } from "@vet/shared";

const { Title } = Typography;

interface Pet {
  _id: string;
  name: string;
  kind: string;
  breed?: string;
  gender: "male" | "female";
  birthDate?: string;
  initialAge?: { value: number; unit: "month" | "year" };
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
  const modal = useAntdModal();

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
    form.setFieldsValue({
      ...p,
      customerId: p.customerId._id,
      birthDate: p.birthDate ? dayjs(p.birthDate) : undefined,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const birthDate = values.birthDate ? dayjs(values.birthDate).toISOString() : undefined;
      const payload: any = {
        name: values.name,
        kind: values.kind,
        breed: values.breed,
        gender: values.gender,
        customerId: values.customerId,
        notes: values.notes,
        birthDate,
        // Umur awal hanya diisi jika tanggal lahir tidak diketahui
        initialAge: !birthDate && values.initialAge?.value ? values.initialAge : undefined,
      };
      if (editing) {
        await apiFetch(`/api/pets/${editing._id}`, { method: "PUT", body: JSON.stringify(payload) });
        msg.success("Pasien diupdate");
      } else {
        await apiFetch("/api/pets", { method: "POST", body: JSON.stringify(payload) });
        msg.success("Pasien ditambahkan");
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      if (err.message) msg.error(err.message);
    }
  };

  const handleDelete = (id: string) => {
    modal.confirm({
      title: "Hapus pasien?",
      onOk: async () => {
        try {
          await apiFetch(`/api/pets/${id}`, { method: "DELETE" });
          msg.success("Dihapus");
          fetchData();
        } catch (err: any) {
          msg.error(err.message);
        }
      },
    });
  };

  const columns = [
    { title: "Nama", dataIndex: "name", key: "name" },
    { title: "Jenis", dataIndex: "kind", key: "kind" },
    { title: "Ras", dataIndex: "breed", key: "breed", render: (v?: string) => v || "-" },
    { title: "Umur", key: "age", render: (_: any, r: Pet) => computePetAge(r)?.label || "-" },
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
      <Title level={4}>Pasien Baru</Title>
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
          <Typography.Title level={5} style={{ marginBottom: 8 }}>Data Pasien</Typography.Title>
          <Form.Item name="name" label="Nama Hewan" rules={[{ required: true, message: "Wajib" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="kind" label="Jenis Hewan" rules={[{ required: true, message: "Wajib" }]}>
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

          <Typography.Title level={5} style={{ marginBottom: 8 }}>Signalment</Typography.Title>
          <Form.Item name="breed" label="Ras Hewan">
            <Input placeholder="Contoh: Persian, Labrador (opsional)" />
          </Form.Item>
          <Form.Item name="gender" label="Jenis Kelamin" rules={[{ required: true, message: "Wajib" }]}>
            <Select options={[{ value: "male", label: "Jantan" }, { value: "female", label: "Betina" }]} />
          </Form.Item>
          <Form.Item name="birthDate" label="Umur (Tanggal Lahir)">
            <DatePicker style={{ width: "100%" }} placeholder="Pilih tanggal lahir" />
          </Form.Item>
          <Form.Item name={["initialAge", "value"]} label="Umur Awal (jika tgl lahir tidak diketahui)">
            <InputNumber style={{ width: "100%" }} min={0} placeholder="Contoh: 6" />
          </Form.Item>
          <Form.Item name={["initialAge", "unit"]} label="Satuan Umur Awal">
            <Select placeholder="Pilih satuan" options={[{ value: "month", label: "Bulan" }, { value: "year", label: "Tahun" }]} />
          </Form.Item>
          <Form.Item name="notes" label="Ciri Khusus">
            <Input.TextArea rows={2} placeholder="Ciri khas / tanda khusus hewan (opsional)" />
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
        </Form>
      </Modal>
    </div>
  );
}
