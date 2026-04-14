"use client";

import Link from "next/link";

import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TableShell } from "@/components/ui/table";

export default function DevicesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        description="Daftar perangkat IoT, status operasional, metadata, dan pendaftaran node baru."
        title="Devices"
      />

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          {/* Search Input */}
          <Input
            placeholder="Cari device, lokasi, atau room..."
            value=""
            onChange={() => {}}
          />

          {/* Table */}
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
                {/* Dummy Data */}
                <tr className="border-t border-[var(--color-border)]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--color-foreground)]">
                      Smart Sensor
                    </p>
                    <p className="text-xs text-[var(--color-muted)]">
                      device_001
                    </p>
                  </td>

                  <td className="px-4 py-3">
                    Kitchen / Room A
                  </td>

                  <td className="px-4 py-3">
                    <Badge tone="online">online</Badge>
                  </td>

                  <td className="px-4 py-3">
                    2026-04-14 10:00
                  </td>

                  <td className="px-4 py-3">
                    <Link
                      className="font-semibold text-sky-700"
                      href="#"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </TableShell>
        </div>
      </section>
    </div>
  );
}