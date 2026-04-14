import type { NextRequest } from "next/server";

import { createAlert, getAlerts } from "@/lib/data";
import { getRequestUser } from "@/lib/firebase/auth";
import type { CreateAlertRequestBody } from "@/lib/types";
import { errorResponse, readJsonBody, successResponse } from "@/lib/utils/http";
import { requiredString } from "@/lib/utils/validation";

export async function GET(request: NextRequest) {
  const actor = await getRequestUser(request);
  if (!actor) return errorResponse("Unauthorized", { status: 401 });

  const { searchParams } = request.nextUrl;
  const data = await getAlerts({
    status: searchParams.get("status"),
    severity: searchParams.get("severity"),
    deviceId: searchParams.get("device_id"),
  });
  return successResponse(data);
}

export async function POST(request: NextRequest) {
  const actor = await getRequestUser(request);
  if (!actor) return errorResponse("Unauthorized", { status: 401 });
  if (!["admin", "member"].includes(actor.role)) {
    return errorResponse("Forbidden", { status: 403 });
  }

  const body = await readJsonBody<CreateAlertRequestBody>(request);
  if (!body) return errorResponse("Body request tidak valid");

  const errors: Array<{ field: string; message: string }> = [];
  const deviceId = requiredString(body.device_id, "device_id", errors);
  const type = requiredString(body.type, "type", errors);
  const severity = requiredString(body.severity, "severity", errors);
  const title = requiredString(body.title, "title", errors);
  const message = requiredString(body.message, "message", errors);

  if (errors.length > 0 || !deviceId || !type || !severity || !title || !message) {
    return errorResponse("Validasi gagal", { errors });
  }

  const alertId = await createAlert(
    {
      device_id: deviceId,
      type,
      severity,
      title,
      message,
      trigger_values: body.trigger_values,
    },
    actor,
  );

  return successResponse(
    {
      alert_id: alertId,
    },
    {
      status: 201,
      message: "Alert berhasil dibuat",
    },
  );
}
