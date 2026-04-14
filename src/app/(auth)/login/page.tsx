"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { LoginRequestBody, LoginResponseData } from "@/lib/types";
import { fetchJson } from "@/lib/use-api-data";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState<LoginRequestBody>({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      await fetchJson<LoginResponseData>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });

      router.replace("/dashboard");
      router.refresh();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Login gagal");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[28px] bg-[linear-gradient(160deg,#0e2844_0%,#12547a_52%,#2e8c84_100%)] p-8 text-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.6)] md:p-10">
          <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium">
            Smart Kitchen Safety System
          </div>
          <div className="mt-10 space-y-6">
            <h1 className="max-w-xl text-4xl font-bold tracking-tight">
              Smart dashboard for live kitchen gas leak and fire monitoring.
            </h1>
            <p className="max-w-xl text-base leading-7 text-sky-100/82">
              Pantau kebocoran gas, deteksi api, suhu, kelembaban, status
              perangkat, alert, notification log, dan pengaturan ambang batas
              dalam satu dashboard.
            </p>
          </div>
        </section>

        <Card className="self-center p-8 md:p-10">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
              Dashboard Access
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
              Sign in
            </h2>
            <p className="text-sm text-[var(--color-muted)]">
              Gunakan akun Firebase Authentication yang sudah terdaftar di
              dashboard.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-[var(--color-foreground)]"
                htmlFor="email"
              >
                Email
              </label>
              <Input
                id="email"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                placeholder="admin@example.com"
                type="email"
                value={form.email}
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-[var(--color-foreground)]"
                htmlFor="password"
              >
                Password
              </label>
              <Input
                id="password"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                placeholder="••••••••"
                type="password"
                value={form.password}
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <Button className="w-full py-3" disabled={pending} type="submit">
              {pending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
