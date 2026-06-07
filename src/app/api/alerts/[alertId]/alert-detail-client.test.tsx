import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleAlert } from "@/test/fixtures";

const apiMock = vi.hoisted(() => ({
  useApiData: vi.fn(),
  fetchJson: vi.fn(),
}));

vi.mock("@/lib/use-api-data", () => apiMock);

describe("AlertDetailClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.useApiData.mockReturnValue({ data: sampleAlert, loading: false, error: null, reload: vi.fn(), setData: vi.fn() });
    apiMock.fetchJson.mockResolvedValue({});
  });

  it("render detail alert dan action", async () => {
    const { AlertDetailClient } = await import("@/app/dashboard/alerts/[alertId]/alert-detail-client");
    render(<AlertDetailClient alertId="alert_1" />);

    expect(screen.getByText("Gas bocor")).toBeInTheDocument();
    expect(screen.getByText("Gas terdeteksi tinggi")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Acknowledge" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Resolve" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send notification" })).toBeInTheDocument();
  });

  it("memanggil endpoint acknowledge, resolve, dan send telegram", async () => {
    const reload = vi.fn();
    apiMock.useApiData.mockReturnValue({ data: sampleAlert, loading: false, error: null, reload, setData: vi.fn() });
    const { AlertDetailClient } = await import("@/app/dashboard/alerts/[alertId]/alert-detail-client");
    render(<AlertDetailClient alertId="alert_1" />);

    fireEvent.change(screen.getAllByRole("textbox")[0], { target: { value: "checked" } });
    fireEvent.click(screen.getByRole("button", { name: "Acknowledge" }));
    await waitFor(() => expect(apiMock.fetchJson).toHaveBeenCalledWith("/api/alerts/alert_1/acknowledge", expect.objectContaining({ method: "PATCH" })));

    fireEvent.change(screen.getAllByRole("textbox")[1], { target: { value: "safe" } });
    fireEvent.click(screen.getByRole("button", { name: "Resolve" }));
    await waitFor(() => expect(apiMock.fetchJson).toHaveBeenCalledWith("/api/alerts/alert_1/resolve", expect.objectContaining({ method: "PATCH" })));

    fireEvent.change(screen.getByPlaceholderText("Recipient chat ID"), { target: { value: "12345" } });
    fireEvent.click(screen.getByRole("button", { name: "Send notification" }));
    await waitFor(() => expect(apiMock.fetchJson).toHaveBeenCalledWith("/api/alerts/alert_1/send-telegram", expect.objectContaining({ method: "POST" })));
    expect(reload).toHaveBeenCalled();
  });

  it("render loading, error, dan not found", async () => {
    const { AlertDetailClient } = await import("@/app/dashboard/alerts/[alertId]/alert-detail-client");

    apiMock.useApiData.mockReturnValueOnce({ data: null, loading: true, error: null, reload: vi.fn(), setData: vi.fn() });
    const { rerender } = render(<AlertDetailClient alertId="alert_1" />);
    expect(screen.getByText("Memuat detail alert...")).toBeInTheDocument();

    apiMock.useApiData.mockReturnValueOnce({ data: null, loading: false, error: "Error", reload: vi.fn(), setData: vi.fn() });
    rerender(<AlertDetailClient alertId="alert_1" />);
    expect(screen.getByText("Error")).toBeInTheDocument();

    apiMock.useApiData.mockReturnValueOnce({ data: null, loading: false, error: null, reload: vi.fn(), setData: vi.fn() });
    rerender(<AlertDetailClient alertId="alert_1" />);
    expect(screen.getByText("Alert tidak ditemukan")).toBeInTheDocument();
  });
});
