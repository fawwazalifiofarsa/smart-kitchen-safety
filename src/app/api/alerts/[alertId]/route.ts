import type { NextRequest } from "next/server";

import { getAlertById } from "@/lib/data";
import { getRequestUser } from "@/lib/firebase/auth";
import { errorResponse, successResponse } from "@/lib/utils/http";

type Params = {
  params: Promise<{ alertId: string }>;
};

export async function GET(request: NextRequest, context: Params) {
  const actor = await getRequestUser(request);
  if (!actor) return errorResponse("Unauthorized", { status: 401 });

  const { alertId } = await context.params;
  const alert = await getAlertById(alertId);
  if (!alert) return errorResponse("Alert tidak ditemukan", { status: 404 });
  return successResponse(alert);
}
