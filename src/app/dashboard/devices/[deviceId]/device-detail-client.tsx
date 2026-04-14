"use client";

import { LineChart } from "@/components/dashboard/line-chart";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TableShell } from "@/components/ui/table";
import { formatDateTime, formatMetric } from "@/lib/utils/format";

export function DeviceDetailClient() {
  const device = {
    device_id: "device_001",
    name: "Smart Sensor",
    location: "Kitchen",
    room: "Room A",
    status: "online",
    last_seen_at: "2026-04-14T10:00:00Z",
    firmware_version: "1.0.0",
  };

  const latest = {
    temperature_c: 32,
    humidity_pct: 65,
    gas_ppm: 16,
    safe_status: "safe",
  };

  const readings = [
    {
      reading_id: "1",
      recorded_at: "2026-04-14T09:50:00Z",
      temperature_c: 31,
      humidity_pct: 64,
      gas_ppm: 15,
      safe_status: "safe",
    },
    {
      reading_id: "2",
      recorded_at: "2026-04-14T09:40:00Z",
      temperature_c: 30,
      humidity_pct: 63,
      gas_ppm: 14,
      safe_status: "safe",
    },
  ];

  const charts = [
    {
      time: "09:40",
      temperature_c: 30,
      gas_ppm: 14,
      humidity_pct: 63,
      smoke_pct: 3,
    },
    {
      time: "09:50",
      temperature_c: 31,
      gas_ppm: 15,
      humidity_pct: 64,
      smoke_pct: 4,
    },
    {
      time: "10:00",
      temperature_c: 32,
      gas_ppm: 16,
      humidity_pct: 65,
      smoke_pct: 5,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        description={`${device.location} / ${device.room}`}
        title={device.name}
      />

      <section className="grid gap-6">
        <div className="space-y-6">

          <Card className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-[var(--color-muted)]">Device ID</p>
              <p className="font-semibold">{device.device_id}</p>
            </div>

            <div>
              <p className="text-sm text-[var(--color-muted)]">Status</p>
              <Badge tone={device.status}>{device.status}</Badge>
            </div>

            <div>
              <p className="text-sm text-[var(--color-muted)]">Last Seen</p>
              <p>{formatDateTime(device.last_seen_at)}</p>
            </div>

            <div>
              <p className="text-sm text-[var(--color-muted)]">Firmware</p>
              <p>{device.firmware_version}</p>
            </div>
          </Card>

          <Card className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-[var(--color-muted)]">Temperature</p>
              <p className="text-2xl font-bold">
                {formatMetric(latest.temperature_c, "°C")}
              </p>
            </div>

            <div>
              <p className="text-sm text-[var(--color-muted)]">Humidity</p>
              <p className="text-2xl font-bold">
                {formatMetric(latest.humidity_pct, "%")}
              </p>
            </div>

            <div>
              <p className="text-sm text-[var(--color-muted)]">Gas</p>
              <p className="text-2xl font-bold">
                {formatMetric(latest.gas_ppm, "ppm")}
              </p>
            </div>

            <div>
              <p className="text-sm text-[var(--color-muted)]">Status</p>
              <Badge tone={latest.safe_status}>
                {latest.safe_status}
              </Badge>
            </div>
          </Card>

          <LineChart
            points={charts}
            series={[
              { key: "temperature_c", label: "Temperature", color: "#dc2626" },
              { key: "gas_ppm", label: "Gas", color: "#2563eb" },
              { key: "humidity_pct", label: "Humidity", color: "#0f766e" },
              { key: "smoke_pct", label: "Smoke", color: "#7c3aed" },
            ]}
            title="Device Monitoring Chart"
          />

          <TableShell>
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[var(--color-surface-muted)] text-[var(--color-muted)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Recorded</th>
                  <th className="px-4 py-3 font-semibold">Temp</th>
                  <th className="px-4 py-3 font-semibold">Humidity</th>
                  <th className="px-4 py-3 font-semibold">Gas</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>

              <tbody>
                {readings.map((r) => (
                  <tr
                    key={r.reading_id}
                    className="border-t border-[var(--color-border)]"
                  >
                    <td className="px-4 py-3">
                      {formatDateTime(r.recorded_at)}
                    </td>
                    <td className="px-4 py-3">
                      {formatMetric(r.temperature_c, "°C")}
                    </td>
                    <td className="px-4 py-3">
                      {formatMetric(r.humidity_pct, "%")}
                    </td>
                    <td className="px-4 py-3">
                      {formatMetric(r.gas_ppm, "ppm")}
                    </td>
                    <td className="px-4 py-3">
                      {r.safe_status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>

        </div>
      </section>
    </div>
  );
}