import type { NextRequest } from "next/server";

import { getAuditLogs } from "@/lib/data";
import { getRequestUser } from "@/lib/firebase/auth";
import { errorResponse, successResponse } from "@/lib/utils/http";

export async function GET(request: NextRequest) {
  const actor = await getRequestUser(request);
  if (!actor) return errorResponse("Unauthorized", { status: 401 });
  if (actor.role !== "admin") return errorResponse("Forbidden", { status: 403 });

  const { searchParams } = request.nextUrl;
  const logs = await getAuditLogs({
    userId: searchParams.get("user_id"),
    action: searchParams.get("action"),
  });
  return successResponse(logs);
}
