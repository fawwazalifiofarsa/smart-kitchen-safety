import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LineChart } from "@/components/dashboard/line-chart";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

describe("dashboard components", () => {
  it("PageHeader render title, description, dan action", () => {
    render(<PageHeader title="Devices" description="List perangkat"><button>Tambah</button></PageHeader>);
    expect(screen.getByRole("heading", { name: "Devices" })).toBeInTheDocument();
    expect(screen.getByText("List perangkat")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tambah" })).toBeInTheDocument();
  });

  it("StatCard render link jika href tersedia", () => {
    render(<StatCard label="Alerts" value="3" hint="Active" href="/dashboard/alerts" />);
    expect(screen.getByText("Alerts")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open" })).toHaveAttribute("href", "/dashboard/alerts");
  });

  it("LineChart render empty state saat points kosong", () => {
    render(<LineChart title="Chart" points={[]} series={[{ key: "gas_ppm", label: "Gas", color: "#000" }]} />);
    expect(screen.getByText("Belum ada data chart.")).toBeInTheDocument();
  });

  it("LineChart render svg dan legend saat ada data", () => {
    render(
      <LineChart
        title="Monitoring"
        points={[{ time: "2026-01-01T00:00:00.000Z", gas_ppm: 120, flame_raw: 1 }]}
        series={[
          { key: "gas_ppm", label: "Gas", color: "#2563eb" },
          { key: "flame_raw", label: "Flame", color: "#dc2626" },
        ]}
      />,
    );
    expect(screen.getByText("Monitoring")).toBeInTheDocument();
    expect(screen.getByText("Gas")).toBeInTheDocument();
    expect(screen.getByRole("img")).toBeInTheDocument();
  });
});
