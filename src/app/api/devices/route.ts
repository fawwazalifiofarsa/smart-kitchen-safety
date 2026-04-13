import type { NextRequest } from "next/server";

import { createDevice, getDevices } from "@/lib/data";
import { getRequestUser } from "@/lib/firebase/auth";
import type { CreateDeviceRequestBody } from "@/lib/types";
import { errorResponse, readJsonBody, successResponse } from "@/lib/utils/http";
import {
  optionalString,
  requiredBoolean,
  requiredString,
} from "@/lib/utils/validation";

export async function GET(request: NextRequest) {
  const actor = await getRequestUser(request);
  if (!actor) return errorResponse("Unauthorized", { status: 401 });

  const { searchParams } = request.nextUrl;
  const data = await getDevices({
    search: searchParams.get("search"),
    status: searchParams.get("status"),
    location: searchParams.get("location"),
  });
  return successResponse(data);
}

export async function POST(request: NextRequest) {
  const actor = await getRequestUser(request);
  if (!actor) return errorResponse("Unauthorized", { status: 401 });
  if (actor.role !== "admin") return errorResponse("Forbidden", { status: 403 });

  const body = await readJsonBody<CreateDeviceRequestBody>(request);
  if (!body) return errorResponse("Body request tidak valid");

  const errors: Array<{ field: string; message: string }> = [];
  const deviceId = requiredString(body.device_id, "device_id", errors);
  const name = requiredString(body.name, "name", errors);
  const location = requiredString(body.location, "location", errors);
  const gas = requiredBoolean(body.gas_sensor_enabled, "gas_sensor_enabled", errors);
  const flame = requiredBoolean(body.flame_sensor_enabled, "flame_sensor_enabled", errors);
  const temp = requiredBoolean(body.temp_sensor_enabled, "temp_sensor_enabled", errors);
  const humidity = requiredBoolean(body.humidity_sensor_enabled, "humidity_sensor_enabled", errors);
  const localAlarm = requiredBoolean(body.local_alarm_enabled, "local_alarm_enabled", errors);
  const active = requiredBoolean(body.is_active, "is_active", errors);

  if (
    errors.length > 0 ||
    !deviceId ||
    !name ||
    !location ||
    gas === null ||
    flame === null ||
    temp === null ||
    humidity === null ||
    localAlarm === null ||
    active === null
  ) {
    return errorResponse("Validasi gagal", { errors });
  }

  await createDevice(
    {
      device_id: deviceId,
      name,
      location,
      room: optionalString(body.room) ?? null,
      firmware_version: optionalString(body.firmware_version) ?? null,
      wifi_ssid: optionalString(body.wifi_ssid) ?? null,
      gas_sensor_enabled: gas,
      flame_sensor_enabled: flame,
      temp_sensor_enabled: temp,
      humidity_sensor_enabled: humidity,
      local_alarm_enabled: localAlarm,
      is_active: active,
    },
    actor,
  );

  return successResponse(
    {
      device_id: deviceId,
    },
    {
      status: 201,
      message: "Perangkat berhasil didaftarkan",
    },
  );
}