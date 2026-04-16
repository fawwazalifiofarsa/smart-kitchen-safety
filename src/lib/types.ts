export type ApiFieldError = {
  field: string;
  message: string;
};

export type ApiSuccessResponse<T> = {
  success: true;
  message?: string;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  errors?: ApiFieldError[];
};

export type UserRole = "admin" | "member" | "viewer" | string;
export type UserStatus = "active" | "inactive" | string;
export type SafeStatus = "safe" | "warning" | "danger" | string;

export type AlertSeverity = "info" | "warning" | "critical" | string;
export type AlertStatus =
  | "active"
  | "acknowledged"
  | "resolved"
  | "sent"
  | string;

export type DeviceStatus =
  | "online"
  | "offline"
  | "warning"
  | "critical"
  | string;

export type AlertTriggerValues = {
  gas_ppm: number | null;
  temperature_c: number | null;
  flame_detected: boolean | null;
  humidity_pct: number | null;
};

export type DashboardUser = {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  telegram_chat_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_login_at: string | null;
};

export type LoginRequestBody = {
  email: string;
  password: string;
};

export type RefreshRequestBody = {
  refresh_token: string;
};

export type AuthenticatedUser = Pick<
  DashboardUser,
  "uid" | "name" | "email" | "role" | "status" | "telegram_chat_id"
>;

export type RegisterRequestBody = {
  name: string;
  email: string;
  password: string;
};

export type LoginResponseData = {
  access_token: string;
  refresh_token: string;
  user: Pick<DashboardUser, "uid" | "name" | "email" | "role" | "status">;
};

export type CreateUserRequestBody = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  telegram_chat_id?: string | null;
};

export type CreateUserProfilePayload = {
  uid: string;
  name: string;
  email: string;
  role?: string;
  status?: string;
};

export type UpdateUserRequestBody = Partial<
  Pick<DashboardUser, "name" | "email" | "role" | "status" | "telegram_chat_id">
>;

export type SendTelegramRequestBody = {
  recipient_chat_id: string;
};

export type CreateAlertRequestBody = {
  device_id: string;
  type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  trigger_values: AlertTriggerValues;
};

export type AcknowledgeAlertRequestBody = {
  note?: string;
};

export type SystemSettings = {
  gas_threshold_warning: number;
  gas_threshold_danger: number;
  temperature_threshold_warning: number;
  temperature_threshold_danger: number;
  offline_timeout_seconds: number;
  telegram_enabled: boolean;
  telegram_bot_token_ref: string | null;
  default_alert_chat_id: string | null;
  data_retention_days: number;
  updated_at: string | null;
  updated_by: string | null;
};

export type Device = {
  device_id: string;
  name: string;
  location: string;
  room: string | null;
  status: DeviceStatus;
  firmware_version: string | null;
  ip_address: string | null;
  wifi_ssid: string | null;
  last_seen_at: string | null;
  installed_at: string | null;
  is_active: boolean;
  gas_sensor_enabled: boolean;
  flame_sensor_enabled: boolean;
  temp_sensor_enabled: boolean;
  humidity_sensor_enabled: boolean;
  last_alert_at: string | null;
  battery_level: number | null;
  local_alarm_enabled: boolean;
  maintenance_due_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Alert = {
  alert_id: string;
  device_id: string;
  type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  trigger_values: AlertTriggerValues;
  status: AlertStatus;
  telegram_sent: boolean;
  telegram_sent_at: string | null;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ResolveAlertRequestBody = {
  resolution_note?: string;
};

export type SensorReading = {
  reading_id: string;
  device_id: string;
  temperature_c: number;
  humidity_pct: number;
  gas_ppm: number;
  smoke_pct: number | null;
  flame_detected: boolean;
  buzzer_active: boolean | null;
  safe_status: SafeStatus;
  source: string;
  recorded_at: string | null;
};

export type CreateReadingRequestBody = {
  temperature_c: number;
  humidity_pct: number;
  gas_ppm: number;
  smoke_pct?: number | null;
  flame_detected: boolean;
  buzzer_active?: boolean | null;
  source: string;
  recorded_at?: string;
};

export type DeviceStatusLog = {
  log_id: string;
  device_id: string;
  previous_status: string | null;
  new_status: string;
  reason: string;
  created_at: string | null;
};

export type CreateDeviceRequestBody = {
  device_id: string;
  name: string;
  location: string;
  room?: string | null;
  firmware_version?: string | null;
  wifi_ssid?: string | null;
  gas_sensor_enabled: boolean;
  flame_sensor_enabled: boolean;
  temp_sensor_enabled: boolean;
  humidity_sensor_enabled: boolean;
  local_alarm_enabled: boolean;
  is_active: boolean;
};

export type UpdateDeviceRequestBody = Partial<
  Pick<
    Device,
    | "name"
    | "location"
    | "room"
    | "firmware_version"
    | "ip_address"
    | "wifi_ssid"
    | "is_active"
    | "gas_sensor_enabled"
    | "flame_sensor_enabled"
    | "temp_sensor_enabled"
    | "humidity_sensor_enabled"
    | "local_alarm_enabled"
    | "battery_level"
    | "maintenance_due_at"
  >
>;
