"use client";

import { Row, Col, Select, InputNumber, Input, Button, Typography, Empty, Space, Tag } from "antd";
import { Plus, Trash2 } from "lucide-react";

const { Text } = Typography;

export interface TreatmentLine {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  _key: string;
}

interface TreatmentEditorProps {
  items: TreatmentLine[];
  onChange: (items: TreatmentLine[]) => void;
  options: { _id: string; name: string; selling: number }[];
  loading?: boolean;
  onSearch?: (q: string) => void; // server-side search (opsional)
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

// ──────────────────────────────────────────
// Editor Tindakan (jasa dokter) — multiple item dari Master Tindakan
// ──────────────────────────────────────────
export default function TreatmentEditor({ items, onChange, options, loading, onSearch }: TreatmentEditorProps) {
  const addLine = () => {
    onChange([...items, { productId: "", name: "", quantity: 1, price: 0, _key: `t-${Date.now()}-${items.length}` }]);
  };

  const updateLine = (key: string, patch: Partial<TreatmentLine>) => {
    onChange(items.map((i) => (i._key === key ? { ...i, ...patch } : i)));
  };

  const removeLine = (key: string) => {
    onChange(items.filter((i) => i._key !== key));
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      {items.map((line) => (
        <Row key={line._key} gutter={8} align="middle" wrap>
          <Col flex="auto">
      <Select
        showSearch
        style={{ width: "100%" }}
        placeholder="Pilih tindakan..."
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
            <InputNumber min={0} value={line.price} onChange={(v) => updateLine(line._key, { price: v ?? 0 })} style={{ width: 110 }} addonBefore="Rp" />
          </Col>
          <Col>
            <Input
              placeholder="Catatan (opsional)"
              value={line.notes}
              onChange={(e) => updateLine(line._key, { notes: e.target.value })}
              style={{ width: 160 }}
            />
          </Col>
          <Col>
            <Text strong>{formatPrice(line.price * line.quantity)}</Text>
          </Col>
          <Col>
            <Button size="small" danger icon={<Trash2 size={14} />} onClick={() => removeLine(line._key)} />
          </Col>
        </Row>
      ))}
      {items.length === 0 && (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Belum ada tindakan">
          <Button type="dashed" icon={<Plus size={14} />} onClick={addLine}>Tambah Tindakan</Button>
        </Empty>
      )}
      {items.length > 0 && (
        <Button type="dashed" icon={<Plus size={14} />} onClick={addLine} block>Tambah Tindakan</Button>
      )}
    </Space>
  );
}

export function TreatmentTag({ count }: { count: number }) {
  return count > 0 ? <Tag color="blue">{count} tindakan</Tag> : null;
}
