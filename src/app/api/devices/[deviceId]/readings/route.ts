import type { NextRequest } from "next/server";

import { createAlert, getReadings, getSystemSettings, ingestReading, sendTelegramAlert, verifyDeviceKey } from "@/lib/data";
import { getRequestUser } from "@/lib/firebase/auth";
import type { AuthenticatedUser, CreateReadingRequestBody } from "@/lib/types";
import {
  errorResponse,
  parsePositiveLimit,
  readJsonBody,
  successResponse,
} from "@/lib/utils/http";
import {
  optionalNumber,
  optionalString,
  requiredBoolean,
  requiredNumber,
} from "@/lib/utils/validation";

type Params = {
  params: Promise<{ deviceId: string }>;
};

const systemActor: AuthenticatedUser = {
  uid: "system",
  name: "System",
  email: "system@smart-kitchen.local",
  role: "admin",
  status: "active",
  telegram_chat_id: null,
};

async function canReadDeviceSensorData(request: NextRequest, deviceId: string) {
  const deviceKey = request.headers.get("x-device-key");
  if (verifyDeviceKey(deviceId, deviceKey)) return true;

  return Boolean(await getRequestUser(request));
}

export async function GET(request: NextRequest, context: Params) {
  const { deviceId } = await context.params;
  if (!(await canReadDeviceSensorData(request, deviceId))) {
    return errorResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const data = await getReadings(deviceId, {
    startDate: searchParams.get("start_date"),
    endDate: searchParams.get("end_date"),
    limit: parsePositiveLimit(searchParams.get("limit"), 100),
  });

  return successResponse(data);
}

export async function POST(request: NextRequest, context: Params) {
  const { deviceId } = await context.params;
  const deviceKey = request.headers.get("x-device-key");
  console.log("[sensor-ingest]", {
    method: request.method,
    deviceId,
    hasDeviceKey: Boolean(deviceKey),
    espDevice: request.headers.get("x-esp-device") ?? null,
  });

  if (!verifyDeviceKey(deviceId, deviceKey)) {
    return errorResponse("x-device-key tidak valid", { status: 401 });
  }

  const body = await readJsonBody<CreateReadingRequestBody>(request);
  if (!body) return errorResponse("Body request tidak valid");

  const errors: Array<{ field: string; message: string }> = [];
  const bodyDeviceId = optionalString(body.device_id);
  if (bodyDeviceId && bodyDeviceId !== deviceId) {
    errors.push({
      field: "device_id",
      message: "device_id tidak sesuai dengan path perangkat",
    });
  }

  const gas = requiredNumber(body.gas_ppm ?? body.gas, "gas_ppm", errors);
  const flame = requiredBoolean(body.flame_detected, "flame_detected", errors);
  const flameRaw = optionalNumber(body.flame_raw);
  const espMillis = optionalNumber(body.esp_millis);
  if (
    body.flame_raw !== undefined &&
    body.flame_raw !== null &&
    flameRaw === undefined
  ) {
    errors.push({ field: "flame_raw", message: "flame raw harus berupa angka" });
  }
  if (
    body.esp_millis !== undefined &&
    body.esp_millis !== null &&
    espMillis === undefined
  ) {
    errors.push({ field: "esp_millis", message: "esp millis harus berupa angka" });
  }

  if (errors.length > 0 || gas === null || flame === null) {
    return errorResponse("Validasi gagal", { errors });
  }

  const saved = await ingestReading(deviceId, {
    gas_ppm: gas,
    flame_raw: flameRaw ?? null,
    flame_detected: flame,
    flame_message: optionalString(body.flame_message) ?? null,
    detection_status: optionalString(body.detection_status) ?? null,
    esp_millis: espMillis ?? null,
    buzzer_active:
      typeof body.buzzer_active === "boolean" ? body.buzzer_active : null,
    source: optionalString(body.source) ?? "esp8266",
    recorded_at: optionalString(body.recorded_at) ?? undefined,
    device_name: optionalString(body.device_name) ?? null,
    location: optionalString(body.location) ?? null,
    room: optionalString(body.room) ?? null,
  });

  const settings = await getSystemSettings();

  const isDanger =
    saved.safe_status === "danger" ||
    gas >= settings.gas_threshold_danger ||
    flame === true;

  if (isDanger && settings.telegram_enabled) {
    const systemActor: AuthenticatedUser = {
      uid: "system",
      name: "System",
      email: "system@smart-kitchen.local",
      role: "admin",
      status: "active",
      telegram_chat_id: null,
    };

    const alertId = await createAlert(
      {
        device_id: deviceId,
        type: flame ? "fire" : "gas_leak",
        title: "Danger Detected",
        message: `Gas terdeteksi ${gas} ppm. Flame: ${flame ? "Detected" : "Clear"
          }. Status: ${saved.safe_status}`,
        severity: "critical",
        trigger_values: {
          gas_ppm: gas,
          flame_detected: flame,
          flame_raw: flameRaw ?? null,
          detection_status: optionalString(body.detection_status) ?? saved.safe_status,
        },
      },
      systemActor,
    );

    await sendTelegramAlert(
      alertId,
      {
        recipient_chat_id: settings.default_alert_chat_id ?? "",
      },
      systemActor,
    );
  }

  return successResponse(saved, {
    status: 201,
    message: "Data sensor berhasil disimpan",
  });
}
