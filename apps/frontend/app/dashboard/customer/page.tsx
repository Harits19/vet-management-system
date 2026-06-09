"use client";

import React from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Tooltip,
} from "antd";
import {
  UserOutlined,
  PlusOutlined,
  WhatsAppOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  EditOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import useQueryParams from "@/hooks/useQueryParam";
import TableFilter from "@/components/TableFilter";
import {
  ICustomer,
  ICustomerListFilter,
} from "../../../../shared/types/customer.type";
import { useGetCustomers } from "@/api/customer.api";

const { Title } = Typography;

const formatDate = (val: Date | string) =>
  new Date(val).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function CustomerPage() {
  const { debounceQuery, query, setQuery } =
    useQueryParams<ICustomerListFilter>({
      page: 1,
      limit: 10,
      search: "",
      sortBy: "createdAt",
      order: "desc",
    });

  const { data, loading } = useGetCustomers(debounceQuery);

  const customers = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div style={{ padding: "24px" }}>
      <Row
        gutter={[16, 16]}
        justify="space-between"
        align="middle"
        style={{ marginBottom: 24 }}
      >
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            Data Customer
          </Title>
        </Col>
        <Col>
          <Link href="/dashboard/customer/create">
            <Button type="primary" icon={<PlusOutlined />} size="large">
              Tambah Customer
            </Button>
          </Link>
        </Col>
      </Row>

      {/* 📈 SUMMARY STATS */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless" className="stats-card">
            <Statistic
              title="Total Customer"
              value={meta?.total ?? 0}
              prefix={<UserOutlined style={{ color: "#1890ff" }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* 🔍 FILTER SECTION */}
      <Card variant="borderless" style={{ marginBottom: 16 }}>
        <TableFilter
          query={query}
          setQuery={setQuery}
          searchKey="search"
          searchPlaceholder="Cari nama customer atau nomor WhatsApp..."
        />
      </Card>

      {/* 📊 TABLE SECTION */}
      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        <Table<ICustomer>
          loading={loading}
          dataSource={customers}
          rowKey="_id"
          pagination={{
            current: query.page,
            pageSize: query.limit,
            total: meta?.total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (total) => `Total ${total} customer`,
          }}
          onChange={(pag, _, sorter: any) => {
            setQuery((prev) => ({
              ...prev,
              page: pag.current ?? prev.page,
              limit: pag.pageSize ?? prev.limit,
              sortBy: sorter.field ?? prev.sortBy,
              order: sorter.order === "ascend" ? "asc" : "desc",
            }));
          }}
          columns={[
            {
              title: "Nama Lengkap",
              dataIndex: "name",
              key: "name",
              sorter: true,
              render: (text) => (
                <Space>
                  <UserOutlined style={{ color: "#8c8c8c" }} />
                  <span style={{ fontWeight: 600 }}>{text}</span>
                </Space>
              ),
            },
            {
              title: "WhatsApp",
              dataIndex: "whatsapp",
              key: "whatsapp",
              render: (val) =>
                val ? (
                  <Link
                    href={`https://wa.me/${val.replace(/\D/g, "")}`}
                    target="_blank"
                  >
                    <Tag
                      icon={<WhatsAppOutlined />}
                      color="success"
                      style={{ cursor: "pointer" }}
                    >
                      {val}
                    </Tag>
                  </Link>
                ) : (
                  "-"
                ),
            },
            {
              title: "Alamat",
              dataIndex: "address",
              key: "address",
              ellipsis: true,
              render: (val) => (
                <Tooltip title={val}>
                  <Space>
                    <EnvironmentOutlined style={{ color: "#bfbfbf" }} />
                    {val || (
                      <span style={{ color: "#d9d9d9" }}>Tidak ada alamat</span>
                    )}
                  </Space>
                </Tooltip>
              ),
            },
            {
              title: "Terdaftar Pada",
              dataIndex: "createdAt",
              key: "createdAt",
              sorter: true,
              render: (val) => (
                <Space>
                  <CalendarOutlined style={{ color: "#8c8c8c" }} />
                  {formatDate(val)}
                </Space>
              ),
            },
            {
              title: "Aksi",
              key: "action",
              fixed: "right",
              width: 100,
              render: (_, record) => (
                <Space size="middle">
                  <Tooltip title="Lihat Detail">
                    <Button type="text" icon={<EyeOutlined />} />
                  </Tooltip>
                  <Tooltip title="Edit">
                    <Button type="text" icon={<EditOutlined />} />
                  </Tooltip>
                </Space>
              ),
            },
          ]}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
}
