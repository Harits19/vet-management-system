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
    token: { colorBgContainer },
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
          label: "List Product",
        },
        {
          key: "/dashboard/products/create",
          label: "Create Product",
        },
        {
          key: "/dashboard/products/import",
          label: "Import Product",
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
          label: "List Sale",
        },
        {
          key: "/dashboard/sales/create",
          label: "Create Sale",
        },
        {
          key: "/dashboard/sales/import",
          label: "Import Sale",
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
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
      >
        <div style={styles.logo}>{collapsed ? "PC" : "Pet Clinic"}</div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={(e) => router.push(e.key)}
        />
      </Sider>

      <Layout>
        <DashboardHeader />

        <Content style={{ margin: "16px" }}>
          <div
            style={{
              padding: 16,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: 8,
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
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: 18,
  },
};
