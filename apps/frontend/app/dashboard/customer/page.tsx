'use client';

import React from 'react';
import { Form, Input, Button, Card, Space, Select, Typography, Divider, message, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined, UserAddOutlined } from '@ant-design/icons';

/**
 * Referensi Interface yang digunakan:
 * ICustomer: name, whatsapp?, address?
 * IPet: name, kind, gender, notes?, ownerId
 */

const { Title, Text } = Typography;

export default function Page(){
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    // Values akan berisi data customer dan array pets
    console.log('Payload data untuk dikirim ke API:', values);
    
    // Contoh simulasi sukses
    message.success('Data Customer dan Pet berhasil disimpan!');
    form.resetFields();
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>
      <header style={{ marginBottom: 32 }}>
        <Title level={2}>
          <UserAddOutlined /> Registrasi Customer Baru
        </Title>
        <Text type="secondary">
          Lengkapi formulir di bawah untuk mendaftarkan pemilik hewan beserta peliharaannya ke dalam sistem.
        </Text>
      </header>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ pets: [{}] }} // Inisialisasi dengan 1 form pet kosong
        scrollToFirstError
      >
        {/* SECTION: DATA CUSTOMER */}
        <Card title="Informasi Pemilik (Customer)" style={{ marginBottom: 24 }} variant="outlined">
          <Row gutter={16}>
            <Col span={24} md={12}>
              <Form.Item
                name="name"
                label="Nama Lengkap"
                rules={[{ required: true, message: 'Nama customer wajib diisi' }]}
              >
                <Input placeholder="Nama lengkap pemilik" />
              </Form.Item>
            </Col>
            <Col span={24} md={12}>
              <Form.Item
                name="whatsapp"
                label="Nomor WhatsApp (Optional)"
                rules={[{ pattern: /^\d+$/, message: 'Hanya masukkan karakter angka' }]}
              >
                <Input placeholder="Contoh: 08123456789" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="address"
                label="Alamat (Optional)"
              >
                <Input.TextArea rows={2} placeholder="Alamat lengkap customer" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* SECTION: DATA PETS */}
        <Card title="Daftar Hewan Peliharaan (Pets)" variant="outlined">
          <Form.List name="pets">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <Title level={5} style={{ margin: 0 }}>Hewan #{index + 1}</Title>
                      {fields.length > 1 && (
                        <Button 
                          type="text" 
                          danger 
                          icon={<DeleteOutlined />} 
                          onClick={() => remove(name)}
                        >
                          Hapus Hewan
                        </Button>
                      )}
                    </div>
                    
                    <Row gutter={16}>
                      <Col span={24} md={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'name']}
                          label="Nama Pet"
                          rules={[{ required: true, message: 'Nama pet wajib diisi' }]}
                        >
                          <Input placeholder="Nama hewan" />
                        </Form.Item>
                      </Col>
                      <Col span={24} md={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'kind']}
                          label="Jenis / Spesies"
                          rules={[{ required: true, message: 'Jenis hewan wajib diisi' }]}
                        >
                          <Input placeholder="Contoh: Kucing, Anjing" />
                        </Form.Item>
                      </Col>
                      <Col span={24} md={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'gender']}
                          label="Jenis Kelamin"
                          rules={[{ required: true, message: 'Pilih jenis kelamin' }]}
                        >
                          <Select placeholder="Pilih">
                            <Select.Option value="male">Jantan</Select.Option>
                            <Select.Option value="female">Betina</Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item {...restField} name={[name, 'notes']} label="Catatan Tambahan (Optional)">
                          <Input.TextArea placeholder="Keterangan tambahan atau riwayat singkat" />
                        </Form.Item>
                      </Col>
                    </Row>
                    {index < fields.length - 1 && <Divider />}
                  </div>
                ))}
                <Form.Item>
                  <Button 
                    type="dashed" 
                    onClick={() => add()} 
                    block 
                    icon={<PlusOutlined />}
                    style={{ height: '45px' }}
                  >
                    Tambah Hewan Lainnya
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Card>

        <Form.Item style={{ marginTop: 32, textAlign: 'right' }}>
          <Space size="middle">
            <Button size="large" onClick={() => form.resetFields()}>
              Reset
            </Button>
            <Button type="primary" htmlType="submit" size="large">
              Simpan Customer & Pet
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
}