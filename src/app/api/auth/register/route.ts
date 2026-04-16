import type { NextRequest } from "next/server";

import {
  createSessionCookie,
  createUserWithPassword,
  createUserProfile,
  getUserFromAccessToken,
  setAuthCookies,
} from "@/lib/firebase/auth";
import type { RegisterRequestBody } from "@/lib/types";
import { errorResponse, readJsonBody, successResponse } from "@/lib/utils/http";
import { requiredString } from "@/lib/utils/validation";

export async function POST(request: NextRequest) {
  const body = await readJsonBody<RegisterRequestBody>(request);
  if (!body) {
    return errorResponse("Body request tidak valid");
  }

  const errors: Array<{ field: string; message: string }> = [];

  const name = requiredString(body.name, "name", errors);
  const email = requiredString(body.email, "email", errors);
  const password = requiredString(body.password, "password", errors);

  if (errors.length > 0 || !name || !email || !password) {
    return errorResponse("Validasi gagal", { errors });
  }

  try {
    const register = await createUserWithPassword(email, password);

    await createUserProfile({
      uid: register.localId,
      name,
      email: register.email ?? email,
      role: "user",
      status: "active",
    });

    const user = await getUserFromAccessToken(register.idToken);
    if (!user) {
      return errorResponse(
        "Registrasi berhasil, tetapi data akun gagal dimuat",
        {
          status: 500,
        },
      );
    }

    const sessionCookie = await createSessionCookie(register.idToken);

    const response = successResponse(
      {
        access_token: register.idToken,
        refresh_token: register.refreshToken,
        user: {
          uid: user.uid,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      },
      {
        message: "Registrasi berhasil",
      },
    );

    setAuthCookies(response, {
      sessionCookie,
      refreshToken: register.refreshToken,
    });
    return response;
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Registrasi gagal",
      { status: 400 },
    );
  }
}
