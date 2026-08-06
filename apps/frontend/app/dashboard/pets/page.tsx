"use client";

import { useEffect, useState } from "react";
import { Card, Table, Button, Input, Space, Modal, Form, Select, Typography, Row, Col, Tag, Empty, DatePicker, InputNumber, Radio, AutoComplete } from "antd";
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
  code?: string;
  name: string;
  kind: string;
  breed?: string;
  furColor?: string;
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
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Pet | null>(null);
  const [customers, setCustomers] = useState<{ _id: string; name: string }[]>([]);
  const [kindOptions, setKindOptions] = useState<{ value: string }[]>([]);
  const [breedOptions, setBreedOptions] = useState<{ value: string }[]>([]);
  const [notesOptions, setNotesOptions] = useState<{ value: string }[]>([]);
  const [form] = Form.useForm();
  const msg = useAntdMessage();
  const router = useRouter();
  const modal = useAntdModal();

  const ageMode = Form.useWatch("ageMode", form);

  const fetchDistinct = async (field: "kind" | "breed" | "notes") => {
    try {
      const res = await apiFetch<{ data: string[] }>(`/api/pets/distinct?field=${field}`);
      const opts = res.data.map((v) => ({ value: v }));
      if (field === "kind") setKindOptions(opts);
      else if (field === "breed") setBreedOptions(opts);
      else setNotesOptions(opts);
    } catch { /* ignore */ }
  };

  const fetchData = async (p = page, s = search, sb = sortBy, od = order) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "10", search: s, sortBy: sb, order: od });
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
    // Pertahankan pemilik yang sedang dipilih di form agar value-nya tidak
    // berubah jadi ObjectId saat hasil pencarian tidak memuatnya.
    setCustomers((prev) => {
      const curId = form.getFieldValue("customerId");
      const cur = prev.find((c) => c._id === curId);
      return cur && !res.data.some((c) => c._id === cur._id) ? [...res.data, cur] : res.data;
    });
  };

  useEffect(() => { fetchData(); fetchCustomers(); fetchDistinct("kind"); fetchDistinct("breed"); fetchDistinct("notes"); }, []);

  const handleSearch = () => { setPage(1); fetchData(1, search); };

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ ageMode: "birthDate" });
    setModalOpen(true);
  };
  const openEdit = (p: Pet) => {
    setEditing(p);
    // Options pemilik hanya 20 data pertama dari server — pastikan pemilik pasien ini
    // selalu ada di dropdown agar value-nya tidak tampil sebagai ObjectId.
    const owner = p.customerId;
    if (owner?._id && owner.name && !customers.some((c) => c._id === owner._id)) {
      setCustomers((prev) => [...prev, { _id: owner._id, name: owner.name }]);
    }
    form.setFieldsValue({
      ...p,
      customerId: owner?._id,
      birthDate: p.birthDate ? dayjs(p.birthDate) : undefined,
      ageMode: p.birthDate ? "birthDate" : "initialAge",
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // Input kondisional: hanya satu sumber umur yang boleh terisi
      const useBirthDate = values.ageMode !== "initialAge";
      const birthDate = useBirthDate && values.birthDate ? dayjs(values.birthDate).toISOString() : undefined;
      const payload: any = {
        code: values.code || undefined,
        name: values.name,
        kind: values.kind,
        breed: values.breed,
        furColor: values.furColor,
        gender: values.gender,
        customerId: values.customerId,
        notes: values.notes,
        birthDate,
        initialAge: !useBirthDate && values.initialAge?.value ? values.initialAge : undefined,
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
    { title: "Kode", dataIndex: "code", key: "code", render: (v?: string) => v ? <Tag>{v}</Tag> : "-" },
    { title: "Nama", dataIndex: "name", key: "name", sorter: true },
    { title: "Jenis", dataIndex: "kind", key: "kind", sorter: true },
    { title: "Ras", dataIndex: "breed", key: "breed", render: (v?: string) => v || "-" },
    { title: "Warna Bulu", dataIndex: "furColor", key: "furColor", render: (v?: string) => v || "-" },
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
          onChange={(_, __, sorter) => {
            const s: any = Array.isArray(sorter) ? sorter[0] : sorter;
            const sb = s?.order ? String(s.field) : "createdAt";
            const od = s?.order === "ascend" ? "asc" : s?.order === "descend" ? "desc" : "desc";
            setSortBy(sb); setOrder(od); setPage(1); fetchData(1, search, sb, od);
          }}
          pagination={{ current: page, total, pageSize: 10, onChange: (p) => { setPage(p); fetchData(p); } }} />
      </Card>

      <Modal title={editing ? "Edit Pasien" : "Tambah Pasien"} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)} width={500}>
        <Form form={form} layout="vertical">
          <Typography.Title level={5} style={{ marginBottom: 8 }}>Data Pasien</Typography.Title>
          <Form.Item name="code" label="Kode Pasien">
            <Input placeholder="Contoh: KCG-2026-0001 (opsional)" />
          </Form.Item>
          <Form.Item name="name" label="Nama Hewan" rules={[{ required: true, message: "Wajib" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="kind" label="Jenis Hewan" rules={[{ required: true, message: "Wajib" }]}>
            <AutoComplete
              options={kindOptions}
              placeholder="Pilih atau ketik jenis hewan (Kucing, Anjing...)"
              filterOption={(input, option) => (option?.value || "").toLowerCase().includes(input.toLowerCase())}
            />
          </Form.Item>

          <Typography.Title level={5} style={{ marginBottom: 8 }}>Signalment</Typography.Title>
          <Form.Item name="breed" label="Ras Hewan">
            <AutoComplete
              options={breedOptions}
              placeholder="Pilih atau ketik ras (Persian, Labrador...)"
              filterOption={(input, option) => (option?.value || "").toLowerCase().includes(input.toLowerCase())}
            />
          </Form.Item>
          <Form.Item name="furColor" label="Warna Bulu">
            <Input placeholder="Warna bulu, contoh: Oren, Putih (opsional)" />
          </Form.Item>
          <Form.Item name="gender" label="Jenis Kelamin" rules={[{ required: true, message: "Wajib" }]}>
            <Select options={[{ value: "male", label: "Jantan" }, { value: "female", label: "Betina" }]} />
          </Form.Item>
          <Form.Item name="ageMode" label="Sumber Umur">
            <Radio.Group optionType="button" buttonStyle="solid" style={{ width: "100%" }}>
              <Radio.Button value="birthDate" style={{ width: "50%", textAlign: "center" }}>📅 Tanggal Lahir</Radio.Button>
              <Radio.Button value="initialAge" style={{ width: "50%", textAlign: "center" }}>🐣 Umur Awal</Radio.Button>
            </Radio.Group>
          </Form.Item>
          {ageMode !== "initialAge" ? (
            <Form.Item name="birthDate" label="Tanggal Lahir">
              <DatePicker style={{ width: "100%" }} placeholder="Pilih tanggal lahir" />
            </Form.Item>
          ) : (
            <>
              <Form.Item name={["initialAge", "value"]} label="Umur Awal" rules={[{ required: true, message: "Wajib" }]}>
                <InputNumber style={{ width: "100%" }} min={0} placeholder="Contoh: 6" />
              </Form.Item>
              <Form.Item name={["initialAge", "unit"]} label="Satuan Umur Awal" rules={[{ required: true, message: "Pilih satuan" }]}>
                <Select placeholder="Pilih satuan" options={[{ value: "month", label: "Bulan" }, { value: "year", label: "Tahun" }]} />
              </Form.Item>
            </>
          )}
          <Form.Item name="notes" label="Ciri Khusus">
            <AutoComplete
              options={notesOptions}
              placeholder="Ciri khas / tanda khusus hewan (opsional)"
              filterOption={(input, option) => (option?.value || "").toLowerCase().includes(input.toLowerCase())}
            />
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
