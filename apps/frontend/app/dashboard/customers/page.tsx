"use client";

import { useEffect, useState } from "react";
import { Card, Table, Button, Input, Space, Modal, Form, Tag, Typography, Row, Col, Select, AutoComplete } from "antd";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import { apiFetch } from "../../context/auth";
import { useAntdMessage } from "../../hooks/useAntdMessage";
import { useAntdModal } from "../../hooks/useAntdModal";
import { useRouter } from "next/navigation";

const { Title } = Typography;

interface Customer {
  _id: string;
  name: string;
  whatsapp?: string;
  address?: string;
  province?: string;
  regency?: string;
  district?: string;
  village?: string;
  hamlet?: string;
  createdAt: string;
}

interface Wilayah {
  code: string;
  name: string;
}

async function fetchWilayah(path: string): Promise<Wilayah[]> {
  const res = await fetch(`/wilayah/${path}`);
  if (!res.ok) throw new Error("Gagal memuat data wilayah");
  const json = await res.json();
  return json.data ?? json;
}

export function formatAddress(c: { address?: string; hamlet?: string; village?: string; district?: string; regency?: string; province?: string }) {
  const parts = [
    c.address,
    c.hamlet ? `Dusun ${c.hamlet}` : "",
    c.village,
    c.district,
    c.regency,
    c.province,
  ].filter(Boolean);
  return parts.join(", ") || "-";
}

export default function CustomersPage() {
  const [data, setData] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form] = Form.useForm();
  const [provinces, setProvinces] = useState<Wilayah[]>([]);
  const [regencies, setRegencies] = useState<Wilayah[]>([]); // semua kabupaten (difilter client-side)
  const [districts, setDistricts] = useState<Wilayah[]>([]); // semua kecamatan (difilter client-side)
  const [villages, setVillages] = useState<Wilayah[]>([]);   // desa kecamatan terpilih
  const [villageCache, setVillageCache] = useState<Record<string, Wilayah[]>>({}); // cache desa per provinsi
  const [dusunOptions, setDusunOptions] = useState<{ value: string }[]>([]);
  const provinceName = Form.useWatch("province", form);
  const regencyName = Form.useWatch("regency", form);
  const provinceCode = provinces.find((x) => x.name === provinceName)?.code ?? "";
  const regencyCode = regencies.find((x) => x.name === regencyName)?.code ?? "";
  const regencyOptions = provinceCode ? regencies.filter((r) => r.code.startsWith(provinceCode)) : [];
  const districtOptions = regencyCode ? districts.filter((d) => d.code.startsWith(regencyCode)) : [];
  const router = useRouter();
  const msg = useAntdMessage();
  const modal = useAntdModal();

  const fetchData = async (p = page, s = search, sb = sortBy, od = order) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "10", search: s, sortBy: sb, order: od });
      const res = await apiFetch<{ data: Customer[]; meta: { total: number } }>(`/api/customers?${params}`);
      setData(res.data);
      setTotal(res.meta.total);
    } catch (err: any) {
      msg.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const loadProvinces = async (): Promise<Wilayah[]> => {
    if (provinces.length) return provinces;
    try {
      const list = await fetchWilayah("provinces.json");
      setProvinces(list);
      return list;
    } catch {
      msg.warning("Gagal memuat daftar provinsi");
      return [];
    }
  };
  const loadAllRegencies = async (): Promise<Wilayah[]> => {
    if (regencies.length) return regencies;
    try {
      const list = await fetchWilayah("regencies.json");
      setRegencies(list);
      return list;
    } catch {
      msg.warning("Gagal memuat kabupaten/kota");
      return [];
    }
  };
  const loadAllDistricts = async (): Promise<Wilayah[]> => {
    if (districts.length) return districts;
    try {
      const list = await fetchWilayah("districts.json");
      setDistricts(list);
      return list;
    } catch {
      msg.warning("Gagal memuat kecamatan");
      return [];
    }
  };
  const loadVillages = async (districtCode: string) => {
    const provinceCode = districtCode.split(".")[0];
    let all = villageCache[provinceCode];
    if (!all) {
      try {
        all = await fetchWilayah(`villages/${provinceCode}.json`);
        setVillageCache((prev) => ({ ...prev, [provinceCode]: all }));
      } catch {
        msg.warning("Gagal memuat desa/kelurahan");
        all = [];
      }
    }
    setVillages(all.filter((v) => v.code.startsWith(districtCode)));
  };
  const loadDusunOptions = async () => {
    try {
      const res = await apiFetch<{ data: string[] }>("/api/customers/distinct?field=hamlet");
      setDusunOptions(res.data.map((v) => ({ value: v })));
    } catch { /* ignore */ }
  };

  useEffect(() => { loadProvinces(); loadDusunOptions(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => { setPage(1); fetchData(1, search); };

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = async (c: Customer) => {
    setEditing(c);
    form.resetFields(); // buang state form dari edit sebelumnya (field yang tidak ada di record baru tidak ikut terbawa)
    form.setFieldsValue(c);
    setModalOpen(true);
    const provs = await loadProvinces();
    const p = provs.find((x) => x.name === c.province);
    if (p) {
      const regs = await loadAllRegencies();
      const rg = regs.find((x) => x.name === c.regency);
      if (rg) {
        const dists = await loadAllDistricts();
        const d = dists.find((x) => x.name === c.district);
        if (d) await loadVillages(d.code);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await apiFetch(`/api/customers/${editing._id}`, { method: "PUT", body: JSON.stringify(values) });
        msg.success("Customer diupdate");
      } else {
        await apiFetch("/api/customers", { method: "POST", body: JSON.stringify(values) });
        msg.success("Customer dibuat");
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      if (err.message) msg.error(err.message);
    }
  };

  const handleDelete = (id: string) => {
    modal.confirm({
      title: "Hapus customer?",
      onOk: async () => {
        try {
          await apiFetch(`/api/customers/${id}`, { method: "DELETE" });
          msg.success("Customer dihapus");
          fetchData();
        } catch (err: any) {
          msg.error(err.message);
        }
      },
    });
  };

  const columns = [
    { title: "Nama", dataIndex: "name", key: "name", sorter: true },
    { title: "WhatsApp", dataIndex: "whatsapp", key: "whatsapp", render: (v?: string) => v || "-" },
    { title: "Alamat", key: "address", render: (_: any, r: Customer) => formatAddress(r) },
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
      <Title level={4}>Klien</Title>
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
          onChange={(_, __, sorter) => {
            const s: any = Array.isArray(sorter) ? sorter[0] : sorter;
            const sb = s?.order ? String(s.field) : "createdAt";
            const od = s?.order === "ascend" ? "asc" : s?.order === "descend" ? "desc" : "desc";
            setSortBy(sb); setOrder(od); setPage(1); fetchData(1, search, sb, od);
          }}
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
          <Form.Item name="province" label="Provinsi">
            <Select
              showSearch
              placeholder="Pilih provinsi"
              optionFilterProp="label"
              options={provinces.map((p) => ({ value: p.name, label: p.name }))}
              onChange={() => {
                form.setFieldsValue({ regency: undefined, district: undefined, village: undefined });
                setVillages([]);
                loadAllRegencies();
              }}
            />
          </Form.Item>
          <Form.Item name="regency" label="Kabupaten / Kota">
            <Select
              showSearch
              placeholder="Pilih kabupaten/kota"
              optionFilterProp="label"
              options={regencyOptions.map((r) => ({ value: r.name, label: r.name }))}
              onChange={() => {
                form.setFieldsValue({ district: undefined, village: undefined });
                setVillages([]);
                loadAllDistricts();
              }}
            />
          </Form.Item>
          <Form.Item name="district" label="Kecamatan">
            <Select
              showSearch
              placeholder="Pilih kecamatan"
              optionFilterProp="label"
              options={districtOptions.map((d) => ({ value: d.name, label: d.name }))}
              onChange={(v) => {
                form.setFieldsValue({ village: undefined });
                setVillages([]);
                const d = districts.find((x) => x.name === v);
                if (d) loadVillages(d.code);
              }}
            />
          </Form.Item>
          <Form.Item name="village" label="Desa / Kelurahan">
            <Select
              showSearch
              placeholder="Pilih desa/kelurahan"
              optionFilterProp="label"
              options={villages.map((v) => ({ value: v.name, label: v.name }))}
            />
          </Form.Item>
          <Form.Item name="hamlet" label="Dusun">
            <AutoComplete
              options={dusunOptions}
              placeholder="Pilih dusun yang pernah diisi atau ketik baru"
              filterOption={(input, option) => (option?.value || "").toLowerCase().includes(input.toLowerCase())}
            />
          </Form.Item>
          <Form.Item name="address" label="Detail Alamat">
            <Input.TextArea rows={2} placeholder="Jalan, RT/RW, nomor rumah (opsional)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
