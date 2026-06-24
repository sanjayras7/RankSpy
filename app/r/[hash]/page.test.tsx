import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { Metadata } from "next";

const mockHeadersGet = vi.fn();

vi.mock("next/headers", () => ({
  headers: vi.fn(() =>
    Promise.resolve({ get: mockHeadersGet }),
  ),
}));

import SharedResultPage, { generateMetadata } from "./page";

const VALID_HASH = "a".repeat(64);
const mockAuditResult = {
  scores: [
    {
      tag: "title",
      value: "Test Title",
      score: 10,
      maxScore: 20,
      status: "warning" as const,
      problem: "Your title is too short.",
    },
    {
      tag: "h1",
      value: "Welcome",
      score: 20,
      maxScore: 20,
      status: "good" as const,
      problem: "",
    },
  ],
  overallScore: 64,
  grade: "C" as const,
  fixes: [
    { tag: "title", suggestedFix: "Better Title Here", charCount: 17 },
  ],
  failedTags: [] as string[],
};

beforeEach(() => {
  mockHeadersGet.mockReturnValue("localhost:3000");
  globalThis.fetch = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("SharedResultPage", () => {
  it("renders the ResultsPage with fetched data for a valid hash", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify(mockAuditResult), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const element = await SharedResultPage({ params: Promise.resolve({ hash: VALID_HASH }) });
    render(element);

    await waitFor(() => {
      expect(screen.getByText("64/100")).toBeInTheDocument();
    });
    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("Better Title Here")).toBeInTheDocument();
  });

  it("shows the error state for an invalid hash (wrong length)", async () => {
    const element = await SharedResultPage({ params: Promise.resolve({ hash: "short" }) });
    render(element);

    expect(screen.getByText("Share link not found or expired")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Analyze a URL" })).toHaveAttribute("href", "/");
  });

  it("shows the error state when the API returns 404", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "not_found", message: "Not found" }), {
        status: 404,
      }),
    );

    const element = await SharedResultPage({ params: Promise.resolve({ hash: VALID_HASH }) });
    render(element);

    expect(screen.getByText("Share link not found or expired")).toBeInTheDocument();
    expect(
      screen.getByText(/Shared results expire after 24 hours/),
    ).toBeInTheDocument();
  });

  it("shows the error state when fetch rejects", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network error"));

    const element = await SharedResultPage({ params: Promise.resolve({ hash: VALID_HASH }) });
    render(element);

    expect(screen.getByText("Share link not found or expired")).toBeInTheDocument();
  });
});

describe("generateMetadata", () => {
  it("returns OG metadata with score for a valid cached result", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify(mockAuditResult), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const metadata = await generateMetadata({ params: Promise.resolve({ hash: VALID_HASH }) }) as Metadata;

    expect(metadata.title).toBe("RankSpy Audit — C (64/100)");
    expect(metadata.description).toBe("1 issue(s) found. Fix these to improve your Google ranking.");
    expect(metadata.openGraph?.title).toBe("RankSpy Audit — C (64/100)");
    expect(metadata.openGraph?.images).toHaveLength(1);
    if (metadata.openGraph?.images && Array.isArray(metadata.openGraph.images)) {
      expect(metadata.openGraph.images[0]).toMatchObject({ url: "/og-image.png", width: 1200, height: 630 });
    }
  });

  it("returns fallback OG metadata when the hash is not found", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "not_found" }), { status: 404 }),
    );

    const metadata = await generateMetadata({ params: Promise.resolve({ hash: "unknown" }) }) as Metadata;

    expect(metadata.title).toBe("RankSpy — Shared Result");
    expect(metadata.openGraph?.title).toBe("RankSpy — Shared Result");
    expect(metadata.openGraph?.images).toHaveLength(1);
  });

  it("returns fallback OG metadata for an invalid hash", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ hash: "invalid" }) }) as Metadata;

    expect(metadata.title).toBe("RankSpy — Shared Result");
  });
});
