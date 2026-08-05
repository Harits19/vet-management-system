"use client";

import { Tabs } from "antd";
import ProductManager from "../components/ProductManager";

export default function ProductsPage() {
  return (
    <Tabs
      defaultActiveKey="petshop"
      items={[
        { key: "petshop", label: "Petshop", children: <ProductManager productTypeFilter="good" goodTypeFilter="petshop" title="Petshop" /> },
        { key: "bmhp", label: "BMHP", children: <ProductManager productTypeFilter="good" goodTypeFilter="bmhp" title="BMHP" /> },
        { key: "obat", label: "Obat", children: <ProductManager productTypeFilter="medicine" title="Obat" /> },
      ]}
    />
  );
}
