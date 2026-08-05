"use client";

import { useEffect, useState } from "react";
import { Card, Row, Col, Statistic, Table, Typography, Tag, Tabs } from "antd";
import { apiFetch } from "../context/auth";

const { Title } = Typography;

interface LowStockItem {
  _id: string;
  productType: "medicine" | "good";
  category: string;
  product: { name: string };
  inventory: { quantity?: number };
  pricing: { selling: number };
  unit?: string;
}

interface DashboardData {
  today: { total: number; count: number };
  week: { total: number; count: number };
  month: { total: number; count: number };
  patients: { year: number; month: number; day: number };
  lowStock: { medicine: LowStockItem[]; petshop: LowStockItem[]; consumable: LowStockItem[] };
  diagnoses: { data: { name: string; count: number }[]; total: number };
  customers: { data: { _id: string; name: string; whatsapp?: string; petCount: number; visitCount: number }[]; total: number };
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

const lowStockColumns = [
  { title: "Nama", dataIndex: "product", key: "name", render: (p: any) => p?.name },
  { title: "Kategori", dataIndex: "category", key: "category", render: (c: string) => c || "-" },
  { title: "Stok", dataIndex: "inventory", key: "qty", render: (i: any) => <Tag color="red">{i?.quantity ?? 0}</Tag> },
  { title: "Harga", dataIndex: "pricing", key: "price", render: (p: any) => formatPrice(p?.selling ?? 0) },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [diagnosesPage, setDiagnosesPage] = useState(1);
  const [customersPage, setCustomersPage] = useState(1);

  const fetchData = (dp: number, cp: number) => {
    setLoading(true);
    const params = new URLSearchParams({ diagnosesPage: String(dp), customersPage: String(cp) });
    apiFetch<{ data: DashboardData }>(`/api/dashboard/summary?${params}`)
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(1, 1); }, []);

  const stockTabs = [
    {
      key: "medicine",
      label: `Obat (${data?.lowStock?.medicine?.length ?? 0})`,
      children: <Table dataSource={data?.lowStock?.medicine ?? []} columns={lowStockColumns} rowKey="_id" pagination={false} size="small" />,
    },
    {
      key: "petshop",
      label: `Petshop (${data?.lowStock?.petshop?.length ?? 0})`,
      children: <Table dataSource={data?.lowStock?.petshop ?? []} columns={lowStockColumns} rowKey="_id" pagination={false} size="small" />,
    },
    {
      key: "consumable",
      label: `Barang Habis Pakai (${data?.lowStock?.consumable?.length ?? 0})`,
      children: <Table dataSource={data?.lowStock?.consumable ?? []} columns={lowStockColumns} rowKey="_id" pagination={false} size="small" />,
    },
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

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic title="Pasien Tahun Ini" value={data?.patients?.year ?? 0} suffix="ekor" />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic title="Pasien Bulan Ini" value={data?.patients?.month ?? 0} suffix="ekor" />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic title="Pasien Hari Ini" value={data?.patients?.day ?? 0} suffix="ekor" />
          </Card>
        </Col>
      </Row>

      <Card title="Stok Menipis" style={{ marginTop: 16 }} loading={loading}>
        <Tabs items={stockTabs} />
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="List Diagnosa" loading={loading}>
            <Table
              dataSource={data?.diagnoses?.data ?? []}
              columns={[
                { title: "Diagnosa", dataIndex: "name", key: "name" },
                { title: "Jumlah Pasien", dataIndex: "count", key: "count", render: (n: number) => <Tag color="blue">{n}</Tag> },
              ]}
              rowKey="name"
              size="small"
              pagination={{
                current: diagnosesPage,
                pageSize: 10,
                total: data?.diagnoses?.total ?? 0,
                showSizeChanger: false,
                onChange: (p) => { setDiagnosesPage(p); fetchData(p, customersPage); },
              }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="List Klien" loading={loading}>
            <Table
              dataSource={data?.customers?.data ?? []}
              columns={[
                { title: "Klien", dataIndex: "name", key: "name" },
                { title: "Jumlah Hewan", dataIndex: "petCount", key: "petCount" },
                { title: "Jumlah Kedatangan", dataIndex: "visitCount", key: "visitCount" },
              ]}
              rowKey="_id"
              size="small"
              pagination={{
                current: customersPage,
                pageSize: 10,
                total: data?.customers?.total ?? 0,
                showSizeChanger: false,
                onChange: (p) => { setCustomersPage(p); fetchData(diagnosesPage, p); },
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
