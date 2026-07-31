"use client";

import { useEffect, useState } from "react";
import { Card, Form, Input, Select, Button, Row, Col, Typography, Space, Divider, Tag, Empty, Spin, Alert } from "antd";
import { ArrowLeft, Save, Info } from "lucide-react";
import { apiFetch } from "../../context/auth";
import { useAntdMessage } from "../../hooks/useAntdMessage";
import { useRouter, useSearchParams } from "next/navigation";
import { computePetAge } from "@vet/shared";
import PhysicalExamEditor from "../../components/PhysicalExamEditor";
import TreatmentEditor, { TreatmentLine } from "../../components/TreatmentEditor";
import PrescriptionEditor, { PrescriptionLine } from "../../components/PrescriptionEditor";

const { Title, Text } = Typography;

interface PetOption {
  _id: string;
  name: string;
  kind: string;
  breed?: string;
  birthDate?: string;
  initialAge?: { value: number; unit: "month" | "year" };
  customerId?: { _id: string; name: string };
}

export default function NewConsultationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form] = Form.useForm();
  const msg = useAntdMessage();

  const [customers, setCustomers] = useState<any[]>([]);
  const [pets, setPets] = useState<PetOption[]>([]);
  const [selectedPet, setSelectedPet] = useState<PetOption | null>(null);
  const [petLoading, setPetLoading] = useState(false);

  const [services, setServices] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [mastersLoading, setMastersLoading] = useState(true);

  const [treatments, setTreatments] = useState<TreatmentLine[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionLine[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch<{ data: any[] }>("/api/customers?page=1&limit=100"),
      apiFetch<{ data: any[] }>("/api/products/services?limit=100"),
      apiFetch<{ data: any[] }>("/api/products/physical?limit=100"),
    ])
      .then(async ([c, s, m]) => {
        setCustomers(c.data);
        setServices(s.data);
        setMedicines(m.data);

        const customerId = searchParams.get("customerId");
        const petId = searchParams.get("petId");
        if (customerId) {
          form.setFieldsValue({ customerId });
          await loadPets(customerId);
        }
        if (customerId && petId) {
          form.setFieldsValue({ petId });
          await loadPetDetail(petId);
        }
      })
      .catch(console.error)
      .finally(() => setMastersLoading(false));
  }, []);

  const loadPets = async (customerId: string) => {
    const res = await apiFetch<{ data: PetOption[] }>(`/api/pets/by-customer/${customerId}`);
    setPets(res.data);
  };

  const loadPetDetail = async (petId: string) => {
    setPetLoading(true);
    try {
      const res = await apiFetch<{ data: PetOption }>(`/api/pets/${petId}`);
      setSelectedPet(res.data);
    } catch (err: any) {
      msg.error(err.message);
    } finally {
      setPetLoading(false);
    }
  };

  const petAge = selectedPet ? computePetAge(selectedPet) : null;

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const physicalExam = (values.physicalExam || [])
        .map((i: any) => ({ key: i.key, label: i.label, unit: i.unit, value: i.value ?? undefined }))
        .filter((i: any) => i.value !== undefined);

      const payload = {
        petId: values.petId,
        visitDate: new Date().toISOString(),
        soap: {
          subjective: { complaint: values.complaint },
          objective: { physicalExam },
          assessment: { differentialDiagnosis: values.differentialDiagnosis },
          plan: {
            treatmentPlan: values.treatmentPlan,
            doctorNotes: values.doctorNotes || undefined,
          },
        },
        diagnosis: values.diagnosis,
        treatments: treatments
          .filter((t) => t.productId)
          .map((t) => ({ productId: t.productId, name: t.name, quantity: t.quantity, price: t.price, notes: t.notes })),
        prescriptions: prescriptions
          .filter((p) => p.productId)
          .map((p) => ({ productId: p.productId, name: p.name, quantity: p.quantity, price: p.price, dosage: p.dosage, usage: p.usage, notes: p.notes })),
      };

      const res = await apiFetch<{ data: any }>("/api/medical-histories", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const txn = res.data?.transaction;
      msg.success(
        txn
          ? `Rekam medis tersimpan. Transaksi ${txn.receiptNumber} dibuat (${txn.paymentStatus === "debt" ? "status: utang" : "lunas"}).`
          : "Rekam medis tersimpan (tanpa transaksi — tidak ada tindakan/obat)."
      );
      router.push(`/dashboard/medical-histories/${res.data._id}`);
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
        <Title level={4} style={{ margin: 0 }}>Form Konsultasi — Rekam Medis (SOAP)</Title>
      </Space>

      <Spin spinning={mastersLoading}>
        <Form form={form} layout="vertical">
          <Card title="Data Pasien">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="customerId" label="Pemilik" rules={[{ required: true, message: "Pilih pemilik" }]}>
                  <Select
                    showSearch
                    placeholder="Cari pemilik..."
                    filterOption={(input, o) => (o?.label as string || "").toLowerCase().includes(input.toLowerCase())}
                    options={customers.map((c) => ({ value: c._id, label: c.name }))}
                    onChange={(val) => {
                      form.setFieldsValue({ petId: undefined });
                      setSelectedPet(null);
                      loadPets(val);
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="petId" label="Pasien" rules={[{ required: true, message: "Pilih pasien" }]}>
                  <Select
                    showSearch
                    loading={petLoading}
                    placeholder="Pilih pasien..."
                    disabled={!form.getFieldValue("customerId")}
                    options={pets.map((p) => ({ value: p._id, label: `${p.name} (${p.kind})` }))}
                    onChange={(val) => loadPetDetail(val)}
                    notFoundContent={<Empty description="Belum ada pasien" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
                  />
                </Form.Item>
              </Col>
            </Row>

            {selectedPet && (
              <>
                <Space wrap style={{ marginTop: 8 }}>
                  <Tag color="blue">{selectedPet.name}</Tag>
                  <Tag>{selectedPet.kind}</Tag>
                  {selectedPet.breed && <Tag>{selectedPet.breed}</Tag>}
                  <Tag color="green">Umur: {petAge?.label || "-"} (otomatis)</Tag>
                </Space>
                <Alert
                  style={{ marginTop: 12 }}
                  type="info"
                  showIcon
                  icon={<Info size={14} />}
                  message={`Umur dihitung otomatis dari ${selectedPet.birthDate ? "tanggal lahir" : "umur awal"} pasien — tidak diinput pada konsultasi ini.`}
                />
              </>
            )}
          </Card>

          <Card title="SOAP — Anamnesa" style={{ marginTop: 16 }}>
            <Card type="inner" title="S — Subjective (Keluhan)">
              <Form.Item name="complaint" label="Keluhan" rules={[{ required: true, message: "Keluhan wajib diisi" }]}>
                <Input.TextArea rows={3} placeholder="Keluhan pemilik / gejala yang dialami hewan..." />
              </Form.Item>
            </Card>

            <Card type="inner" title="O — Objective (Pemeriksaan Fisik)" style={{ marginTop: 12 }}>
              <Form.Item name="physicalExam" initialValue={[]}>
                <PhysicalExamEditor />
              </Form.Item>
            </Card>

            <Card type="inner" title="A — Assessment (Diagnosis Banding)" style={{ marginTop: 12 }}>
              <Form.Item name="differentialDiagnosis" label="Diagnosis Banding" rules={[{ required: true, message: "Diagnosis banding wajib diisi" }]}>
                <Input.TextArea rows={3} placeholder="Kemungkinan diagnosis yang perlu dipertimbangkan..." />
              </Form.Item>
            </Card>

            <Card type="inner" title="P — Plan (Rencana Penanganan)" style={{ marginTop: 12 }}>
              <Form.Item name="treatmentPlan" label="Rencana Penanganan" rules={[{ required: true, message: "Rencana penanganan wajib diisi" }]}>
                <Input.TextArea rows={3} placeholder="Rencana terapi / penanganan..." />
              </Form.Item>
              <Form.Item name="doctorNotes" label="Catatan Dokter">
                <Input.TextArea rows={2} placeholder="Catatan tambahan dokter (opsional)" />
              </Form.Item>
            </Card>
          </Card>

          <Card title="Penegakan Diagnosis" style={{ marginTop: 16 }}>
            <Form.Item name="diagnosis" label="Diagnosis" rules={[{ required: true, message: "Diagnosis wajib diisi" }]}>
              <Input.TextArea rows={2} placeholder="Diagnosis final setelah penegakan..." />
            </Form.Item>
          </Card>
        </Form>

        <Card title="Tindakan (Jasa)" style={{ marginTop: 16 }}>
          <Text type="secondary">Tindakan diambil dari Master Tindakan dan otomatis menjadi item jasa pada transaksi.</Text>
          <div style={{ marginTop: 12 }}>
            <TreatmentEditor
              items={treatments}
              onChange={setTreatments}
              options={services.map((s) => ({ _id: s._id, name: s.product?.name, selling: s.pricing?.selling }))}
              loading={mastersLoading}
            />
          </div>
        </Card>

        <Card title="Resep Obat" style={{ marginTop: 16 }}>
          <Text type="secondary">Obat diambil dari Master Obat dan otomatis menjadi item obat pada transaksi.</Text>
          <div style={{ marginTop: 12 }}>
            <PrescriptionEditor
              items={prescriptions}
              onChange={setPrescriptions}
              options={medicines.map((m) => ({ _id: m._id, name: m.product?.name, selling: m.pricing?.selling }))}
              loading={mastersLoading}
            />
          </div>
        </Card>

        <Divider />
        <Button type="primary" size="large" block icon={<Save size={16} />} loading={submitting} onClick={handleSubmit}>
          Simpan Rekam Medis & Buat Transaksi
        </Button>
      </Spin>
    </div>
  );
}
