"use client";

import { useState } from "react";
import { Card, Row, Col, Statistic, Table, Typography, Tag, Tabs, Space, DatePicker } from "antd";
import dayjs from "dayjs";
import { useGetDashboardSummary } from "@/api/useGetDashboardSummary";

const { Title } = Typography;

function formatPrice(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

const lowStockColumns = [
  { title: "Nama", dataIndex: "product", key: "name", render: (p: any) => p?.name },
  { title: "Kategori", dataIndex: "category", key: "category", render: (c: string) => c || "-" },
  {
    title: "Stok",
    dataIndex: "inventory",
    key: "qty",
    render: (i: any) => <Tag color="red">{i?.quantity ?? 0}</Tag>,
  },
  {
    title: "Harga",
    dataIndex: "pricing",
    key: "price",
    render: (p: any) => formatPrice(p?.selling ?? 0),
  },
];

export default function DashboardPage() {
  const [diagnosesPage, setDiagnosesPage] = useState(1);
  const [customersPage, setCustomersPage] = useState(1);
  const [patientsYear, setPatientsYear] = useState(dayjs());
  const [patientsMonth, setPatientsMonth] = useState(dayjs());
  const [patientsDate, setPatientsDate] = useState(dayjs());

  // Semua bagian dashboard datang dari satu endpoint: satu query untuk semua
  // filter (tanggal pasien + halaman tabel diagnosa/klien).
  const { data, isLoading, isFetching } = useGetDashboardSummary({
    diagnosesPage,
    customersPage,
    patientsYear: patientsYear.format("YYYY"),
    patientsMonth: patientsMonth.format("YYYY-MM"),
    patientsDate: patientsDate.format("YYYY-MM-DD"),
  });
  const dashboard = data?.data;

  const stockTabs = [
    {
      key: "medicine",
      label: `Obat (${dashboard?.lowStock?.medicine?.length ?? 0})`,
      children: (
        <Table
          dataSource={dashboard?.lowStock?.medicine ?? []}
          columns={lowStockColumns}
          rowKey="_id"
          pagination={false}
          size="small"
        />
      ),
    },
    {
      key: "petshop",
      label: `Petshop (${dashboard?.lowStock?.petshop?.length ?? 0})`,
      children: (
        <Table
          dataSource={dashboard?.lowStock?.petshop ?? []}
          columns={lowStockColumns}
          rowKey="_id"
          pagination={false}
          size="small"
        />
      ),
    },
    {
      key: "consumable",
      label: `Barang Habis Pakai (${dashboard?.lowStock?.consumable?.length ?? 0})`,
      children: (
        <Table
          dataSource={dashboard?.lowStock?.consumable ?? []}
          columns={lowStockColumns}
          rowKey="_id"
          pagination={false}
          size="small"
        />
      ),
    },
  ];

  return (
    <div>
      <Title level={4}>Dashboard</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card loading={isLoading}>
            <Statistic
              title="Penjualan Hari Ini"
              value={dashboard?.today?.total ?? 0}
              prefix="Rp"
              precision={0}
              suffix={`(${dashboard?.today?.count ?? 0} transaksi)`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={isLoading}>
            <Statistic
              title="Minggu Ini"
              value={dashboard?.week?.total ?? 0}
              prefix="Rp"
              precision={0}
              suffix={`(${dashboard?.week?.count ?? 0} transaksi)`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={isLoading}>
            <Statistic
              title="Bulan Ini"
              value={dashboard?.month?.total ?? 0}
              prefix="Rp"
              precision={0}
              suffix={`(${dashboard?.month?.count ?? 0} transaksi)`}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={8}>
          <Card loading={isLoading}>
            <Space orientation="vertical" style={{ width: "100%" }}>
              <DatePicker
                picker="year"
                value={patientsYear}
                allowClear={false}
                style={{ width: "100%" }}
                onChange={(d) => {
                  if (d) setPatientsYear(d);
                }}
              />
              <Statistic
                title={`Pasien Tahun ${patientsYear.format("YYYY")}`}
                value={dashboard?.patients?.year ?? 0}
                suffix="ekor"
              />
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={isLoading}>
            <Space orientation="vertical" style={{ width: "100%" }}>
              <DatePicker
                picker="month"
                value={patientsMonth}
                allowClear={false}
                style={{ width: "100%" }}
                onChange={(d) => {
                  if (d) setPatientsMonth(d);
                }}
              />
              <Statistic
                title={`Pasien Bulan ${patientsMonth.format("MMMM YYYY")}`}
                value={dashboard?.patients?.month ?? 0}
                suffix="ekor"
              />
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={isLoading}>
            <Space orientation="vertical" style={{ width: "100%" }}>
              <DatePicker
                value={patientsDate}
                allowClear={false}
                style={{ width: "100%" }}
                onChange={(d) => {
                  if (d) setPatientsDate(d);
                }}
              />
              <Statistic
                title={`Pasien ${patientsDate.format("DD/MM/YYYY")}`}
                value={dashboard?.patients?.day ?? 0}
                suffix="ekor"
              />
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title="Stok Menipis" style={{ marginTop: 16 }} loading={isLoading}>
        <Tabs items={stockTabs} />
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="List Diagnosa">
            <Table
              dataSource={dashboard?.diagnoses?.data ?? []}
              columns={[
                { title: "Diagnosa", dataIndex: "name", key: "name" },
                {
                  title: "Jumlah Pasien",
                  dataIndex: "count",
                  key: "count",
                  render: (n: number) => <Tag color="blue">{n}</Tag>,
                },
              ]}
              rowKey="name"
              size="small"
              loading={isFetching}
              pagination={{
                current: diagnosesPage,
                pageSize: 10,
                total: dashboard?.diagnoses?.total ?? 0,
                showSizeChanger: false,
                onChange: (p) => setDiagnosesPage(p),
              }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="List Klien">
            <Table
              dataSource={dashboard?.customers?.data ?? []}
              columns={[
                { title: "Klien", dataIndex: "name", key: "name" },
                { title: "Jumlah Hewan", dataIndex: "petCount", key: "petCount" },
                { title: "Jumlah Kedatangan", dataIndex: "visitCount", key: "visitCount" },
              ]}
              rowKey="_id"
              size="small"
              loading={isFetching}
              pagination={{
                current: customersPage,
                pageSize: 10,
                total: dashboard?.customers?.total ?? 0,
                showSizeChanger: false,
                onChange: (p) => setCustomersPage(p),
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
