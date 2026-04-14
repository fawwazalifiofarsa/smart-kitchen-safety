import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function LoadingState({ label = "Memuat data..." }: { label?: string }) {
  return (
    <Card className="flex min-h-48 items-center justify-center text-sm text-[var(--color-muted)]">
      {label}
    </Card>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="flex min-h-48 flex-col items-center justify-center gap-2 text-center">
      <p className="text-base font-semibold text-[var(--color-foreground)]">
        {title}
      </p>
      <p className="max-w-md text-sm text-[var(--color-muted)]">{description}</p>
    </Card>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
      <p className="text-base font-semibold text-[var(--color-danger)]">
        Gagal memuat data
      </p>
      <p className="max-w-md text-sm text-[var(--color-muted)]">{message}</p>
      {onRetry ? (
        <Button onClick={onRetry} type="button" variant="secondary">
          Coba lagi
        </Button>
      ) : null}
    </Card>
  );
}
