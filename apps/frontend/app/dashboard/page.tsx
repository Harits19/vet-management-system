"use client";

import { useEffect, useState } from "react";
import { Card, Row, Col, Statistic, Table, Typography, Tag } from "antd";
import { ShoppingCart, TrendingUp, Package } from "lucide-react";
import { apiFetch } from "../context/auth";
import dayjs from "dayjs";

const { Title } = Typography;

interface DashboardData {
  today: { total: number; count: number };
  week: { total: number; count: number };
  month: { total: number; count: number };
  lowStock: any[];
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ data: DashboardData }>("/api/dashboard/summary")
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const lowStockColumns = [
    { title: "Nama", dataIndex: "product", key: "name", render: (p: any) => p?.name },
    { title: "Stok", dataIndex: "inventory", key: "qty", render: (i: any) => <Tag color="red">{i?.quantity}</Tag> },
    { title: "Harga", dataIndex: "pricing", key: "price", render: (p: any) => formatPrice(p?.selling) },
  ];

  return (
    <div>
      <Title level={4}>Dashboard</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic title="Penjualan Hari Ini" value={data?.today?.total ?? 0} prefix="Rp" precision={0} suffix={`(${data?.today?.count ?? 0} transaksi)`} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic title="Minggu Ini" value={data?.week?.total ?? 0} prefix="Rp" precision={0} suffix={`(${data?.week?.count ?? 0} transaksi)`} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic title="Bulan Ini" value={data?.month?.total ?? 0} prefix="Rp" precision={0} suffix={`(${data?.month?.count ?? 0} transaksi)`} />
          </Card>
        </Col>
      </Row>
      <Card title="Stok Menipis" style={{ marginTop: 16 }} loading={loading}>
        <Table dataSource={data?.lowStock ?? []} columns={lowStockColumns} rowKey="_id" pagination={false} size="small" />
      </Card>
    </div>
  );
}
