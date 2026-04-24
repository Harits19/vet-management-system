"use client";

import { useSyncSales } from "@/api/sale.api";
import { Button, Card, Form, Input, message, Table, Typography } from "antd";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { IScrape, scrapeSchema } from "../../../../../shared/types/scrape.type";
import VetForm from "@/components/VetForm";
import { zodResolver } from "@hookform/resolvers/zod";

const { Text } = Typography;

export default function ScrapeSalesPage() {
  const { mutate, loading } = useSyncSales();
  const { control, handleSubmit } = useForm<IScrape>({
    resolver: zodResolver(scrapeSchema),
    defaultValues: {
      cf_clearance:
        "6bVnm2qvpKaaV7GF_VkYwy7rixeLrWyx8wzwMzOFUgs-1777004972-1.2.1.1-_czqoQzl8IW.DY.j93oRvg0IB8sNeg9L6uuJFaczFt6xBLZObp2eW6XgwMzjaUaPvIVasd0UjNp4Y2oDIfBAzSBVtHXtrMLrQNPyUM.E3r4htlWdAPhoI2J_89L5x1WAcfNDfiTLSSPsamk643PYGkyoL3ptbH9vfADkZ24RF38rOiLn8DW33pRVVWe9noeqhVdqzwwKYlzBHZ4ZETOnEmwKXXDm00U32uq3IDEQMR53C15sykbp.lSZjLR6c7y0nM2ISMS3s2diPGUqgxI6gZXE905ZPwcjgQvJ8ypNQo2q4W7SNDhxU8QjY1q9ZCBP9ER61Ppjlb2VI9ujr0pz_A",
      sess: "ikuce7nsbb0980upd6p3ftsj0l4l87ie",
      storeName: "wedianimalcare",
    },
  });
  const onFinish = async (values: IScrape) => {
    mutate({ body: values });
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <Card title="Sync / Scrape Sales Data" style={{ marginBottom: 24 }}>
        <Form layout="vertical" onFinish={handleSubmit(onFinish)}>
          <VetForm label="Session (sess)" name="sess" control={control}>
            {(field) => <Input.Password placeholder="sess=..." {...field} />}
          </VetForm>

          <VetForm control={control} label="Store Name" name="storeName">
            {(field) => (
              <Input placeholder="contoh: wedianimalcare" {...field} />
            )}
          </VetForm>

          <VetForm
            control={control}
            label="Cloudflare Clearance"
            name="cf_clearance"
          >
            {(field) => (
              <Input.Password placeholder="cf_clearance=..." {...field} />
            )}
          </VetForm>

          <Button type="primary" htmlType="submit" loading={loading} block>
            🚀 Sync Data
          </Button>
        </Form>
      </Card>
    </div>
  );
}
