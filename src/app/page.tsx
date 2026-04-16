import Link from "next/link";

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Fresh Start</p>
          <h1>Vet Management System rebuilt from scratch.</h1>
          <p className="muted">
            Frontend menggunakan Next.js App Router dan backend menggunakan
            Express + TypeScript.
          </p>
        </div>
        <div className="actions">
          <Link className="button" href="/products">
            Buka Produk
          </Link>
          <a className="button secondary" href="http://localhost:4000/api/health">
            Cek API Health
          </a>
        </div>
      </section>
    </main>
  );
}
