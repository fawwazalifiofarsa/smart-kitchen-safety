"use client";

import { useState } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/state";
import { TableShell } from "@/components/ui/table";
import type { Device, DeviceStatusLog, SensorReading } from "@/lib/types";
import { formatDateTime, formatMetric} from "@/lib/utils/format";
import { fetchJson, useApiData } from "@/lib/use-api-data";

export function DeviceDetailClient({ deviceId }: { deviceId: string }) {
  const device = useApiData<Device>(`/api/devices/${deviceId}`);
  const latest = useApiData<SensorReading>(`/api/devices/${deviceId}/readings/latest`);
  const readings = useApiData<SensorReading[]>(`/api/devices/${deviceId}/readings?limit=20`);
  const statusLogs = useApiData<DeviceStatusLog[]>(
    `/api/devices/${deviceId}/status-logs?limit=20`,
  );
  const [form] = useState({
    name: "",
    location: "",
    room: "",
    local_alarm_enabled: true,
    is_active: true,
  });

  const currentDevice = device.data;

  if (device.loading || latest.loading || readings.loading || statusLogs.loading) {
    return <LoadingState label="Memuat detail perangkat..." />;
  }

  if (device.error || latest.error || readings.error  || statusLogs.error) {
    return (
      <ErrorState
        message={
          device.error ??
          latest.error ??
          readings.error ??
          statusLogs.error ??
          "Request gagal"
        }
        onRetry={() => {
          device.reload();
          latest.reload();
          readings.reload();
          statusLogs.reload();
        }}
      />
    ); 
  }

  if (!currentDevice) return <ErrorState message="Perangkat tidak ditemukan" />;

  return (
    <div className="space-y-6">
      <PageHeader
        description={`${currentDevice.location}${currentDevice.room ? ` / ${currentDevice.room}` : ""}`}
        title={currentDevice.name}
      />

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-[var(--color-muted)]">Device ID</p>
              <p className="mt-1 font-semibold">{currentDevice.device_id}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--color-muted)]">Status</p>
              <div className="mt-2">
                <Badge tone={currentDevice.status}>{currentDevice.status}</Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-[var(--color-muted)]">Last seen</p>
              <p className="mt-1 font-semibold">{formatDateTime(currentDevice.last_seen_at)}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--color-muted)]">Firmware</p>
              <p className="mt-1 font-semibold">{currentDevice.firmware_version ?? "-"}</p>
            </div>
          </Card>

          {latest.data ? (
            <Card className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-[var(--color-muted)]">Temperature</p>
                <p className="mt-1 text-2xl font-bold">{formatMetric(latest.data.temperature_c, "°C")}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--color-muted)]">Humidity</p>
                <p className="mt-1 text-2xl font-bold">{formatMetric(latest.data.humidity_pct, "%")}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--color-muted)]">Gas</p>
                <p className="mt-1 text-2xl font-bold">{formatMetric(latest.data.gas_ppm, "ppm")}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--color-muted)]">Latest status</p>
                <div className="mt-2">
                  <Badge tone={latest.data.safe_status}>{latest.data.safe_status}</Badge>
                </div>
              </div>
            </Card>
          ) : null}

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
                {(readings.data ?? []).map((reading) => (
                  <tr className="border-t border-[var(--color-border)]" key={reading.reading_id}>
                    <td className="px-4 py-3">{formatDateTime(reading.recorded_at)}</td>
                    <td className="px-4 py-3">{formatMetric(reading.temperature_c, "°C")}</td>
                    <td className="px-4 py-3">{formatMetric(reading.humidity_pct, "%")}</td>
                    <td className="px-4 py-3">{formatMetric(reading.gas_ppm, "ppm")}</td>
                    <td className="px-4 py-3">{reading.safe_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              Status Logs
            </h2>
            <div className="mt-4 space-y-3">
              {(statusLogs.data ?? []).map((log) => (
                <div className="rounded-xl border border-[var(--color-border)] p-3" key={log.log_id}>
                  <p className="font-medium text-[var(--color-foreground)]">
                    {log.previous_status ?? "-"} → {log.new_status}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">{log.reason}</p>
                  <p className="mt-2 text-xs text-[var(--color-muted)]">
                    {formatDateTime(log.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}