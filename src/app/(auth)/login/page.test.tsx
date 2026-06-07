import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.hoisted(() => ({ fetchJson: vi.fn() }));
const routerMock = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));

vi.mock("@/lib/use-api-data", () => apiMock);
vi.mock("next/navigation", () => ({ useRouter: () => routerMock }));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.fetchJson.mockResolvedValue({ access_token: "token", refresh_token: "refresh", user: { uid: "u1" } });
  });

  it("render form login", async () => {
    const Page = (await import("@/app/(auth)/login/page")).default;
    render(<Page />);

    expect(screen.getByText("Smart Kitchen Safety System")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("admin@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
  });

  it("submit login memanggil API dan redirect dashboard", async () => {
    const Page = (await import("@/app/(auth)/login/page")).default;
    render(<Page />);

    fireEvent.change(screen.getByPlaceholderText("admin@example.com"), { target: { value: "admin@test.local" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "secret" } });
    fireEvent.submit(screen.getByRole("button", { name: /Sign in/i }).closest("form")!);

    await waitFor(() => expect(apiMock.fetchJson).toHaveBeenCalledWith("/api/auth/login", expect.objectContaining({ method: "POST" })));
    expect(routerMock.replace).toHaveBeenCalledWith("/dashboard");
    expect(routerMock.refresh).toHaveBeenCalled();
  });

  it("menampilkan error saat login gagal", async () => {
    apiMock.fetchJson.mockRejectedValueOnce(new Error("Invalid credential"));
    const Page = (await import("@/app/(auth)/login/page")).default;
    render(<Page />);

    fireEvent.submit(screen.getByRole("button", { name: /Sign in/i }).closest("form")!);

    await waitFor(() => expect(screen.getByText("Invalid credential")).toBeInTheDocument());
  });
});
