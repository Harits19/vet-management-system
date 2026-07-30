"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../context/auth";
import { Layout, Menu, Button, Typography, Avatar, Dropdown, Space } from "antd";
import {
  Users, Dog, Package, LayoutDashboard, PawPrint, User as UserIcon,
  ShoppingBag, Stethoscope, FileText, LogOut
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

function SidebarMenu({ role }: { role: string }) {
  const pathname = usePathname();

  const items = [
    { key: "/dashboard", icon: <LayoutDashboard size={18} />, label: <Link href="/dashboard">Dashboard</Link> },
    { key: "/dashboard/customers", icon: <Users size={18} />, label: <Link href="/dashboard/customers">Customer/Pemilik</Link> },
    { key: "/dashboard/pets", icon: <Dog size={18} />, label: <Link href="/dashboard/pets">Pasien</Link> },
    { key: "/dashboard/products", icon: <Package size={18} />, label: <Link href="/dashboard/products">Produk & Jasa</Link> },
    { key: "/dashboard/sales", icon: <ShoppingBag size={18} />, label: <Link href="/dashboard/sales">Penjualan</Link> },
  ];

  // Doctor-only menus
  if (["doctor", "superadmin"].includes(role)) {
    items.push(
      { key: "/dashboard/medical-histories", icon: <FileText size={18} />, label: <Link href="/dashboard/medical-histories">Rekam Medis</Link> },
    );
  }

  // All roles can see vet sales
  items.push(
    { key: "/dashboard/vet-sales", icon: <Stethoscope size={18} />, label: <Link href="/dashboard/vet-sales">Transaksi Dokter</Link> },
  );

  return <Menu mode="inline" selectedKeys={[pathname]} items={items} style={{ borderInlineEnd: "none" }} />;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider theme="light" width={220} style={{ borderRight: "1px solid #f0f0f0" }}>
        <div style={{ padding: "16px", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
          <Space>
            <PawPrint size={24} style={{ color: "#1677ff" }} />
            <Text strong>Vet System</Text>
          </Space>
        </div>
        <SidebarMenu role={user.role} />
      </Sider>
      <Layout>
        <Header style={{ background: "#fff", padding: "0 24px", display: "flex", justifyContent: "flex-end", alignItems: "center", borderBottom: "1px solid #f0f0f0" }}>
          <Dropdown menu={{
            items: [
              { key: "profile", label: `${user.name} (${user.role})`, disabled: true },
              { type: "divider" },
              { key: "logout", label: "Logout", icon: <LogOut size={14} />, onClick: logout },
            ]
          }}>
            <Button type="text">
              <Space>
                <Avatar size="small" icon={<UserIcon size={14} />} />
                {user.name}
              </Space>
            </Button>
          </Dropdown>
        </Header>
        <Content style={{ padding: 24, background: "#f5f5f5" }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
