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