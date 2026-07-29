"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../context/auth";
import { Layout, Menu, Button, Typography, Avatar, Dropdown, Space } from "antd";
import {
  ShoppingCart, Users, Dog, Package, LayoutDashboard, LogOut, PawPrint, User as UserIcon,
  ShoppingBag, Activity
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: "/dashboard", icon: <LayoutDashboard size={18} />, label: <Link href="/dashboard">Dashboard</Link> },
  { key: "/dashboard/customers", icon: <Users size={18} />, label: <Link href="/dashboard/customers">Customer</Link> },
  { key: "/dashboard/pets", icon: <Dog size={18} />, label: <Link href="/dashboard/pets">Pasien</Link> },
  { key: "/dashboard/products", icon: <Package size={18} />, label: <Link href="/dashboard/products">Produk & Jasa</Link> },
  { key: "/dashboard/sales", icon: <ShoppingBag size={18} />, label: <Link href="/dashboard/sales">Penjualan</Link> },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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
        <Menu mode="inline" selectedKeys={[pathname]} items={menuItems} style={{ borderInlineEnd: "none" }} />
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
