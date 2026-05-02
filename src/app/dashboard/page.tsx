"use client";

import { useApiData } from "@/lib/use-api-data";
import type { Alert, ChartPoint, DashboardOverview } from "@/lib/types";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { LineChart } from "@/components/dashboard/line-chart";
import { ErrorState, LoadingState, EmptyState } from "@/components/ui/state";
import { TableShell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatMetric } from "@/lib/utils/format";

export default function DashboardOverviewPage() {
  const overview = useApiData<DashboardOverview>("/api/dashboard/overview");
  const charts = useApiData<ChartPoint[]>("/api/dashboard/charts?interval=hour");
  const alerts = useApiData<Alert[]>("/api/alerts?status=active");

  if (overview.loading || charts.loading || alerts.loading) {
    return <LoadingState label="Memuat dashboard overview..." />;
  }

  if (overview.error || charts.error || alerts.error) {
    return (
      <ErrorState
        message={overview.error ?? charts.error ?? alerts.error ?? "Request gagal"}
        onRetry={() => {
          overview.reload();
          charts.reload();
          alerts.reload();
        }}
      />
    );
  }

  if (!overview.data) {
    return (
      <EmptyState
        title="Overview belum tersedia"
        description="Belum ada data ringkasan untuk ditampilkan."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Ringkasan perangkat, alert aktif, pembacaan sensor terbaru, dan chart monitoring."
        title="Dashboard Overview"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          hint="Total perangkat terdaftar"
          href="/dashboard/devices"
          label="Devices Total"
          value={`${overview.data.devices_total}`}
        />
        <StatCard
          hint="Perangkat aktif dan terhubung"
          href="/dashboard/devices"
          label="Devices Online"
          value={`${overview.data.devices_online}`}
        />
        <StatCard
          hint="Perangkat tidak aktif atau timeout"
          href="/dashboard/devices"
          label="Devices Offline"
          value={`${overview.data.devices_offline}`}
        />
        <StatCard
          hint="Alert yang masih membutuhkan tindak lanjut"
          href="/dashboard/alerts"
          label="Active Alerts"
          value={`${overview.data.active_alerts}`}
        />
        <StatCard
          hint="Alert level kritis"
          href="/dashboard/alerts"
          label="Critical Alerts"
          value={`${overview.data.critical_alerts}`}
        />
      </section>

      <LineChart
        points={charts.data ?? []}
        series={[
          { key: "temperature_c", label: "Temperature", color: "#dc2626" },
          { key: "gas_ppm", label: "Gas", color: "#2563eb" },
          { key: "humidity_pct", label: "Humidity", color: "#0f766e" },
          { key: "smoke_pct", label: "Smoke", color: "#7c3aed" },
        ]}
        title="Monitoring Chart"
      />

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            Latest Sensor Readings
          </h2>
          <TableShell>
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[var(--color-surface-muted)] text-[var(--color-muted)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Device</th>
                  <th className="px-4 py-3 font-semibold">Temperature</th>
                  <th className="px-4 py-3 font-semibold">Humidity</th>
                  <th className="px-4 py-3 font-semibold">Gas</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Recorded</th>
                </tr>
              </thead>
              <tbody>
                {overview.data.latest_readings.map((reading) => (
                  <tr className="border-t border-[var(--color-border)]" key={reading.device_id}>
                    <td className="px-4 py-3 font-medium">{reading.name}</td>
                    <td className="px-4 py-3">{formatMetric(reading.temperature_c, "°C")}</td>
                    <td className="px-4 py-3">{formatMetric(reading.humidity_pct, "%")}</td>
                    <td className="px-4 py-3">{formatMetric(reading.gas_ppm, "ppm")}</td>
                    <td className="px-4 py-3">
                      <Badge tone={reading.safe_status}>{reading.safe_status}</Badge>
                    </td>
                    <td className="px-4 py-3">{formatDateTime(reading.recorded_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            Active Alert Summary
          </h2>
          {(alerts.data ?? []).length === 0 ? (
            <EmptyState
              description="Belum ada alert aktif saat ini."
              title="No active alerts"
            />
          ) : (
            <div className="space-y-3">
              {(alerts.data ?? []).slice(0, 5).map((alert) => (
                <div
                  className="rounded-2xl border border-[var(--color-border)] bg-white p-4"
                  key={alert.alert_id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-[var(--color-foreground)]">
                      {alert.title}
                    </p>
                    <Badge tone={alert.severity}>{alert.severity}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-[var(--color-muted)]">
                    {alert.message}
                  </p>
                  <p className="mt-3 text-xs text-[var(--color-muted)]">
                    {formatDateTime(alert.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
