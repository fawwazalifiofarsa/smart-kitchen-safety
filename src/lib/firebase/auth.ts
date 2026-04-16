import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { DecodedIdToken } from "firebase-admin/auth";

import type { AuthenticatedUser, CreateUserProfilePayload } from "@/lib/types";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export const SESSION_COOKIE_NAME = "smart-kitchen-session";
export const REFRESH_TOKEN_COOKIE_NAME = "smart-kitchen-refresh-token";
export const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 5;
export const SESSION_DURATION_SECONDS = SESSION_DURATION_MS / 1000;

type FirebaseLoginResponse = {
  localId: string;
  email: string;
  idToken: string;
  refreshToken: string;
  expiresIn: string;
};

type FirebaseRefreshResponse = {
  user_id: string;
  id_token: string;
  refresh_token: string;
};

type CookieCarrier = {
  cookies: {
    set(options: {
      name: string;
      value: string;
      httpOnly: boolean;
      sameSite: "lax";
      secure: boolean;
      path: string;
      maxAge: number;
    }): void;
  };
};

function getFirebaseApiKey() {
  const key =
    process.env.FIREBASE_WEB_API_KEY ??
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!key) {
    throw new Error("Firebase Web API key is not configured.");
  }

  return key;
}

async function resolveUserProfile(decoded: DecodedIdToken) {
  const snapshot = await adminDb.collection("users").doc(decoded.uid).get();

  if (!snapshot.exists) {
    return null;
  }

  const raw = snapshot.data() ?? {};
  const status = typeof raw.status === "string" ? raw.status : "inactive";

  return {
    uid: decoded.uid,
    name:
      typeof raw.name === "string" && raw.name
        ? raw.name
        : (decoded.name ?? "Dashboard User"),
    email:
      typeof raw.email === "string" && raw.email
        ? raw.email
        : (decoded.email ?? ""),
    role: typeof raw.role === "string" ? raw.role : "viewer",
    status,
    telegram_chat_id:
      typeof raw.telegram_chat_id === "string" ? raw.telegram_chat_id : null,
  } satisfies AuthenticatedUser;
}

function mapFirebaseAuthError(message: string | undefined) {
  switch (message) {
    case "EMAIL_NOT_FOUND":
    case "INVALID_PASSWORD":
    case "INVALID_LOGIN_CREDENTIALS":
      return "Email atau password tidak valid";
    case "USER_DISABLED":
      return "Akun ini dinonaktifkan";
    default:
      return "Autentikasi gagal";
  }
}

function readCookieValue(cookieHeader: string | null, key: string) {
  if (!cookieHeader) return null;

  const match = cookieHeader.match(new RegExp(`(?:^|; )${key}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function createUserWithPassword(email: string, password: string) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${getFirebaseApiKey()}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Registrasi gagal");
  }

  return data;
}

export async function createUserProfile(payload: CreateUserProfilePayload) {
  await adminDb.collection("users").doc(payload.uid).set({
    uid: payload.uid,
    name: payload.name,
    email: payload.email,
    role: payload.role ?? "user",
    status: payload.status ?? "active",
    created_at: new Date(),
    updated_at: new Date(),
    last_login_at: null,
  });
}

export async function signInWithPassword(email: string, password: string) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${getFirebaseApiKey()}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    },
  );

  const payload = (await response.json().catch(() => null)) as
    | FirebaseLoginResponse
    | { error?: { message?: string } }
    | null;

  if (!response.ok || !payload || !("idToken" in payload)) {
    const errorMessage =
      payload && "error" in payload ? payload.error?.message : undefined;
    throw new Error(mapFirebaseAuthError(errorMessage));
  }

  return payload;
}

export async function refreshAccessToken(refreshToken: string) {
  const response = await fetch(
    `https://securetoken.googleapis.com/v1/token?key=${getFirebaseApiKey()}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    },
  );

  const payload = (await response.json().catch(() => null)) as
    | FirebaseRefreshResponse
    | { error?: { message?: string } }
    | null;

  if (!response.ok || !payload || !("id_token" in payload)) {
    throw new Error("Refresh token tidak valid");
  }

  return payload;
}

export async function createSessionCookie(idToken: string) {
  return adminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_DURATION_MS,
  });
}

export function setSessionCookie<T extends CookieCarrier>(
  response: T,
  value: string,
) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });

  return response;
}

export function setRefreshTokenCookie<T extends CookieCarrier>(
  response: T,
  value: string,
) {
  response.cookies.set({
    name: REFRESH_TOKEN_COOKIE_NAME,
    value,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });

  return response;
}

export function setAuthCookies<T extends CookieCarrier>(
  response: T,
  payload: {
    sessionCookie: string;
    refreshToken: string;
  },
) {
  setSessionCookie(response, payload.sessionCookie);
  setRefreshTokenCookie(response, payload.refreshToken);
  return response;
}

export function clearSessionCookie<T extends CookieCarrier>(response: T) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}

export function clearRefreshTokenCookie<T extends CookieCarrier>(response: T) {
  response.cookies.set({
    name: REFRESH_TOKEN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}

export function clearAuthCookies<T extends CookieCarrier>(response: T) {
  clearSessionCookie(response);
  clearRefreshTokenCookie(response);
  return response;
}

export async function getUserFromSessionCookie(sessionCookie: string) {
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const user = await resolveUserProfile(decoded);
    return user?.status === "active" ? user : null;
  } catch {
    return null;
  }
}

export async function getUserFromAccessToken(
  idToken: string,
): Promise<AuthenticatedUser | null> {
  try {
    const decoded = await adminAuth.verifyIdToken(idToken, true);
    const user = await resolveUserProfile(decoded);
    return user?.status === "active" ? user : null;
  } catch {
    return null;
  }
}

export async function refreshSessionFromRefreshToken(refreshToken: string) {
  try {
    const refreshed = await refreshAccessToken(refreshToken);
    const user = await getUserFromAccessToken(refreshed.id_token);

    if (!user) {
      return null;
    }

    const sessionCookie = await createSessionCookie(refreshed.id_token);

    return {
      user,
      accessToken: refreshed.id_token,
      refreshToken: refreshed.refresh_token,
      sessionCookie,
    };
  } catch {
    return null;
  }
}

export async function getRequestUser(request: Request) {
  const authorization = request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    return getUserFromAccessToken(authorization.slice(7));
  }

  const sessionCookie = readCookieValue(
    request.headers.get("cookie"),
    SESSION_COOKIE_NAME,
  );

  if (!sessionCookie) {
    return null;
  }

  return getUserFromSessionCookie(sessionCookie);
}

export async function getServerUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  return getUserFromSessionCookie(sessionCookie);
}

export async function requireServerUser() {
  const user = await getServerUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
