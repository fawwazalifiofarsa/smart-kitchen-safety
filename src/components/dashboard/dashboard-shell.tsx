"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/format";

type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
};

const navigation: NavItem[] = [
  { href: "/dashboard", label: "Overview", shortLabel: "OV" },
  { href: "/dashboard/devices", label: "Devices", shortLabel: "DV" },
  { href: "/dashboard/monitoring", label: "Monitoring", shortLabel: "MN" },
  { href: "/dashboard/alerts", label: "Alerts", shortLabel: "AL" },
  { href: "/dashboard/users", label: "Users", shortLabel: "US" },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: "{}",
    });

    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-full">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-72 border-r border-[var(--color-border)] bg-[linear-gradient(180deg,#0f2742_0%,#123a56_46%,#1b5a68_100%)] px-6 py-6 text-white transition md:static md:block",
            open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-sky-100/70">
                Safety Platform
              </p>
              <p className="mt-2 text-xl font-semibold">Smart Kitchen Safety</p>
            </div>
            <Button
              className="md:hidden"
              onClick={() => setOpen(false)}
              type="button"
              variant="ghost"
            >
              Close
            </Button>
          </div>

          <nav className="mt-10 space-y-2">
            {navigation.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                    active
                      ? "bg-white/12 text-white"
                      : "text-sky-100/80 hover:bg-white/10 hover:text-white",
                  )}
                  href={item.href}
                  key={item.href}
                  onClick={() => setOpen(false)}
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold tracking-[0.12em]">
                    {item.shortLabel}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-white/80 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-8">
              <div className="flex items-center gap-3">
                <Button onClick={() => setOpen(true)} type="button" variant="secondary" className="md:hidden">
                  Menu
                </Button>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
                    Live Monitoring Dashboard
                  </p>
                  <p className="text-sm font-semibold text-[var(--color-foreground)]">
                    Kitchen gas, fire, temperature, humidity, and device health
                  </p>
                </div>
              </div>
              <Button onClick={handleLogout} type="button" variant="ghost">
                Sign out
              </Button>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
        </div>
      </div>
      {open ? (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-slate-950/30 md:hidden"
          onClick={() => setOpen(false)}
          type="button"
        />
      ) : null}
    </div>
  );
}
