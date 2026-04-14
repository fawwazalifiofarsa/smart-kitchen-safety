import type { NextRequest } from "next/server";

import { acknowledgeAlert, getAlertById } from "@/lib/data";
import { getRequestUser } from "@/lib/firebase/auth";
import type { AcknowledgeAlertRequestBody } from "@/lib/types";
import { errorResponse, readJsonBody, successResponse } from "@/lib/utils/http";
import { optionalString } from "@/lib/utils/validation";

type Params = {
  params: Promise<{ alertId: string }>;
};

export async function PATCH(request: NextRequest, context: Params) {
  const actor = await getRequestUser(request);
  if (!actor) return errorResponse("Unauthorized", { status: 401 });

  const { alertId } = await context.params;
  const alert = await getAlertById(alertId);
  if (!alert) return errorResponse("Alert tidak ditemukan", { status: 404 });

  const body = await readJsonBody<AcknowledgeAlertRequestBody>(request);
  await acknowledgeAlert(alertId, actor, optionalString(body?.note) ?? undefined);

  return successResponse(
    {
      alert_id: alertId,
      status: "acknowledged",
      acknowledged_by: actor.uid,
      acknowledged_at: new Date().toISOString(),
    },
    { message: "Alert berhasil di-acknowledge" },
  );
}
