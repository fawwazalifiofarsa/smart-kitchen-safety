import type { NextRequest } from "next/server";

import { getDashboardOverview } from "@/lib/data";
import { getRequestUser } from "@/lib/firebase/auth";
import { errorResponse, successResponse } from "@/lib/utils/http";

export async function GET(request: NextRequest) {
  const actor = await getRequestUser(request);
  if (!actor) return errorResponse("Unauthorized", { status: 401 });

  const overview = await getDashboardOverview();
  return successResponse(overview);
}
