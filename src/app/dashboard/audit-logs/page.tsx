"use client";

import { PageHeader } from "@/components/dashboard/page-header";
import { ErrorState, LoadingState } from "@/components/ui/state";
import { TableShell } from "@/components/ui/table";
import type { AuditLog } from "@/lib/types";
import { formatDateTime } from "@/lib/utils/format";
import { useApiData } from "@/lib/use-api-data";

export default function AuditLogsPage() {
  const logs = useApiData<AuditLog[]>("/api/audit-logs");

  if (logs.loading) return <LoadingState label="Memuat audit logs..." />;
  if (logs.error) return <ErrorState message={logs.error} onRetry={logs.reload} />;

  return (
    <div className="space-y-6">
      <PageHeader
        description="Jejak aktivitas dashboard untuk perubahan data dan tindakan operator."
        title="Audit Logs"
      />

      <TableShell>
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--color-surface-muted)] text-[var(--color-muted)]">
            <tr>
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Action</th>
              <th className="px-4 py-3 font-semibold">Target</th>
              <th className="px-4 py-3 font-semibold">Created</th>
            </tr>
          </thead>
          <tbody>
            {(logs.data ?? []).map((log) => (
              <tr className="border-t border-[var(--color-border)]" key={log.log_id}>
                <td className="px-4 py-3">{log.user_id}</td>
                <td className="px-4 py-3">{log.action}</td>
                <td className="px-4 py-3">
                  {log.target_type}
                  {log.target_id ? ` / ${log.target_id}` : ""}
                </td>
                <td className="px-4 py-3">{formatDateTime(log.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}
