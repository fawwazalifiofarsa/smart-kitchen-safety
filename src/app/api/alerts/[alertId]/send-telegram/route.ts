import type { NextRequest } from "next/server";

import { sendTelegramAlert } from "@/lib/data";
import { getRequestUser } from "@/lib/firebase/auth";
import type { SendTelegramRequestBody } from "@/lib/types";
import { errorResponse, readJsonBody, successResponse } from "@/lib/utils/http";
import { requiredString } from "@/lib/utils/validation";

type Params = {
  params: Promise<{ alertId: string }>;
};

export async function POST(request: NextRequest, context: Params) {
  const actor = await getRequestUser(request);
  if (!actor) return errorResponse("Unauthorized", { status: 401 });

  const body = await readJsonBody<SendTelegramRequestBody>(request);
  if (!body) return errorResponse("Body request tidak valid");

  const errors: Array<{ field: string; message: string }> = [];
  const recipient = requiredString(body.recipient_chat_id, "recipient_chat_id", errors);
  if (errors.length > 0 || !recipient) {
    return errorResponse("Validasi gagal", { errors });
  }

  const { alertId } = await context.params;
  try {
    const result = await sendTelegramAlert(
      alertId,
      { recipient_chat_id: recipient },
      actor,
    );
    if (!result) return errorResponse("Alert tidak ditemukan", { status: 404 });
    return successResponse(result, { message: "Notifikasi Telegram berhasil dikirim" });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Gagal mengirim notifikasi Telegram",
      { status: 500 },
    );
  }
}
