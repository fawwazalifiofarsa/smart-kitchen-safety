import { NextResponse } from "next/server";

import type {
  ApiErrorResponse,
  ApiFieldError,
  ApiSuccessResponse,
} from "@/lib/types";

export function successResponse<T>(
  data: T,
  options?: { message?: string; status?: number },
) {
  return NextResponse.json<ApiSuccessResponse<T>>(
    {
      success: true,
      message: options?.message,
      data,
    },
    {
      status: options?.status ?? 200,
    },
  );
}

export function errorResponse(
  message: string,
  options?: { status?: number; errors?: ApiFieldError[] },
) {
  return NextResponse.json<ApiErrorResponse>(
    {
      success: false,
      message,
      errors: options?.errors,
    },
    {
      status: options?.status ?? 400,
    },
  );
}

export async function readJsonBody<T>(request: Request) {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function parsePositiveLimit(value: string | null, fallback: number) {
  if (!value) return fallback;
  const limit = Number(value);
  if (!Number.isFinite(limit) || limit <= 0) return fallback;
  return Math.min(limit, 500);
}
