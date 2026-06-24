import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import Page from "./page";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe("Page", () => {
  it("navigates to /result?url=<normalized> when a valid URL is submitted", () => {
    render(<Page />);

    fireEvent.change(screen.getByLabelText("Website URL"), {
      target: { value: "example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Analyze" }));

    expect(mockPush).toHaveBeenCalledWith(
      "/result?url=https%3A%2F%2Fexample.com",
    );
  });

  it("shows Analyzing... button state while navigating", () => {
    render(<Page />);

    fireEvent.change(screen.getByLabelText("Website URL"), {
      target: { value: "https://example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Analyze" }));

    expect(screen.getByRole("button")).toHaveTextContent("Analyzing...");
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
