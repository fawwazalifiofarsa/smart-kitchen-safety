import type { NextRequest } from "next/server";

import { createUser, getUsers } from "@/lib/data";
import { getRequestUser } from "@/lib/firebase/auth";
import type { CreateUserRequestBody } from "@/lib/types";
import { errorResponse, readJsonBody, successResponse } from "@/lib/utils/http";
import { optionalString, requiredString } from "@/lib/utils/validation";

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return errorResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const data = await getUsers({
    role: searchParams.get("role"),
    status: searchParams.get("status"),
  });
  return successResponse(data);
}

export async function POST(request: NextRequest) {
  const actor = await getRequestUser(request);
  if (!actor) {
    return errorResponse("Unauthorized", { status: 401 });
  }
  if (actor.role !== "admin") {
    return errorResponse("Forbidden", { status: 403 });
  }

  const body = await readJsonBody<CreateUserRequestBody>(request);
  if (!body) return errorResponse("Body request tidak valid");

  const errors: Array<{ field: string; message: string }> = [];
  const name = requiredString(body.name, "name", errors);
  const email = requiredString(body.email, "email", errors);
  const password = requiredString(body.password, "password", errors);
  const role = requiredString(body.role, "role", errors);
  const status = requiredString(body.status, "status", errors);

  if (errors.length > 0 || !name || !email || !password || !role || !status) {
    return errorResponse("Validasi gagal", { errors });
  }

  try {
    const created = await createUser(
      {
        name,
        email,
        password,
        role,
        status,
        telegram_chat_id: optionalString(body.telegram_chat_id) ?? null,
      },
      actor,
    );

    return successResponse(created, {
      status: 201,
      message: "User berhasil dibuat",
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Gagal membuat user",
      { status: 500 },
    );
  }
}
