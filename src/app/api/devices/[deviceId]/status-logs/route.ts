import type { NextRequest } from "next/server";

import { getStatusLogs } from "@/lib/data";
import { getRequestUser } from "@/lib/firebase/auth";
import { errorResponse, parsePositiveLimit, successResponse } from "@/lib/utils/http";

type Params = {
  params: Promise<{ deviceId: string }>;
};

export async function GET(request: NextRequest, context: Params) {
  const actor = await getRequestUser(request);
  if (!actor) return errorResponse("Unauthorized", { status: 401 });

  const { deviceId } = await context.params;
  const limit = parsePositiveLimit(request.nextUrl.searchParams.get("limit"), 50);
  const logs = await getStatusLogs(deviceId, limit);
  return successResponse(logs);
}
