import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import LandingPage from "./LandingPage";

describe("LandingPage", () => {
  it("submits a valid URL: invokes onAnalyze with the normalized URL and enters loading state", () => {
    const onAnalyze = vi.fn();
    render(<LandingPage onAnalyze={onAnalyze} />);

    fireEvent.change(screen.getByLabelText("Website URL"), {
      target: { value: "example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Analyze" }));

    expect(onAnalyze).toHaveBeenCalledWith("https://example.com");
    expect(screen.getByRole("button")).toHaveTextContent("Analyzing...");
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("blocks an empty submission with a clear message and does not call onAnalyze", () => {
    const onAnalyze = vi.fn();
    render(<LandingPage onAnalyze={onAnalyze} />);

    fireEvent.click(screen.getByRole("button", { name: "Analyze" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Please enter a URL.");
    expect(onAnalyze).not.toHaveBeenCalled();
  });

  it("blocks malformed input with a clear message and does not call onAnalyze", () => {
    const onAnalyze = vi.fn();
    render(<LandingPage onAnalyze={onAnalyze} />);

    fireEvent.change(screen.getByLabelText("Website URL"), {
      target: { value: "not a url" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Analyze" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter a valid URL, like example.com or https://example.com",
    );
    expect(onAnalyze).not.toHaveBeenCalled();
  });

  it("disables the input and button once loading, preventing a double submit", () => {
    const onAnalyze = vi.fn();
    render(<LandingPage onAnalyze={onAnalyze} />);

    fireEvent.change(screen.getByLabelText("Website URL"), {
      target: { value: "example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Analyze" }));
    fireEvent.click(screen.getByRole("button"));

    expect(onAnalyze).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Website URL")).toBeDisabled();
  });
});
