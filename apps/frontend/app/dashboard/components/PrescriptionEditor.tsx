"use client";

import {
  Row,
  Col,
  Select,
  InputNumber,
  Input,
  Button,
  Typography,
  Empty,
  Space,
  Tag,
  theme as antdTheme,
} from "antd";
import { Plus, Trash2 } from "lucide-react";

const { Text } = Typography;

export interface PrescriptionLine {
  productId: string; // kosong = obat bebas (diketik manual, tanpa harga & stok)
  name: string;
  quantity: number; // Qty billing (dipakai transaksi)
  price: number; // Harga (0 utk obat bebas)
  dosage?: string; // Dosis
  usage?: string; // Aturan Pakai
  notes?: string; // Catatan
  unit?: string; // Satuan (dropdown)
  amount?: number; // Jumlah obat (bisa desimal, mis. 0.5)
  usageTime?: string; // Waktu penggunaan (mis. "2 dd 1")
  usageInstruction?: string; // Instruksi penggunaan (mis. "tab", "cth")
  usageNote?: string; // Catatan penggunaan
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
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

// Nilai awal dropdown (distinct — user bisa menambah nilai baru lewat input)
const UNIT_SEEDS = [
  "Unit",
  "Tablet",
  "Kaplet",
  "Kapsul",
  "Sirup",
  "Botol",
  "Tube",
  "Salep",
  "Tetes",
  "Ampul",
  "Vial",
  "Sachet",
  "Pcs",
  "Strip",
  "ml",
  "mg",
  "g",
  "kg",
  "cc",
  "caps",
];
const USAGE_TIME_SEEDS = ["1 dd 1", "2 dd 1", "3 dd 1", "4 dd 1", "1 dd 1/2"];
const USAGE_INSTRUCTION_SEEDS = ["tab", "cab", "cth", "ue", "gtt", "I.M.M", "suc", "c"];

// Dropdown dengan nilai distinct: opsi = seed + semua nilai yang pernah dipakai
// di baris lain; nilai baru hasil ketikan user otomatis ikut masuk opsi.
function DistinctTagSelect({
  value,
  options,
  placeholder,
  onChange,
}: {
  value?: string;
  options: string[];
  placeholder: string;
  onChange: (v?: string) => void;
}) {
  return (
    <Select
      mode="tags"
      style={{ width: "100%" }}
      placeholder={placeholder}
      value={value ? [value] : []}
      options={options.map((o) => ({ value: o, label: o }))}
      onChange={(vals: string[]) => onChange(vals.length ? vals[vals.length - 1] : undefined)}
    />
  );
}

// ──────────────────────────────────────────
// Editor Resep Obat — multiple item dari Master Obat.
// Obat bisa diketik manual (tidak ada di master) → otomatis jadi obat bebas
// tanpa harga & stok (tidak dibuatkan item transaksi).
// ──────────────────────────────────────────
export default function PrescriptionEditor({
  items,
  onChange,
  options,
  loading,
  onSearch,
}: PrescriptionEditorProps) {
  const { token } = antdTheme.useToken();
  const addLine = () => {
    onChange([
      ...items,
      { productId: "", name: "", quantity: 1, price: 0, _key: `p-${Date.now()}-${items.length}` },
    ]);
  };

  const updateLine = (key: string, patch: Partial<PrescriptionLine>) => {
    onChange(items.map((i) => (i._key === key ? { ...i, ...patch } : i)));
  };

  const removeLine = (key: string) => {
    onChange(items.filter((i) => i._key !== key));
  };

  // Kumpulkan nilai distinct dari semua baris utk opsi dropdown
  const distinctValues = (pick: (l: PrescriptionLine) => string | undefined) => {
    const set = new Set<string>();
    for (const l of items) {
      const v = pick(l);
      if (v && v.trim()) set.add(v.trim());
    }
    return Array.from(set);
  };
  const unitOptions = Array.from(new Set([...UNIT_SEEDS, ...distinctValues((l) => l.unit)]));
  const usageTimeOptions = Array.from(
    new Set([...USAGE_TIME_SEEDS, ...distinctValues((l) => l.usageTime)])
  );
  const usageInstructionOptions = Array.from(
    new Set([...USAGE_INSTRUCTION_SEEDS, ...distinctValues((l) => l.usageInstruction)])
  );
  const usageNoteOptions = distinctValues((l) => l.usageNote);

  return (
    <Space orientation="vertical" style={{ width: "100%" }}>
      {items.map((line) => {
        // Pastikan opsi obat yang sedang dipilih tetap tampil (label dari line.name)
        // walau sedang tidak ada di daftar hasil pencarian.
        const drugOptions = options.map((o) => ({
          value: o._id,
          label: `${o.name} - ${formatPrice(o.selling)}`,
        }));
        if (line.productId && !options.some((o) => o._id === line.productId) && line.name) {
          drugOptions.push({
            value: line.productId,
            label: `${line.name} - ${formatPrice(line.price)}`,
          });
        }

        return (
          <Space
            key={line._key}
            orientation="vertical"
            style={{
              width: "100%",
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: 8,
              padding: 8,
            }}
          >
            <Row gutter={8} align="middle">
              <Col flex="none">
                <Text strong style={{ lineHeight: "32px" }}>
                  R/
                </Text>
              </Col>
              <Col flex="auto">
                <Select
                  mode="tags"
                  showSearch
                  style={{ width: "100%" }}
                  placeholder="Pilih obat dari master, atau ketik nama obat baru..."
                  value={line.productId ? [line.productId] : line.name ? [line.name] : []}
                  onSearch={onSearch}
                  onFocus={onSearch ? () => onSearch("") : undefined}
                  filterOption={
                    onSearch
                      ? false
                      : (input, o) =>
                          ((o?.label as string) || "").toLowerCase().includes(input.toLowerCase())
                  }
                  options={drugOptions}
                  loading={loading}
                  onChange={(vals: string[]) => {
                    const val = vals.length ? vals[vals.length - 1] : "";
                    const opt = options.find((o) => o._id === val);
                    if (opt) {
                      // Dipilih dari master → isi nama & harga
                      updateLine(line._key, {
                        productId: val,
                        name: opt.name,
                        price: opt.selling ?? 0,
                      });
                    } else {
                      // Diketik manual → obat bebas (tanpa harga & stok)
                      updateLine(line._key, { productId: "", name: val, price: 0 });
                    }
                  }}
                />
              </Col>
              <Col>
                <InputNumber
                  min={1}
                  value={line.quantity}
                  onChange={(v) => updateLine(line._key, { quantity: v ?? 1 })}
                  style={{ width: 60 }}
                  placeholder="Qty"
                />
              </Col>
              <Col>
                <Button
                  size="small"
                  danger
                  icon={<Trash2 size={14} />}
                  onClick={() => removeLine(line._key)}
                />
              </Col>
            </Row>
            <Row gutter={8}>
              <Col xs={24} sm={12}>
                <DistinctTagSelect
                  value={line.unit}
                  options={unitOptions}
                  placeholder="Satuan (mis. Unit, ml)"
                  onChange={(v) => updateLine(line._key, { unit: v })}
                />
              </Col>
              <Col xs={24} sm={12}>
                <InputNumber
                  min={0}
                  step={0.5}
                  precision={2}
                  style={{ width: "100%" }}
                  placeholder="Jumlah (mis. 0.5)"
                  value={line.amount}
                  onChange={(v) => updateLine(line._key, { amount: v ?? undefined })}
                />
              </Col>
            </Row>
            <Row gutter={8} align="middle">
              <Col flex="none">
                <Text strong style={{ lineHeight: "32px" }}>
                  s
                </Text>
              </Col>
              <Col xs={24} sm={7}>
                <DistinctTagSelect
                  value={line.usageTime}
                  options={usageTimeOptions}
                  placeholder="Waktu Penggunaan (mis. 2 dd 1)"
                  onChange={(v) => updateLine(line._key, { usageTime: v })}
                />
              </Col>
              <Col xs={24} sm={8}>
                <DistinctTagSelect
                  value={line.usageInstruction}
                  options={usageInstructionOptions}
                  placeholder="Instruksi (mis. tab, cth)"
                  onChange={(v) => updateLine(line._key, { usageInstruction: v })}
                />
              </Col>
              <Col xs={24} sm={8}>
                <DistinctTagSelect
                  value={line.usageNote}
                  options={usageNoteOptions}
                  placeholder="Catatan Penggunaan (mis. setelah makan)"
                  onChange={(v) => updateLine(line._key, { usageNote: v })}
                />
              </Col>
            </Row>
            <Row gutter={8}>
              <Col xs={24} sm={8}>
                <Input
                  placeholder="Dosis (mis. 1/2 tablet)"
                  value={line.dosage}
                  onChange={(e) => updateLine(line._key, { dosage: e.target.value })}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Input
                  placeholder="Aturan Pakai (mis. 2x sehari)"
                  value={line.usage}
                  onChange={(e) => updateLine(line._key, { usage: e.target.value })}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Input
                  placeholder="Catatan"
                  value={line.notes}
                  onChange={(e) => updateLine(line._key, { notes: e.target.value })}
                />
              </Col>
            </Row>
            <Row>
              <Col>
                <Text strong>
                  Harga: {formatPrice(line.price)} / Subtotal:{" "}
                  {formatPrice(line.price * line.quantity)}
                </Text>
              </Col>
            </Row>
          </Space>
        );
      })}
      {items.length === 0 && (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Belum ada obat">
          <Button type="dashed" icon={<Plus size={14} />} onClick={addLine}>
            Tambah Obat
          </Button>
        </Empty>
      )}
      {items.length > 0 && (
        <Button type="dashed" icon={<Plus size={14} />} onClick={addLine} block>
          Tambah Obat
        </Button>
      )}
    </Space>
  );
}

export function PrescriptionTag({ count }: { count: number }) {
  return count > 0 ? <Tag color="green">{count} obat</Tag> : null;
}
