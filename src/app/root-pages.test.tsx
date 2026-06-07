import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const redirectMock = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/components/dashboard/dashboard-shell", () => ({ DashboardShell: ({ children }: any) => <div data-testid="shell">{children}</div> }));
vi.mock("@/lib/firebase/auth", () => ({ requireServerUser: vi.fn().mockResolvedValue({ uid: "u1" }) }));

describe("root app pages and layouts", () => {
  it("HomePage redirect ke dashboard", async () => {
    const HomePage = (await import("@/app/page")).default;
    HomePage();
    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });

  it("RootLayout render html dan body", async () => {
    const RootLayout = (await import("@/app/layout")).default;
    render(<RootLayout><div>App</div></RootLayout> as any);
    expect(screen.getByText("App")).toBeInTheDocument();
  });

  it("DashboardLayout render DashboardShell", async () => {
    const DashboardLayout = (await import("@/app/dashboard/layout")).default;
    const element = await DashboardLayout({ children: <div>Dashboard Content</div> });
    render(element);
    expect(screen.getByTestId("shell")).toHaveTextContent("Dashboard Content");
  });
});
