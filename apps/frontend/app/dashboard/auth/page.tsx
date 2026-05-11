"use client";

import VetForm from "@/components/VetForm";
import { Button, Card, Form, Input, Typography, Space } from "antd";
import { useForm } from "react-hook-form";
import {
  CookieRequest,
  cookieSchema,
} from "../../../../shared/types/auth.type";
import { useGetCookie, usePostCookie } from "@/api/auth.api";
import { zodResolver } from "@hookform/resolvers/zod";

const { Text, Paragraph } = Typography;

export default function Page() {
  const { data: cookie, mutate: mutateGetCookie } = useGetCookie();

  const { control, handleSubmit } = useForm<CookieRequest>({
    defaultValues: {
      cookie: cookie?.data.cookie,
    },
    resolver: zodResolver(cookieSchema),
  });

  const { loading, mutate: mutatePostCookie } = usePostCookie();

  const onSubmit = async (value: CookieRequest) => {
    await mutatePostCookie({ body: value });
    await mutateGetCookie({});
  };

  return (
    <Card title="Update Cookie Aplikasir">
      <Space orientation="vertical" size="large" style={{ width: "100%" }}>
        <Card size="small" title="Current Cookie">
          {cookie?.data.cookie ? (
            <Paragraph
              copyable
              style={{
                marginBottom: 0,
                wordBreak: "break-all",
                whiteSpace: "pre-wrap",
              }}
            >
              {cookie.data.cookie}
            </Paragraph>
          ) : (
            <Text type="secondary">No cookie available</Text>
          )}
        </Card>

        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <VetForm control={control} name="cookie" label="New Cookie">
            {(field) => <Input.TextArea rows={6} {...field} />}
          </VetForm>

          <Button type="primary" block loading={loading} htmlType="submit">
            Save
          </Button>
        </Form>
      </Space>
    </Card>
  );
}
