import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/state";
import { TableShell } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

describe("UI components", () => {
  it("Button render children, variant, className, dan onClick", () => {
    const onClick = vi.fn();
    render(<Button className="extra" onClick={onClick} variant="danger">Delete</Button>);
    const button = screen.getByRole("button", { name: "Delete" });
    expect(button).toHaveClass("extra");
    expect(button.className).toContain("bg-[var(--color-danger)]");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["safe", "emerald"],
    ["warning", "amber"],
    ["danger", "rose"],
    ["unknown", "slate"],
  ])("Badge tone %s memakai class yang benar", (tone, expectedClassPart) => {
    render(<Badge tone={tone}>{tone}</Badge>);
    expect(screen.getByText(tone).className).toContain(expectedClassPart);
  });

  it("Card dan TableShell render children", () => {
    render(<Card data-testid="card">Content</Card>);
    expect(screen.getByTestId("card")).toHaveTextContent("Content");

    render(<TableShell><table><tbody><tr><td>Row</td></tr></tbody></table></TableShell>);
    expect(screen.getByText("Row")).toBeInTheDocument();
  });

  it("Input, Select, dan Textarea meneruskan props", () => {
    render(<Input aria-label="name" defaultValue="Kitchen" />);
    expect(screen.getByLabelText("name")).toHaveValue("Kitchen");

    render(<Select aria-label="status" defaultValue="online"><option value="online">Online</option></Select>);
    expect(screen.getByLabelText("status")).toHaveValue("online");

    render(<Textarea aria-label="note" defaultValue="Checked" />);
    expect(screen.getByLabelText("note")).toHaveValue("Checked");
  });

  it("LoadingState, EmptyState, dan ErrorState render state UI", () => {
    render(<LoadingState />);
    expect(screen.getByText("Memuat data...")).toBeInTheDocument();

    render(<EmptyState title="Kosong" description="Belum ada data" />);
    expect(screen.getByText("Kosong")).toBeInTheDocument();
    expect(screen.getByText("Belum ada data")).toBeInTheDocument();

    const onRetry = vi.fn();
    render(<ErrorState message="Server error" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
