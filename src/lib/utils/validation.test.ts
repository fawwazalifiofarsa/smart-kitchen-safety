import { describe, expect, it } from "vitest";
import { optionalBoolean, optionalNumber, optionalString, requiredBoolean, requiredNumber, requiredString } from "@/lib/utils/validation";
import type { ApiFieldError } from "@/lib/types";

describe("validation utilities", () => {
  it("requiredString trim value dan menambah error jika kosong", () => {
    const errors: ApiFieldError[] = [];
    expect(requiredString(" test ", "name", errors)).toBe("test");
    expect(requiredString("", "device_id", errors)).toBeNull();
    expect(errors[0]).toEqual({ field: "device_id", message: "device id wajib diisi" });
  });

  it("optionalString mengembalikan undefined, null, atau string trim", () => {
    expect(optionalString(undefined)).toBeUndefined();
    expect(optionalString(null)).toBeNull();
    expect(optionalString("  x  ")).toBe("x");
    expect(optionalString("   ")).toBeNull();
    expect(optionalString(1)).toBeUndefined();
  });

  it("requiredBoolean validasi boolean", () => {
    const errors: ApiFieldError[] = [];
    expect(requiredBoolean(true, "active", errors)).toBe(true);
    expect(requiredBoolean("true", "active", errors)).toBeNull();
    expect(errors[0].message).toContain("harus berupa true/false");
  });

  it("requiredNumber validasi number", () => {
    const errors: ApiFieldError[] = [];
    expect(requiredNumber(10, "gas_ppm", errors)).toBe(10);
    expect(requiredNumber(Number.NaN, "gas_ppm", errors)).toBeNull();
    expect(errors[0].message).toContain("harus berupa angka");
  });

  it("optionalBoolean dan optionalNumber menerima value valid", () => {
    expect(optionalBoolean(false)).toBe(false);
    expect(optionalBoolean("false")).toBeUndefined();
    expect(optionalNumber(5)).toBe(5);
    expect(optionalNumber(Number.NaN)).toBeUndefined();
  });
});
