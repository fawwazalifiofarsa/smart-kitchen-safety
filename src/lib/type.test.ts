import { describe, expect, it } from "vitest";
import type { Alert, CreateAlertRequestBody, CreateDeviceRequestBody, CreateReadingRequestBody, DashboardUser, Device, SendTelegramRequestBody, SystemSettings, UpdateSystemSettingsRequestBody } from "@/lib/types";

describe("types.ts contract", () => {
  it("CreateDeviceRequestBody contract", () => {
    const payload: CreateDeviceRequestBody = {
      device_id: "dev_1",
      name: "Kitchen Sensor",
      location: "Kitchen",
      room: "Main",
      firmware_version: "1.0.0",
      wifi_ssid: "iot",
      gas_sensor_enabled: true,
      flame_sensor_enabled: true,
      local_alarm_enabled: true,
      is_active: true,
    };
    expect(payload.device_id).toBe("dev_1");
  });

  it("CreateReadingRequestBody contract", () => {
    const payload: CreateReadingRequestBody = {
      gas_ppm: 120,
      flame_detected: false,
      flame_raw: 1,
      source: "device",
    };
    expect(payload.gas_ppm).toBe(120);
  });

  it("CreateAlertRequestBody contract", () => {
    const payload: CreateAlertRequestBody = {
      device_id: "dev_1",
      type: "gas_leak",
      severity: "critical",
      title: "Gas bocor",
      message: "Gas tinggi",
      trigger_values: { gas_ppm: 400, flame_raw: null, flame_detected: false, detection_status: "danger" },
    };
    expect(payload.trigger_values.gas_ppm).toBe(400);
  });

  it("SendTelegramRequestBody contract", () => {
    const payload: SendTelegramRequestBody = { recipient_chat_id: "12345" };
    expect(payload.recipient_chat_id).toBe("12345");
  });

  it("UpdateSystemSettingsRequestBody partial contract", () => {
    const payload: UpdateSystemSettingsRequestBody = {
      telegram_enabled: true,
      default_alert_chat_id: "12345",
      gas_threshold_danger: 300,
    };
    expect(payload.telegram_enabled).toBe(true);
  });

  it("SystemSettings contract", () => {
    const settings: SystemSettings = {
      gas_threshold_warning: 100,
      gas_threshold_danger: 300,
      temperature_threshold_warning: 50,
      temperature_threshold_danger: 80,
      offline_timeout_seconds: 60,
      telegram_enabled: true,
      telegram_bot_token_ref: null,
      default_alert_chat_id: "12345",
      data_retention_days: 30,
      updated_at: null,
      updated_by: null,
    };
    expect(settings.default_alert_chat_id).toBe("12345");
  });

  it("Device, Alert, dan DashboardUser contract", () => {
    const device: Device = {
      device_id: "dev_1", name: "Kitchen", location: "Kitchen", room: null, status: "online", firmware_version: null, ip_address: null, wifi_ssid: null, last_seen_at: null, installed_at: null, is_active: true, gas_sensor_enabled: true, flame_sensor_enabled: true, last_alert_at: null, battery_level: null, local_alarm_enabled: true, maintenance_due_at: null, created_at: null, updated_at: null,
    };
    const alert: Alert = {
      alert_id: "alert_1", device_id: "dev_1", type: "fire_detected", severity: "critical", title: "Api", message: "Api terdeteksi", trigger_values: { gas_ppm: 10, flame_raw: 1, flame_detected: true, detection_status: "danger" }, status: "active", telegram_sent: false, telegram_sent_at: null, acknowledged_by: null, acknowledged_at: null, resolved_at: null, created_at: null, updated_at: null,
    };
    const user: DashboardUser = {
      uid: "user_1", name: "Admin", email: "admin@test.local", role: "admin", status: "active", telegram_chat_id: null, created_at: null, updated_at: null, last_login_at: null,
    };

    expect(device.status).toBe("online");
    expect(alert.telegram_sent).toBe(false);
    expect(user.role).toBe("admin");
  });
});
