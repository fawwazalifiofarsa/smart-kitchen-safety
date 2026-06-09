"use client";

import { useState } from "react";

import { LineChart } from "@/components/dashboard/line-chart";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ErrorState, LoadingState } from "@/components/ui/state";
import { TableShell } from "@/components/ui/table";
import type { ChartPoint, Device, SensorReading } from "@/lib/types";
import { formatDateTime, formatMetric, fromDateTimeInputValue } from "@/lib/utils/format";
import { useApiData } from "@/lib/use-api-data";

export default function MonitoringPage() {
  const devices = useApiData<Device[]>("/api/devices");
  const [deviceId, setDeviceId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const selectedDeviceId = deviceId || devices.data?.[0]?.device_id || "";

  const query = selectedDeviceId
    ? `device_id=${selectedDeviceId}&interval=minute${
        startDate ? `&start_date=${encodeURIComponent(fromDateTimeInputValue(startDate) ?? "")}` : ""
      }${endDate ? `&end_date=${encodeURIComponent(fromDateTimeInputValue(endDate) ?? "")}` : ""}`
    : "";

  const charts = useApiData<ChartPoint[]>(
    selectedDeviceId ? `/api/dashboard/charts?${query}` : "",
    { enabled: Boolean(selectedDeviceId) },
  );
  const readings = useApiData<SensorReading[]>(
    selectedDeviceId ? `/api/devices/${selectedDeviceId}/readings?limit=50` : "",
    { enabled: Boolean(selectedDeviceId) },
  );

  if (devices.loading) return <LoadingState label="Memuat data monitoring..." />;
  if (devices.error) return <ErrorState message={devices.error} onRetry={devices.reload} />;

  return (
    <div className="space-y-6">
      <PageHeader
        description="Visualisasi histori pembacaan sensor per perangkat dengan filter rentang waktu sederhana."
        title="Monitoring"
      />

      <Card className="grid gap-4 md:grid-cols-4">
        <Select onChange={(event) => setDeviceId(event.target.value)} value={selectedDeviceId}>
          {(devices.data ?? []).map((device) => (
            <option key={device.device_id} value={device.device_id}>
              {device.name}
            </option>
          ))}
        </Select>
        <Input
          onChange={(event) => setStartDate(event.target.value)}
          type="datetime-local"
          value={startDate}
        />
        <Input
          onChange={(event) => setEndDate(event.target.value)}
          type="datetime-local"
          value={endDate}
        />
        <Button
          onClick={() => {
            charts.reload();
            readings.reload();
          }}
          type="button"
          variant="secondary"
        >
          Refresh
        </Button>
      </Card>

      {charts.loading ? (
        <LoadingState label="Memuat chart monitoring..." />
      ) : charts.error ? (
        <ErrorState message={charts.error} onRetry={charts.reload} />
      ) : (
        <LineChart
          points={charts.data ?? []}
          series={[
            { key: "gas_ppm", label: "Gas", color: "#2563eb" },
            { key: "flame_raw", label: "Flame Raw", color: "#dc2626" },
          ]}
          title="Sensor History Chart"
        />
      )}

      {readings.loading ? (
        <LoadingState label="Memuat histori sensor..." />
      ) : readings.error ? (
        <ErrorState message={readings.error} onRetry={readings.reload} />
      ) : (
        <TableShell>
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--color-surface-muted)] text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Recorded</th>
                <th className="px-4 py-3 font-semibold">Gas</th>
                <th className="px-4 py-3 font-semibold">Flame Raw</th>
                <th className="px-4 py-3 font-semibold">Flame</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {(readings.data ?? []).map((reading) => (
                <tr className="border-t border-[var(--color-border)]" key={reading.reading_id}>
                  <td className="px-4 py-3">{formatDateTime(reading.recorded_at)}</td>
                  <td className="px-4 py-3">{formatMetric(reading.gas_ppm, "ppm")}</td>
                  <td className="px-4 py-3">{formatMetric(reading.flame_raw, "")}</td>
                  <td className="px-4 py-3">
                    {reading.flame_message ?? (reading.flame_detected ? "Detected" : "Clear")}
                  </td>
                  <td className="px-4 py-3">{reading.safe_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      )}
    </div>
  );
}
