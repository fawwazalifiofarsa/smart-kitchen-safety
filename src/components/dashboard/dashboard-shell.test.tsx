import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleUser } from "@/test/fixtures";

const navMock = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/link", () => ({ default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a> }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/devices",
  useRouter: () => navMock,
}));
vi.mock("@/lib/use-api-data", () => ({
  useApiData: () => ({ data: sampleUser, loading: false, error: null, reload: vi.fn(), setData: vi.fn() }),
}));

describe("DashboardShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, data: {} }) });
  });

  it("render navigation, current user, dan children", async () => {
    const { DashboardShell } = await import("@/components/dashboard/dashboard-shell");
    render(<DashboardShell><div>Content Area</div></DashboardShell>);

    expect(screen.getByText("Smart Kitchen Safety")).toBeInTheDocument();
    expect(screen.getByText("Devices")).toBeInTheDocument();
    expect(screen.getByText("Admin User")).toBeInTheDocument();
    expect(screen.getByText("Content Area")).toBeInTheDocument();
  });

  it("logout memanggil API dan redirect ke login", async () => {
    const { DashboardShell } = await import("@/components/dashboard/dashboard-shell");
    render(<DashboardShell><div>Content</div></DashboardShell>);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/auth/logout", expect.objectContaining({ method: "POST" })));
    expect(navMock.replace).toHaveBeenCalledWith("/login");
    expect(navMock.refresh).toHaveBeenCalled();
  });

  it("mobile menu bisa dibuka dan ditutup", async () => {
    const { DashboardShell } = await import("@/components/dashboard/dashboard-shell");
    render(<DashboardShell><div>Content</div></DashboardShell>);

    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    expect(screen.getByLabelText("Close sidebar")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Close sidebar"));
    expect(screen.queryByLabelText("Close sidebar")).not.toBeInTheDocument();
  });
});
