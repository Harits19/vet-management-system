"use client";

import { Layout, Menu, theme } from "antd";
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  KeyOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import DashboardHeader from "./components/DashboardHeader";
import { useGetMe } from "@/api/auth.api";
import { clearFrontendAuthCookie } from "@/lib/auth";

const { Header, Sider, Content } = Layout;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { mutate: validateSession } = useGetMe();

  const {
    token: { colorBgContainer, colorPrimary },
  } = theme.useToken();

  const menuItems = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: "Dashboard",
    },
    {
      key: "products",
      icon: <AppstoreOutlined />,
      label: "Products",
      children: [
        {
          key: "/dashboard/products",
          label: "List",
        },
        {
          key: "/dashboard/products/create",
          label: "Create",
        },
        {
          key: "/dashboard/products/import",
          label: "Import",
        },
      ],
    },
    {
      key: "sale",
      icon: <ShoppingCartOutlined />,
      label: "Sales",
      children: [
        {
          key: "/dashboard/sales",
          label: "List",
        },
        {
          key: "/dashboard/sales/create",
          label: "Create",
        },
        {
          key: "/dashboard/sales/import",
          label: "Import",
        },
      ],
    },
    {
      key: "customer",
      icon: <AppstoreOutlined />,
      label: "Customer",
      children: [
        {
          key: "/dashboard/customers",
          label: "List",
        },
        {
          key: "/dashboard/customers/create",
          label: "Create",
        },
      ],
    },
    {
      key: "auth",
      icon: <KeyOutlined />,
      label: "Auth",
      children: [
        {
          key: "/dashboard/auth",
          label: "Config",
        },
      ],
    },
  ];

  useEffect(() => {
    const verifySession = async () => {
      const response = await validateSession({});

      if (!response) {
        clearFrontendAuthCookie();
        router.replace("/login");
      }
    };

    verifySession();
  }, [router]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        theme="light"
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        style={{ borderRight: "1px solid #f0f0f0" }}
      >
        <div style={{ ...styles.logo, color: colorPrimary }}>
          {collapsed ? "PC" : "Pet Clinic"}
        </div>

        <Menu
          theme="light"
          mode="inline"
          style={{ borderInlineEnd: "none" }}
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={(e) => router.push(e.key)}
        />
      </Sider>

      <Layout>
        <DashboardHeader />

        <Content style={{ margin: "24px 16px" }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: 12,
            }}
          >
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  logo: {
    height: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: 18,
  },
};
