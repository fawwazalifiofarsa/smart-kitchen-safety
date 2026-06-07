import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchJson, useApiData } from "@/lib/use-api-data";

describe("fetchJson", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("return data saat API success", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { value: 1 } }),
    } as Response);

    await expect(fetchJson("/api/test")).resolves.toEqual({ value: 1 });
    expect(fetch).toHaveBeenCalledWith("/api/test", expect.objectContaining({ headers: expect.objectContaining({ "Content-Type": "application/json" }) }));
  });

  it("throw message dari API saat response error", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, message: "Unauthorized" }),
    } as Response);

    await expect(fetchJson("/api/test")).rejects.toThrow("Unauthorized");
  });

  it("throw fallback saat body bukan JSON", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => { throw new Error("invalid json"); },
    } as unknown as Response);

    await expect(fetchJson("/api/test")).rejects.toThrow("Request gagal");
  });
});

describe("useApiData", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("load data saat enabled", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { name: "Kitchen" } }),
    } as Response);

    const { result } = renderHook(() => useApiData<{ name: string }>("/api/devices"));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ name: "Kitchen" });
  });

  it("set error saat request gagal", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, message: "Server error" }),
    } as Response);

    const { result } = renderHook(() => useApiData("/api/error"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Server error");
  });

  it("tidak fetch saat disabled", async () => {
    const { result } = renderHook(() => useApiData("/api/disabled", { enabled: false }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetch).not.toHaveBeenCalled();
  });

  it("reload melakukan fetch ulang", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: { value: 1 } }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: { value: 2 } }) } as Response);

    const { result } = renderHook(() => useApiData<{ value: number }>("/api/reload"));
    await waitFor(() => expect(result.current.data?.value).toBe(1));

    act(() => result.current.reload());
    await waitFor(() => expect(result.current.data?.value).toBe(2));
  });
});
