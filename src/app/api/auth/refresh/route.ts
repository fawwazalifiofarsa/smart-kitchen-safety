import type { NextRequest } from "next/server";

import {
  createSessionCookie,
  REFRESH_TOKEN_COOKIE_NAME,
  refreshAccessToken,
  setAuthCookies,
} from "@/lib/firebase/auth";
import type { RefreshRequestBody } from "@/lib/types";
import { errorResponse, readJsonBody, successResponse } from "@/lib/utils/http";
import { requiredString } from "@/lib/utils/validation";

export async function POST(request: NextRequest) {
  const body = await readJsonBody<RefreshRequestBody>(request);
  const refreshTokenFromCookie =
    request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

  const errors: Array<{ field: string; message: string }> = [];
  const refreshToken = requiredString(
    body?.refresh_token ?? refreshTokenFromCookie,
    "refresh_token",
    errors,
  );
  if (errors.length > 0 || !refreshToken) {
    return errorResponse("Validasi gagal", { errors });
  }

  try {
    const refreshed = await refreshAccessToken(refreshToken);
    const sessionCookie = await createSessionCookie(refreshed.id_token);
    const response = successResponse(
      {
        access_token: refreshed.id_token,
      },
      { message: "Token berhasil diperbarui" },
    );
    setAuthCookies(response, {
      sessionCookie,
      refreshToken: refreshed.refresh_token,
    });
    return response;
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Refresh token gagal",
      { status: 401 },
    );
  }
}
