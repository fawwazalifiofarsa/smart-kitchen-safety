import type { NextRequest } from "next/server";

import { deactivateDevice, getDeviceById, updateDevice } from "@/lib/data";
import { getRequestUser } from "@/lib/firebase/auth";
import type { UpdateDeviceRequestBody } from "@/lib/types";
import { errorResponse, readJsonBody, successResponse } from "@/lib/utils/http";
import {
  optionalBoolean,
  optionalNumber,
  optionalString,
} from "@/lib/utils/validation";

type Params = {
  params: Promise<{ deviceId: string }>;
};

export async function GET(request: NextRequest, context: Params) {
  const actor = await getRequestUser(request);
  if (!actor) return errorResponse("Unauthorized", { status: 401 });

  const { deviceId } = await context.params;
  const device = await getDeviceById(deviceId);
  if (!device) return errorResponse("Perangkat tidak ditemukan", { status: 404 });
  return successResponse(device);
}

export async function PATCH(request: NextRequest, context: Params) {
  const actor = await getRequestUser(request);
  if (!actor) return errorResponse("Unauthorized", { status: 401 });
  if (actor.role !== "admin") return errorResponse("Forbidden", { status: 403 });

  const { deviceId } = await context.params;
  const body = await readJsonBody<UpdateDeviceRequestBody>(request);
  if (!body) return errorResponse("Body request tidak valid");

  await updateDevice(
    deviceId,
    {
      name: optionalString(body.name) ?? undefined,
      location: optionalString(body.location) ?? undefined,
      room: optionalString(body.room),
      firmware_version: optionalString(body.firmware_version),
      ip_address: optionalString(body.ip_address),
      wifi_ssid: optionalString(body.wifi_ssid),
      is_active: optionalBoolean(body.is_active) ?? undefined,
      gas_sensor_enabled: optionalBoolean(body.gas_sensor_enabled) ?? undefined,
      flame_sensor_enabled: optionalBoolean(body.flame_sensor_enabled) ?? undefined,
      temp_sensor_enabled: optionalBoolean(body.temp_sensor_enabled) ?? undefined,
      humidity_sensor_enabled:
        optionalBoolean(body.humidity_sensor_enabled) ?? undefined,
      local_alarm_enabled: optionalBoolean(body.local_alarm_enabled) ?? undefined,
      battery_level: optionalNumber(body.battery_level),
      maintenance_due_at: optionalString(body.maintenance_due_at),
    },
    actor,
  );

  return successResponse(
    {
      device_id: deviceId,
    },
    { message: "Perangkat berhasil diperbarui" },
  );
}

export async function DELETE(request: NextRequest, context: Params) {
  const actor = await getRequestUser(request);
  if (!actor) return errorResponse("Unauthorized", { status: 401 });
  if (actor.role !== "admin") return errorResponse("Forbidden", { status: 403 });

  const { deviceId } = await context.params;
  await deactivateDevice(deviceId, actor);
  return successResponse({}, { message: "Perangkat berhasil dihapus" });
}
