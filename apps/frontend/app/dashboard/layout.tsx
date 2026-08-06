"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../context/auth";
import { useTheme } from "../context/theme";
import { Layout, Menu, Button, Typography, Avatar, Dropdown, Space, Grid, Drawer, Tooltip, theme as antdTheme } from "antd";
import {
  Users, Dog, Package, LayoutDashboard, PawPrint, User as UserIcon,
  ShoppingCart, Stethoscope, FileText, ClipboardList, LogOut, FileSignature, Menu as MenuIcon, Sun, Moon
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

function SidebarMenu({ role, onNavigate }: { role: string; onNavigate?: () => void }) {
  const pathname = usePathname();

  const isActive = (item: { key: string }) =>
    item.key === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.key);

  const items = [
    { key: "/dashboard", icon: <LayoutDashboard size={18} />, label: <Link href="/dashboard">Dashboard</Link> },
    { key: "/dashboard/customers", icon: <Users size={18} />, label: <Link href="/dashboard/customers">Klien</Link> },
    { key: "/dashboard/pets", icon: <Dog size={18} />, label: <Link href="/dashboard/pets">Pasien Baru</Link> },
    { key: "/dashboard/services", icon: <Stethoscope size={18} />, label: <Link href="/dashboard/services">Jasa</Link> },
    { key: "/dashboard/products", icon: <Package size={18} />, label: <Link href="/dashboard/products">Barang</Link> },
    { key: "/dashboard/transactions", icon: <ShoppingCart size={18} />, label: <Link href="/dashboard/transactions">Transaksi</Link> },
  ];

  if (["doctor", "superadmin", "admin"].includes(role)) {
    items.splice(3, 0,
      { key: "/dashboard/consultations", icon: <Stethoscope size={18} />, label: <Link href="/dashboard/consultations/new">Pasien Lama</Link> },
      { key: "/dashboard/medical-histories", icon: <FileText size={18} />, label: <Link href="/dashboard/medical-histories">Rekam Medis</Link> },
      { key: "/dashboard/diagnoses", icon: <ClipboardList size={18} />, label: <Link href="/dashboard/diagnoses">List Diagnosis</Link> },
      { key: "/dashboard/letters", icon: <FileSignature size={18} />, label: <Link href="/dashboard/letters">Surat</Link> },
    );
  }

  if (["superadmin", "admin"].includes(role)) {
    items.push({ key: "/dashboard/users", icon: <UserIcon size={18} />, label: <Link href="/dashboard/users">Manajemen User</Link> });
  }

  return <Menu mode="inline" selectedKeys={[items.find(isActive)?.key || ""]} items={items} style={{ borderInlineEnd: "none" }} onClick={onNavigate} />;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { token } = antdTheme.useToken();
  const router = useRouter();
  const screens = useBreakpoint();
  // Layar besar (>= lg / 992px): sider tetap. Di bawah itu: drawer + tombol hamburger.
  const isDesktop = !!screens.lg;
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user) return null;

  const logo = (
    <div style={{ padding: "16px", textAlign: "center", borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
      <Space>
        <PawPrint size={24} style={{ color: token.colorPrimary }} />
        <Text strong>Vet System</Text>
      </Space>
    </div>
  );

  const themeToggle = (
    <Tooltip title={isDark ? "Mode terang" : "Mode gelap"}>
      <Button
        type="text"
        aria-label="Ganti tema"
        icon={isDark ? <Sun size={18} /> : <Moon size={18} />}
        onClick={toggleTheme}
      />
    </Tooltip>
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {isDesktop && (
        <Sider width={220} style={{ background: token.colorBgContainer, borderRight: `1px solid ${token.colorBorderSecondary}` }}>
          {logo}
          <SidebarMenu role={user.role} />
        </Sider>
      )}
      <Drawer
        placement="left"
        width={220}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        closable={false}
        styles={{ body: { padding: 0 } }}
      >
        {logo}
        <SidebarMenu role={user.role} onNavigate={() => setDrawerOpen(false)} />
      </Drawer>
      <Layout>
        <Header style={{ background: token.colorBgContainer, padding: "0 16px", display: "flex", justifyContent: "flex-end", alignItems: "center", borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
          {!isDesktop && (
            <Button type="text" icon={<MenuIcon size={18} />} onClick={() => setDrawerOpen(true)} style={{ marginRight: "auto" }} aria-label="Buka menu" />
          )}
          {themeToggle}
          <Dropdown menu={{
            items: [
              { key: "userinfo", label: `${user.name} (${user.role})`, disabled: true },
              { type: "divider" },
              { key: "profile", label: <Link href="/dashboard/profile">Edit Profil</Link>, icon: <UserIcon size={14} /> },
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
        <Content style={{ padding: 24, background: token.colorBgLayout }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
