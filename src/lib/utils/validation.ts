import type { ApiFieldError } from "@/lib/types";

function humanizeField(field: string) {
  return field.replaceAll("_", " ");
}

export function pushError(
  errors: ApiFieldError[],
  field: string,
  message: string,
) {
  errors.push({ field, message });
}

export function requiredString(
  value: unknown,
  field: string,
  errors: ApiFieldError[],
) {
  if (typeof value !== "string" || !value.trim()) {
    pushError(errors, field, `${humanizeField(field)} wajib diisi`);
    return null;
  }

  return value.trim();
}

export function optionalString(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function requiredBoolean(
  value: unknown,
  field: string,
  errors: ApiFieldError[],
) {
  if (typeof value !== "boolean") {
    pushError(errors, field, `${humanizeField(field)} harus berupa true/false`);
    return null;
  }

  return value;
}

export function requiredNumber(
  value: unknown,
  field: string,
  errors: ApiFieldError[],
) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    pushError(errors, field, `${humanizeField(field)} harus berupa angka`);
    return null;
  }

  return value;
}

export function optionalBoolean(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "boolean") return undefined;
  return value;
}

export function optionalNumber(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "number" || Number.isNaN(value)) return undefined;
  return value;
}