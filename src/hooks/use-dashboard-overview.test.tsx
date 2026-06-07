import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const firestoreMock = vi.hoisted(() => ({
  onSnapshot: vi.fn(),
  collection: vi.fn((_db, name: string) => ({ type: "collection", name })),
  doc: vi.fn((_db, collectionName: string, docId: string) => ({ type: "doc", collectionName, docId })),
}));

class TimestampMock {
  constructor(private date: Date) { }
  toDate() {
    return this.date;
  }
}

vi.mock("firebase/firestore", () => ({
  onSnapshot: firestoreMock.onSnapshot,
  collection: firestoreMock.collection,
  doc: firestoreMock.doc,
  Timestamp: TimestampMock,
}));

vi.mock("@/lib/firebase/client", () => ({
  firebaseClientDb: {},
}));

function collectionSnapshot(items: Record<string, unknown>[]) {
  return {
    docs: items.map((item) => ({ data: () => item })),
    size: items.length,
  };
}

function settingsSnapshot(data: Record<string, unknown> | null) {
  return {
    exists: () => Boolean(data),
    data: () => data,
  };
}

describe("useDashboardOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(new Date("2026-01-01T10:00:00.000Z"));
    firestoreMock.onSnapshot.mockImplementation((ref, success) => {
      if (ref.name === "devices") {
        success(collectionSnapshot([
          { device_id: "dev_1", status: "online", is_active: true, last_seen_at: new Date("2026-01-01T09:59:55.000Z") },
          { device_id: "dev_2", status: "offline", is_active: false },
        ]));
      }
      if (ref.name === "alerts") {
        success(collectionSnapshot([
          { alert_id: "a1", status: "active" },
          { alert_id: "a2", status: "resolved" },
          { alert_id: "a3", status: "acknowledged" },
        ]));
      }
      if (ref.name === "users") {
        success(collectionSnapshot([{ uid: "u1" }, { uid: "u2" }]));
      }
      if (ref.type === "doc") {
        success(settingsSnapshot({ offline_timeout_seconds: 10 }));
      }
      return vi.fn();
    });
  });

  it("menghitung dashboard overview dari snapshot Firestore", async () => {
    const { useDashboardOverview } = await import("@/hooks/use-dashboard-overview");
    const { result } = renderHook(() => useDashboardOverview());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({
      totalDevices: 2,
      activeDevices: 1,
      totalAlerts: 3,
      unresolvedAlerts: 2,
      totalUsers: 2,
    });
  });

  it("set error jika listener gagal", async () => {
    firestoreMock.onSnapshot.mockImplementation((_ref, _success, error) => {
      error(new Error("Firestore error"));
      return vi.fn();
    });

    const { useDashboardOverview } = await import("@/hooks/use-dashboard-overview");
    const { result } = renderHook(() => useDashboardOverview());

    await waitFor(() => expect(result.current.error).toBe("Firestore error"));
  });
});
