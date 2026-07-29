"use client";

import { useState } from "react";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { Lock, User, PawPrint } from "lucide-react";
import { useAuth } from "../context/auth";

const { Title, Text } = Typography;

export default function LoginPage() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.username, values.password);
    } catch (err: any) {
      message.error(err.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f2f5" }}>
      <Card style={{ width: 400, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <PawPrint size={48} style={{ color: "#1677ff" }} />
          <Title level={3} style={{ marginTop: 8 }}>Vet Management</Title>
          <Text type="secondary">Sistem Kasir & Praktek Dokter Hewan</Text>
        </div>
        <Form layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item name="username" label="Username" rules={[{ required: true, message: "Masukkan username" }]}>
            <Input prefix={<User size={16} />} placeholder="username" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, message: "Masukkan password" }]}>
            <Input.Password prefix={<Lock size={16} />} placeholder="password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Masuk
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
