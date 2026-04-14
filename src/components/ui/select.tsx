import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils/format";

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm text-[var(--color-foreground)] outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100",
        className,
      )}
      {...props}
    />
  );
}
