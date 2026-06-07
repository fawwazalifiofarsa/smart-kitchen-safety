"use client";

import { useEffect, useState } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ErrorState, LoadingState } from "@/components/ui/state";
import type { SystemSettings, UpdateSystemSettingsRequestBody } from "@/lib/types";
import { fetchJson, useApiData } from "@/lib/use-api-data";

export default function SettingsPage() {
  const settings = useApiData<SystemSettings>("/api/settings/system");
  const [form, setForm] = useState<UpdateSystemSettingsRequestBody>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings.data) {
      setForm({
        gas_threshold_warning: settings.data.gas_threshold_warning,
        gas_threshold_danger: settings.data.gas_threshold_danger,
        offline_timeout_seconds: settings.data.offline_timeout_seconds,
        telegram_enabled: settings.data.telegram_enabled,
        default_alert_chat_id: settings.data.default_alert_chat_id,
        data_retention_days: settings.data.data_retention_days,
      });
    }
  }, [settings.data]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await fetchJson("/api/settings/system", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      settings.reload();
    } finally {
      setSaving(false);
    }
  }

  if (settings.loading) return <LoadingState label="Memuat pengaturan sistem..." />;
  if (settings.error) return <ErrorState message={settings.error} onRetry={settings.reload} />;

  return (
    <div className="space-y-6">
      <PageHeader
        description="Kelola threshold gas, timeout offline, Telegram, dan retensi data."
        title="System Settings"
      />

      <Card>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <Input
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                gas_threshold_warning: Number(event.target.value),
              }))
            }
            placeholder="Gas warning threshold"
            type="number"
            value={String(form.gas_threshold_warning ?? "")}
          />
          <Input
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                gas_threshold_danger: Number(event.target.value),
              }))
            }
            placeholder="Gas danger threshold"
            type="number"
            value={String(form.gas_threshold_danger ?? "")}
          />
          <Input
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                offline_timeout_seconds: Number(event.target.value),
              }))
            }
            placeholder="Offline timeout"
            type="number"
            value={String(form.offline_timeout_seconds ?? "")}
          />
          <Input
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                data_retention_days: Number(event.target.value),
              }))
            }
            placeholder="Data retention days"
            type="number"
            value={String(form.data_retention_days ?? "")}
          />
          <Select
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                telegram_enabled: event.target.value === "true",
              }))
            }
            value={String(form.telegram_enabled ?? false)}
          >
            <option value="true">Telegram enabled</option>
            <option value="false">Telegram disabled</option>
          </Select>
          <Input
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                default_alert_chat_id: event.target.value,
              }))
            }
            placeholder="Default Telegram chat ID"
            value={form.default_alert_chat_id ?? ""}
          />
          <div className="md:col-span-2">
            <Button disabled={saving} type="submit">
              {saving ? "Saving..." : "Save settings"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
