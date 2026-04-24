"use client";

import { Button, Card, Form, Input, Typography } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { usePostLogin } from "@/api/auth.api";
import { setFrontendAuthCookie } from "@/lib/auth";
const { Title, Text } = Typography;

export default function LoginPage() {
  const { data, mutate, loading } = usePostLogin();
  const router = useRouter();
  const onFinish = async (values: any) => {
    const response = await mutate({
      body: values,
      onSuccess: () => {
        setFrontendAuthCookie();
      },
    });

    if (response) {
      router.push("/dashboard");
    }
  };

  return (
    <div style={styles.container}>
      <Card style={styles.card} variant={"outlined"}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={3}>Pet Clinic System</Title>
          <Text type="secondary">Login untuk melanjutkan</Text>
        </div>
        {/* {JSON.stringify(data, null, 2)} */}

        <Form
          name="login"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Email wajib diisi" },
              { type: "email", message: "Format email tidak valid" },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="email@example.com"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Password wajib diisi" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Masukkan password"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              loading={loading}
              type="primary"
              htmlType="submit"
              block
              size="large"
            >
              Login
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f5f7fa",
  },
  card: {
    width: 380,
    borderRadius: 12,
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
  },
};
