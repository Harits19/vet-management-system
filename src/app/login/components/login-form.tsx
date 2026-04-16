"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import useLogin from "@/hooks/api/useLogin";
import { LoginInput } from "@/shared/types";

const defaultValues: LoginInput = {
  email: "admin@vet.local",
  password: "admin123",
};

export default function LoginForm() {
  const router = useRouter();
  const { login, isLoading, errorMessage } = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ defaultValues });

  async function onSubmit(values: LoginInput) {
    await login({
      email: values.email.trim().toLowerCase(),
      password: values.password,
    });

    router.push("/products");
    router.refresh();
  }

  return (
    <div className="auth-shell">
      <section className="auth-hero">
        <p className="eyebrow">Secure Access</p>
        <h1>Masuk ke dashboard klinik dengan akun MongoDB.</h1>
        <p className="muted">
          Session disimpan di cookie `httpOnly` dan diverifikasi lewat Express
          API.
        </p>
        <div className="auth-note">
          <strong>Akun default</strong>
          <span>Email: admin@vet.local</span>
          <span>Password: admin123</span>
        </div>
      </section>

      <form className="panel auth-panel" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <p className="eyebrow">Login</p>
          <h2>Selamat datang kembali</h2>
          <p className="muted">
            Gunakan akun admin bawaan atau user yang sudah tersimpan di MongoDB.
          </p>
        </div>

        <label>
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            {...register("email", {
              required: "Email wajib diisi.",
              pattern: {
                value: /\S+@\S+\.\S+/,
                message: "Format email tidak valid.",
              },
            })}
          />
          <small>{errors.email?.message}</small>
        </label>

        <label>
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            {...register("password", {
              required: "Password wajib diisi.",
              minLength: {
                value: 6,
                message: "Password minimal 6 karakter.",
              },
            })}
          />
          <small>{errors.password?.message}</small>
        </label>

        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

        <div className="actions">
          <button className="button" disabled={isLoading} type="submit">
            {isLoading ? "Memproses..." : "Masuk"}
          </button>
          <Link className="button secondary" href="/">
            Kembali ke Home
          </Link>
        </div>
      </form>
    </div>
  );
}
