"use client";

import { Row, Col, Select, InputNumber, Input, Button, Typography, Empty, Space, Tag } from "antd";
import { Plus, Trash2 } from "lucide-react";

const { Text } = Typography;

export interface PrescriptionLine {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  dosage?: string;
  usage?: string;
  notes?: string;
  _key: string;
}

interface PrescriptionEditorProps {
  items: PrescriptionLine[];
  onChange: (items: PrescriptionLine[]) => void;
  options: { _id: string; name: string; selling: number }[];
  loading?: boolean;
  onSearch?: (q: string) => void; // server-side search (opsional)
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

// ──────────────────────────────────────────
// Editor Resep Obat — multiple item dari Master Obat
// ──────────────────────────────────────────
export default function PrescriptionEditor({ items, onChange, options, loading, onSearch }: PrescriptionEditorProps) {
  const addLine = () => {
    onChange([...items, { productId: "", name: "", quantity: 1, price: 0, _key: `p-${Date.now()}-${items.length}` }]);
  };

  const updateLine = (key: string, patch: Partial<PrescriptionLine>) => {
    onChange(items.map((i) => (i._key === key ? { ...i, ...patch } : i)));
  };

  const removeLine = (key: string) => {
    onChange(items.filter((i) => i._key !== key));
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      {items.map((line) => (
        <Space key={line._key} direction="vertical" style={{ width: "100%", border: "1px solid #f0f0f0", borderRadius: 8, padding: 8 }}>
          <Row gutter={8} align="middle">
            <Col flex="auto">
              <Select
                showSearch
                style={{ width: "100%" }}
                placeholder="Pilih obat..."
                value={line.productId || undefined}
                onSearch={onSearch}
                onFocus={onSearch ? () => onSearch("") : undefined}
                filterOption={onSearch ? false : (input, o) => (o?.label as string || "").toLowerCase().includes(input.toLowerCase())}
                options={options.map((o) => ({ value: o._id, label: `${o.name} - ${formatPrice(o.selling)}` }))}
                loading={loading}
                onChange={(val) => {
                  const opt = options.find((o) => o._id === val);
                  updateLine(line._key, { productId: val, name: opt?.name || "", price: opt?.selling ?? 0 });
                }}
              />
            </Col>
            <Col>
              <InputNumber min={1} value={line.quantity} onChange={(v) => updateLine(line._key, { quantity: v ?? 1 })} style={{ width: 60 }} placeholder="Jml" />
            </Col>
            <Col>
              <Button size="small" danger icon={<Trash2 size={14} />} onClick={() => removeLine(line._key)} />
            </Col>
          </Row>
          <Row gutter={8}>
            <Col span={8}>
              <Input placeholder="Dosis (mis. 1/2 tablet)" value={line.dosage} onChange={(e) => updateLine(line._key, { dosage: e.target.value })} />
            </Col>
            <Col span={8}>
              <Input placeholder="Aturan Pakai (mis. 2x sehari)" value={line.usage} onChange={(e) => updateLine(line._key, { usage: e.target.value })} />
            </Col>
            <Col span={8}>
              <Input placeholder="Catatan" value={line.notes} onChange={(e) => updateLine(line._key, { notes: e.target.value })} />
            </Col>
          </Row>
          <Row>
            <Col>
              <Text strong>Harga: {formatPrice(line.price)} / Subtotal: {formatPrice(line.price * line.quantity)}</Text>
            </Col>
          </Row>
        </Space>
      ))}
      {items.length === 0 && (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Belum ada obat">
          <Button type="dashed" icon={<Plus size={14} />} onClick={addLine}>Tambah Obat</Button>
        </Empty>
      )}
      {items.length > 0 && (
        <Button type="dashed" icon={<Plus size={14} />} onClick={addLine} block>Tambah Obat</Button>
      )}
    </Space>
  );
}

export function PrescriptionTag({ count }: { count: number }) {
  return count > 0 ? <Tag color="green">{count} obat</Tag> : null;
}
