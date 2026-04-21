import { Button, Table } from "antd";

const columns = [
  { title: "Nama Produk", dataIndex: "name" },
  { title: "Harga", dataIndex: "price" },
  { title: "Stok", dataIndex: "stock" },
];

export default function ProductsPage() {
  return (
    <div>
      <Button
        href="products/create"
        type="primary"
        style={{ marginBottom: 16 }}
      >
        Tambah Produk
      </Button>

      <Table columns={columns} dataSource={[]} rowKey="id" />
    </div>
  );
}
