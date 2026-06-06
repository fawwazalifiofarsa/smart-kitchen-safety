"use client";

import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { ErrorState, LoadingState } from "@/components/ui/state";
import { TableShell } from "@/components/ui/table";
import type { NotificationLog } from "@/lib/types";
import { formatDateTime } from "@/lib/utils/format";
import { useApiData } from "@/lib/use-api-data";

export default function NotificationLogsPage() {
  const logs = useApiData<NotificationLog[]>("/api/notification-logs");

  if (logs.loading) return <LoadingState label="Memuat notification logs..." />;
  if (logs.error) return <ErrorState message={logs.error} onRetry={logs.reload} />;

  return (
    <div className="space-y-6">
      <PageHeader
        description="Riwayat pengiriman notifikasi Telegram untuk penelusuran dan debugging."
        title="Notification Logs"
      />

      <TableShell>
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--color-surface-muted)] text-[var(--color-muted)]">
            <tr>
              <th className="px-4 py-3 font-semibold">Alert</th>
              <th className="px-4 py-3 font-semibold">Recipient</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Sent</th>
              <th className="px-4 py-3 font-semibold">Created</th>
            </tr>
          </thead>
          <tbody>
            {(logs.data ?? []).map((log) => (
              <tr className="border-t border-[var(--color-border)]" key={log.log_id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-[var(--color-foreground)]">{log.alert_id}</p>
                  <p className="text-xs text-[var(--color-muted)]">{log.device_id}</p>
                </td>
                <td className="px-4 py-3">{log.recipient}</td>
                <td className="px-4 py-3">
                  <Badge tone={log.status}>{log.status}</Badge>
                </td>
                <td className="px-4 py-3">{formatDateTime(log.sent_at)}</td>
                <td className="px-4 py-3">{formatDateTime(log.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}
