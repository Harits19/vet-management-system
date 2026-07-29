"use client";

import { useEffect, useState } from "react";
import { Card, Descriptions, Table, Typography } from "antd";
import { apiFetch } from "../../../context/auth";
import { useParams } from "next/navigation";

const { Title } = Typography;

interface CustomerDetail {
  _id: string;
  name: string;
  whatsapp?: string;
  address?: string;
  createdAt: string;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<{ data: CustomerDetail }>(`/api/customers/${id}`),
      apiFetch<{ data: any[] }>(`/api/pets?customerId=${id}`),
    ]).then(([c, p]) => {
      setCustomer(c.data);
      setPets(p.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (!customer) return null;

  const petColumns = [
    { title: "Nama", dataIndex: "name", key: "name" },
    { title: "Jenis", dataIndex: "kind", key: "kind" },
    { title: "Gender", dataIndex: "gender", key: "gender", render: (v: string) => v === "male" ? "Jantan" : "Betina" },
    { title: "Catatan", dataIndex: "notes", key: "notes", render: (v?: string) => v || "-" },
  ];

  return (
    <div>
      <Title level={4}>Detail Customer</Title>
      <Card loading={loading}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="Nama">{customer.name}</Descriptions.Item>
          <Descriptions.Item label="WhatsApp">{customer.whatsapp || "-"}</Descriptions.Item>
          <Descriptions.Item label="Alamat" span={2}>{customer.address || "-"}</Descriptions.Item>
        </Descriptions>
      </Card>
      <Card title="Hewan Peliharaan" style={{ marginTop: 16 }}>
        <Table dataSource={pets} columns={petColumns} rowKey="_id" pagination={false} size="small" />
      </Card>
    </div>
  );
}
