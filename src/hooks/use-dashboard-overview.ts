"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, Timestamp } from "firebase/firestore";

import { firebaseClientDb } from "@/lib/firebase/client";
import type { DashboardOverviewSummary } from "@/lib/types";

const DEFAULT_OFFLINE_TIMEOUT_SECONDS = 10;

const DEFAULT_SUMMARY: DashboardOverviewSummary = {
  totalDevices: 0,
  activeDevices: 0,
  totalAlerts: 0,
  unresolvedAlerts: 0,
  totalUsers: 0,
};

type FirestoreRecord = Record<string, unknown>;

function serializeTimestamp(value: unknown) {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return null;
}

function readOfflineTimeoutSeconds(settings: FirestoreRecord | null) {
  return typeof settings?.offline_timeout_seconds === "number"
    ? settings.offline_timeout_seconds
    : DEFAULT_OFFLINE_TIMEOUT_SECONDS;
}

function isDeviceActive(device: FirestoreRecord, offlineTimeoutSeconds: number) {
  if (device.is_active === false) return false;

  const status = typeof device.status === "string" ? device.status : "offline";
  const lastSeenAt = serializeTimestamp(device.last_seen_at);
  if (!lastSeenAt) return status !== "offline";

  const lastSeen = new Date(lastSeenAt);
  if (Number.isNaN(lastSeen.getTime())) return status !== "offline";

  const ageMs = Date.now() - lastSeen.getTime();
  return ageMs <= offlineTimeoutSeconds * 1000;
}

function isAlertUnresolved(alert: FirestoreRecord) {
  return alert.status === "active" || alert.status === "acknowledged";
}

export function useDashboardOverview() {
  const [devices, setDevices] = useState<FirestoreRecord[] | null>(null);
  const [alerts, setAlerts] = useState<FirestoreRecord[] | null>(null);
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [settings, setSettings] = useState<FirestoreRecord | null | undefined>(
    undefined,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleError = (nextError: Error) => {
      setError(nextError.message || "Gagal memuat ringkasan dashboard");
    };

    const unsubscribeDevices = onSnapshot(
      collection(firebaseClientDb, "devices"),
      (snapshot) => {
        setDevices(snapshot.docs.map((item) => item.data()));
        setError(null);
      },
      handleError,
    );

    const unsubscribeAlerts = onSnapshot(
      collection(firebaseClientDb, "alerts"),
      (snapshot) => {
        setAlerts(snapshot.docs.map((item) => item.data()));
        setError(null);
      },
      handleError,
    );

    const unsubscribeUsers = onSnapshot(
      collection(firebaseClientDb, "users"),
      (snapshot) => {
        setUsersCount(snapshot.size);
        setError(null);
      },
      handleError,
    );

    const unsubscribeSettings = onSnapshot(
      doc(firebaseClientDb, "settings", "system"),
      (snapshot) => {
        setSettings(snapshot.exists() ? snapshot.data() : null);
        setError(null);
      },
      handleError,
    );

    return () => {
      unsubscribeDevices();
      unsubscribeAlerts();
      unsubscribeUsers();
      unsubscribeSettings();
    };
  }, []);

  return useMemo(
    () => {
      const loading =
        !error &&
        (devices === null ||
          alerts === null ||
          usersCount === null ||
          settings === undefined);

      if (
        loading ||
        error ||
        devices === null ||
        alerts === null ||
        usersCount === null ||
        settings === undefined
      ) {
        return {
          data: DEFAULT_SUMMARY,
          loading,
          error,
        };
      }

      const offlineTimeoutSeconds = readOfflineTimeoutSeconds(settings);
      const data = {
        totalDevices: devices.length,
        activeDevices: devices.filter((device) =>
          isDeviceActive(device, offlineTimeoutSeconds),
        ).length,
        totalAlerts: alerts.length,
        unresolvedAlerts: alerts.filter(isAlertUnresolved).length,
        totalUsers: usersCount,
      } satisfies DashboardOverviewSummary;

      return {
        data,
        loading,
        error,
      };
    },
    [alerts, devices, error, settings, usersCount],
  );
}
