import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleChart, sampleDevice, sampleReading } from "@/test/fixtures";

const apiMock = vi.hoisted(() => ({
  useApiData: vi.fn(),
  fetchJson: vi.fn(),
}));

vi.mock("@/lib/use-api-data", () => apiMock);

function ok(data: unknown) {
  return { data, loading: false, error: null, reload: vi.fn(), setData: vi.fn() };
}

describe("DeviceDetailClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.fetchJson.mockResolvedValue({});
    apiMock.useApiData.mockImplementation((url: string) => {
      if (url === "/api/devices/dev_1") return ok(sampleDevice);
      if (url.includes("readings/latest")) return ok(sampleReading);
      if (url.includes("readings?limit")) return ok([sampleReading]);
      if (url.includes("dashboard/charts")) return ok(sampleChart);
      if (url.includes("status-logs")) return ok([{ log_id: "log_1", device_id: "dev_1", previous_status: "online", new_status: "warning", reason: "sensor_ingestion", created_at: "2026-01-01T10:00:00.000Z" }]);
      return ok(null);
    });
  });

  it("render detail device, latest reading, chart, readings, dan status log", async () => {
    const { DeviceDetailClient } = await import("@/app/dashboard/devices/[deviceId]/device-detail-client");
    render(<DeviceDetailClient deviceId="dev_1" />);

    expect(screen.getByText("Kitchen Sensor")).toBeInTheDocument();
    expect(screen.getByText("dev_1")).toBeInTheDocument();
    expect(screen.getByText("Device Monitoring Chart")).toBeInTheDocument();
    expect(screen.getByText("sensor_ingestion")).toBeInTheDocument();
  });

  it("submit update device memanggil endpoint PATCH", async () => {
    const { DeviceDetailClient } = await import("@/app/dashboard/devices/[deviceId]/device-detail-client");
    render(<DeviceDetailClient deviceId="dev_1" />);

    fireEvent.change(screen.getByPlaceholderText("Device name"), { target: { value: "Kitchen Updated" } });
    fireEvent.submit(screen.getByRole("button", { name: "Save changes" }).closest("form")!);

    await waitFor(() => expect(apiMock.fetchJson).toHaveBeenCalledWith("/api/devices/dev_1", expect.objectContaining({ method: "PATCH" })));
  });

  it("render loading, error, dan not found", async () => {
    const { DeviceDetailClient } = await import("@/app/dashboard/devices/[deviceId]/device-detail-client");

    apiMock.useApiData.mockReturnValue({ data: null, loading: true, error: null, reload: vi.fn(), setData: vi.fn() });
    const { rerender } = render(<DeviceDetailClient deviceId="dev_1" />);
    expect(screen.getByText("Memuat detail perangkat...")).toBeInTheDocument();

    apiMock.useApiData.mockReturnValue({ data: null, loading: false, error: "Error", reload: vi.fn(), setData: vi.fn() });
    rerender(<DeviceDetailClient deviceId="dev_1" />);
    expect(screen.getByText("Error")).toBeInTheDocument();

    apiMock.useApiData.mockReturnValue({ data: null, loading: false, error: null, reload: vi.fn(), setData: vi.fn() });
    rerender(<DeviceDetailClient deviceId="dev_1" />);
    expect(screen.getByText("Perangkat tidak ditemukan")).toBeInTheDocument();
  });
});
