import type { NextRequest } from "next/server";

import { getLatestReading, verifyDeviceKey } from "@/lib/data";
import { getRequestUser } from "@/lib/firebase/auth";
import { errorResponse, successResponse } from "@/lib/utils/http";

type Params = {
  params: Promise<{ deviceId: string }>;
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

  const reading = await getLatestReading(deviceId);
  if (!reading) return errorResponse("Data sensor tidak ditemukan", { status: 404 });
  return successResponse(reading);
}
