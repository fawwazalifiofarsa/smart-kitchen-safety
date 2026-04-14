"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState, LoadingState } from "@/components/ui/state";
import { TableShell } from "@/components/ui/table";
import type { Alert, CreateAlertRequestBody, Device } from "@/lib/types";
import { formatDateTime } from "@/lib/utils/format";
import { fetchJson, useApiData } from "@/lib/use-api-data";

const emptyForm: CreateAlertRequestBody = {
  device_id: "",
  type: "high_temperature",
  severity: "warning",
  title: "",
  message: "",
  trigger_values: {
    gas_ppm: null,
    temperature_c: null,
    flame_detected: false,
    humidity_pct: null,
  },
};

export default function AlertsPage() {
  const alerts = useApiData<Alert[]>("/api/alerts");
  const devices = useApiData<Device[]>("/api/devices");
  const [form, setForm] = useState<CreateAlertRequestBody>(emptyForm);
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [saving, setSaving] = useState(false);

  const filteredAlerts = useMemo(() => {
    const items = alerts.data ?? [];
    return items.filter((alert) => {
      const matchesStatus = statusFilter === "all" ? true : alert.status === statusFilter;
      const matchesSeverity =
        severityFilter === "all" ? true : alert.severity === severityFilter;
      return matchesStatus && matchesSeverity;
    });
  }, [alerts.data, severityFilter, statusFilter]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await fetchJson("/api/alerts", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm(emptyForm);
      alerts.reload();
    } finally {
      setSaving(false);
    }
  }

  if (alerts.loading || devices.loading) {
    return <LoadingState label="Memuat modul alert..." />;
  }

  if (alerts.error || devices.error) {
    return (
      <ErrorState
        message={alerts.error ?? devices.error ?? "Request gagal"}
        onRetry={() => {
          alerts.reload();
          devices.reload();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Daftar alert sistem, filter status dan severity, serta pembuatan alert manual."
        title="Alerts"
      />

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </Select>
            <Select
              onChange={(event) => setSeverityFilter(event.target.value)}
              value={severityFilter}
            >
              <option value="all">All severity</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
              <option value="info">Info</option>
            </Select>
          </div>
          <TableShell>
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[var(--color-surface-muted)] text-[var(--color-muted)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Alert</th>
                  <th className="px-4 py-3 font-semibold">Severity</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map((alert) => (
                  <tr className="border-t border-[var(--color-border)]" key={alert.alert_id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--color-foreground)]">{alert.title}</p>
                      <p className="text-xs text-[var(--color-muted)]">{alert.device_id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={alert.severity}>{alert.severity}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={alert.status}>{alert.status}</Badge>
                    </td>
                    <td className="px-4 py-3">{formatDateTime(alert.created_at)}</td>
                    <td className="px-4 py-3">
                      <Link
                        className="font-semibold text-sky-700"
                        href={`/dashboard/alerts/${alert.alert_id}`}
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        </div>

        <Card>
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            Manual Alert
          </h2>
          <form className="mt-5 space-y-4" onSubmit={handleCreate}>
            <Select
              onChange={(event) =>
                setForm((current) => ({ ...current, device_id: event.target.value }))
              }
              value={form.device_id}
            >
              <option value="">Select device</option>
              {(devices.data ?? []).map((device) => (
                <option key={device.device_id} value={device.device_id}>
                  {device.name}
                </option>
              ))}
            </Select>
            <Input
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Suhu tinggi terdeteksi"
              value={form.title}
            />
            <Textarea
              onChange={(event) =>
                setForm((current) => ({ ...current, message: event.target.value }))
              }
              placeholder="Deskripsi alert..."
              value={form.message}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                onChange={(event) =>
                  setForm((current) => ({ ...current, type: event.target.value }))
                }
                value={form.type}
              >
                <option value="high_temperature">High temperature</option>
                <option value="gas_leak">Gas leak</option>
                <option value="fire_detected">Fire detected</option>
              </Select>
              <Select
                onChange={(event) =>
                  setForm((current) => ({ ...current, severity: event.target.value }))
                }
                value={form.severity}
              >
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
                <option value="info">Info</option>
              </Select>
            </div>
            <Button className="w-full" disabled={saving} type="submit">
              {saving ? "Saving..." : "Create alert"}
            </Button>
          </form>
        </Card>
      </section>
    </div>
  );
}
