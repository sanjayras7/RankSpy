import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import ResultsPage from "./ResultsPage";
import type { AuditResult, ErrorResult } from "@/lib/auditTypes";

const mixedResult: AuditResult = {
  scores: [
    {
      tag: "title",
      value: "Buy Shoes",
      score: 10,
      maxScore: 20,
      status: "warning",
      problem: "Your title is too short.",
    },
    {
      tag: "metaDescription",
      value: null,
      score: 0,
      maxScore: 20,
      status: "missing",
      problem: "No meta description found.",
    },
    {
      tag: "h1",
      value: "Welcome",
      score: 20,
      maxScore: 20,
      status: "good",
      problem: "",
    },
  ],
  overallScore: 64,
  grade: "C",
  fixes: [
    { tag: "title", suggestedFix: "Buy Shoes Online | ShoeStore", charCount: 30 },
  ],
  failedTags: ["metaDescription"],
};

const perfectResult: AuditResult = {
  scores: [
    {
      tag: "title",
      value: "Great Title",
      score: 20,
      maxScore: 20,
      status: "good",
      problem: "",
    },
  ],
  overallScore: 100,
  grade: "A",
  fixes: [],
  failedTags: [],
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("ResultsPage", () => {
  it("shows the loading state while analysis is pending", () => {
    const { promise } = deferred<AuditResult>();
    render(<ResultsPage url="https://example.com" analyze={() => promise} />);

    expect(screen.getByRole("status")).toHaveTextContent("Analyzing your page...");
  });

  it("renders the score card, mixed tag results, and AI fix with a working copy button", async () => {
    render(
      <ResultsPage url="https://example.com" analyze={async () => mixedResult} />,
    );

    await waitFor(() => expect(screen.getByText("64/100")).toBeInTheDocument());
    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.getByText(/2 issues found/)).toBeInTheDocument();

    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("Your title is too short.")).toBeInTheDocument();
    expect(screen.getByText("Buy Shoes Online | ShoeStore")).toBeInTheDocument();

    expect(screen.getByText("Not found")).toBeInTheDocument();
    expect(screen.getByText("Fix unavailable")).toBeInTheDocument();
  });

  it("shows the perfect-score state instead of the tag list when overallScore is 100", async () => {
    render(
      <ResultsPage url="https://example.com" analyze={async () => perfectResult} />,
    );

    await waitFor(() =>
      expect(screen.getByText("Your meta tags are solid.")).toBeInTheDocument(),
    );
    expect(screen.queryByText("title")).not.toBeInTheDocument();
    expect(screen.getByText("100/100")).toBeInTheDocument();
  });

  it.each<[ErrorResult["errorType"], string]>([
    ["not_found", "We couldn't find a page at that URL (404)."],
    ["blocked", "This site is blocking automated requests, so we can't analyze it."],
    ["private", "This page requires login, so we can't see its content."],
    ["timeout", "This page took too long to load."],
    ["unreachable", "We couldn't reach that URL."],
  ])("shows the distinct message for the %s error", async (errorType, message) => {
    render(
      <ResultsPage
        url="https://example.com"
        analyze={async () => ({ errorType, message: "ignored" })}
      />,
    );

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(message));
  });

  it("renders the 'Analyze Another URL' button linking to / with mixed results", async () => {
    render(
      <ResultsPage url="https://example.com" analyze={async () => mixedResult} />,
    );

    await waitFor(() => expect(screen.getByText("64/100")).toBeInTheDocument());

    const link = screen.getByRole("link", { name: "Analyze Another URL" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/");
  });

  it("renders the 'Analyze Another URL' button in the perfect-score state", async () => {
    render(
      <ResultsPage url="https://example.com" analyze={async () => perfectResult} />,
    );

    await waitFor(() =>
      expect(screen.getByText("Your meta tags are solid.")).toBeInTheDocument(),
    );

    const link = screen.getByRole("link", { name: "Analyze Another URL" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/");
  });

  it("does not show the 'Analyze Another URL' link while loading", () => {
    const { promise } = deferred<AuditResult>();
    render(<ResultsPage url="https://example.com" analyze={() => promise} />);

    expect(screen.queryByRole("link", { name: "Analyze Another URL" })).not.toBeInTheDocument();
  });

  it("does not show the 'Analyze Another URL' link on error", async () => {
    render(
      <ResultsPage
        url="https://example.com"
        analyze={async () => ({ errorType: "not_found", message: "ignored" })}
      />,
    );

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.queryByRole("link", { name: "Analyze Another URL" })).not.toBeInTheDocument();
  });

  it("falls back to a generic message for an unrecognized error type", async () => {
    render(
      <ResultsPage
        url="https://example.com"
        analyze={async () =>
          ({ errorType: "weird" as ErrorResult["errorType"], message: "ignored" })
        }
      />,
    );

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Something went wrong. Please try again.",
      ),
    );
  });
});
