"use client";

import { Card, Upload, Button, Table, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import Papa from "papaparse";
import { useState } from "react";
import { useImportProducts as usePostImportProducts } from "@/api/product.api";

export default function ImportProductPage() {
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState<any[]>([]);

  const { loading, mutate } = usePostImportProducts();

  // 📦 handle preview CSV
  const handlePreview = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setPreview(result.data.slice(0, 5)); // preview 5 row saja
        setFile(file);
      },
      error: () => {
        message.error("Gagal membaca CSV");
      },
    });

    return false; // prevent auto upload
  };

  // 🚀 upload ke backend
  const handleUpload = async () => {
    if (!file) return;

    await mutate({
      body: file,
      onSuccess: () => {
        setFile(undefined);
        setPreview([]);
      },
    });
  };

  return (
    <Card title="Import Produk (CSV)">
      {/* Upload */}
      <Upload
        beforeUpload={handlePreview}
        accept=".csv"
        maxCount={1}
        showUploadList
      >
        <Button icon={<UploadOutlined />}>Upload CSV</Button>
      </Upload>

      {/* Preview */}
      {preview.length > 0 && (
        <>
          <Table
            style={{ marginTop: 16 }}
            dataSource={preview}
            pagination={false}
            rowKey={(val) => val["No"]}
            columns={[
              { title: "Kategori", dataIndex: "Kategori" },
              { title: "Nama Produk", dataIndex: "Nama Produk" },
              { title: "Harga Jual", dataIndex: "Harga Jual" },
              { title: "Stok", dataIndex: "Stok Jumlah" },
            ]}
          />

          <Button
            type="primary"
            loading={loading}
            onClick={handleUpload}
            style={{ marginTop: 16 }}
          >
            Import ke Sistem
          </Button>
        </>
      )}
    </Card>
  );
}
