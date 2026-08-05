"use client";

import { useEffect, useState } from "react";
import { Card, Form, Select, Input, DatePicker, Typography, Space, Button, Alert } from "antd";
import { ArrowLeft, Save } from "lucide-react";
import { apiFetch, useAuth } from "../../../context/auth";
import { useAntdMessage } from "../../../hooks/useAntdMessage";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import SignaturePad from "../../components/SignaturePad";
import { LETTER_TYPE_OPTIONS, LETTER_TYPE_META } from "../constants";

const { Title, Text } = Typography;

interface PetOpt {
  _id: string;
  name: string;
  kind?: string;
  breed?: string;
  customerId?: { _id: string; name: string; whatsapp?: string };
}

export default function CreateLetterPage() {
  const router = useRouter();
  const msg = useAntdMessage();
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [pets, setPets] = useState<PetOpt[]>([]);
  const [signature, setSignature] = useState<string | null>(null);
  const [doctorSignature, setDoctorSignature] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const letterType = Form.useWatch("letterType", form);
  const petId = Form.useWatch("petId", form);
  const meta = LETTER_TYPE_META[letterType];

  const searchPets = async (q = "") => {
    const res = await apiFetch<{ data: PetOpt[] }>(`/api/pets?search=${encodeURIComponent(q)}&limit=100`);
    setPets(res.data);
  };

  useEffect(() => { searchPets(); }, []);

  // Auto-fill nama penandatangan dari pemilik pasien
  const selectedPet = pets.find((p) => p._id === petId);
  useEffect(() => {
    if (selectedPet?.customerId?.name) {
      form.setFieldValue("ownerSignedName", selectedPet.customerId.name);
    }
  }, [petId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-fill nama dokter penandatangan dari user yang login
  useEffect(() => {
    if (user?.name) form.setFieldValue("doctorSignedName", user.name);
  }, [user?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    if (!signature) { msg.warning("Pemilik harus menandatangani dulu"); return; }
    if (!doctorSignature) { msg.warning("Dokter harus menandatangani dulu"); return; }
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const res = await apiFetch<{ data: { _id: string } }>("/api/letters", {
        method: "POST",
        body: JSON.stringify({
          letterType: values.letterType,
          petId: values.petId,
          date: values.date.toISOString(),
          subject: values.subject || undefined,
          notes: values.notes || undefined,
          ownerSignedName: values.ownerSignedName || undefined,
          ownerSignature: signature,
          doctorSignedName: values.doctorSignedName || undefined,
          doctorSignature: doctorSignature,
        }),
      });
      msg.success("Surat dibuat");
      router.push(`/dashboard/letters/${res.data._id}`);
    } catch (err: any) {
      if (err.message) msg.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeft size={16} />} onClick={() => router.back()}>Kembali</Button>
        <Title level={4} style={{ margin: 0 }}>Buat Surat</Title>
      </Space>

      <Card style={{ maxWidth: 720 }}>
        <Form form={form} layout="vertical">
          <Form.Item name="letterType" label="Jenis Surat" rules={[{ required: true, message: "Pilih jenis surat" }]}>
            <Select placeholder="Pilih jenis surat" options={LETTER_TYPE_OPTIONS} />
          </Form.Item>

          <Form.Item name="petId" label="Pasien" rules={[{ required: true, message: "Pilih pasien" }]}>
            <Select
              showSearch
              placeholder="Cari pasien..."
              onSearch={searchPets}
              onFocus={() => searchPets()}
              filterOption={false}
              options={pets.map((p) => ({ value: p._id, label: `${p.name}${p.kind ? ` (${p.kind})` : ""}` }))}
            />
          </Form.Item>

          {selectedPet?.customerId && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message={`Pemilik: ${selectedPet.customerId.name}${selectedPet.customerId.whatsapp ? ` (${selectedPet.customerId.whatsapp})` : ""}`}
            />
          )}

          <Form.Item name="date" label="Tanggal Surat" rules={[{ required: true, message: "Pilih tanggal" }]} initialValue={dayjs()}>
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="subject" label={meta?.subjectLabel ?? "Perihal"}>
            <Input placeholder={meta?.subjectLabel ?? "Isi perihal surat"} />
          </Form.Item>

          <Form.Item name="notes" label="Catatan / Keterangan">
            <Input.TextArea rows={3} placeholder="Catatan tambahan, risiko, biaya, dll (opsional)" />
          </Form.Item>

          <Form.Item label="Tanda Tangan Pemilik" required>
            <SignaturePad onChange={(d) => setSignature(d)} />
            <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
              Pemilik / penanggung jawab menandatangani di atas (mouse / jari).
            </Text>
          </Form.Item>

          <Form.Item name="ownerSignedName" label="Nama Penandatangan" rules={[{ required: true, message: "Nama penandatangan wajib" }]}>
            <Input placeholder="Nama pemilik yang menandatangani" />
          </Form.Item>

          <Form.Item label="Tanda Tangan Dokter" required style={{ marginTop: 24 }}>
            <SignaturePad onChange={(d) => setDoctorSignature(d)} />
            <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
              Dokter yang membuat surat menandatangani di atas (mouse / jari).
            </Text>
          </Form.Item>

          <Form.Item name="doctorSignedName" label="Nama Dokter" rules={[{ required: true, message: "Nama dokter wajib" }]}>
            <Input placeholder="Nama dokter yang menandatangani" />
          </Form.Item>

          <Button type="primary" icon={<Save size={16} />} loading={submitting} onClick={handleSubmit}>
            Simpan Surat
          </Button>
        </Form>
      </Card>
    </div>
  );
}
