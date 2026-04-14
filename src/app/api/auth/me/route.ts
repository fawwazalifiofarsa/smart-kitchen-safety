import type { NextRequest } from "next/server";

import { getRequestUser } from "@/lib/firebase/auth";
import { errorResponse, successResponse } from "@/lib/utils/http";

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return errorResponse("Unauthorized", { status: 401 });
  }

  return successResponse(user);
}
