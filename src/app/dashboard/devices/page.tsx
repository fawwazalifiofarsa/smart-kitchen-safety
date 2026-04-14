"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";

import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TableShell } from "@/components/ui/table";
import { ErrorState, LoadingState } from "@/components/ui/state";
import type {Device } from "@/lib/types";
import { formatDateTime } from "@/lib/utils/format";
import { useApiData } from "@/lib/use-api-data";

export default function DevicesPage() {
  const { data, loading, error, reload } = useApiData<Device[]>("/api/devices");
  const [search, setSearch] = useState("");
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
      </section>
    </div>
  );
}