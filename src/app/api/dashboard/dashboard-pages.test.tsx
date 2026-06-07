import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleAlert, sampleAuditLog, sampleChart, sampleDevice, sampleNotificationLog, sampleReading, sampleSettings, sampleUser } from "@/test/fixtures";

vi.mock("@/lib/firebase/client", () => ({
  firebaseClientApp: {},
  firebaseClientAuth: {},
  firebaseClientDb: {},
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => ({ type: "collection" })),
  query: vi.fn((ref) => ref),
  orderBy: vi.fn(() => ({})),
  limit: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  doc: vi.fn(() => ({ type: "doc" })),

  getDocs: vi.fn(async () => ({
    docs: [],
  })),

  getDoc: vi.fn(async () => ({
    exists: () => false,
    data: () => null,
  })),

  onSnapshot: vi.fn((ref, callback) => {
    if ((ref as any)?.type === "doc") {
      callback({
        exists: () => true,
        data: () => sampleSettings,
      });

      return vi.fn();
    }

    callback({
      docs: [],
    });

    return vi.fn();
  }),
}));

const apiMock = vi.hoisted(() => ({
  useApiData: vi.fn(),
  fetchJson: vi.fn(),
}));


vi.mock("@/lib/use-api-data", () => apiMock);
vi.mock("next/link", () => ({ default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a> }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }), usePathname: () => "/dashboard" }));

function ok(data: unknown) {
  return { data, loading: false, error: null, reload: vi.fn(), setData: vi.fn() };
}

function loading() {
  return { data: null, loading: true, error: null, reload: vi.fn(), setData: vi.fn() };
}

function setupUseApiData() {
  apiMock.useApiData.mockImplementation((url: string) => {
    if (url === "/api/dashboard/overview") return ok({ devices_total: 1, devices_online: 1, devices_offline: 0, active_alerts: 1, critical_alerts: 1, latest_readings: [{ ...sampleReading, name: "Kitchen Sensor" }] });
    if (url.startsWith("/api/dashboard/charts")) return ok(sampleChart);
    if (url.startsWith("/api/alerts")) return ok([sampleAlert]);
    if (url.startsWith("/api/devices") && url.includes("readings/latest")) return ok(sampleReading);
    if (url.startsWith("/api/devices") && url.includes("readings")) return ok([sampleReading]);
    if (url.startsWith("/api/devices") && url.includes("status-logs")) return ok([{ log_id: "log_1", device_id: "dev_1", previous_status: "online", new_status: "warning", reason: "sensor_ingestion", created_at: "2026-01-01T10:00:00.000Z" }]);
    if (url === "/api/devices") return ok([sampleDevice]);
    if (url === "/api/settings/system") return ok(sampleSettings);
    if (url === "/api/users") return ok([sampleUser]);
    if (url === "/api/audit-logs") return ok([sampleAuditLog]);
    if (url === "/api/notification-logs") return ok([sampleNotificationLog]);
    return ok(null);
  });
}

describe("dashboard pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupUseApiData();
  });

  it("DashboardOverviewPage render overview, chart, dan alert", async () => {
    const Page = (await import("@/app/dashboard/page")).default;
    render(<Page />);
    expect(screen.getByText("Dashboard Overview")).toBeInTheDocument();
    expect(screen.getByText("Kitchen Sensor")).toBeInTheDocument();
    expect(screen.getByText("Gas bocor")).toBeInTheDocument();
  });

  it("DevicesPage render data perangkat", async () => {
    const Page = (await import("@/app/dashboard/devices/page")).default;
    render(<Page />);
    expect(screen.getByRole("heading", { name: /devices/i })).toBeInTheDocument();
    expect(screen.getByText("Kitchen Sensor")).toBeInTheDocument();
  });

  it("AlertsPage render data alert", async () => {
    const Page = (await import("@/app/dashboard/alerts/page")).default;
    render(<Page />);
    expect(screen.getByRole("heading", { name: /alerts/i })).toBeInTheDocument();
    expect(screen.getByText("Gas bocor")).toBeInTheDocument();
  });

  it("MonitoringPage render monitoring dan histori sensor", async () => {
    const Page = (await import("@/app/dashboard/monitoring/page")).default;
    render(<Page />);
    expect(screen.getByRole("heading", { name: /monitoring/i })).toBeInTheDocument();
    expect(screen.getByText("Kitchen Sensor")).toBeInTheDocument();
  });

  it("SettingsPage render konfigurasi sistem", async () => {
    const Page = (await import("@/app/dashboard/settings/page")).default;
    render(<Page />);
    expect(screen.getByText("System Settings")).toBeInTheDocument();
    expect(screen.getByDisplayValue("12345")).toBeInTheDocument();
  });

  it("UsersPage render data user", async () => {
    const Page = (await import("@/app/dashboard/users/page")).default;
    render(<Page />);
    expect(screen.getByRole("heading", { name: /users & members/i })).toBeInTheDocument();
    expect(screen.getByText("Admin User")).toBeInTheDocument();
  });

  it("AuditLogsPage render audit log", async () => {
    const Page = (await import("@/app/dashboard/audit-logs/page")).default;
    render(<Page />);
    expect(screen.getByText("Audit Logs")).toBeInTheDocument();
    expect(screen.getByText("create_device")).toBeInTheDocument();
  });

  it("NotificationLogsPage render notification logs", async () => {
    const Page = (await import("@/app/dashboard/notifications/page")).default;
    render(<Page />);
    expect(screen.getByText("Notification Logs")).toBeInTheDocument();
    expect(screen.getByText("alert_1")).toBeInTheDocument();
    expect(screen.getByText("12345")).toBeInTheDocument();
    expect(screen.getByText("sent")).toBeInTheDocument();
  });

  it("page menampilkan loading state", async () => {
    apiMock.useApiData.mockReturnValue(loading());
    const Page = (await import("@/app/dashboard/devices/page")).default;
    render(<Page />);
    expect(screen.getByText("Memuat data perangkat...")).toBeInTheDocument();
  });
});
