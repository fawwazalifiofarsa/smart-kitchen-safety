"use client";

import { useState } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ErrorState, LoadingState } from "@/components/ui/state";
import { TableShell } from "@/components/ui/table";
import type {
  CreateUserRequestBody,
  DashboardUser,
  UpdateUserRequestBody,
} from "@/lib/types";
import { formatDateTime } from "@/lib/utils/format";
import { fetchJson, useApiData } from "@/lib/use-api-data";

const createDefaults: CreateUserRequestBody = {
  name: "",
  email: "",
  password: "",
  role: "member",
  status: "active",
  telegram_chat_id: "",
};

export default function UsersPage() {
  const users = useApiData<DashboardUser[]>("/api/users");
  const [selectedUser, setSelectedUser] = useState<DashboardUser | null>(null);
  const [createForm, setCreateForm] = useState<CreateUserRequestBody>(createDefaults);
  const [editForm, setEditForm] = useState<UpdateUserRequestBody>({});
  const [saving, setSaving] = useState(false);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await fetchJson("/api/users", {
        method: "POST",
        body: JSON.stringify(createForm),
      });
      setCreateForm(createDefaults);
      users.reload();
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUser) return;
    setSaving(true);
    try {
      await fetchJson(`/api/users/${selectedUser.uid}`, {
        method: "PATCH",
        body: JSON.stringify(editForm),
      });
      users.reload();
    } finally {
      setSaving(false);
    }
  }

  if (users.loading) return <LoadingState label="Memuat data user..." />;
  if (users.error) return <ErrorState message={users.error} onRetry={users.reload} />;

  return (
    <div className="space-y-6">
      <PageHeader
        description="Kelola user dashboard, peran, status akun, dan Telegram chat ID."
        title="Users & Members"
      />

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <TableShell>
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--color-surface-muted)] text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody>
              {(users.data ?? []).map((user) => (
                <tr
                  className="cursor-pointer border-t border-[var(--color-border)] hover:bg-slate-50"
                  key={user.uid}
                  onClick={() => {
                    setSelectedUser(user);
                    setEditForm({
                      name: user.name,
                      email: user.email,
                      role: user.role,
                      status: user.status,
                      telegram_chat_id: user.telegram_chat_id,
                    });
                  }}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--color-foreground)]">{user.name}</p>
                    <p className="text-xs text-[var(--color-muted)]">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={user.role}>{user.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={user.status}>{user.status}</Badge>
                  </td>
                  <td className="px-4 py-3">{formatDateTime(user.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>

        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              Create User
            </h2>
            <form className="mt-5 space-y-4" onSubmit={handleCreate}>
              <Input
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Nama lengkap"
                value={createForm.name}
              />
              <Input
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="Email"
                value={createForm.email}
              />
              <Input
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="Password"
                type="password"
                value={createForm.password}
              />
              <div className="grid grid-cols-2 gap-4">
                <Select
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, role: event.target.value }))
                  }
                  value={createForm.role}
                >
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                  <option value="viewer">Viewer</option>
                </Select>
                <Select
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, status: event.target.value }))
                  }
                  value={createForm.status}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </div>
              <Input
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    telegram_chat_id: event.target.value,
                  }))
                }
                placeholder="Telegram chat ID"
                value={createForm.telegram_chat_id ?? ""}
              />
              <Button className="w-full" disabled={saving} type="submit">
                {saving ? "Saving..." : "Create user"}
              </Button>
            </form>
          </Card>

         
        </div>
      </section>
    </div>
  );
}
