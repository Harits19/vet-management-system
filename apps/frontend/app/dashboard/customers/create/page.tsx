"use client";

import React from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Space,
  Select,
  Typography,
  Divider,
  message,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import VetForm from "@/components/VetForm";
import { petCreateSchema } from "../../../../../shared/types/pet.type";
import { customerCreateSchema } from "../../../../../shared/types/customer.type";
import { useCreateCustomer } from "@/api/customer.api";
import useVetRouter from "@/hooks/useVetRouter";

const createFormSchema = customerCreateSchema.extend({
  pets: z.array(petCreateSchema).optional(),
});

type CreateFormValues = z.infer<typeof createFormSchema>;

const { Title, Text } = Typography;

export default function Page() {
  const { control, handleSubmit, reset } = useForm<CreateFormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      name: "",
      whatsapp: "",
      address: "",
      pets: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "pets",
  });

  const { mutate, loading } = useCreateCustomer();
  const router = useVetRouter();

  const onFinish = (values: CreateFormValues) => {
    mutate({
      body: values,
      onSuccess: () => {
        router.push("/dashboard/customers");
      },
    });
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px" }}>
      <header style={{ marginBottom: 32 }}>
        <Title level={2}>
          <UserAddOutlined /> Registrasi Customer Baru
        </Title>
        <Text type="secondary">
          {loading ? "Loading" : "Loaded"}
          Lengkapi formulir di bawah untuk mendaftarkan pemilik hewan beserta
          peliharaannya ke dalam sistem.
        </Text>
      </header>

      <Form layout="vertical" onFinish={handleSubmit(onFinish)}>
        {/* SECTION: DATA CUSTOMER */}
        <Card
          title="Informasi Pemilik (Customer)"
          style={{ marginBottom: 24 }}
          variant="outlined"
        >
          <Row gutter={16}>
            <Col span={24} md={12}>
              <VetForm control={control} name="name" label="Nama Lengkap">
                {(field) => (
                  <Input {...field} placeholder="Nama lengkap pemilik" />
                )}
              </VetForm>
            </Col>
            <Col span={24} md={12}>
              <VetForm
                control={control}
                name="whatsapp"
                label="Nomor WhatsApp (Optional)"
              >
                {(field) => (
                  <Input {...field} placeholder="Contoh: 08123456789" />
                )}
              </VetForm>
            </Col>
            <Col span={24}>
              <VetForm
                control={control}
                name="address"
                label="Alamat (Optional)"
              >
                {(field) => (
                  <Input.TextArea
                    {...field}
                    rows={2}
                    placeholder="Alamat lengkap customer"
                  />
                )}
              </VetForm>
            </Col>
          </Row>
        </Card>

        {/* SECTION: DATA PETS */}
        <Card title="Daftar Hewan Peliharaan (Pets)" variant="outlined">
          {fields.map((field, index) => (
            <div key={field.id}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <Title level={5} style={{ margin: 0 }}>
                  Hewan #{index + 1}
                </Title>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => remove(index)}
                >
                  Hapus Hewan
                </Button>
              </div>

              <Row gutter={16}>
                <Col span={24} md={8}>
                  <VetForm
                    control={control}
                    name={`pets.${index}.name`}
                    label="Nama Pet"
                  >
                    {(f) => <Input {...f} placeholder="Nama hewan" />}
                  </VetForm>
                </Col>
                <Col span={24} md={8}>
                  <VetForm
                    control={control}
                    name={`pets.${index}.kind`}
                    label="Jenis / Spesies"
                  >
                    {(f) => (
                      <Input {...f} placeholder="Contoh: Kucing, Anjing" />
                    )}
                  </VetForm>
                </Col>
                <Col span={24} md={8}>
                  <VetForm
                    control={control}
                    name={`pets.${index}.gender`}
                    label="Jenis Kelamin"
                  >
                    {(f) => (
                      <Select {...f} placeholder="Pilih">
                        <Select.Option value="male">Jantan</Select.Option>
                        <Select.Option value="female">Betina</Select.Option>
                      </Select>
                    )}
                  </VetForm>
                </Col>
                <Col span={24}>
                  <VetForm
                    control={control}
                    name={`pets.${index}.notes`}
                    label="Catatan Tambahan (Optional)"
                  >
                    {(f) => (
                      <Input.TextArea
                        {...f}
                        placeholder="Keterangan tambahan"
                      />
                    )}
                  </VetForm>
                </Col>
              </Row>
              {index < fields.length - 1 && <Divider />}
            </div>
          ))}
          <Button
            type="dashed"
            onClick={() =>
              append({ name: "", kind: "", gender: "male", notes: "" })
            }
            block
            icon={<PlusOutlined />}
            style={{ height: "45px", marginTop: fields.length > 0 ? 16 : 0 }}
          >
            Tambah Hewan
          </Button>
        </Card>

        <Form.Item style={{ marginTop: 32, textAlign: "right" }}>
          <Space size="middle">
            <Button size="large" onClick={() => reset()}>
              Reset
            </Button>
            <Button
              loading={loading}
              type="primary"
              htmlType="submit"
              size="large"
            >
              Simpan Customer & Pet
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
}
