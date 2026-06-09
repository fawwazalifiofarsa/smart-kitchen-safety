import { describe, expect, it } from "vitest";
import { cn, formatCompactDate, formatDateTime, formatMetric, fromDateTimeInputValue } from "@/lib/utils/format";

describe("format utilities", () => {
  it("cn menggabungkan class valid dan menghapus nilai kosong", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("formatDateTime return '-' untuk value kosong atau invalid", () => {
    expect(formatDateTime(null)).toBe("-");
    expect(formatDateTime("invalid-date")).toBe("-");
  });

  it("formatDateTime memformat ISO date", () => {
    expect(formatDateTime("2026-01-01T10:00:00.000Z")).not.toBe("-");
  });

  it("formatCompactDate memformat tanggal ringkas", () => {
    expect(formatCompactDate("2026-01-01T10:00:00.000Z")).not.toBe("-");
  });

  it("formatMetric memformat angka dengan unit", () => {
    expect(formatMetric(12.345, "ppm", 1)).toBe("12.3 ppm");
    expect(formatMetric(null, "ppm")).toBe("-");
    expect(formatMetric(Number.NaN, "ppm")).toBe("-");
  });

  it("fromDateTimeInputValue mengubah input date menjadi ISO", () => {
    expect(fromDateTimeInputValue("")).toBeNull();
    expect(fromDateTimeInputValue("invalid")).toBeNull();
    expect(fromDateTimeInputValue("2026-01-01T10:00")).toContain("2026-01-01");
  });
});
