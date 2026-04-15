import type { NextRequest } from "next/server";

import { getLatestReading } from "@/lib/data";
import { getRequestUser } from "@/lib/firebase/auth";
import { errorResponse, successResponse } from "@/lib/utils/http";

type Params = {
  params: Promise<{ deviceId: string }>;
};

export async function GET(request: NextRequest, context: Params) {
  const actor = await getRequestUser(request);
  if (!actor) return errorResponse("Unauthorized", { status: 401 });

  const { deviceId } = await context.params;
  const reading = await getLatestReading(deviceId);
  if (!reading) return errorResponse("Data sensor tidak ditemukan", { status: 404 });
  return successResponse(reading);
}
