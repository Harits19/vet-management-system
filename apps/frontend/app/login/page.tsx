"use client";

import { Button, Card, Form, Input, Typography } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { usePostLogin } from "@/api/auth.api";
import { setFrontendAuthCookie } from "@/lib/auth";
import { useForm } from "react-hook-form";
import {
  AuthLoginRequest,
  authLoginSchema,
} from "../../../shared/types/auth.type";
import { zodResolver } from "@hookform/resolvers/zod";
import VetForm from "@/components/VetForm";
const { Title, Text } = Typography;

export default function LoginPage() {
  const { data, mutate, loading } = usePostLogin();
  const { control, handleSubmit } = useForm<AuthLoginRequest>({
    resolver: zodResolver(authLoginSchema),
    defaultValues: {
      username: "super.admin",
      password: "admin123",
    },
  });
  const router = useRouter();
  const onFinish = async (values: AuthLoginRequest) => {
    console.log(values);
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
          onFinish={handleSubmit(onFinish)}
          autoComplete="off"
        >
          <VetForm label="Username" name="username" control={control}>
            {(field) => (
              <Input
                prefix={<UserOutlined />}
                placeholder="Username"
                size="large"
                {...field}
              />
            )}
          </VetForm>

          <VetForm control={control} label="Password" name="password">
            {(field) => (
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Masukkan password"
                size="large"
                {...field}
              />
            )}
          </VetForm>

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
