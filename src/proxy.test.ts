import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.hoisted(() => ({
  clearAuthCookies: vi.fn(),
  getUserFromSessionCookie: vi.fn(),
  refreshSessionFromRefreshToken: vi.fn(),
  setAuthCookies: vi.fn(),
  SESSION_COOKIE_NAME: "session",
  REFRESH_TOKEN_COOKIE_NAME: "refresh",
}));

vi.mock("@/lib/firebase/auth", () => authMock);

function proxyRequest(pathname: string, cookies: Record<string, string> = {}) {
  const url = new URL(`http://test.local${pathname}`);
  const headerCookie = Object.entries(cookies).map(([key, value]) => `${key}=${value}`).join("; ");
  const headers = new Headers(headerCookie ? { cookie: headerCookie } : undefined);
  return {
    url: url.toString(),
    nextUrl: url,
    headers,
    cookies: {
      get: (name: string) => cookies[name] ? { value: cookies[name] } : undefined,
    },
  } as any;
}

describe("proxy middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("dashboard route redirect ke login jika tidak ada session", async () => {
    const { proxy } = await import("@/proxy");
    const response = await proxy(proxyRequest("/dashboard"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
  });

  it("dashboard route lanjut jika session valid", async () => {
    authMock.getUserFromSessionCookie.mockResolvedValueOnce({ uid: "u1" });
    const { proxy } = await import("@/proxy");
    const response = await proxy(proxyRequest("/dashboard", { session: "session-cookie" }));
    expect(response.status).toBe(200);
  });

  it("login route redirect ke dashboard jika user sudah login", async () => {
    authMock.getUserFromSessionCookie.mockResolvedValueOnce({ uid: "u1" });
    const { proxy } = await import("@/proxy");
    const response = await proxy(proxyRequest("/login", { session: "session-cookie" }));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/dashboard");
  });

  it("refresh session jika refresh token valid", async () => {
    authMock.refreshSessionFromRefreshToken.mockResolvedValueOnce({ sessionCookie: "new-session", refreshToken: "new-refresh" });
    const { proxy } = await import("@/proxy");
    const response = await proxy(proxyRequest("/dashboard", { refresh: "old-refresh" }));
    expect(response.status).toBe(200);
    expect(authMock.setAuthCookies).toHaveBeenCalled();
  });
});
