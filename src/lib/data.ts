import { randomUUID } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "./firebase/admin";


import type {
  Alert,
  AuthenticatedUser,
  SystemSettings,
  CreateAlertRequestBody,
  CreateUserRequestBody,
  DashboardUser,
  UpdateUserRequestBody,
  Device,
  DeviceStatus,
} from "@/lib/types";

const DEFAULT_SYSTEM_SETTINGS: Omit<SystemSettings, "updated_at" | "updated_by"> = {
  gas_threshold_warning: 100,
  gas_threshold_danger: 300,
  temperature_threshold_warning: 50,
  temperature_threshold_danger: 70,
  offline_timeout_seconds: 60,
  telegram_enabled: false,
  telegram_bot_token_ref: null,
  default_alert_chat_id: null,
  data_retention_days: 30,
};


type RecordData = Record<string, unknown>;



function timestampNow() {
  return Timestamp.now();
}

function createId(prefix: string) {
  return `${prefix}_${randomUUID().slice(0, 8)}`;
}

function ensureRecord(value: unknown): RecordData {
  return typeof value === "object" && value !== null ? (value as RecordData) : {};
}

export async function getSystemSettings() {
  const snapshot = await adminDb.collection("settings").doc("system").get();
  return mapSystemSettings(snapshot.exists ? snapshot.data() : null);
}

function serializeTimestamp(value: unknown) {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return null;
}

function mapUserDoc(id: string, rawInput: unknown): DashboardUser {
  const raw = ensureRecord(rawInput);
  return {
    uid: id,
    name: typeof raw.name === "string" ? raw.name : "Unknown User",
    email: typeof raw.email === "string" ? raw.email : "",
    role: typeof raw.role === "string" ? raw.role : "viewer",
    status: typeof raw.status === "string" ? raw.status : "inactive",
    telegram_chat_id:
      typeof raw.telegram_chat_id === "string" ? raw.telegram_chat_id : null,
    created_at: serializeTimestamp(raw.created_at),
    updated_at: serializeTimestamp(raw.updated_at),
    last_login_at: serializeTimestamp(raw.last_login_at),
  };
}

function mapSystemSettings(rawInput: unknown): SystemSettings {
  const raw = ensureRecord(rawInput);
  return {
    gas_threshold_warning:
      typeof raw.gas_threshold_warning === "number"
        ? raw.gas_threshold_warning
        : DEFAULT_SYSTEM_SETTINGS.gas_threshold_warning,
    gas_threshold_danger:
      typeof raw.gas_threshold_danger === "number"
        ? raw.gas_threshold_danger
        : DEFAULT_SYSTEM_SETTINGS.gas_threshold_danger,
    temperature_threshold_warning:
      typeof raw.temperature_threshold_warning === "number"
        ? raw.temperature_threshold_warning
        : DEFAULT_SYSTEM_SETTINGS.temperature_threshold_warning,
    temperature_threshold_danger:
      typeof raw.temperature_threshold_danger === "number"
        ? raw.temperature_threshold_danger
        : DEFAULT_SYSTEM_SETTINGS.temperature_threshold_danger,
    offline_timeout_seconds:
      typeof raw.offline_timeout_seconds === "number"
        ? raw.offline_timeout_seconds
        : DEFAULT_SYSTEM_SETTINGS.offline_timeout_seconds,
    telegram_enabled:
      typeof raw.telegram_enabled === "boolean"
        ? raw.telegram_enabled
        : DEFAULT_SYSTEM_SETTINGS.telegram_enabled,
    telegram_bot_token_ref:
      typeof raw.telegram_bot_token_ref === "string"
        ? raw.telegram_bot_token_ref
        : null,
    default_alert_chat_id:
      typeof raw.default_alert_chat_id === "string"
        ? raw.default_alert_chat_id
        : null,
    data_retention_days:
      typeof raw.data_retention_days === "number"
        ? raw.data_retention_days
        : DEFAULT_SYSTEM_SETTINGS.data_retention_days,
    updated_at: serializeTimestamp(raw.updated_at),
    updated_by: typeof raw.updated_by === "string" ? raw.updated_by : null,
  };
}

function mapAlertDoc(id: string, rawInput: unknown): Alert {
  const raw = ensureRecord(rawInput);
  const triggerValues = ensureRecord(raw.trigger_values);

  return {
    alert_id: typeof raw.alert_id === "string" ? raw.alert_id : id,
    device_id: typeof raw.device_id === "string" ? raw.device_id : "",
    type: typeof raw.type === "string" ? raw.type : "system_alert",
    severity: typeof raw.severity === "string" ? raw.severity : "warning",
    title: typeof raw.title === "string" ? raw.title : "System alert",
    message: typeof raw.message === "string" ? raw.message : "",
    trigger_values: {
      gas_ppm:
        typeof triggerValues.gas_ppm === "number" ? triggerValues.gas_ppm : null,
      temperature_c:
        typeof triggerValues.temperature_c === "number"
          ? triggerValues.temperature_c
          : null,
      flame_detected:
        typeof triggerValues.flame_detected === "boolean"
          ? triggerValues.flame_detected
          : null,
      humidity_pct:
        typeof triggerValues.humidity_pct === "number"
          ? triggerValues.humidity_pct
          : null,
    },
    status: typeof raw.status === "string" ? raw.status : "active",
    telegram_sent: raw.telegram_sent === true,
    telegram_sent_at: serializeTimestamp(raw.telegram_sent_at),
    acknowledged_by:
      typeof raw.acknowledged_by === "string" ? raw.acknowledged_by : null,
    acknowledged_at: serializeTimestamp(raw.acknowledged_at),
    resolved_at: serializeTimestamp(raw.resolved_at),
    created_at: serializeTimestamp(raw.created_at),
    updated_at: serializeTimestamp(raw.updated_at),
  };
}


async function writeNotificationLog(entry: {
  alert_id: string;
  device_id: string;
  channel: string;
  recipient: string;
  message: string;
  status: string;
  provider_response: Record<string, unknown> | string | null;
  sent_at?: Timestamp | null;
}) {
  const logId = createId("notif");
  await adminDb.collection("notification_logs").doc(logId).set({
    ...entry,
    sent_at: entry.sent_at ?? null,
    created_at: timestampNow(),
  });
}

export async function getAlerts(filters: {
  status?: string | null;
  severity?: string | null;
  deviceId?: string | null;
}) {
  let query: FirebaseFirestore.Query = adminDb.collection("alerts");
  if (filters.status) query = query.where("status", "==", filters.status);
  if (filters.severity) query = query.where("severity", "==", filters.severity);
  if (filters.deviceId) query = query.where("device_id", "==", filters.deviceId);
  const snapshot = await query.orderBy("created_at", "desc").get();
  return snapshot.docs.map((doc) => mapAlertDoc(doc.id, doc.data()));
}

export async function createAlert(
  payload: CreateAlertRequestBody,
  actor: AuthenticatedUser,
) {
  const alertId = createId("alert");
  await adminDb.collection("alerts").doc(alertId).set({
    alert_id: alertId,
    ...payload,
    status: "active",
    telegram_sent: false,
    telegram_sent_at: null,
    acknowledged_by: null,
    acknowledged_at: null,
    resolved_at: null,
    created_at: timestampNow(),
    updated_at: timestampNow(),
  });

  await adminDb.collection("devices").doc(payload.device_id).set(
    {
      last_alert_at: timestampNow(),
      updated_at: timestampNow(),
    },
    { merge: true },
  );

  await writeAuditLog(actor, "create_alert", "alert", alertId, {
    device_id: payload.device_id,
    severity: payload.severity,
  });

  return alertId;
}


async function writeAuditLog(
  actor: AuthenticatedUser,
  action: string,
  targetType: string,
  targetId: string | null,
  metadata: Record<string, unknown>,
) {
  const logId = createId("audit");
  await adminDb.collection("audit_logs").doc(logId).set({
    user_id: actor.uid,
    action,
    target_type: targetType,
    target_id: targetId,
    metadata,
    created_at: timestampNow(),
  });
}


export async function acknowledgeAlert(
  alertId: string,
  actor: AuthenticatedUser,
  note: string | undefined,
) {
  await adminDb.collection("alerts").doc(alertId).set(
    {
      status: "acknowledged",
      acknowledged_by: actor.uid,
      acknowledged_at: timestampNow(),
      updated_at: timestampNow(),
    },
    { merge: true },
  );

  await writeAuditLog(actor, "acknowledge_alert", "alert", alertId, {
    note: note ?? null,
  });
}

export async function getAlertById(alertId: string) {
  const snapshot = await adminDb.collection("alerts").doc(alertId).get();
  if (!snapshot.exists) return null;
  return mapAlertDoc(snapshot.id, snapshot.data());
}

export async function resolveAlert(
  alertId: string,
  actor: AuthenticatedUser,
  resolutionNote: string | undefined,
) {
  await adminDb.collection("alerts").doc(alertId).set(
    {
      status: "resolved",
      resolved_at: timestampNow(),
      updated_at: timestampNow(),
    },
    { merge: true },
  );

  await writeAuditLog(actor, "resolve_alert", "alert", alertId, {
    resolution_note: resolutionNote ?? null,
  });
}

export async function sendTelegramAlert(
  alertId: string,
  payload: { recipient_chat_id: string },
  actor: AuthenticatedUser,
) {
  const alert = await getAlertById(alertId);
  if (!alert) return null;

  const settings = await getSystemSettings();
  if (!settings.telegram_enabled) {
    throw new Error("Telegram dinonaktifkan di pengaturan sistem");
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    throw new Error("TELEGRAM_BOT_TOKEN belum dikonfigurasi");
  }

  const recipient = payload.recipient_chat_id || settings.default_alert_chat_id;
  if (!recipient) {
    throw new Error("Recipient chat ID tidak tersedia");
  }

  const message = `${alert.title}\n${alert.message}`;
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: recipient,
      text: message,
    }),
  });

  const providerResponse = (await response.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  const sentAt = response.ok ? timestampNow() : null;

  await writeNotificationLog({
    alert_id: alert.alert_id,
    device_id: alert.device_id,
    channel: "telegram",
    recipient,
    message,
    status: response.ok ? "sent" : "failed",
    provider_response: providerResponse,
    sent_at: sentAt,
  });

  if (!response.ok) {
    throw new Error("Pengiriman Telegram gagal");
  }

  await adminDb.collection("alerts").doc(alertId).set(
    {
      telegram_sent: true,
      telegram_sent_at: sentAt,
      updated_at: timestampNow(),
    },
    { merge: true },
  );

  await writeAuditLog(actor, "send_telegram_alert", "alert", alertId, {
    recipient_chat_id: recipient,
  });

  return {
    alert_id: alertId,
    channel: "telegram",
    status: "sent",
  };
}

export async function getUsers(filters: { role?: string | null; status?: string | null }) {
  let query: FirebaseFirestore.Query = adminDb.collection("users");
  if (filters.role) query = query.where("role", "==", filters.role);
  if (filters.status) query = query.where("status", "==", filters.status);

  const snapshot = await query.orderBy("created_at", "desc").get();
  return snapshot.docs.map((doc) => mapUserDoc(doc.id, doc.data()));
}

export async function createUser(
  payload: CreateUserRequestBody,
  actor: AuthenticatedUser,
) {
  const userRecord = await adminAuth.createUser({
    email: payload.email,
    password: payload.password,
    displayName: payload.name,
    disabled: payload.status !== "active",
  });

  await adminDb.collection("users").doc(userRecord.uid).set({
    uid: userRecord.uid,
    name: payload.name,
    email: payload.email,
    role: payload.role,
    status: payload.status,
    telegram_chat_id: payload.telegram_chat_id ?? null,
    created_at: timestampNow(),
    updated_at: timestampNow(),
    last_login_at: null,
  });

  await writeAuditLog(actor, "create_user", "user", userRecord.uid, {
    role: payload.role,
    status: payload.status,
  });

  return getUserById(userRecord.uid);
}

export async function updateUser(
  uid: string,
  payload: UpdateUserRequestBody,
  actor: AuthenticatedUser,
) {
  const updateAuthPayload: Record<string, unknown> = {};
  if (payload.name) updateAuthPayload.displayName = payload.name;
  if (payload.email) updateAuthPayload.email = payload.email;
  if (payload.status) updateAuthPayload.disabled = payload.status !== "active";
  if (Object.keys(updateAuthPayload).length > 0) {
    await adminAuth.updateUser(uid, updateAuthPayload);
  }

  await adminDb.collection("users").doc(uid).set(
    {
      ...payload,
      updated_at: timestampNow(),
    },
    { merge: true },
  );

  await writeAuditLog(actor, "update_user", "user", uid, payload as Record<string, unknown>);
  return getUserById(uid);
}

export async function deactivateUser(uid: string, actor: AuthenticatedUser) {
  await adminAuth.updateUser(uid, { disabled: true });
  await adminDb.collection("users").doc(uid).set(
    {
      status: "inactive",
      updated_at: timestampNow(),
    },
    { merge: true },
  );

  await writeAuditLog(actor, "delete_user", "user", uid, {});
}

export async function touchUserLastLogin(uid: string) {
  await adminDb.collection("users").doc(uid).set(
    {
      last_login_at: timestampNow(),
      updated_at: timestampNow(),
    },
    { merge: true },
  );
}
