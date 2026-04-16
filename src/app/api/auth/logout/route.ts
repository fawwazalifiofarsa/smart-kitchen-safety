import type { NextRequest } from "next/server";

import { clearAuthCookies, getRequestUser } from "@/lib/firebase/auth";
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
    clearAuthCookies(response);
    return response;
  }

  try {
    await adminAuth.revokeRefreshTokens(user.uid);
    const response = successResponse({}, { message: "Logout berhasil" });
    clearAuthCookies(response);
    return response;
  } catch {
    return errorResponse("Logout gagal", { status: 500 });
  }
}
