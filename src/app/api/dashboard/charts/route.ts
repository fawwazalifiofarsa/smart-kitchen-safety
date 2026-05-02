import type { NextRequest } from "next/server";

import { getDashboardCharts } from "@/lib/data";
import { getRequestUser } from "@/lib/firebase/auth";
import { errorResponse, successResponse } from "@/lib/utils/http";

export async function GET(request: NextRequest) {
  const actor = await getRequestUser(request);
  if (!actor) return errorResponse("Unauthorized", { status: 401 });

  const { searchParams } = request.nextUrl;
  const points = await getDashboardCharts({
    deviceId: searchParams.get("device_id"),
    startDate: searchParams.get("start_date"),
    endDate: searchParams.get("end_date"),
    interval: searchParams.get("interval"),
  });

  return successResponse(points);
}
