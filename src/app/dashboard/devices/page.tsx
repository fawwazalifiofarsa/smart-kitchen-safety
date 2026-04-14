"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";

import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TableShell } from "@/components/ui/table";
import { ErrorState, LoadingState } from "@/components/ui/state";
import type { CreateDeviceRequestBody, Device } from "@/lib/types";
import { formatDateTime } from "@/lib/utils/format";
import { fetchJson, useApiData } from "@/lib/use-api-data";

const emptyForm: CreateDeviceRequestBody = {
  device_id: "",
  name: "",
  location: "",
  room: "",
  firmware_version: "",
  wifi_ssid: "",
  gas_sensor_enabled: true,
  flame_sensor_enabled: true,
  temp_sensor_enabled: true,
  humidity_sensor_enabled: true,
  local_alarm_enabled: true,
  is_active: true,
};

export default function DevicesPage() {
  const { data, loading, error, reload } = useApiData<Device[]>("/api/devices");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<CreateDeviceRequestBody>(emptyForm);
  const [saving, setSaving] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const filteredDevices = useMemo(() => {
    const list = data ?? [];
    const needle = deferredSearch.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((device) =>
      [device.device_id, device.name, device.location, device.room]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [data, deferredSearch]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await fetchJson("/api/devices", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm(emptyForm);
      reload();
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Memuat data perangkat..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="space-y-6">
      <PageHeader
        description="Daftar perangkat IoT, status operasional, metadata, dan pendaftaran node baru."
        title="Devices"
      />

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <Input
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari device, lokasi, atau room..."
            value={search}
          />
          <TableShell>
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[var(--color-surface-muted)] text-[var(--color-muted)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Device</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Last Seen</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((device) => (
                  <tr className="border-t border-[var(--color-border)]" key={device.device_id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--color-foreground)]">
                        {device.name}
                      </p>
                      <p className="text-xs text-[var(--color-muted)]">{device.device_id}</p>
                    </td>
                    <td className="px-4 py-3">
                      {device.location}
                      {device.room ? ` / ${device.room}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={device.status}>{device.status}</Badge>
                    </td>
                    <td className="px-4 py-3">{formatDateTime(device.last_seen_at)}</td>
                    <td className="px-4 py-3">
                      <Link
                        className="font-semibold text-sky-700"
                        href={`/dashboard/devices/${device.device_id}`}
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
            Register Device
          </h2>
          <form className="mt-5 space-y-4" onSubmit={handleCreate}>
            <Input
              onChange={(event) => setForm((current) => ({ ...current, device_id: event.target.value }))}
              placeholder="device_01"
              value={form.device_id}
            />
            <Input
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Kitchen Node 1"
              value={form.name}
            />
            <Input
              onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
              placeholder="Rumah A"
              value={form.location}
            />
            <Input
              onChange={(event) => setForm((current) => ({ ...current, room: event.target.value }))}
              placeholder="Dapur Utama"
              value={form.room ?? ""}
            />
            <Input
              onChange={(event) =>
                setForm((current) => ({ ...current, firmware_version: event.target.value }))
              }
              placeholder="1.0.0"
              value={form.firmware_version ?? ""}
            />
            <Select
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  is_active: event.target.value === "true",
                }))
              }
              value={String(form.is_active)}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
            <Button className="w-full" disabled={saving} type="submit">
              {saving ? "Saving..." : "Create device"}
            </Button>
          </form>
        </Card>
      </section>
    </div>
  );
}