import { Card } from "@/components/ui/card";
import { formatCompactDate } from "@/lib/utils/format";

type ChartSeries = {
  key: "temperature_c" | "humidity_pct" | "gas_ppm" | "smoke_pct";
  label: string;
  color: string;
};

type ChartDataPoint = {
  time: string;
  temperature_c: number | null;
  humidity_pct: number | null;
  gas_ppm: number | null;
  smoke_pct: number | null;
};

export function LineChart({
  title,
  points,
  series,
}: {
  title: string;
  points: ChartDataPoint[];
  series: ChartSeries[];
}) {
  const width = 760;
  const height = 280;
  const padding = 28;
  const values = points.flatMap((point) =>
    series
      .map((item) => point[item.key])
      .filter((value): value is number => value !== null),
  );
  const maxValue = values.length > 0 ? Math.max(...values) : 1;
  const minValue = values.length > 0 ? Math.min(...values) : 0;
  const range = maxValue - minValue || 1;

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[var(--color-foreground)]">
          {title}
        </h2>
        <div className="flex flex-wrap gap-3 text-xs text-[var(--color-muted)]">
          {series.map((item) => (
            <span className="inline-flex items-center gap-2" key={item.key}>
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </span>
          ))}
        </div>
      </div>
      {points.length === 0 ? (
        <div className="flex min-h-56 items-center justify-center rounded-2xl bg-[var(--color-surface-muted)] text-sm text-[var(--color-muted)]">
          Belum ada data chart.
        </div>
      ) : (
        <svg className="h-auto w-full" viewBox={`0 0 ${width} ${height}`} role="img">
          {[0, 1, 2, 3].map((index) => {
            const y = padding + ((height - padding * 2) / 3) * index;
            return (
              <line
                key={index}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                x1={padding}
                x2={width - padding}
                y1={y}
                y2={y}
              />
            );
          })}
          {series.map((item) => {
            const polyline = points
              .map((point, index) => {
                const x =
                  padding +
                  ((width - padding * 2) / Math.max(points.length - 1, 1)) * index;
                const value = point[item.key] ?? minValue;
                const y =
                  height -
                  padding -
                  ((value - minValue) / range) * (height - padding * 2);
                return `${x},${y}`;
              })
              .join(" ");

            return (
              <polyline
                key={item.key}
                fill="none"
                points={polyline}
                stroke={item.color}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              />
            );
          })}
          {points.map((point, index) => {
            const x =
              padding +
              ((width - padding * 2) / Math.max(points.length - 1, 1)) * index;
            return (
              <text
                key={point.time}
                fill="#64748b"
                fontSize="11"
                textAnchor="middle"
                x={x}
                y={height - 6}
              >
                {formatCompactDate(point.time)}
              </text>
            );
          })}
        </svg>
      )}
    </Card>
  );
}