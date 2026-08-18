import { Spin } from "antd";

export default function LoadingView() {
  return (
    <div
      style={{
        width: "100vw",
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Spin />
    </div>
  );
}
