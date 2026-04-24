"use client";

import { useEffect, useState } from "react";
import { Table, Card, Typography, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ISale } from "../../../../shared/types/sale.type";

const { Title, Text } = Typography;

const formatCurrency = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;

const formatDate = (date: Date | string) =>
  new Date(date).toLocaleString("id-ID");

export default function SalesPage() {
  const [data, setData] = useState<ISale[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSales = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/sales"); // 🔥 endpoint kamu
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.message);
      }

      setData(json.data);
    } catch (err: any) {
      message.error(err.message || "Gagal load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // fetchSales();
  }, []);

  const columns: ColumnsType<ISale> = [
    {
      title: "No Struk",
      dataIndex: "receiptNumber",
      sorter: (a, b) => a.receiptNumber.localeCompare(b.receiptNumber),
    },
    {
      title: "Tanggal",
      dataIndex: "timestamp",
      render: (val) => formatDate(val),
      sorter: (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    },
    {
      title: "Kasir",
      dataIndex: "cashier",
    },
    {
      title: "Customer",
      dataIndex: "customer",
      render: (val) => val || "-",
    },
    {
      title: "Payment",
      dataIndex: "paymentMethod",
      render: (val) => (
        <Tag color={val === "Cash" ? "green" : "blue"}>{val}</Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "paymentStatus",
      render: (val) => (
        <Tag color={val === "Lunas" ? "green" : "orange"}>{val}</Tag>
      ),
    },

    // 💰 Pricing
    {
      title: "Modal",
      render: (_, r) => formatCurrency(r.pricing.cost),
      sorter: (a, b) => a.pricing.cost - b.pricing.cost,
    },
    {
      title: "Profit",
      render: (_, r) => formatCurrency(r.pricing.profit),
      sorter: (a, b) => a.pricing.profit - b.pricing.profit,
    },
    {
      title: "Harga Jual",
      render: (_, r) => formatCurrency(r.pricing.selling),
      sorter: (a, b) => a.pricing.selling - b.pricing.selling,
    },

    // 📊 Summary
    {
      title: "Total",
      render: (_, r) => formatCurrency(r.summary.total),
      sorter: (a, b) => a.summary.total - b.summary.total,
    },
    {
      title: "DP",
      render: (_, r) => formatCurrency(r.summary.downPayment),
    },
    {
      title: "Hutang",
      render: (_, r) => formatCurrency(r.summary.debt),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={4}>Sales Transactions</Title>
        <Text type="secondary">Data transaksi penjualan</Text>

        <Table
          style={{ marginTop: 16 }}
          rowKey="externalId"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
          }}
          scroll={{ x: "max-content" }}
        />
      </Card>
    </div>
  );
}
