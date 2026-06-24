import { describe, expect, it, vi } from "vitest";

const { mockFetchPageHtml, mockParseTags, mockScoreTags, mockGenerateFixes, mockSetCachedShare } = vi.hoisted(
  () => ({
    mockFetchPageHtml: vi.fn(),
    mockParseTags: vi.fn(),
    mockScoreTags: vi.fn(),
    mockGenerateFixes: vi.fn(),
    mockSetCachedShare: vi.fn(),
  }),
);

vi.mock("@/lib/server/urlFetcher", () => ({
  fetchPageHtml: mockFetchPageHtml,
}));

vi.mock("@/lib/parseTags", () => ({
  parseTags: mockParseTags,
}));

vi.mock("@/lib/server/scoringEngine", () => ({
  scoreTags: mockScoreTags,
}));

vi.mock("@/lib/server/aiFixGenerator", () => ({
  generateFixes: mockGenerateFixes,
  setCachedShare: mockSetCachedShare,
}));

import { GET } from "./route";

function mockRequest(url: string) {
  return {
    nextUrl: {
      searchParams: new URLSearchParams(url ? { url } : undefined),
    },
  } as import("next/server").NextRequest;
}

describe("/api/analyze GET", () => {
  it("returns 400 when no URL is provided", async () => {
    const request = mockRequest("");

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ errorType: "unreachable", message: "No URL provided." });
  });

  it("returns the fetch error when the URL cannot be fetched", async () => {
    mockFetchPageHtml.mockResolvedValueOnce({
      ok: false,
      errorType: "not_found",
      message: "We couldn't find a page at that URL (404).",
    });

    const response = await GET(mockRequest("https://example.com/missing"));
    const data = await response.json();

    expect(data).toEqual({
      errorType: "not_found",
      message: "We couldn't find a page at that URL (404).",
    });
  });

  it("returns the audit result on successful full chain", async () => {
    const fakeHtml = "<html><head><title>Test</title></head><body></body></html>";
    const fakeParsedTags = { title: "Test", metaDescription: null };
    const fakeScores = [
      {
        tag: "title",
        value: "Test",
        score: 10,
        maxScore: 20,
        status: "warning",
        problem: "Your title is too short.",
      },
    ];
    const fakeScoringResult = {
      scores: fakeScores,
      overallScore: 64,
      grade: "C" as const,
    };
    const fakeFixResult = {
      fixes: [{ tag: "title", suggestedFix: "Better Title Here", charCount: 17 }],
      failedTags: [],
    };

    mockFetchPageHtml.mockResolvedValueOnce({ ok: true, html: fakeHtml, renderedVia: "fetch" });
    mockParseTags.mockReturnValueOnce(fakeParsedTags);
    mockScoreTags.mockResolvedValueOnce(fakeScoringResult);
    mockGenerateFixes.mockResolvedValueOnce(fakeFixResult);

    const response = await GET(mockRequest("https://example.com"));
    const data = await response.json();

    expect(data).toEqual({
      scores: fakeScores,
      overallScore: 64,
      grade: "C",
      fixes: fakeFixResult.fixes,
      failedTags: fakeFixResult.failedTags,
    });
  });

  it("handles a blocked URL error", async () => {
    mockFetchPageHtml.mockResolvedValueOnce({
      ok: false,
      errorType: "blocked",
      message: "This site is blocking automated requests, so we can't analyze it.",
    });

    const response = await GET(mockRequest("https://blocked-site.com"));
    const data = await response.json();

    expect(data).toEqual({
      errorType: "blocked",
      message: "This site is blocking automated requests, so we can't analyze it.",
    });
  });

  it("handles a timeout fetch error", async () => {
    mockFetchPageHtml.mockResolvedValueOnce({
      ok: false,
      errorType: "timeout",
      message: "This page took too long to load.",
    });

    const response = await GET(mockRequest("https://slow-site.com"));
    const data = await response.json();

    expect(data).toEqual({
      errorType: "timeout",
      message: "This page took too long to load.",
    });
  });
});
