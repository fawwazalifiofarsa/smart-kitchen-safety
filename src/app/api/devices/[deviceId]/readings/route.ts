import type { NextRequest } from "next/server";

import { getReadings, ingestReading, verifyDeviceKey } from "@/lib/data";
import { getRequestUser } from "@/lib/firebase/auth";
import type { CreateReadingRequestBody } from "@/lib/types";
import {
  errorResponse,
  parsePositiveLimit,
  readJsonBody,
  successResponse,
} from "@/lib/utils/http";
import { optionalString, requiredBoolean, requiredNumber, requiredString } from "@/lib/utils/validation";

type Params = {
  params: Promise<{ deviceId: string }>;
};

export async function GET(request: NextRequest, context: Params) {
  const actor = await getRequestUser(request);
  if (!actor) return errorResponse("Unauthorized", { status: 401 });

  const { deviceId } = await context.params;
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
  if (!verifyDeviceKey(deviceId, deviceKey)) {
    return errorResponse("x-device-key tidak valid", { status: 401 });
  }

  const body = await readJsonBody<CreateReadingRequestBody>(request);
  if (!body) return errorResponse("Body request tidak valid");

  const errors: Array<{ field: string; message: string }> = [];
  const temperature = requiredNumber(body.temperature_c, "temperature_c", errors);
  const humidity = requiredNumber(body.humidity_pct, "humidity_pct", errors);
  const gas = requiredNumber(body.gas_ppm, "gas_ppm", errors);
  const flame = requiredBoolean(body.flame_detected, "flame_detected", errors);
  const source = requiredString(body.source, "source", errors);

  if (
    errors.length > 0 ||
    temperature === null ||
    humidity === null ||
    gas === null ||
    flame === null ||
    !source
  ) {
    return errorResponse("Validasi gagal", { errors });
  }

  const saved = await ingestReading(deviceId, {
    temperature_c: temperature,
    humidity_pct: humidity,
    gas_ppm: gas,
    smoke_pct: typeof body.smoke_pct === "number" ? body.smoke_pct : null,
    flame_detected: flame,
    buzzer_active:
      typeof body.buzzer_active === "boolean" ? body.buzzer_active : null,
    source,
    recorded_at: optionalString(body.recorded_at) ?? undefined,
  });

  if (!saved) return errorResponse("Perangkat tidak ditemukan", { status: 404 });
  return successResponse(saved, {
    status: 201,
    message: "Data sensor berhasil disimpan",
  });
}
