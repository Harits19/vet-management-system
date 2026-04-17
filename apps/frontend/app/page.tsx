import { HeartPulse, PawPrint, PhoneCall, Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Product } from "../../shared/types/product";

export default async function HomePage() {
  const patients: Product[] = [{ category: "Test" }];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-10">
      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <Card className="border-white/60 bg-white/85 shadow-xl shadow-emerald-950/5 backdrop-blur">
          <CardHeader className="gap-5">
            <Badge className="w-fit bg-primary/10 text-primary hover:bg-primary/10">
              Monorepo Starter
            </Badge>
            <div className="space-y-3">
              <CardTitle className="max-w-2xl text-4xl leading-tight md:text-5xl">
                Dashboard klinik hewan dengan shared types untuk frontend dan
                backend.
              </CardTitle>
              <CardDescription className="max-w-xl text-base text-muted-foreground">
                Next.js menampilkan data pasien, Express.js menyajikan API, dan
                paket `@vet/shared-types` tersedia sebagai workspace package di
                `node_modules`.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <a
                href="http://localhost:4000/api/health"
                target="_blank"
                rel="noreferrer"
              >
                Cek Backend
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a
                href="http://localhost:4000/api/patients"
                target="_blank"
                rel="noreferrer"
              >
                Lihat Endpoint Pasien
              </a>
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <SummaryCard
            icon={HeartPulse}
            label="Pasien aktif"
            value={`${patients.length}`}
          />
          <SummaryCard
            icon={Stethoscope}
            label="Teknologi"
            value="Next.js + Express + MongoDB"
          />
          <SummaryCard
            icon={PawPrint}
            label="Shared package"
            value="@vet/shared-types"
          />
        </div>
      </section>

      <section className="grid gap-4">
        {patients.map((product) => (
          <Card
            key={product.category}
            className="border-white/60 bg-white/80 shadow-lg shadow-emerald-950/5"
          >
            {product.category}
          </Card>
        ))}
      </section>
    </main>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof HeartPulse;
  label: string;
  value: string;
}) {
  return (
    <Card className="border-white/60 bg-white/80 shadow-lg shadow-emerald-950/5">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="rounded-2xl bg-primary/10 p-3 text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
