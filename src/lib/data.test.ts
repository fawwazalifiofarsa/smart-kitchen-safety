import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => {
  const docSet = vi.fn();
  const docGet = vi.fn();
  const queryGet = vi.fn();
  const where = vi.fn();
  const orderBy = vi.fn();
  const limit = vi.fn();
  const collection = vi.fn();
  const doc = vi.fn();
  const subCollection = vi.fn();

  const queryApi: any = {
    where: (...args: any[]) => {
      where(...args);
      return queryApi;
    },
    orderBy: (...args: any[]) => {
      orderBy(...args);
      return queryApi;
    },
    limit: (...args: any[]) => {
      limit(...args);
      return queryApi;
    },
    get: queryGet,
    doc: (id: string) => doc(id),
  };

  const docApi: any = {
    get: docGet,
    set: docSet,
    collection: (...args: any[]) => {
      subCollection(...args);
      return queryApi;
    },
  };

  doc.mockReturnValue(docApi);
  collection.mockReturnValue({ ...queryApi, doc });

  return { collection, doc, docSet, docGet, queryGet, where, orderBy, limit, subCollection, queryApi, docApi };
});

const authMocks = vi.hoisted(() => ({
  createUser: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock("@/lib/firebase/admin", () => ({
  adminDb: { collection: dbMocks.collection },
  adminAuth: authMocks,
}));

class TimestampMock {
  private date: Date;
  constructor(date = new Date("2026-01-01T00:00:00.000Z")) {
    this.date = date;
  }
  toDate() {
    return this.date;
  }
  static now() {
    return new TimestampMock();
  }
  static fromDate(date: Date) {
    return new TimestampMock(date);
  }
}

vi.mock("firebase-admin/firestore", () => ({
  Timestamp: TimestampMock,
}));

const actor = {
  uid: "admin_1",
  name: "Admin",
  email: "admin@test.local",
  role: "admin",
  status: "active",
  telegram_chat_id: null,
};

function docSnapshot(id: string, data: Record<string, unknown> | null) {
  return {
    id,
    exists: Boolean(data),
    data: () => data,
  };
}

function querySnapshot(docs: Array<{ id: string; data: Record<string, unknown> }>) {
  return {
    empty: docs.length === 0,
    docs: docs.map((item) => docSnapshot(item.id, item.data)),
    size: docs.length,
  };
}

describe("data.ts service layer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TELEGRAM_BOT_TOKEN = "telegram-token";
    process.env.DEVICE_API_KEY = "global-key";
    delete process.env.DEVICE_API_KEYS_JSON;
    global.fetch = vi.fn();
  });

  it("getSystemSettings memakai default saat settings kosong", async () => {
    const { getSystemSettings } = await import("@/lib/data");
    dbMocks.docGet.mockResolvedValueOnce(docSnapshot("system", null));

    const settings = await getSystemSettings();

    expect(settings.gas_threshold_warning).toBe(100);
    expect(settings.gas_threshold_danger).toBe(300);
    expect(settings.telegram_enabled).toBe(false);
    expect(settings.offline_timeout_seconds).toBe(60);
  });

  it("createDevice menyimpan device dan audit log", async () => {
    const { createDevice } = await import("@/lib/data");

    await createDevice(
      {
        device_id: "dev_1",
        name: "Kitchen Sensor",
        location: "Kitchen",
        room: "Main",
        firmware_version: "1.0.0",
        wifi_ssid: "iot",
        is_active: true,
        gas_sensor_enabled: true,
        flame_sensor_enabled: true,
        local_alarm_enabled: true,
      },
      actor,
    );

    expect(dbMocks.doc).toHaveBeenCalledWith("dev_1");
    expect(dbMocks.docSet).toHaveBeenCalledWith(expect.objectContaining({ device_id: "dev_1", status: "online" }));
  });

  it("getDeviceById return null jika device tidak ditemukan", async () => {
    const { getDeviceById } = await import("@/lib/data");
    dbMocks.docGet
      .mockResolvedValueOnce(docSnapshot("system", { offline_timeout_seconds: 60 }))
      .mockResolvedValueOnce(docSnapshot("dev_404", null));

    await expect(getDeviceById("dev_404")).resolves.toBeNull();
  });

  it("getDevices filter search dan status", async () => {
    const { getDevices } = await import("@/lib/data");
    dbMocks.docGet.mockResolvedValueOnce(docSnapshot("system", { offline_timeout_seconds: 60 }));
    dbMocks.queryGet.mockResolvedValueOnce(querySnapshot([
      { id: "dev_1", data: { name: "Kitchen Sensor", location: "Kitchen", status: "online", is_active: true } },
      { id: "dev_2", data: { name: "Warehouse Sensor", location: "Warehouse", status: "offline", is_active: true } },
    ]));

    const devices = await getDevices({ search: "kitchen", status: "online" });
    expect(devices).toHaveLength(1);
    expect(devices[0].name).toBe("Kitchen Sensor");
  });

  it("verifyDeviceKey support global key dan per-device key", async () => {
    const { verifyDeviceKey } = await import("@/lib/data");
    expect(verifyDeviceKey("dev_1", "global-key")).toBe(true);
    expect(verifyDeviceKey("dev_1", "wrong")).toBe(false);
    process.env.DEVICE_API_KEYS_JSON = JSON.stringify({ dev_1: "specific-key" });
    expect(verifyDeviceKey("dev_1", "specific-key")).toBe(true);
  });

  it("createAlert membuat alert, update device, dan audit log", async () => {
    const { createAlert } = await import("@/lib/data");
    const alertId = await createAlert(
      {
        device_id: "dev_1",
        type: "gas_leak",
        severity: "critical",
        title: "Gas bocor",
        message: "Gas tinggi",
        trigger_values: { gas_ppm: 400, flame_raw: null, flame_detected: false, detection_status: "danger" },
      },
      actor,
    );

    expect(alertId).toContain("alert_");
    expect(dbMocks.docSet).toHaveBeenCalledWith(expect.objectContaining({ status: "active", telegram_sent: false }));
  });

  it("acknowledgeAlert dan resolveAlert mengubah status", async () => {
    const { acknowledgeAlert, resolveAlert } = await import("@/lib/data");
    await acknowledgeAlert("alert_1", actor, "checked");
    expect(dbMocks.docSet).toHaveBeenCalledWith(expect.objectContaining({ status: "acknowledged", acknowledged_by: "admin_1" }), { merge: true });

    await resolveAlert("alert_1", actor, "safe");
    expect(dbMocks.docSet).toHaveBeenCalledWith(expect.objectContaining({ status: "resolved" }), { merge: true });
  });

  it("sendTelegramAlert return null jika alert tidak ditemukan", async () => {
    const { sendTelegramAlert } = await import("@/lib/data");
    dbMocks.docGet.mockResolvedValueOnce(docSnapshot("alert_404", null));

    await expect(sendTelegramAlert("alert_404", { recipient_chat_id: "123" }, actor)).resolves.toBeNull();
  });

  it("sendTelegramAlert gagal jika telegram disabled", async () => {
    const { sendTelegramAlert } = await import("@/lib/data");
    dbMocks.docGet
      .mockResolvedValueOnce(docSnapshot("alert_1", { alert_id: "alert_1", device_id: "dev_1", title: "Alert", message: "Message" }))
      .mockResolvedValueOnce(docSnapshot("system", { telegram_enabled: false }));

    await expect(sendTelegramAlert("alert_1", { recipient_chat_id: "123" }, actor)).rejects.toThrow("Telegram dinonaktifkan");
  });

  it("sendTelegramAlert berhasil kirim Telegram dan update alert", async () => {
    const { sendTelegramAlert } = await import("@/lib/data");
    dbMocks.docGet
      .mockResolvedValueOnce(docSnapshot("alert_1", { alert_id: "alert_1", device_id: "dev_1", title: "Alert", message: "Message" }))
      .mockResolvedValueOnce(docSnapshot("system", { telegram_enabled: true, default_alert_chat_id: "123" }));
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) } as Response);

    const result = await sendTelegramAlert("alert_1", { recipient_chat_id: "123" }, actor);

    expect(result).toEqual({ alert_id: "alert_1", channel: "telegram", status: "sent" });
    expect(fetch).toHaveBeenCalledWith("https://api.telegram.org/bottelegram-token/sendMessage", expect.objectContaining({ method: "POST" }));
  });

  it("sendTelegramAlert mencatat failed dan throw jika provider gagal", async () => {
    const { sendTelegramAlert } = await import("@/lib/data");
    dbMocks.docGet
      .mockResolvedValueOnce(docSnapshot("alert_1", { alert_id: "alert_1", device_id: "dev_1", title: "Alert", message: "Message" }))
      .mockResolvedValueOnce(docSnapshot("system", { telegram_enabled: true, default_alert_chat_id: "123" }));
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, json: async () => ({ ok: false, description: "Bad Request" }) } as Response);

    await expect(sendTelegramAlert("alert_1", { recipient_chat_id: "123" }, actor)).rejects.toThrow("Pengiriman Telegram gagal");
  });

  it("updateSystemSettings menyimpan settings dan audit log", async () => {
    const { updateSystemSettings } = await import("@/lib/data");
    dbMocks.docGet.mockResolvedValueOnce(docSnapshot("system", { telegram_enabled: true, default_alert_chat_id: "123" }));

    const result = await updateSystemSettings({ telegram_enabled: true, default_alert_chat_id: "123" }, actor);

    expect(dbMocks.docSet).toHaveBeenCalledWith(expect.objectContaining({ telegram_enabled: true, updated_by: "admin_1" }), { merge: true });
    expect(result.telegram_enabled).toBe(true);
  });

  it("ingestReading menghasilkan safe, warning, dan danger sesuai threshold", async () => {
    const { ingestReading } = await import("@/lib/data");

    dbMocks.docGet
      .mockResolvedValueOnce(docSnapshot("dev_1", { device_id: "dev_1", name: "Kitchen", location: "Kitchen", status: "online", is_active: true }))
      .mockResolvedValueOnce(docSnapshot("system", { gas_threshold_warning: 100, gas_threshold_danger: 300 }))
      .mockResolvedValueOnce(docSnapshot("dev_1", { device_id: "dev_1", name: "Kitchen", location: "Kitchen", status: "online", is_active: true }))
      .mockResolvedValueOnce(docSnapshot("system", { gas_threshold_warning: 100, gas_threshold_danger: 300 }))
      .mockResolvedValueOnce(docSnapshot("dev_1", { device_id: "dev_1", name: "Kitchen", location: "Kitchen", status: "online", is_active: true }))
      .mockResolvedValueOnce(docSnapshot("system", { gas_threshold_warning: 100, gas_threshold_danger: 300 }));
    dbMocks.queryGet.mockResolvedValue(querySnapshot([]));

    await expect(ingestReading("dev_1", { gas_ppm: 50, flame_detected: false })).resolves.toMatchObject({ safe_status: "safe" });
    await expect(ingestReading("dev_1", { gas_ppm: 150, flame_detected: false })).resolves.toMatchObject({ safe_status: "warning" });
    await expect(ingestReading("dev_1", { gas_ppm: 50, flame_detected: true })).resolves.toMatchObject({ safe_status: "danger" });
  });

  it("createUser, updateUser, deactivateUser memanggil Firebase Auth dan Firestore", async () => {
    const { createUser, updateUser, deactivateUser } = await import("@/lib/data");
    authMocks.createUser.mockResolvedValueOnce({ uid: "user_1" });
    dbMocks.docGet.mockResolvedValueOnce(docSnapshot("user_1", { name: "User", email: "user@test.local", role: "member", status: "active" }));

    const created = await createUser({ name: "User", email: "user@test.local", password: "secret", role: "member", status: "active", telegram_chat_id: null }, actor);
    expect(authMocks.createUser).toHaveBeenCalledWith(expect.objectContaining({ email: "user@test.local" }));
    expect(created?.uid).toBe("user_1");

    dbMocks.docGet.mockResolvedValueOnce(docSnapshot("user_1", { name: "User 2", email: "user2@test.local", role: "member", status: "active" }));
    await updateUser("user_1", { name: "User 2", email: "user2@test.local" }, actor);
    expect(authMocks.updateUser).toHaveBeenCalledWith("user_1", expect.objectContaining({ displayName: "User 2" }));

    await deactivateUser("user_1", actor);
    expect(authMocks.updateUser).toHaveBeenCalledWith("user_1", { disabled: true });
  });

  it("getDashboardCharts melakukan bucket data sensor", async () => {
    const { getDashboardCharts } = await import("@/lib/data");
    dbMocks.queryGet.mockResolvedValueOnce(querySnapshot([
      { id: "r1", data: { device_id: "dev_1", gas_ppm: 100, flame_raw: 1, recorded_at: new TimestampMock(new Date("2026-01-01T10:15:00Z")) } },
      { id: "r2", data: { device_id: "dev_1", gas_ppm: 200, flame_raw: 3, recorded_at: new TimestampMock(new Date("2026-01-01T10:45:00Z")) } },
    ]));

    const chart = await getDashboardCharts({ deviceId: "dev_1", interval: "hour" });
    expect(chart).toEqual([{ time: expect.any(String), gas_ppm: 150, flame_raw: 2 }]);
  });

  it("getDashboardCharts mendukung bucket menit dan tidak mengubah flame_raw kosong menjadi 0", async () => {
    const { getDashboardCharts } = await import("@/lib/data");
    dbMocks.queryGet.mockResolvedValueOnce(querySnapshot([
      { id: "r1", data: { device_id: "dev_1", gas_ppm: 40, flame_raw: null, recorded_at: new TimestampMock(new Date("2026-01-01T10:15:05Z")) } },
      { id: "r2", data: { device_id: "dev_1", gas_ppm: 50, flame_raw: null, recorded_at: new TimestampMock(new Date("2026-01-01T10:15:45Z")) } },
      { id: "r3", data: { device_id: "dev_1", gas_ppm: 60, flame_raw: 1, recorded_at: new TimestampMock(new Date("2026-01-01T10:16:05Z")) } },
    ]));

    const chart = await getDashboardCharts({ deviceId: "dev_1", interval: "minute" });
    expect(chart).toEqual([
      { time: "2026-01-01T10:15:00.000Z", gas_ppm: 45, flame_raw: null },
      { time: "2026-01-01T10:16:00.000Z", gas_ppm: 60, flame_raw: 1 },
    ]);
  });
});
