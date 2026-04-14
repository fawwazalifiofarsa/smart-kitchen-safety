import type { NextRequest } from "next/server";

import {
  createSessionCookie,
  getUserFromAccessToken,
  setSessionCookie,
  signInWithPassword,
} from "@/lib/firebase/auth";
import type { LoginRequestBody } from "@/lib/types";
import { errorResponse, readJsonBody, successResponse } from "@/lib/utils/http";
import { requiredString } from "@/lib/utils/validation";

export async function POST(request: NextRequest) {
  const body = await readJsonBody<LoginRequestBody>(request);
  if (!body) {
    return errorResponse("Body request tidak valid");
  }

  const errors: Array<{ field: string; message: string }> = [];
  const email = requiredString(body.email, "email", errors);
  const password = requiredString(body.password, "password", errors);

  if (errors.length > 0 || !email || !password) {
    return errorResponse("Validasi gagal", { errors });
  }

  try {
    const login = await signInWithPassword(email, password);
    const user = await getUserFromAccessToken(login.idToken);
    if (!user) {
      return errorResponse("Akun tidak aktif atau belum terdaftar", {
        status: 403,
      });
    }

    const sessionCookie = await createSessionCookie(login.idToken);

    const response = successResponse(
      {
        access_token: login.idToken,
        refresh_token: login.refreshToken,
        user: {
          uid: user.uid,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      },
      {
        message: "Login berhasil",
      },
    );

    setSessionCookie(response, sessionCookie);
    return response;
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Login gagal",
      { status: 401 },
    );
  }
}
