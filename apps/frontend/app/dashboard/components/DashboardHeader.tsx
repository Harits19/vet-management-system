import { Dropdown, Button, Layout } from "antd";
import { DownOutlined, LogoutOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import useFetch from "@/hooks/useFetch";
import usePostLogout from "@/hooks/api/usePostLogout";
const { Header } = Layout;

export default function DashboardHeader() {
  const router = useRouter();
  const { mutate } = usePostLogout();

  const handleLogout = async () => {
    await mutate({});

    router.push("/login");
  };

  const items = [
    {
      key: "logout",
      label: "Logout",
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  return (
    <Header
      style={{
        padding: "0 16px",
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div>Dashboard</div>

      <Dropdown menu={{ items }}>
        <Button type="text">
          Admin <DownOutlined />
        </Button>
      </Dropdown>
    </Header>
  );
}
