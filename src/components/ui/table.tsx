import type { HTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils/format";

export function TableShell({
  children,
  className,
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white",
        className,
      )}
    >
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
