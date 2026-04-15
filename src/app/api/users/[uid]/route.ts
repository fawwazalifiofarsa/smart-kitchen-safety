import type { NextRequest } from "next/server";

import { deactivateUser, getUserById, updateUser } from "@/lib/data";
import { getRequestUser } from "@/lib/firebase/auth";
import type { UpdateUserRequestBody } from "@/lib/types";
import { errorResponse, readJsonBody, successResponse } from "@/lib/utils/http";
import { optionalString } from "@/lib/utils/validation";

type Params = {
  params: Promise<{ uid: string }>;
};

export async function GET(request: NextRequest, context: Params) {
  const actor = await getRequestUser(request);
  if (!actor) return errorResponse("Unauthorized", { status: 401 });

  const { uid } = await context.params;
  const user = await getUserById(uid);
  if (!user) return errorResponse("User tidak ditemukan", { status: 404 });
  return successResponse(user);
}

export async function PATCH(request: NextRequest, context: Params) {
  const actor = await getRequestUser(request);
  if (!actor) return errorResponse("Unauthorized", { status: 401 });
  if (actor.role !== "admin") return errorResponse("Forbidden", { status: 403 });

  const { uid } = await context.params;
  const body = await readJsonBody<UpdateUserRequestBody>(request);
  if (!body) return errorResponse("Body request tidak valid");

  const updated = await updateUser(
    uid,
    {
      name: optionalString(body.name) ?? undefined,
      email: optionalString(body.email) ?? undefined,
      role: optionalString(body.role) ?? undefined,
      status: optionalString(body.status) ?? undefined,
      telegram_chat_id: optionalString(body.telegram_chat_id),
    },
    actor,
  );

  if (!updated) return errorResponse("User tidak ditemukan", { status: 404 });
  return successResponse(updated, { message: "User berhasil diperbarui" });
}

export async function DELETE(request: NextRequest, context: Params) {
  const actor = await getRequestUser(request);
  if (!actor) return errorResponse("Unauthorized", { status: 401 });
  if (actor.role !== "admin") return errorResponse("Forbidden", { status: 403 });

  const { uid } = await context.params;
  await deactivateUser(uid, actor);
  return successResponse({}, { message: "User berhasil dihapus" });
}
