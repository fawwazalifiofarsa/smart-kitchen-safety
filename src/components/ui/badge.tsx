import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils/format";

function toneClass(tone: string) {
  switch (tone) {
    case "safe":
    case "online":
    case "active":
    case "resolved":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "warning":
    case "acknowledged":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "danger":
    case "critical":
    case "offline":
    case "inactive":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

export function Badge({
  children,
  tone,
}: PropsWithChildren<{ tone: string }>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset",
        toneClass(tone),
      )}
    >
      {children}
    </span>
  );
}
