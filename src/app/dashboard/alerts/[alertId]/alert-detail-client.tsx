"use client";

import { useState } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState, LoadingState } from "@/components/ui/state";
import type { Alert } from "@/lib/types";
import { formatDateTime } from "@/lib/utils/format";
import { fetchJson, useApiData } from "@/lib/use-api-data";

export function AlertDetailClient({ alertId }: { alertId: string }) {
  const alert = useApiData<Alert>(`/api/alerts/${alertId}`);
  const [note, setNote] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [recipient, setRecipient] = useState("");

  if (alert.loading) return <LoadingState label="Memuat detail alert..." />;
  if (alert.error) return <ErrorState message={alert.error} onRetry={alert.reload} />;
  if (!alert.data) return <ErrorState message="Alert tidak ditemukan" />;

  async function handleAcknowledge() {
    await fetchJson(`/api/alerts/${alertId}/acknowledge`, {
      method: "PATCH",
      body: JSON.stringify({ note }),
    });
    alert.reload();
  }

  async function handleResolve() {
    await fetchJson(`/api/alerts/${alertId}/resolve`, {
      method: "PATCH",
      body: JSON.stringify({ resolution_note: resolutionNote }),
    });
    alert.reload();
  }

  async function handleSendTelegram() {
    await fetchJson(`/api/alerts/${alertId}/send-telegram`, {
      method: "POST",
      body: JSON.stringify({ recipient_chat_id: recipient }),
    });
    alert.reload();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description={alert.data.device_id}
        title={alert.data.title}
      />

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge tone={alert.data.severity}>{alert.data.severity}</Badge>
            <Badge tone={alert.data.status}>{alert.data.status}</Badge>
          </div>
          <p className="text-sm leading-7 text-[var(--color-muted)]">
            {alert.data.message}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-[var(--color-muted)]">Created</p>
              <p className="mt-1 font-semibold">{formatDateTime(alert.data.created_at)}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--color-muted)]">Telegram sent</p>
              <p className="mt-1 font-semibold">{alert.data.telegram_sent ? "Yes" : "No"}</p>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              Acknowledge Alert
            </h2>
            <Textarea onChange={(event) => setNote(event.target.value)} value={note} />
            <Button className="w-full" onClick={handleAcknowledge} type="button">
              Acknowledge
            </Button>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              Resolve Alert
            </h2>
            <Textarea
              onChange={(event) => setResolutionNote(event.target.value)}
              value={resolutionNote}
            />
            <Button className="w-full" onClick={handleResolve} type="button" variant="secondary">
              Resolve
            </Button>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              Send Telegram
            </h2>
            <Input
              onChange={(event) => setRecipient(event.target.value)}
              placeholder="Recipient chat ID"
              value={recipient}
            />
            <Button className="w-full" onClick={handleSendTelegram} type="button" variant="secondary">
              Send notification
            </Button>
          </Card>
        </div>
      </section>
    </div>
  );
}
