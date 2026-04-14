import type { NextRequest } from "next/server";

import { clearSessionCookie, getRequestUser } from "@/lib/firebase/auth";
import { errorResponse, successResponse } from "@/lib/utils/http";
import { adminAuth } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);

  if (!user) {
    const response = successResponse(
      {},
      {
        message: "Logout berhasil",
      },
    );
    clearSessionCookie(response);
    return response;
  }

  try {
    await adminAuth.revokeRefreshTokens(user.uid);
    const response = successResponse({}, { message: "Logout berhasil" });
    clearSessionCookie(response);
    return response;
  } catch {
    return errorResponse("Logout gagal", { status: 500 });
  }
}
