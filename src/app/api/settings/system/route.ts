import type { NextRequest } from "next/server";

import { getSystemSettings, updateSystemSettings } from "@/lib/data";
import { getRequestUser } from "@/lib/firebase/auth";
import type { UpdateSystemSettingsRequestBody } from "@/lib/types";
import { errorResponse, readJsonBody, successResponse } from "@/lib/utils/http";

export async function GET(request: NextRequest) {
  const actor = await getRequestUser(request);
  if (!actor) return errorResponse("Unauthorized", { status: 401 });
  const settings = await getSystemSettings();
  return successResponse(settings);
}

export async function PATCH(request: NextRequest) {
  const actor = await getRequestUser(request);
  if (!actor) return errorResponse("Unauthorized", { status: 401 });
  if (actor.role !== "admin") return errorResponse("Forbidden", { status: 403 });

  const body = await readJsonBody<UpdateSystemSettingsRequestBody>(request);
  if (!body) return errorResponse("Body request tidak valid");

  const updated = await updateSystemSettings(body, actor);
  return successResponse(
    {
      updated_at: updated.updated_at,
      updated_by: updated.updated_by,
    },
    { message: "Pengaturan sistem berhasil diperbarui" },
  );
}
