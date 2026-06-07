import { describe, expect, it } from "vitest";
import { errorResponse, parsePositiveLimit, readJsonBody, successResponse } from "@/lib/utils/http";

describe("http utilities", () => {
  it("successResponse membuat payload sukses", async () => {
    const response = successResponse({ ok: true }, { message: "Berhasil", status: 201 });
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ success: true, message: "Berhasil", data: { ok: true } });
  });

  it("errorResponse membuat payload error", async () => {
    const response = errorResponse("Gagal", { status: 422, errors: [{ field: "name", message: "required" }] });
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({ success: false, message: "Gagal", errors: [{ field: "name", message: "required" }] });
  });

  it("readJsonBody return null untuk body invalid", async () => {
    const valid = new Request("http://test.local", { method: "POST", body: JSON.stringify({ a: 1 }) });
    await expect(readJsonBody(valid)).resolves.toEqual({ a: 1 });

    const invalid = new Request("http://test.local", { method: "POST", body: "{" });
    await expect(readJsonBody(invalid)).resolves.toBeNull();
  });

  it("parsePositiveLimit menjaga fallback dan max 500", () => {
    expect(parsePositiveLimit(null, 20)).toBe(20);
    expect(parsePositiveLimit("abc", 20)).toBe(20);
    expect(parsePositiveLimit("0", 20)).toBe(20);
    expect(parsePositiveLimit("1000", 20)).toBe(500);
    expect(parsePositiveLimit("30", 20)).toBe(30);
  });
});
