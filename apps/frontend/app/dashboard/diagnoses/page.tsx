"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  Typography,
  Row,
  Col,
  Select,
  InputNumber,
  Tag,
} from "antd";
import { Plus, Edit, Trash2 } from "lucide-react";
import { apiFetch } from "../../context/auth";
import { useAntdMessage } from "../../hooks/useAntdMessage";
import { useAntdModal } from "../../hooks/useAntdModal";

const { Title, Text } = Typography;

interface TplLine {
  productId: string;
  name: string;
  quantity: number;
  dosage?: string;
  _key: string;
}

interface DiagnosisTemplate {
  _id: string;
  name: string;
  items: {
    treatments: Omit<TplLine, "_key">[];
    prescriptions: Omit<TplLine, "_key">[];
    goods: Omit<TplLine, "_key">[];
  };
}

interface SvcOpt {
  _id: string;
  name: string;
  price: number;
}
interface ProdOpt {
  _id: string;
  product: { name: string };
  pricing: { selling: number };
  inventory?: { quantity?: number };
  unit?: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

const newLine = (prefix: string, lines: TplLine[]) => ({
  productId: "",
  name: "",
  quantity: 1,
  _key: `${prefix}-${Date.now()}-${lines.length}`,
});

export default function DiagnosesPage() {
  const [data, setData] = useState<DiagnosisTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DiagnosisTemplate | null>(null);
  const [form] = Form.useForm();
  const msg = useAntdMessage();
  const modal = useAntdModal();

  const [services, setServices] = useState<SvcOpt[]>([]);
  const [medicines, setMedicines] = useState<ProdOpt[]>([]);
  const [goods, setGoods] = useState<ProdOpt[]>([]);

  // line items di modal
  const [treatments, setTreatments] = useState<TplLine[]>([]);
  const [prescriptions, setPrescriptions] = useState<TplLine[]>([]);
  const [goodsLines, setGoodsLines] = useState<TplLine[]>([]);

  const fetchData = async (p = page, s = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "10", search: s });
      const res = await apiFetch<{ data: DiagnosisTemplate[]; meta: { total: number } }>(
        `/api/diagnosis-templates?${params}`
      );
      setData(res.data);
      setTotal(res.meta.total);
    } catch (err: any) {
      msg.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Master jasa/obat/barang untuk picker item template (abaikan stok — produk stok 0 tetap bisa dipilih)
  useEffect(() => {
    Promise.all([
      apiFetch<{ data: SvcOpt[] }>("/api/services?page=1&limit=100"),
      apiFetch<{ data: ProdOpt[] }>("/api/products?productType=medicine&page=1&limit=100"),
      apiFetch<{ data: ProdOpt[] }>("/api/products?productType=good&page=1&limit=100"),
    ])
      .then(([s, m, g]) => {
        setServices(s.data);
        setMedicines(m.data);
        setGoods(g.data);
      })
      .catch(console.error);
  }, []);

  // Server-side search (backend bisa punya >100 data, search client-side tidak cukup)
  const searchServices = async (q = "") => {
    const res = await apiFetch<{ data: SvcOpt[] }>(
      `/api/services?search=${encodeURIComponent(q)}&limit=100`
    );
    setServices(res.data);
  };
  const searchMedicines = async (q = "") => {
    const res = await apiFetch<{ data: ProdOpt[] }>(
      `/api/products?productType=medicine&search=${encodeURIComponent(q)}&limit=100`
    );
    setMedicines(res.data);
  };
  const searchGoods = async (q = "") => {
    const res = await apiFetch<{ data: ProdOpt[] }>(
      `/api/products?productType=good&search=${encodeURIComponent(q)}&limit=100`
    );
    setGoods(res.data);
  };

  const handleSearch = () => {
    setPage(1);
    fetchData(1, search);
  };

  const svcOpts = services.map((s) => ({ value: s._id, label: `${s.name} — ${fmt(s.price)}` }));
  const prodLabel = (p: ProdOpt) =>
    `${p.product?.name || "-"}${p.unit ? ` (${p.unit})` : ""} — stok ${p.inventory?.quantity ?? 0} — ${fmt(p.pricing?.selling ?? 0)}`;
  const medOpts = medicines.map((m) => ({ value: m._id, label: prodLabel(m) }));
  const goodOpts = goods.map((g) => ({ value: g._id, label: prodLabel(g) }));

  const svcName = (id: string) => services.find((s) => s._id === id)?.name || "";
  const medName = (id: string) => medicines.find((m) => m._id === id)?.product?.name || "";
  const goodName = (id: string) => goods.find((g) => g._id === id)?.product?.name || "";

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setTreatments([]);
    setPrescriptions([]);
    setGoodsLines([]);
    setModalOpen(true);
  };

  const openEdit = (t: DiagnosisTemplate) => {
    setEditing(t);
    form.setFieldsValue({ name: t.name });
    setTreatments((t.items.treatments || []).map((i, idx) => ({ ...i, _key: `t-${idx}` })));
    setPrescriptions((t.items.prescriptions || []).map((i, idx) => ({ ...i, _key: `p-${idx}` })));
    setGoodsLines((t.items.goods || []).map((i, idx) => ({ ...i, _key: `g-${idx}` })));
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const strip = (lines: TplLine[]) =>
        lines.filter((l) => l.productId).map(({ _key, ...rest }) => rest);
      const payload = {
        name: values.name,
        items: {
          treatments: strip(treatments),
          prescriptions: strip(prescriptions),
          goods: strip(goodsLines),
        },
      };
      if (editing) {
        await apiFetch(`/api/diagnosis-templates/${editing._id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        msg.success("List diagnosis diupdate");
      } else {
        await apiFetch("/api/diagnosis-templates", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        msg.success("List diagnosis dibuat");
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      if (err.message) msg.error(err.message);
    }
  };

  const handleDelete = (id: string) => {
    modal.confirm({
      title: "Hapus list diagnosis?",
      content: "Template ini tidak bisa dikembalikan.",
      onOk: async () => {
        try {
          await apiFetch(`/api/diagnosis-templates/${id}`, { method: "DELETE" });
          msg.success("List diagnosis dihapus");
          fetchData();
        } catch (err: any) {
          msg.error(err.message);
        }
      },
    });
  };

  const renderEditor = (
    lines: TplLine[],
    setLines: Dispatch<SetStateAction<TplLine[]>>,
    options: { value: string; label: string }[],
    getName: (id: string) => string,
    placeholder: string,
    prefix: string,
    showDosage = false,
    onSearch?: (q: string) => void
  ) => (
    <Space orientation="vertical" style={{ width: "100%" }}>
      {lines.map((line) => (
        <Row key={line._key} gutter={8} align="middle" wrap>
          <Col flex="auto">
            <Select
              showSearch
              style={{ width: "100%" }}
              placeholder={placeholder}
              value={line.productId || undefined}
              onSearch={onSearch}
              onFocus={onSearch ? () => onSearch("") : undefined}
              filterOption={
                onSearch
                  ? false
                  : (input, o) =>
                      ((o?.label as string) || "").toLowerCase().includes(input.toLowerCase())
              }
              options={options}
              onChange={(val) =>
                setLines(
                  lines.map((l) =>
                    l._key === line._key ? { ...l, productId: val, name: getName(val) } : l
                  )
                )
              }
            />
          </Col>
          <Col>
            <InputNumber
              min={1}
              value={line.quantity}
              onChange={(v) =>
                setLines(lines.map((l) => (l._key === line._key ? { ...l, quantity: v ?? 1 } : l)))
              }
              style={{ width: 60 }}
              placeholder="Jml"
            />
          </Col>
          {showDosage && (
            <Col>
              <Input
                placeholder="Dosis (mis. 1/2 tablet)"
                value={line.dosage}
                onChange={(e) =>
                  setLines(
                    lines.map((l) => (l._key === line._key ? { ...l, dosage: e.target.value } : l))
                  )
                }
                style={{ width: 150 }}
              />
            </Col>
          )}
          <Col>
            <Button
              size="small"
              danger
              icon={<Trash2 size={14} />}
              onClick={() => setLines(lines.filter((l) => l._key !== line._key))}
            />
          </Col>
        </Row>
      ))}
      <Button
        type="dashed"
        icon={<Plus size={14} />}
        block
        onClick={() => setLines([...lines, newLine(prefix, lines)])}
      >
        Tambah
      </Button>
    </Space>
  );

  const columns = [
    {
      title: "Nama Diagnosis",
      dataIndex: "name",
      key: "name",
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: "Jasa",
      key: "t",
      render: (_: any, r: DiagnosisTemplate) => (
        <Tag color="blue">{r.items?.treatments?.length || 0}</Tag>
      ),
    },
    {
      title: "Obat",
      key: "p",
      render: (_: any, r: DiagnosisTemplate) => (
        <Tag color="green">{r.items?.prescriptions?.length || 0}</Tag>
      ),
    },
    {
      title: "Barang",
      key: "g",
      render: (_: any, r: DiagnosisTemplate) => (
        <Tag color="orange">{r.items?.goods?.length || 0}</Tag>
      ),
    },
    {
      title: "Aksi",
      key: "action",
      render: (_: any, r: DiagnosisTemplate) => (
        <Space>
          <Button size="small" icon={<Edit size={14} />} onClick={() => openEdit(r)} />
          <Button
            size="small"
            danger
            icon={<Trash2 size={14} />}
            onClick={() => handleDelete(r._id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>List Diagnosis</Title>
      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col flex="auto">
            <Input.Search
              placeholder="Cari diagnosis..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onSearch={handleSearch}
              enterButton
            />
          </Col>
          <Col>
            <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>
              Tambah Diagnosis
            </Button>
          </Col>
        </Row>
        <Table
          dataSource={data}
          columns={columns}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 900 }}
          pagination={{
            current: page,
            total,
            pageSize: 10,
            onChange: (p) => {
              setPage(p);
              fetchData(p);
            },
          }}
        />
      </Card>

      <Modal
        title={editing ? "Edit List Diagnosis" : "Tambah List Diagnosis"}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={860}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Nama Diagnosis"
            rules={[{ required: true, message: "Wajib" }]}
          >
            <Input placeholder="Contoh: Dermatitis, Otitis, Vaksinasi..." />
          </Form.Item>
        </Form>

        <Card size="small" title="Template Jasa (Tindakan)" style={{ marginBottom: 12 }}>
          <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
            Diambil dari Master Tindakan. Produk stok 0 tetap bisa dipilih.
          </Text>
          {renderEditor(
            treatments,
            setTreatments,
            svcOpts,
            svcName,
            "Pilih jasa...",
            "t",
            false,
            searchServices
          )}
        </Card>

        <Card size="small" title="Template Obat (Resep)" style={{ marginBottom: 12 }}>
          <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
            Diambil dari Master Obat. Produk stok 0 tetap bisa dipilih.
          </Text>
          {renderEditor(
            prescriptions,
            setPrescriptions,
            medOpts,
            medName,
            "Pilih obat...",
            "p",
            true,
            searchMedicines
          )}
        </Card>

        <Card size="small" title="Template Barang">
          <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
            Diambil dari Master Barang. Produk stok 0 tetap bisa dipilih.
          </Text>
          {renderEditor(
            goodsLines,
            setGoodsLines,
            goodOpts,
            goodName,
            "Pilih barang...",
            "g",
            false,
            searchGoods
          )}
        </Card>
      </Modal>
    </div>
  );
}
