"use client";

import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/state";
import type { Device } from "@/lib/types";
import { formatDateTime } from "@/lib/utils/format";
import { useApiData } from "@/lib/use-api-data";

export function DeviceDetailClient({ deviceId }: { deviceId: string }) {
  const { data, loading, error, reload } = useApiData<Device>(`/api/devices/${deviceId}`);

  if (loading) return <LoadingState label="Memuat detail perangkat..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <ErrorState message="Perangkat tidak ditemukan" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.name}
        description={`${data.location}${data.room ? ` / ${data.room}` : ""}`}
      />

      <Card className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm text-[var(--color-muted)]">Device ID</p>
          <p className="font-semibold">{data.device_id}</p>
        </div>

        <div>
          <p className="text-sm text-[var(--color-muted)]">Status</p>
          <Badge tone={data.status}>{data.status}</Badge>
        </div>

        <div>
          <p className="text-sm text-[var(--color-muted)]">Last Seen</p>
          <p>{formatDateTime(data.last_seen_at)}</p>
        </div>

        <div>
          <p className="text-sm text-[var(--color-muted)]">Firmware</p>
          <p>{data.firmware_version ?? "-"}</p>
        </div>
      </Card>
    </div>
  );
}