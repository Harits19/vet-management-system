"use client";

import { useEffect, useState } from "react";
import { Card, Form, Input, Select, Button, Row, Col, Typography, Space, Divider, Tag, Empty, Spin, Alert, AutoComplete } from "antd";
import { ArrowLeft, Save, Info } from "lucide-react";
import { apiFetch } from "../../../context/auth";
import { useAntdMessage } from "../../../hooks/useAntdMessage";
import { useRouter, useSearchParams } from "next/navigation";
import dayjs from "dayjs";
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
  createdAt?: string;
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
  const [goods, setGoods] = useState<any[]>([]);
  const [mastersLoading, setMastersLoading] = useState(true);

  const [treatments, setTreatments] = useState<TreatmentLine[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionLine[]>([]);
  const [goodsLines, setGoodsLines] = useState<TreatmentLine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [diagnosisOptions, setDiagnosisOptions] = useState<{ value: string }[]>([]);
  const [mhRecords, setMhRecords] = useState<any[]>([]);
  const [mhLoading, setMhLoading] = useState(false);

  const selectedDiagnosis = Form.useWatch("diagnosis", form);

  const loadDiagnoses = async (q = "") => {
    try {
      const res = await apiFetch<{ data: any[] }>(`/api/diagnosis-templates?search=${encodeURIComponent(q)}&limit=50`);
      setDiagnosisOptions(res.data.map((d) => ({ value: d.name, id: d._id })));
    } catch { /* ignore */ }
  };

  // Terapkan template list diagnosis. Item template sudah di-resolve backend
  // (nama & harga di-GET dari master by productId) — jadi tidak perlu join
  // ke master lokal yang bisa belum selesai load / terpotong limit.
  const applyTemplate = async (id?: string, name?: string) => {
    try {
      let tpl: any = null;
      if (id) {
        const res = await apiFetch<{ data: any }>(`/api/diagnosis-templates/${id}`);
        tpl = res.data;
      } else if (name) {
        const res = await apiFetch<{ data: any[] }>(`/api/diagnosis-templates?search=${encodeURIComponent(name)}&limit=10`);
        tpl = res.data.find((d) => d.name === name) || null;
      }
      if (!tpl) return;

      const tLines = (tpl.items?.treatments || []).map((ti: any) => ({
        productId: ti.productId, name: ti.name, quantity: ti.quantity, price: ti.price ?? 0, _key: `t-${Date.now()}-${Math.random()}`,
      }));
      const pLines = (tpl.items?.prescriptions || []).map((ti: any) => ({
        productId: ti.productId, name: ti.name, quantity: ti.quantity, price: ti.price ?? 0, dosage: ti.dosage || undefined, _key: `p-${Date.now()}-${Math.random()}`,
      }));
      const gLines = (tpl.items?.goods || []).map((ti: any) => ({
        productId: ti.productId, name: ti.name, quantity: ti.quantity, price: ti.price ?? 0, _key: `g-${Date.now()}-${Math.random()}`,
      }));

      setTreatments((prev) => [...prev, ...tLines]);
      setPrescriptions((prev) => [...prev, ...pLines]);
      setGoodsLines((prev) => [...prev, ...gLines]);

      if (tLines.length + pLines.length + gLines.length > 0) {
        msg.success(`Template "${tpl.name}" diterapkan: ${tLines.length} jasa, ${pLines.length} obat, ${gLines.length} barang.`);
      } else {
        msg.info(`Diagnosis "${tpl.name}" tidak punya template item.`);
      }
    } catch { /* ignore */ }
  };

  const loadMedicalHistory = async (petId: string) => {
    if (!petId) { setMhRecords([]); return; }
    setMhLoading(true);
    try {
      const res = await apiFetch<{ data: { records: any[] } }>(`/api/medical-histories/by-pet/${petId}`);
      setMhRecords(res.data.records || []);
    } catch { setMhRecords([]); } finally { setMhLoading(false); }
  };

  useEffect(() => {
    Promise.all([
      apiFetch<{ data: any[] }>("/api/customers?page=1&limit=100"),
      apiFetch<{ data: any[] }>("/api/services?limit=100"),
      apiFetch<{ data: any[] }>("/api/products?productType=medicine&limit=100"),
      apiFetch<{ data: any[] }>("/api/products?productType=good&limit=100"),
    ])
      .then(async ([c, s, m, g]) => {
        setCustomers(c.data);
        setServices(s.data);
        setMedicines(m.data);
        setGoods(g.data);

        const customerId = searchParams.get("customerId");
        const petId = searchParams.get("petId");
        if (customerId) {
          form.setFieldsValue({ customerId });
          await loadPets(customerId);
        }
        if (customerId && petId) {
          form.setFieldsValue({ petId });
          await loadPetDetail(petId);
          loadMedicalHistory(petId);
        }
      })
      .catch(console.error)
      .finally(() => setMastersLoading(false));
  }, []);

  const loadPets = async (customerId: string) => {
    const res = await apiFetch<{ data: PetOption[] }>(`/api/pets/by-customer/${customerId}`);
    setPets(res.data);
  };

  // Server-side search pemilik (backend punya >100 customer, search client-side tidak cukup)
  const searchCustomers = async (q = "") => {
    const res = await apiFetch<{ data: any[] }>(`/api/customers?search=${encodeURIComponent(q)}&limit=100`);
    setCustomers(res.data);
  };
  const searchServices = async (q = "") => {
    const res = await apiFetch<{ data: any[] }>(`/api/services?search=${encodeURIComponent(q)}&limit=100`);
    setServices(res.data);
  };
  const searchMedicines = async (q = "") => {
    const res = await apiFetch<{ data: any[] }>(`/api/products?productType=medicine&search=${encodeURIComponent(q)}&limit=100`);
    setMedicines(res.data);
  };
  const searchGoods = async (q = "") => {
    const res = await apiFetch<{ data: any[] }>(`/api/products?productType=good&search=${encodeURIComponent(q)}&limit=100`);
    setGoods(res.data);
  };

  const loadPetDetail = async (petId: string) => {
    setPetLoading(true);
    try {
      const res = await apiFetch<{ data: PetOption }>(`/api/pets/${petId}`);
      setSelectedPet(res.data);
      loadMedicalHistory(petId);
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
          objective: { physicalExam, labResult: values.labResult || undefined },
          assessment: { differentialDiagnosis: values.differentialDiagnosis, physicalExamNote: values.physicalExamNote || undefined },
          plan: {
            treatmentPlan: values.treatmentPlan,
            doctorNotes: values.doctorNotes || undefined,
            ownerNote: values.ownerNote || undefined,
            paramedicNote: values.paramedicNote || undefined,
          },
        },
        diagnosis: values.diagnosis,
        treatments: treatments
          .filter((t) => t.productId)
          .map((t) => ({ productId: t.productId, name: t.name, quantity: t.quantity, price: t.price, notes: t.notes })),
        prescriptions: prescriptions
          .filter((p) => p.productId || p.name)
          .map((p) => ({
            productId: p.productId,
            name: p.name,
            quantity: p.quantity,
            price: p.price,
            dosage: p.dosage,
            usage: p.usage,
            notes: p.notes,
            unit: p.unit,
            amount: p.amount,
            usageTime: p.usageTime,
            usageInstruction: p.usageInstruction,
            usageNote: p.usageNote,
            iter: p.iter,
          })),
        goods: goodsLines
          .filter((g) => g.productId)
          .map((g) => ({ productId: g.productId, name: g.name, quantity: g.quantity, price: g.price, notes: g.notes })),
      };

      const res = await apiFetch<{ data: any }>("/api/medical-histories", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const txn = res.data?.transaction;
      const txnError = res.data?.transactionError;
      const txnWarnings: string[] = res.data?.transactionWarnings ?? [];
      if (txnError) {
        // Rekam medis TETAP tersimpan walau transaksi gagal (mis. stok kurang)
        msg.warning(`Rekam medis tersimpan, tapi transaksi gagal dibuat: ${txnError}`);
      } else if (txnWarnings.length > 0) {
        // Stok habis: transaksi hanya menagih stok yang tersedia
        msg.warning(
          `${txn ? "Rekam medis & transaksi tersimpan." : "Rekam medis tersimpan, transaksi tidak dibuat."} ${txnWarnings.join("; ")}`
        );
      } else if (txn) {
        msg.success(`Rekam medis tersimpan. Transaksi ${txn.receiptNumber} dibuat (${txn.paymentStatus === "debt" ? "status: utang" : "lunas"}).`);
      } else {
        msg.success("Rekam medis tersimpan (tanpa transaksi — tidak ada tindakan/obat).");
      }
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
        <Title level={4} style={{ margin: 0 }}>Pasien Lama — Konsultasi</Title>
      </Space>

      <Spin spinning={mastersLoading}>
        <Form form={form} layout="vertical">
          <Card title="Data Pasien">
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="customerId" label="Pemilik" rules={[{ required: true, message: "Pilih pemilik" }]}>
                  <Select
                    showSearch
                    placeholder="Cari pemilik..."
                    onSearch={searchCustomers}
                    onFocus={() => searchCustomers()}
                    filterOption={false}
                    options={customers.map((c) => ({ value: c._id, label: c.name }))}
                    onChange={(val) => {
                      form.setFieldsValue({ petId: undefined });
                      setSelectedPet(null);
                      loadPets(val);
                    }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
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
                <Card size="small" title="Riwayat Rekam Medis" style={{ marginTop: 12 }} loading={mhLoading}>
                  {mhRecords.length === 0 ? (
                    <Text type="secondary">Belum ada riwayat medis</Text>
                  ) : (
                    <Space direction="vertical" style={{ width: "100%" }}>
                      {mhRecords.slice(0, 5).map((r: any) => (
                        <Row key={r._id} gutter={8} align="middle">
                          <Col span={4}><Text type="secondary">{dayjs(r.visitDate).format("DD/MM/YY")}</Text></Col>
                          <Col span={8}>
                            <Text ellipsis style={{ display: "block" }}>{r.diagnosis}</Text>
                            {r.complaint && (
                              <Text type="secondary" ellipsis style={{ display: "block", fontSize: 12 }}>
                                {r.complaint}
                              </Text>
                            )}
                          </Col>
                          <Col span={4}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {r.weight !== undefined || r.temperature !== undefined
                                ? `${r.weight ?? "-"} kg / ${r.temperature ?? "-"} °C`
                                : "-"}
                            </Text>
                          </Col>
                          <Col span={4}><Text type="secondary">{r.treatments?.length || 0} tnd, {r.prescriptions?.length || 0} rsp, {r.goods?.length || 0} brg</Text></Col>
                          <Col span={4} style={{ textAlign: "right" }}>
                            <Button size="small" onClick={() => router.push(`/dashboard/medical-histories/${r._id}`)}>
                              Detail
                            </Button>
                          </Col>
                        </Row>
                      ))}
                    </Space>
                  )}
                </Card>
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
              <Form.Item name="labResult" label="O — Hasil Pemeriksaan Laboratorium">
                <Input.TextArea rows={3} placeholder="Hasil lab darah, urin, dll (opsional)" />
              </Form.Item>
            </Card>

            <Card type="inner" title="A — Assessment (Diagnosis Banding)" style={{ marginTop: 12 }}>
              <Form.Item name="differentialDiagnosis" label="Diagnosis Banding" rules={[{ required: true, message: "Diagnosis banding wajib diisi" }]}>
                <Input.TextArea rows={3} placeholder="Kemungkinan diagnosis yang perlu dipertimbangkan..." />
              </Form.Item>
              <Form.Item name="physicalExamNote" label="A — Pemeriksaan Fisik (catatan)">
                <Input.TextArea rows={2} placeholder="Catatan pemeriksaan fisik lanjutan (opsional)" />
              </Form.Item>
            </Card>

            <Card type="inner" title="P — Plan (Rencana Penanganan)" style={{ marginTop: 12 }}>
              <Form.Item name="treatmentPlan" label="Rencana Penanganan" rules={[{ required: true, message: "Rencana penanganan wajib diisi" }]}>
                <Input.TextArea rows={3} placeholder="Rencana terapi / penanganan..." />
              </Form.Item>
              <Form.Item name="doctorNotes" label="Catatan Dokter">
                <Input.TextArea rows={2} placeholder="Catatan tambahan dokter (opsional)" />
              </Form.Item>
              <Form.Item name="ownerNote" label="P — Catatan Dokter Untuk Pemilik">
                <Input.TextArea rows={2} placeholder="Instruksi / pesan untuk pemilik hewan (opsional)" />
              </Form.Item>
              <Form.Item name="paramedicNote" label="P — Catatan Dokter Untuk Paramedis">
                <Input.TextArea rows={2} placeholder="Instruksi untuk paramedis / staff (opsional)" />
              </Form.Item>
            </Card>
          </Card>

          <Card title="Penegakan Diagnosis" style={{ marginTop: 16 }}>
            <Form.Item name="diagnosis" label="Diagnosis" rules={[{ required: true, message: "Diagnosis wajib diisi" }]}>
              <AutoComplete
                options={diagnosisOptions}
                onSearch={loadDiagnoses}
                onFocus={() => loadDiagnoses()}
                onSelect={(val, option) => applyTemplate((option as any)?.id, val)}
                placeholder="Ketik diagnosis baru atau pilih dari daftar... (template otomatis terisi bila ada)"
              />
            </Form.Item>
          </Card>
        </Form>

          {selectedDiagnosis ? (
            <>
              <Card title="Tindakan (Jasa)" style={{ marginTop: 16 }}>
                <Text type="secondary">Tindakan diambil dari Master Tindakan dan otomatis menjadi item jasa pada transaksi.</Text>
                <div style={{ marginTop: 12 }}>
                  <TreatmentEditor
                    items={treatments}
                    onChange={setTreatments}
                    options={services.map((s) => ({ _id: s._id, name: s.name, selling: s.price }))}
                    loading={mastersLoading}
                    onSearch={searchServices}
                  />
                </div>
              </Card>

              <Card title="Resep Obat" style={{ marginTop: 16 }}>
                <Text type="secondary">Obat diambil dari Master Obat dan otomatis menjadi item obat pada transaksi. Obat tidak ada di master? Ketik nama obat baru — tersimpan sebagai obat bebas tanpa harga & stok (tidak ditagihkan). Obat suntik: tuliskan di catatan resep.</Text>
                <div style={{ marginTop: 12 }}>
                  <PrescriptionEditor
                    items={prescriptions}
                    onChange={setPrescriptions}
                    options={medicines.map((m) => ({ _id: m._id, name: m.product?.name, selling: m.pricing?.selling }))}
                    loading={mastersLoading}
                    onSearch={searchMedicines}
                  />
                </div>
              </Card>

              <Card title="Barang (Non-Obat)" style={{ marginTop: 16 }}>
                <Text type="secondary">Barang diambil dari Master Barang dan otomatis menjadi item barang pada transaksi.</Text>
                <div style={{ marginTop: 12 }}>
                  <TreatmentEditor
                    items={goodsLines}
                    onChange={setGoodsLines}
                    options={goods.map((g) => ({ _id: g._id, name: g.product?.name, selling: g.pricing?.selling }))}
                    loading={mastersLoading}
                    onSearch={searchGoods}
                  />
                </div>
              </Card>
            </>
          ) : (
            <Alert style={{ marginTop: 16 }} type="info" showIcon message="Isi diagnosis terlebih dahulu untuk menambahkan tindakan (jasa), resep obat, dan barang. Konsultasi bisa gratis — simpan tanpa tindakan/obat." />
          )}

          <Divider />
          <Button type="primary" size="large" block icon={<Save size={16} />} loading={submitting} onClick={handleSubmit}>
            Simpan Rekam Medis & Buat Transaksi
          </Button>
        </Spin>
    </div>
  );
}
