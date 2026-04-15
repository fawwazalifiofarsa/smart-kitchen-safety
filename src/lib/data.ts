import { randomUUID } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "./firebase/admin";


import type {
  Alert,
  AlertSeverity,
  AuthenticatedUser,
  SystemSettings,
  CreateAlertRequestBody,
  CreateUserRequestBody,
  DashboardUser,
  UpdateUserRequestBody,
  Device,
  DeviceStatus,
  SensorReading,
  Device,
  DeviceStatus,
  DeviceStatusLog,
  UpdateDeviceRequestBody,
  CreateDeviceRequestBody,
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

function optionalTimestamp(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Timestamp.fromDate(date);
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

export async function createDevice(
  payload: CreateDeviceRequestBody,
  actor: AuthenticatedUser,
) {
  await adminDb.collection("devices").doc(payload.device_id).set({
    ...payload,
    status: payload.is_active ? "online" : "offline",
    last_seen_at: null,
    installed_at: null,
    ip_address: null,
    last_alert_at: null,
    battery_level: null,
    maintenance_due_at: null,
    created_at: timestampNow(),
    updated_at: timestampNow(),
  });

  await writeAuditLog(actor, "create_device", "device", payload.device_id, {
    location: payload.location,
  });
}

function baseMapDevice(id: string, rawInput: unknown): Device {
  const raw = ensureRecord(rawInput);
  return {
    device_id: typeof raw.device_id === "string" ? raw.device_id : id,
    name: typeof raw.name === "string" ? raw.name : "Unnamed Device",
    location: typeof raw.location === "string" ? raw.location : "-",
    room: typeof raw.room === "string" ? raw.room : null,
    status: typeof raw.status === "string" ? raw.status : "offline",
    firmware_version:
      typeof raw.firmware_version === "string" ? raw.firmware_version : null,
    ip_address: typeof raw.ip_address === "string" ? raw.ip_address : null,
    wifi_ssid: typeof raw.wifi_ssid === "string" ? raw.wifi_ssid : null,
    last_seen_at: serializeTimestamp(raw.last_seen_at),
    installed_at: serializeTimestamp(raw.installed_at),
    is_active: raw.is_active === false ? false : true,
    gas_sensor_enabled: raw.gas_sensor_enabled === false ? false : true,
    flame_sensor_enabled: raw.flame_sensor_enabled === false ? false : true,
    temp_sensor_enabled: raw.temp_sensor_enabled === false ? false : true,
    humidity_sensor_enabled: raw.humidity_sensor_enabled === false ? false : true,
    last_alert_at: serializeTimestamp(raw.last_alert_at),
    battery_level:
      typeof raw.battery_level === "number" ? raw.battery_level : null,
    local_alarm_enabled: raw.local_alarm_enabled === false ? false : true,
    maintenance_due_at: serializeTimestamp(raw.maintenance_due_at),
    created_at: serializeTimestamp(raw.created_at),
    updated_at: serializeTimestamp(raw.updated_at),
  };
}

function mapReadingDoc(id: string, rawInput: unknown): SensorReading {
  const raw = ensureRecord(rawInput);
  return {
    reading_id: id,
    device_id: typeof raw.device_id === "string" ? raw.device_id : "",
    temperature_c:
      typeof raw.temperature_c === "number" ? raw.temperature_c : 0,
    humidity_pct: typeof raw.humidity_pct === "number" ? raw.humidity_pct : 0,
    gas_ppm: typeof raw.gas_ppm === "number" ? raw.gas_ppm : 0,
    smoke_pct: typeof raw.smoke_pct === "number" ? raw.smoke_pct : null,
    flame_detected: raw.flame_detected === true,
    buzzer_active:
      typeof raw.buzzer_active === "boolean" ? raw.buzzer_active : null,
    safe_status: typeof raw.safe_status === "string" ? raw.safe_status : "safe",
    source: typeof raw.source === "string" ? raw.source : "device",
    recorded_at: serializeTimestamp(raw.recorded_at),
  };
}
function mapStatusLogDoc(id: string, rawInput: unknown): DeviceStatusLog {
  const raw = ensureRecord(rawInput);
  return {
    log_id: id,
    device_id: typeof raw.device_id === "string" ? raw.device_id : "",
    previous_status:
      typeof raw.previous_status === "string" ? raw.previous_status : null,
    new_status: typeof raw.new_status === "string" ? raw.new_status : "offline",
    reason: typeof raw.reason === "string" ? raw.reason : "system_update",
    created_at: serializeTimestamp(raw.created_at),
  };
}

export async function getDeviceById(deviceId: string) {
  const settings = await getSystemSettings();
  const snapshot = await adminDb.collection("devices").doc(deviceId).get();
  if (!snapshot.exists) return null;
  const device = baseMapDevice(snapshot.id, snapshot.data());
  return { ...device, status: computeDeviceStatus(device, settings) };
}

export async function getDevices(filters: {
  search?: string | null;
  status?: string | null;
  location?: string | null;
}) {
  const settings = await getSystemSettings();
  let query: FirebaseFirestore.Query = adminDb.collection("devices");
  if (filters.location) query = query.where("location", "==", filters.location);
  const snapshot = await query.orderBy("created_at", "desc").get();

  return snapshot.docs
    .map((doc) => {
      const device = baseMapDevice(doc.id, doc.data());
      return { ...device, status: computeDeviceStatus(device, settings) };
    })
    .filter((device) => {
      const matchesStatus = filters.status ? device.status === filters.status : true;
      const needle = filters.search?.trim().toLowerCase();
      const haystack = [device.device_id, device.name, device.location, device.room]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = needle ? haystack.includes(needle) : true;
      return matchesStatus && matchesSearch;
    });
}

export async function deactivateDevice(deviceId: string, actor: AuthenticatedUser) {
  await adminDb.collection("devices").doc(deviceId).set(
    {
      is_active: false,
      status: "offline",
      updated_at: timestampNow(),
    },
    { merge: true },
  );

  await writeAuditLog(actor, "delete_device", "device", deviceId, {});
}

export async function updateDevice(
  deviceId: string,
  payload: UpdateDeviceRequestBody,
  actor: AuthenticatedUser,
) {
  const patch: Record<string, unknown> = {
    ...payload,
    updated_at: timestampNow(),
  };
  if (payload.maintenance_due_at !== undefined) {
    patch.maintenance_due_at = optionalTimestamp(payload.maintenance_due_at);
  }

  await adminDb.collection("devices").doc(deviceId).set(patch, { merge: true });
  await writeAuditLog(actor, "update_device", "device", deviceId, payload as Record<string, unknown>);
}

function computeDeviceStatus(device: Device, settings: SystemSettings): DeviceStatus {
  if (!device.is_active) return "offline";
  if (!device.last_seen_at) return device.status;

  const lastSeen = new Date(device.last_seen_at);
  if (Number.isNaN(lastSeen.getTime())) return device.status;

  const ageMs = Date.now() - lastSeen.getTime();
  if (ageMs > settings.offline_timeout_seconds * 1000) return "offline";
  if (device.status === "critical" || device.status === "warning") return device.status;
  return "online";
}

function getDeviceKeyMap() {
  if (!process.env.DEVICE_API_KEYS_JSON) return {};

  try {
    return JSON.parse(process.env.DEVICE_API_KEYS_JSON) as Record<string, string>;
  } catch {
    return {};
  }
}

export function verifyDeviceKey(deviceId: string, providedKey: string | null) {
  if (!providedKey) return false;

  const keyMap = getDeviceKeyMap();
  if (keyMap[deviceId]) return keyMap[deviceId] === providedKey;

  return Boolean(process.env.DEVICE_API_KEY) && process.env.DEVICE_API_KEY === providedKey;
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

export async function getStatusLogs(deviceId: string, limit: number) {
  const snapshot = await adminDb
    .collection("devices")
    .doc(deviceId)
    .collection("status_logs")
    .orderBy("created_at", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => mapStatusLogDoc(doc.id, doc.data()));
}

export async function getReadings(deviceId: string, filters: { startDate?: string | null; endDate?: string | null; limit: number }) {
  let query: FirebaseFirestore.Query = adminDb
    .collection("devices")
    .doc(deviceId)
    .collection("sensor_readings")
    .orderBy("recorded_at", "desc");

  if (filters.startDate) {
    query = query.where("recorded_at", ">=", Timestamp.fromDate(new Date(filters.startDate)));
  }
  if (filters.endDate) {
    query = query.where("recorded_at", "<=", Timestamp.fromDate(new Date(filters.endDate)));
  }

  const snapshot = await query.limit(filters.limit).get();
  return snapshot.docs.map((doc) => mapReadingDoc(doc.id, doc.data()));
}

export async function getLatestReading(deviceId: string) {
  const snapshot = await adminDb
    .collection("devices")
    .doc(deviceId)
    .collection("sensor_readings")
    .orderBy("recorded_at", "desc")
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return mapReadingDoc(doc.id, doc.data());
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

async function writeStatusLog(
  deviceId: string,
  previousStatus: string | null,
  newStatus: string,
  reason: string,
) {
  const logId = createId("statuslog");
  await adminDb
    .collection("devices")
    .doc(deviceId)
    .collection("status_logs")
    .doc(logId)
    .set({
      device_id: deviceId,
      previous_status: previousStatus,
      new_status: newStatus,
      reason,
      created_at: timestampNow(),
    });
}

function alertTypeFromReading(reading: {
  flame_detected: boolean;
  gas_ppm: number;
}) {
  if (reading.flame_detected) return "fire_detected";
  if (reading.gas_ppm > 0) return "gas_leak";
  return "high_temperature";
}

function severityFromSafeStatus(status: string): AlertSeverity {
  if (status === "danger") return "critical";
  if (status === "warning") return "warning";
  return "info";
}

async function ensureAlertForReading(
  device: Device,
  reading: {
    temperature_c: number;
    humidity_pct: number;
    gas_ppm: number;
    flame_detected: boolean;
  },
  safeStatus: string,
) {
  if (safeStatus === "safe") return null;

  const type = alertTypeFromReading(reading);
  const severity = severityFromSafeStatus(safeStatus);
  const existingSnapshot = await adminDb
    .collection("alerts")
    .where("device_id", "==", device.device_id)
    .orderBy("created_at", "desc")
    .limit(10)
    .get();

  const existing = existingSnapshot.docs
    .map((doc) => mapAlertDoc(doc.id, doc.data()))
    .find(
      (alert) =>
        alert.type === type &&
        (alert.status === "active" || alert.status === "acknowledged"),
    );

  if (existing) {
    return existing.alert_id;
  }

  const alertId = createId("alert");
  await adminDb.collection("alerts").doc(alertId).set({
    alert_id: alertId,
    device_id: device.device_id,
    type,
    severity,
    title:
      type === "fire_detected"
        ? "Api terdeteksi"
        : type === "gas_leak"
          ? "Kebocoran gas terdeteksi"
          : "Suhu tinggi terdeteksi",
    message: `${device.name} memicu status ${safeStatus}.`,
    trigger_values: {
      gas_ppm: reading.gas_ppm,
      temperature_c: reading.temperature_c,
      flame_detected: reading.flame_detected,
      humidity_pct: reading.humidity_pct,
    },
    status: "active",
    telegram_sent: false,
    telegram_sent_at: null,
    acknowledged_by: null,
    acknowledged_at: null,
    resolved_at: null,
    created_at: timestampNow(),
    updated_at: timestampNow(),
  });

  return alertId;
}

function computeSafeStatus(
  reading: {
    temperature_c: number;
    humidity_pct: number;
    gas_ppm: number;
    smoke_pct?: number | null;
    flame_detected: boolean;
  },
  settings: SystemSettings,
) {
  if (
    reading.flame_detected ||
    reading.gas_ppm >= settings.gas_threshold_danger ||
    reading.temperature_c >= settings.temperature_threshold_danger
  ) {
    return "danger";
  }

  if (
    reading.gas_ppm >= settings.gas_threshold_warning ||
    reading.temperature_c >= settings.temperature_threshold_warning
  ) {
    return "warning";
  }

  return "safe";
}


export async function ingestReading(
  deviceId: string,
  payload: {
    temperature_c: number;
    humidity_pct: number;
    gas_ppm: number;
    smoke_pct?: number | null;
    flame_detected: boolean;
    buzzer_active?: boolean | null;
    source: string;
    recorded_at?: string;
  },
) {
  const device = await getDeviceById(deviceId);
  if (!device) return null;

  const settings = await getSystemSettings();
  const safeStatus = computeSafeStatus(payload, settings);
  const readingId = createId("reading");
  const recordedAt = optionalTimestamp(payload.recorded_at) ?? timestampNow();
  const nextDeviceStatus: DeviceStatus =
    safeStatus === "danger" ? "critical" : safeStatus === "warning" ? "warning" : "online";

  await adminDb
    .collection("devices")
    .doc(deviceId)
    .collection("sensor_readings")
    .doc(readingId)
    .set({
      device_id: deviceId,
      temperature_c: payload.temperature_c,
      humidity_pct: payload.humidity_pct,
      gas_ppm: payload.gas_ppm,
      smoke_pct: payload.smoke_pct ?? null,
      flame_detected: payload.flame_detected,
      buzzer_active: payload.buzzer_active ?? null,
      safe_status: safeStatus,
      source: payload.source,
      recorded_at: recordedAt,
    });

  await adminDb.collection("devices").doc(deviceId).set(
    {
      status: nextDeviceStatus,
      last_seen_at: recordedAt,
      last_alert_at: safeStatus === "safe" ? device.last_alert_at : timestampNow(),
      updated_at: timestampNow(),
    },
    { merge: true },
  );

  if (device.status !== nextDeviceStatus) {
    await writeStatusLog(deviceId, device.status, nextDeviceStatus, "sensor_ingestion");
  }

  await ensureAlertForReading(device, payload, safeStatus);

  return {
    reading_id: readingId,
    safe_status: safeStatus,
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
