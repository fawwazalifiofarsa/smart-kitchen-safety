import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleAlert, sampleAuditLog, sampleDevice, sampleNotificationLog, sampleReading, sampleSettings, sampleUser } from "@/test/fixtures";

const dataMock = vi.hoisted(() => ({
  acknowledgeAlert: vi.fn(),
  createAlert: vi.fn(),
  createDevice: vi.fn(),
  createUser: vi.fn(),
  deactivateDevice: vi.fn(),
  deactivateUser: vi.fn(),
  getAlertById: vi.fn(),
  getAlerts: vi.fn(),
  getAuditLogs: vi.fn(),
  getDashboardCharts: vi.fn(),
  getDashboardOverview: vi.fn(),
  getDeviceById: vi.fn(),
  getDevices: vi.fn(),
  getLatestReading: vi.fn(),
  getNotificationLogs: vi.fn(),
  getReadings: vi.fn(),
  getStatusLogs: vi.fn(),
  getSystemSettings: vi.fn(),
  getUserById: vi.fn(),
  getUsers: vi.fn(),
  ingestReading: vi.fn(),
  resolveAlert: vi.fn(),
  sendTelegramAlert: vi.fn(),
  updateDevice: vi.fn(),
  updateSystemSettings: vi.fn(),
  updateUser: vi.fn(),
  verifyDeviceKey: vi.fn(),
}));

const authMock = vi.hoisted(() => ({
  clearAuthCookies: vi.fn(),
  createSessionCookie: vi.fn(),
  createUserProfile: vi.fn(),
  createUserWithPassword: vi.fn(),
  getRequestUser: vi.fn(),
  getUserFromAccessToken: vi.fn(),
  refreshAccessToken: vi.fn(),
  setAuthCookies: vi.fn(),
  signInWithPassword: vi.fn(),
  REFRESH_TOKEN_COOKIE_NAME: "refresh_token",
}));

const adminMock = vi.hoisted(() => ({
  adminAuth: { revokeRefreshTokens: vi.fn() },
}));

vi.mock("@/lib/data", () => dataMock);
vi.mock("@/lib/firebase/auth", () => authMock);
vi.mock("@/lib/firebase/admin", () => adminMock);

function request(url: string, options?: { method?: string; body?: unknown; headers?: Record<string, string>; cookies?: Record<string, string> }) {
  const req = new Request(url, {
    method: options?.method ?? "GET",
    headers: options?.headers,
    body: options?.body === undefined ? undefined : JSON.stringify(options.body),
  }) as any;
  req.nextUrl = new URL(url);
  req.cookies = {
    get: (name: string) => options?.cookies?.[name] ? { value: options.cookies[name] } : undefined,
  };
  return req;
}

function params<T extends Record<string, string>>(value: T) {
  return { params: Promise.resolve(value) } as any;
}

async function json(response: Response) {
  return response.json() as Promise<any>;
}

describe("API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.getRequestUser.mockResolvedValue(sampleUser);
    dataMock.getAlerts.mockResolvedValue([sampleAlert]);
    dataMock.createAlert.mockResolvedValue("alert_1");
    dataMock.getAlertById.mockResolvedValue(sampleAlert);
    dataMock.getDevices.mockResolvedValue([sampleDevice]);
    dataMock.getDeviceById.mockResolvedValue(sampleDevice);
    dataMock.createDevice.mockResolvedValue(undefined);
    dataMock.updateDevice.mockResolvedValue(undefined);
    dataMock.getReadings.mockResolvedValue([sampleReading]);
    dataMock.getLatestReading.mockResolvedValue(sampleReading);
    dataMock.getStatusLogs.mockResolvedValue([]);
    dataMock.getSystemSettings.mockResolvedValue(sampleSettings);
    dataMock.updateSystemSettings.mockResolvedValue(sampleSettings);
    dataMock.getUsers.mockResolvedValue([sampleUser]);
    dataMock.getUserById.mockResolvedValue(sampleUser);
    dataMock.createUser.mockResolvedValue(sampleUser);
    dataMock.updateUser.mockResolvedValue(sampleUser);
    dataMock.getAuditLogs.mockResolvedValue([sampleAuditLog]);
    dataMock.getNotificationLogs.mockResolvedValue([sampleNotificationLog]);
    dataMock.getDashboardOverview.mockResolvedValue({ devices_total: 1, devices_online: 1, devices_offline: 0, active_alerts: 1, critical_alerts: 1, latest_readings: [sampleReading] });
    dataMock.getDashboardCharts.mockResolvedValue([{ time: "2026-01-01T10:00:00.000Z", gas_ppm: 120, flame_raw: 1 }]);
    dataMock.sendTelegramAlert.mockResolvedValue({ alert_id: "alert_1", channel: "telegram", status: "sent" });
    dataMock.ingestReading.mockResolvedValue({ reading_id: "reading_1", safe_status: "safe" });
    dataMock.verifyDeviceKey.mockReturnValue(true);
  });

  it("/api/alerts GET dan POST", async () => {
    const alertsRoute = await import("@/app/api/alerts/route");
    const getRes = await alertsRoute.GET(request("http://test.local/api/alerts?status=active"));
    expect(getRes.status).toBe(200);
    expect((await json(getRes)).data[0].alert_id).toBe("alert_1");

    const postRes = await alertsRoute.POST(request("http://test.local/api/alerts", { method: "POST", body: { device_id: "dev_1", type: "gas_leak", severity: "critical", title: "Gas", message: "Detected", trigger_values: {} } }));
    expect(postRes.status).toBe(201);
    expect(dataMock.createAlert).toHaveBeenCalled();
  });

  it("/api/alerts/[alertId] detail, acknowledge, resolve, send telegram", async () => {
    const detail = await import("@/app/api/alerts/[alertId]/route");
    const ack = await import("@/app/api/alerts/[alertId]/acknowledge/route");
    const resolve = await import("@/app/api/alerts/[alertId]/resolve/route");
    const telegram = await import("@/app/api/alerts/[alertId]/send-telegram/route");

    expect((await detail.GET(request("http://test.local/api/alerts/alert_1"), params({ alertId: "alert_1" }))).status).toBe(200);
    expect((await ack.PATCH(request("http://test.local/api/alerts/alert_1/acknowledge", { method: "PATCH", body: { note: "checked" } }), params({ alertId: "alert_1" }))).status).toBe(200);
    expect((await resolve.PATCH(request("http://test.local/api/alerts/alert_1/resolve", { method: "PATCH", body: { resolution_note: "safe" } }), params({ alertId: "alert_1" }))).status).toBe(200);
    expect((await telegram.POST(request("http://test.local/api/alerts/alert_1/send-telegram", { method: "POST", body: { recipient_chat_id: "12345" } }), params({ alertId: "alert_1" }))).status).toBe(200);
  });

  it("/api/devices GET, POST, PATCH, DELETE", async () => {
    const devices = await import("@/app/api/devices/route");
    const detail = await import("@/app/api/devices/[deviceId]/route");

    expect((await devices.GET(request("http://test.local/api/devices"))).status).toBe(200);
    expect((await devices.POST(request("http://test.local/api/devices", { method: "POST", body: { device_id: "dev_1", name: "Kitchen", location: "Kitchen", room: "Main", gas_sensor_enabled: true, flame_sensor_enabled: true, local_alarm_enabled: true, is_active: true } }))).status).toBe(201);
    expect((await detail.GET(request("http://test.local/api/devices/dev_1"), params({ deviceId: "dev_1" }))).status).toBe(200);
    expect((await detail.PATCH(request("http://test.local/api/devices/dev_1", { method: "PATCH", body: { name: "Updated" } }), params({ deviceId: "dev_1" }))).status).toBe(200);
    expect((await detail.DELETE(request("http://test.local/api/devices/dev_1"), params({ deviceId: "dev_1" }))).status).toBe(200);
  });

  it("/api/devices readings, latest, status logs", async () => {
    const readings = await import("@/app/api/devices/[deviceId]/readings/route");
    const latest = await import("@/app/api/devices/[deviceId]/readings/latest/route");
    const statusLogs = await import("@/app/api/devices/[deviceId]/status-logs/route");

    expect((await readings.GET(request("http://test.local/api/devices/dev_1/readings?limit=10", { headers: { "x-device-key": "key" } }), params({ deviceId: "dev_1" }))).status).toBe(200);
    expect((await readings.POST(request("http://test.local/api/devices/dev_1/readings", { method: "POST", headers: { "x-device-key": "key" }, body: { gas_ppm: 10, flame_detected: false } }), params({ deviceId: "dev_1" }))).status).toBe(201);
    expect((await latest.GET(request("http://test.local/api/devices/dev_1/readings/latest"), params({ deviceId: "dev_1" }))).status).toBe(200);
    expect((await statusLogs.GET(request("http://test.local/api/devices/dev_1/status-logs"), params({ deviceId: "dev_1" }))).status).toBe(200);
  });

  it("/api/settings/system GET dan PATCH", async () => {
    const settings = await import("@/app/api/settings/system/route");
    expect((await settings.GET(request("http://test.local/api/settings/system"))).status).toBe(200);
    expect((await settings.PATCH(request("http://test.local/api/settings/system", { method: "PATCH", body: { telegram_enabled: true } }))).status).toBe(200);
  });

  it("/api/users GET, POST, GET by id, PATCH, DELETE", async () => {
    const users = await import("@/app/api/users/route");
    const detail = await import("@/app/api/users/[uid]/route");
    expect((await users.GET(request("http://test.local/api/users"))).status).toBe(200);
    expect((await users.POST(request("http://test.local/api/users", { method: "POST", body: { name: "User", email: "user@test.local", password: "secret", role: "member", status: "active" } }))).status).toBe(201);
    expect((await detail.GET(request("http://test.local/api/users/user_1"), params({ uid: "user_1" }))).status).toBe(200);
    expect((await detail.PATCH(request("http://test.local/api/users/user_1", { method: "PATCH", body: { name: "User 2" } }), params({ uid: "user_1" }))).status).toBe(200);
    expect((await detail.DELETE(request("http://test.local/api/users/user_1"), params({ uid: "user_1" }))).status).toBe(200);
  });

  it("dashboard, audit logs, notification logs", async () => {
    const overview = await import("@/app/api/dashboard/overview/route");
    const charts = await import("@/app/api/dashboard/charts/route");
    const audit = await import("@/app/api/audit-logs/route");
    const notification = await import("@/app/api/notification-logs/route");
    expect((await overview.GET(request("http://test.local/api/dashboard/overview"))).status).toBe(200);
    expect((await charts.GET(request("http://test.local/api/dashboard/charts?interval=hour"))).status).toBe(200);
    expect((await audit.GET(request("http://test.local/api/audit-logs"))).status).toBe(200);
    expect((await notification.GET(request("http://test.local/api/notification-logs"))).status).toBe(200);
  });

  it("auth login, refresh, register, me, logout", async () => {
    authMock.signInWithPassword.mockResolvedValue({ idToken: "id-token", refreshToken: "refresh" });
    authMock.getUserFromAccessToken.mockResolvedValue(sampleUser);
    authMock.createSessionCookie.mockResolvedValue("session-cookie");
    authMock.refreshAccessToken.mockResolvedValue({ id_token: "new-id-token", refresh_token: "new-refresh" });
    authMock.createUserWithPassword.mockResolvedValue({ localId: "user_1", email: "user@test.local", idToken: "id-token", refreshToken: "refresh" });

    const login = await import("@/app/api/auth/login/route");
    const refresh = await import("@/app/api/auth/refresh/route");
    const register = await import("@/app/api/auth/register/route");
    const me = await import("@/app/api/auth/me/route");
    const logout = await import("@/app/api/auth/logout/route");

    expect((await login.POST(request("http://test.local/api/auth/login", { method: "POST", body: { email: "admin@test.local", password: "secret" } }))).status).toBe(200);
    expect((await refresh.POST(request("http://test.local/api/auth/refresh", { method: "POST", body: { refresh_token: "refresh" } }))).status).toBe(200);
    expect((await register.POST(request("http://test.local/api/auth/register", { method: "POST", body: { name: "User", email: "user@test.local", password: "secret" } }))).status).toBe(200);
    expect((await me.GET(request("http://test.local/api/auth/me"))).status).toBe(200);
    expect((await logout.POST(request("http://test.local/api/auth/logout", { method: "POST" }))).status).toBe(200);
  });

  it("return Unauthorized saat user tidak login", async () => {
    authMock.getRequestUser.mockResolvedValueOnce(null);
    const alerts = await import("@/app/api/alerts/route");
    const response = await alerts.GET(request("http://test.local/api/alerts"));
    expect(response.status).toBe(401);
  });

  it("return validation error untuk body tidak lengkap", async () => {
    const devices = await import("@/app/api/devices/route");
    const response = await devices.POST(request("http://test.local/api/devices", { method: "POST", body: { name: "Incomplete" } }));
    expect(response.status).toBe(400);
    expect((await json(response)).message).toBe("Validasi gagal");
  });
});
