import type { NextRequest } from "next/server";

import { getNotificationLogs } from "@/lib/data";
import { getRequestUser } from "@/lib/firebase/auth";
import { errorResponse, successResponse } from "@/lib/utils/http";

export async function GET(request: NextRequest) {
  const actor = await getRequestUser(request);
  if (!actor) return errorResponse("Unauthorized", { status: 401 });

  const { searchParams } = request.nextUrl;
  const logs = await getNotificationLogs({
    status: searchParams.get("status"),
    alertId: searchParams.get("alert_id"),
  });

  return successResponse(logs);
}
