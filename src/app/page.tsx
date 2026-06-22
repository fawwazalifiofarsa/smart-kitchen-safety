"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  collectionGroup,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { Card } from "@/components/ui/card";
import { firebaseClientDb } from "@/lib/firebase/client";
import { formatDateTime, formatMetric } from "@/lib/utils/format";

type LandingDevice = {
  device_id: string;
  name: string;
  status: string;
  last_seen_at: unknown;
};

type LandingAlert = {
  alert_id: string;
  title: string;
  severity: string;
  status: string;
};

type LandingReading = {
  reading_id: string;
  device_id: string;
  gas_ppm: number | null;
  flame_raw: number | null;
  flame_detected: boolean;
  flame_message: string | null;
  safe_status: string;
  recorded_at: unknown;
};

function textValue(value: unknown, fallback = "-") {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function booleanValue(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

function normalizeDate(value: unknown) {
  if (!value) return null;

  if (typeof value === "string") return value;

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  return null;
}

function formatLiveDate(value: unknown) {
  const date = normalizeDate(value);
  return date ? formatDateTime(date) : "-";
}

function normalizeStatus(value: string) {
  return value.toLowerCase();
}

function HeroButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  const base =
    "group relative inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-black transition-all duration-300 sm:w-auto sm:px-7";

  const primary =
    "bg-sky-600 text-white shadow-[0_10px_0_#075985,0_24px_45px_-25px_rgba(2,132,199,0.9)] hover:-translate-y-1 hover:shadow-[0_14px_0_#075985,0_35px_55px_-25px_rgba(2,132,199,1)] active:translate-y-2 active:shadow-[0_4px_0_#075985,0_18px_35px_-25px_rgba(2,132,199,0.8)]";

  const secondary =
    "border border-sky-200 bg-white text-sky-900 shadow-[0_10px_0_#bae6fd,0_22px_40px_-30px_rgba(15,23,42,0.55)] hover:-translate-y-1 hover:shadow-[0_14px_0_#bae6fd,0_30px_45px_-30px_rgba(15,23,42,0.65)] active:translate-y-2 active:shadow-[0_4px_0_#bae6fd,0_15px_30px_-30px_rgba(15,23,42,0.45)]";

  return (
    <Link
      className={`${base} ${variant === "primary" ? primary : secondary}`}
      href={href}
    >
      <span className="relative z-10">{children}</span>
      <span className="absolute inset-x-5 top-2 h-4 rounded-full bg-white/30 blur-md transition group-hover:opacity-80" />
    </Link>
  );
}

function ThreeDCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div style={{ perspective: "1200px" }}>
      <div
        className={`transform-gpu rounded-3xl transition-all duration-500 group-hover:-translate-y-2 ${className}`}
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="group">
      <ThreeDCard>
        <Card className="relative overflow-hidden border-sky-100 bg-white/90 shadow-[0_25px_60px_-35px_rgba(15,23,42,0.6)] backdrop-blur transition-all duration-500 group-hover:-translate-y-2 group-hover:rotate-1 group-hover:shadow-[0_35px_80px_-35px_rgba(15,23,42,0.75)]">
          <div className="absolute right-[-28px] top-[-28px] h-24 w-24 rounded-full bg-sky-200/40 blur-2xl transition group-hover:bg-teal-200/60" />
          <p className="relative text-3xl font-black sm:text-4xl">{value}</p>
          <p className="relative mt-1 text-sm font-bold text-slate-700">
            {label}
          </p>
          <p className="relative mt-1 text-sm text-[var(--color-muted)]">
            {description}
          </p>
        </Card>
      </ThreeDCard>
    </div>
  );
}

export default function HomePage() {
  const [devices, setDevices] = useState<LandingDevice[]>([]);
  const [alerts, setAlerts] = useState<LandingAlert[]>([]);
  const [latestReading, setLatestReading] = useState<LandingReading | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeDevices = onSnapshot(
      collection(firebaseClientDb, "devices"),
      (snapshot) => {
        setDevices(
          snapshot.docs.map((doc) => {
            const data = doc.data();

            return {
              device_id: doc.id,
              name: textValue(data.name, `Device ${doc.id}`),
              status: textValue(data.status, "unknown"),
              last_seen_at: data.last_seen_at ?? null,
            };
          }),
        );

        setError(null);
      },
      () => {
        setError("Gagal memuat data perangkat dari Firebase.");
      },
    );

    const activeAlertsQuery = query(
      collection(firebaseClientDb, "alerts"),
      where("status", "==", "active"),
      limit(10),
    );

    const unsubscribeAlerts = onSnapshot(
      activeAlertsQuery,
      (snapshot) => {
        setAlerts(
          snapshot.docs.map((doc) => {
            const data = doc.data();

            return {
              alert_id: doc.id,
              title: textValue(data.title, "Active Alert"),
              severity: textValue(data.severity, "warning"),
              status: textValue(data.status, "active"),
            };
          }),
        );

        setError(null);
      },
      () => {
        setError("Gagal memuat data alert dari Firebase.");
      },
    );

    const latestReadingQuery = query(
      collectionGroup(firebaseClientDb, "sensor_readings"),
      orderBy("recorded_at", "desc"),
      limit(1),
    );

    const unsubscribeLatestReading = onSnapshot(
      latestReadingQuery,
      (snapshot) => {
        const doc = snapshot.docs[0];

        if (!doc) {
          setLatestReading(null);
          return;
        }

        const data = doc.data();

        setLatestReading({
          reading_id: doc.id,
          device_id: textValue(data.device_id),
          gas_ppm: numberValue(data.gas_ppm),
          flame_raw: numberValue(data.flame_raw),
          flame_detected: booleanValue(data.flame_detected),
          flame_message:
            typeof data.flame_message === "string" ? data.flame_message : null,
          safe_status: textValue(data.safe_status, "normal"),
          recorded_at: data.recorded_at ?? null,
        });

        setError(null);
      },
      () => {
        setError("Gagal memuat pembacaan sensor terbaru dari Firebase.");
      },
    );

    return () => {
      unsubscribeDevices();
      unsubscribeAlerts();
      unsubscribeLatestReading();
    };
  }, []);

  const activeDevices = useMemo(
    () =>
      devices.filter(
        (device) =>
          normalizeStatus(device.status) === "online" ||
          normalizeStatus(device.status) === "active",
      ).length,
    [devices],
  );

  const dangerAlerts = useMemo(
    () =>
      alerts.filter((alert) => {
        const severity = normalizeStatus(alert.severity);

        return severity === "critical" || severity === "danger";
      }).length,
    [alerts],
  );

  const currentGas = latestReading?.gas_ppm ?? 0;
  const currentFlame =
    latestReading?.flame_message ??
    (latestReading?.flame_detected ? "Detected" : "Clear");

  const currentStatus = normalizeStatus(latestReading?.safe_status ?? "normal");

  const isDanger =
    dangerAlerts > 0 ||
    currentStatus === "danger" ||
    currentStatus === "critical" ||
    currentStatus === "gawat";

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_right,#bae6fd_0%,transparent_32%),linear-gradient(180deg,#f8fbff_0%,#eef9f7_100%)] text-slate-950">
      <style>
        {`
          @keyframes floatY {
            0%, 100% {
              transform: translateY(0) rotateX(0deg) rotateY(0deg);
            }
            50% {
              transform: translateY(-18px) rotateX(3deg) rotateY(-3deg);
            }
          }

          @keyframes softPulse {
            0%, 100% {
              opacity: 0.55;
              transform: scale(1);
            }
            50% {
              opacity: 1;
              transform: scale(1.08);
            }
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(28px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes glowMove {
            0%, 100% {
              transform: translateX(-20%) translateY(-10%);
            }
            50% {
              transform: translateX(20%) translateY(10%);
            }
          }

          @keyframes barPulse {
            0%, 100% {
              transform: scaleY(0.72);
              opacity: 0.75;
            }
            50% {
              transform: scaleY(1);
              opacity: 1;
            }
          }

          .animate-float-3d {
            animation: floatY 5.5s ease-in-out infinite;
          }

          .animate-soft-pulse {
            animation: softPulse 3.5s ease-in-out infinite;
          }

          .animate-slide-up {
            animation: slideUp 800ms ease-out both;
          }

          .animate-glow-move {
            animation: glowMove 7s ease-in-out infinite;
          }

          .bar-pulse {
            transform-origin: bottom;
            animation: barPulse 2.6s ease-in-out infinite;
          }

          @media (prefers-reduced-motion: reduce) {
            .animate-float-3d,
            .animate-soft-pulse,
            .animate-slide-up,
            .animate-glow-move,
            .bar-pulse {
              animation: none;
            }
          }
        `}
      </style>

      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="animate-soft-pulse absolute right-[-220px] top-[-220px] h-[360px] w-[360px] rounded-full bg-sky-300/40 blur-3xl sm:h-[460px] sm:w-[460px]" />
        <div className="animate-soft-pulse absolute bottom-[-220px] left-[-200px] h-[360px] w-[360px] rounded-full bg-teal-300/40 blur-3xl sm:h-[440px] sm:w-[440px]" />
        <div className="animate-glow-move absolute left-1/2 top-1/3 h-32 w-32 rounded-full bg-white/70 blur-3xl sm:h-40 sm:w-40" />

        <nav className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-sky-700 sm:text-xs sm:tracking-[0.32em]">
              IoT Safety Platform
            </p>
            <h1 className="text-lg font-black sm:text-xl">
              Smart Kitchen Safety
            </h1>
          </div>

          <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:items-center">
            <HeroButton href="/login" variant="secondary">
              Login
            </HeroButton>
            <HeroButton href="/dashboard">Dashboard</HeroButton>
          </div>
        </nav>

        <div className="relative z-10 grid flex-1 items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div className="animate-slide-up space-y-7 sm:space-y-8">
            <div className="inline-flex rounded-full border border-sky-200 bg-white/80 px-4 py-2 text-xs font-semibold text-sky-800 shadow-sm backdrop-blur sm:text-sm">
              Live Firebase data, 3D dashboard, and Telegram danger alert
            </div>

            <div className="space-y-5">
              <h2 className="max-w-4xl text-4xl font-black tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Kitchen safety monitoring with a real-time smart dashboard.
              </h2>

              <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base md:text-lg md:leading-8">
                Pantau kebocoran gas, deteksi api, status perangkat, dan alert
                bahaya secara live. Sistem membantu user merespons kondisi
                danger lebih cepat melalui dashboard dan Telegram.
              </p>
            </div>

            <div className="grid gap-3 sm:flex sm:flex-wrap">
              <HeroButton href="/login">Start Monitoring</HeroButton>
              <HeroButton href="#features" variant="secondary">
                View Features
              </HeroButton>
            </div>

            {error ? (
              <div className="max-w-2xl rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            ) : null}

            <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
              <MetricCard
                description="Total node yang terdaftar."
                label="Total perangkat"
                value={devices.length}
              />
              <MetricCard
                description="Node yang sedang online."
                label="Device online"
                value={activeDevices}
              />
              <MetricCard
                description="Alert aktif saat ini."
                label="Active alerts"
                value={alerts.length}
              />
            </div>
          </div>

          <div style={{ perspective: "1400px" }}>
            <Card
              className="animate-float-3d relative overflow-hidden p-0 shadow-[0_40px_100px_-45px_rgba(15,23,42,0.8)]"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.28),transparent_34%)]" />

              <div className="relative bg-[linear-gradient(160deg,#082f49_0%,#0f766e_100%)] p-4 text-white sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-100 sm:text-xs sm:tracking-[0.24em]">
                      Live Firebase Status
                    </p>
                    <h3 className="mt-2 text-xl font-black sm:text-2xl">
                      {latestReading?.device_id ?? "Waiting for sensor"}
                    </h3>
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1 text-sm font-bold ring-1 ${isDanger
                      ? "bg-rose-400/20 text-rose-100 ring-rose-200/30"
                      : "bg-emerald-400/20 text-emerald-100 ring-emerald-200/30"
                      }`}
                  >
                    {isDanger ? "Danger" : "Safe"}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:grid-cols-2">
                  <div className="group">
                    <ThreeDCard>
                      <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/10 backdrop-blur transition duration-500 group-hover:-translate-y-2 group-hover:rotate-1">
                        <p className="text-sm text-sky-100">Gas Level</p>
                        <p className="mt-2 text-4xl font-black sm:text-5xl">
                          {formatMetric(currentGas, "")}
                        </p>
                        <p className="mt-1 text-sm text-sky-100">ppm</p>
                      </div>
                    </ThreeDCard>
                  </div>

                  <div className="group">
                    <ThreeDCard>
                      <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/10 backdrop-blur transition duration-500 group-hover:-translate-y-2 group-hover:rotate-1">
                        <p className="text-sm text-sky-100">Flame Status</p>
                        <p className="mt-2 text-3xl font-black sm:text-4xl">
                          {currentFlame}
                        </p>
                        <p className="mt-1 text-sm text-sky-100">
                          Raw:{" "}
                          {formatMetric(latestReading?.flame_raw ?? null, "")}
                        </p>
                      </div>
                    </ThreeDCard>
                  </div>

                  <div className="group">
                    <ThreeDCard>
                      <div className="rounded-3xl bg-rose-500/20 p-5 ring-1 ring-rose-200/20 backdrop-blur transition duration-500 group-hover:-translate-y-2 group-hover:rotate-1">
                        <p className="text-sm text-rose-100">Danger Alert</p>
                        <p className="mt-2 text-4xl font-black sm:text-5xl">
                          {dangerAlerts}
                        </p>
                        <p className="mt-1 text-sm text-rose-100">
                          Active critical alert
                        </p>
                      </div>
                    </ThreeDCard>
                  </div>

                  <div className="group">
                    <ThreeDCard>
                      <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/10 backdrop-blur transition duration-500 group-hover:-translate-y-2 group-hover:rotate-1">
                        <p className="text-sm text-sky-100">Last Update</p>
                        <p className="mt-2 text-lg font-black sm:text-xl">
                          {formatLiveDate(latestReading?.recorded_at)}
                        </p>
                        <p className="mt-1 text-sm text-sky-100">
                          Live snapshot
                        </p>
                      </div>
                    </ThreeDCard>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl bg-white p-5 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="font-bold">Live Signal</p>
                    <p
                      className={`text-xs font-semibold ${isDanger ? "text-rose-600" : "text-emerald-600"
                        }`}
                    >
                      {currentStatus.toUpperCase()}
                    </p>
                  </div>

                  <div className="flex h-24 items-end gap-1.5 sm:h-28 sm:gap-2">
                    {[22, 36, 48, 34, 58, 44, 64, 52, 42, 56, 39, 46].map(
                      (height, index) => {
                        const liveBoost = Math.min(currentGas / 10, 50);
                        const nextHeight = Math.min(height + liveBoost, 100);

                        return (
                          <div
                            className={`bar-pulse flex-1 rounded-t-xl transition-all duration-700 ${isDanger ? "bg-rose-600" : "bg-sky-600"
                              }`}
                            key={index}
                            style={{
                              height: `${nextHeight}%`,
                              animationDelay: `${index * 90}ms`,
                            }}
                          />
                        );
                      },
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section
        className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 lg:pb-24"
        id="features"
      >
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-sky-700">
            Core Features
          </p>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl md:text-5xl">
            Designed for fast safety response.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="group">
            <ThreeDCard>
              <Card className="h-full transition duration-500 group-hover:-translate-y-2 group-hover:rotate-1 group-hover:shadow-2xl">
                <h3 className="text-xl font-black">Gas Leak Detection</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                  Sistem membaca nilai gas dari sensor MQ dan menandai kondisi
                  normal, warning, atau danger.
                </p>
              </Card>
            </ThreeDCard>
          </div>

          <div className="group">
            <ThreeDCard>
              <Card className="h-full transition duration-500 group-hover:-translate-y-2 group-hover:rotate-1 group-hover:shadow-2xl">
                <h3 className="text-xl font-black">Fire Detection</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                  Flame sensor membantu mendeteksi potensi api di area dapur.
                </p>
              </Card>
            </ThreeDCard>
          </div>

          <div className="group">
            <ThreeDCard>
              <Card className="h-full transition duration-500 group-hover:-translate-y-2 group-hover:rotate-1 group-hover:shadow-2xl">
                <h3 className="text-xl font-black">Telegram Auto Alert</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                  Saat data IoT masuk status danger, sistem otomatis mengirim
                  notifikasi Telegram ke user.
                </p>
              </Card>
            </ThreeDCard>
          </div>
        </div>
      </section>
    </main>
  );
}