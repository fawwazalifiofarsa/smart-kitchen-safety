export const sampleDevice = {
  device_id: "dev_1",
  name: "Kitchen Sensor",
  location: "Kitchen",
  room: "Main",
  status: "online",
  firmware_version: "1.0.0",
  ip_address: null,
  wifi_ssid: "IoT",
  last_seen_at: "2026-01-01T10:00:00.000Z",
  installed_at: null,
  is_active: true,
  gas_sensor_enabled: true,
  flame_sensor_enabled: true,
  last_alert_at: null,
  battery_level: null,
  local_alarm_enabled: true,
  maintenance_due_at: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

export const sampleAlert = {
  alert_id: "alert_1",
  device_id: "dev_1",
  type: "gas_leak",
  severity: "critical",
  title: "Gas bocor",
  message: "Gas terdeteksi tinggi",
  trigger_values: { gas_ppm: 400, flame_raw: null, flame_detected: false, detection_status: "danger" },
  status: "active",
  telegram_sent: false,
  telegram_sent_at: null,
  acknowledged_by: null,
  acknowledged_at: null,
  resolved_at: null,
  created_at: "2026-01-01T10:00:00.000Z",
  updated_at: "2026-01-01T10:00:00.000Z",
};

export const sampleReading = {
  reading_id: "reading_1",
  device_id: "dev_1",
  gas_ppm: 120,
  flame_raw: 1,
  flame_detected: false,
  flame_message: "Clear",
  detection_status: "warning",
  buzzer_active: false,
  safe_status: "warning",
  source: "device",
  esp_millis: 1000,
  recorded_at: "2026-01-01T10:00:00.000Z",
};

export const sampleSettings = {
  gas_threshold_warning: 100,
  gas_threshold_danger: 300,
  temperature_threshold_warning: 50,
  temperature_threshold_danger: 80,
  offline_timeout_seconds: 60,
  telegram_enabled: true,
  telegram_bot_token_ref: null,
  default_alert_chat_id: "12345",
  data_retention_days: 30,
  updated_at: "2026-01-01T10:00:00.000Z",
  updated_by: "admin_1",
};

export const sampleUser = {
  uid: "user_1",
  name: "Admin User",
  email: "admin@test.local",
  role: "admin",
  status: "active",
  telegram_chat_id: "12345",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  last_login_at: null,
};

export const sampleChart = [
  { time: "2026-01-01T10:00:00.000Z", gas_ppm: 120, flame_raw: 1 },
];

export const sampleAuditLog = {
  log_id: "audit_1",
  user_id: "admin_1",
  action: "create_device",
  target_type: "device",
  target_id: "dev_1",
  metadata: { location: "Kitchen" },
  created_at: "2026-01-01T10:00:00.000Z",
};

export const sampleNotificationLog = {
  log_id: "notif_1",
  alert_id: "alert_1",
  device_id: "dev_1",
  channel: "telegram",
  recipient: "12345",
  message: "Gas bocor",
  status: "sent",
  provider_response: { ok: true },
  sent_at: "2026-01-01T10:00:00.000Z",
  created_at: "2026-01-01T10:00:00.000Z",
};
