"use client";

import { useEffect, useState } from "react";
import { Card, Form, Input, Button, Typography, Tag, Space, Divider, Alert } from "antd";
import { Save, KeyRound, FileSignature } from "lucide-react";
import { apiFetch, useAuth } from "../../context/auth";
import { useAntdMessage } from "../../hooks/useAntdMessage";

const { Title, Text } = Typography;

const ROLE_LABEL: Record<string, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  cashier: "Kasir",
  doctor: "Dokter",
};

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const msg = useAntdMessage();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  // Isi form saat data user tersedia / berubah
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        name: user.name,
        username: user.username,
        email: user.email,
      });
    }
  }, [user, form]);

  if (!user) return null;

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload: {
        name: string;
        username: string;
        email: string;
        currentPassword?: string;
        newPassword?: string;
      } = {
        name: values.name,
        username: values.username,
        email: values.email,
      };

      // Kirim bagian password hanya jika password baru diisi
      if (values.newPassword) {
        payload.currentPassword = values.currentPassword;
        payload.newPassword = values.newPassword;
      }

      setSaving(true);
      await apiFetch("/api/auth/me", { method: "PUT", body: JSON.stringify(payload) });
      await refreshUser();
      form.resetFields(["currentPassword", "newPassword", "confirmPassword"]);
      msg.success("Profil berhasil diperbarui");
    } catch (err: any) {
      // err.errorFields = error validasi form antd (sudah tampil di form), jangan ditampilkan sebagai error global
      if (!err?.errorFields) {
        msg.error(err?.message || "Gagal memperbarui profil");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Title level={4} style={{ marginTop: 0 }}>Edit Profil</Title>

      <Card style={{ maxWidth: 640 }}>
        <Form form={form} layout="vertical" autoComplete="off">
          <Divider orientation="left" plain>
            <Space><FileSignature size={14} /> Data Akun</Space>
          </Divider>

          <Form.Item name="name" label="Nama" rules={[{ required: true, message: "Nama wajib diisi" }]}>
            <Input placeholder="Nama lengkap" />
          </Form.Item>

          <Form.Item name="username" label="Username" rules={[{ required: true, message: "Username wajib diisi" }]}>
            <Input placeholder="Username untuk login" autoComplete="username" />
          </Form.Item>

          <Form.Item name="email" label="Email" rules={[{ required: true, message: "Email wajib diisi" }, { type: "email", message: "Format email tidak valid" }]}>
            <Input placeholder="email@contoh.com" />
          </Form.Item>

          <Form.Item label="Role">
            <Tag color="blue">{ROLE_LABEL[user.role] ?? user.role}</Tag>
            <Text type="secondary" style={{ marginLeft: 8 }}>Role tidak bisa diubah di sini.</Text>
          </Form.Item>

          {user.role === "doctor" && (
            <Alert
              type={user.doctorSignature ? "success" : "info"}
              showIcon
              style={{ marginBottom: 24 }}
              message={user.doctorSignature ? "Tanda tangan dokter tersimpan." : "Belum ada tanda tangan dokter tersimpan."}
              description={user.doctorSignature
                ? "Tanda tangan ini akan dipakai saat membuat surat."
                : "Tanda tangan bisa disimpan saat membuat surat baru (halaman Surat)."}
            />
          )}

          <Divider orientation="left" plain>
            <Space><KeyRound size={14} /> Ganti Password</Space>
          </Divider>

          <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
            Kosongkan jika tidak ingin mengganti password.
          </Text>

          <Form.Item
            name="currentPassword"
            label="Password Lama"
            dependencies={["newPassword"]}
            rules={[
              {
                validator(_, value) {
                  const newPwd = form.getFieldValue("newPassword");
                  if (newPwd && !value) {
                    return Promise.reject(new Error("Isi password lama untuk mengganti password"));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input.Password placeholder="Password saat ini" autoComplete="current-password" />
          </Form.Item>

          <Form.Item name="newPassword" label="Password Baru" rules={[{ min: 6, message: "Password minimal 6 karakter" }]}>
            <Input.Password placeholder="Minimal 6 karakter" autoComplete="new-password" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Konfirmasi Password Baru"
            dependencies={["newPassword"]}
            rules={[
              {
                validator(_, value) {
                  if (!value || form.getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Konfirmasi password tidak cocok"));
                },
              },
            ]}
          >
            <Input.Password placeholder="Ulangi password baru" autoComplete="new-password" />
          </Form.Item>

          <Divider />

          <Button type="primary" icon={<Save size={16} />} loading={saving} onClick={handleSave}>
            Simpan Perubahan
          </Button>
        </Form>
      </Card>
    </div>
  );
}
