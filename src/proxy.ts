import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  clearAuthCookies,
  getUserFromSessionCookie,
  REFRESH_TOKEN_COOKIE_NAME,
  refreshSessionFromRefreshToken,
  SESSION_COOKIE_NAME,
  setAuthCookies,
} from "@/lib/firebase/auth";

function buildRequestCookieHeader(
  request: NextRequest,
  values: Record<string, string | null>,
) {
  const cookieMap = new Map<string, string>();
  const currentHeader = request.headers.get("cookie") ?? "";

  currentHeader.split(";").forEach((part) => {
    const trimmed = part.trim();
    if (!trimmed) return;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) return;

    const key = trimmed.slice(0, separatorIndex);
    const value = trimmed.slice(separatorIndex + 1);
    cookieMap.set(key, value);
  });

  Object.entries(values).forEach(([key, value]) => {
    if (!value) {
      cookieMap.delete(key);
      return;
    }

    cookieMap.set(key, encodeURIComponent(value));
  });

  return Array.from(cookieMap.entries())
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");
}

function continueWithAuth(
  request: NextRequest,
  payload: {
    sessionCookie: string;
    refreshToken: string;
  },
) {
  const headers = new Headers(request.headers);
  headers.set(
    "cookie",
    buildRequestCookieHeader(request, {
      [SESSION_COOKIE_NAME]: payload.sessionCookie,
      [REFRESH_TOKEN_COOKIE_NAME]: payload.refreshToken,
    }),
  );

  const response = NextResponse.next({
    request: {
      headers,
    },
  });

  setAuthCookies(response, payload);
  return response;
}

function redirectToLogin(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  clearAuthCookies(response);
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isLoginRoute = pathname === "/login";

  if (isDashboardRoute) {
    const user = sessionCookie
      ? await getUserFromSessionCookie(sessionCookie)
      : null;

    if (user) {
      return NextResponse.next();
    }

    if (refreshToken) {
      const refreshed = await refreshSessionFromRefreshToken(refreshToken);
      if (refreshed) {
        return continueWithAuth(request, {
          sessionCookie: refreshed.sessionCookie,
          refreshToken: refreshed.refreshToken,
        });
      }
    }

    return redirectToLogin(request);
  }

  if (isLoginRoute) {
    const user = sessionCookie
      ? await getUserFromSessionCookie(sessionCookie)
      : null;

    if (user) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (refreshToken) {
      const refreshed = await refreshSessionFromRefreshToken(refreshToken);
      if (refreshed) {
        const response = NextResponse.redirect(new URL("/dashboard", request.url));
        setAuthCookies(response, {
          sessionCookie: refreshed.sessionCookie,
          refreshToken: refreshed.refreshToken,
        });
        return response;
      }
    }

    if (sessionCookie || refreshToken) {
      const response = NextResponse.next();
      clearAuthCookies(response);
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
