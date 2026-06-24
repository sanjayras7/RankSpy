import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getCachedShare, setCachedShare } from "@/lib/server/aiFixGenerator";
import type { AuditResult } from "@/lib/auditTypes";

const { mockGetCachedShare, mockSetCachedShare } = vi.hoisted(() => ({
  mockGetCachedShare: vi.fn(),
  mockSetCachedShare: vi.fn(),
}));

vi.mock("@/lib/server/aiFixGenerator", () => ({
  getCachedShare: mockGetCachedShare,
  setCachedShare: mockSetCachedShare,
}));

import { GET } from "./route";

function mockRequest(hash: string) {
  return {
    nextUrl: {},
  } as import("next/server").NextRequest;
}

function mockParams(hash: string) {
  return Promise.resolve({ hash });
}

describe("/api/share/[hash] GET", () => {
  const mockAuditResult: AuditResult = {
    scores: [
      {
        tag: "title",
        value: "Test Title",
        score: 20,
        maxScore: 20,
        status: "good",
        problem: "",
      },
    ],
    overallScore: 85,
    grade: "B",
    fixes: [
      { tag: "metaDescription", suggestedFix: "Better description here", charCount: 21 },
    ],
    failedTags: [],
  };

  const validHash = "a".repeat(64);
  const invalidHash = "short";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when hash is missing", async () => {
    const request = mockRequest("");
    const params = mockParams("");

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({
      error: "not_found",
      message: "Share link not found or expired",
    });
  });

  it("returns 404 when hash is not 64 characters (invalid SHA-256)", async () => {
    const request = mockRequest(invalidHash);
    const params = mockParams(invalidHash);

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({
      error: "not_found",
      message: "Share link not found or expired",
    });
  });

  it("returns 404 when hash is not found in cache", async () => {
    mockGetCachedShare.mockReturnValue(null);

    const request = mockRequest(validHash);
    const params = mockParams(validHash);

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({
      error: "not_found",
      message: "Share link not found or expired",
    });
    expect(mockGetCachedShare).toHaveBeenCalledWith(validHash);
  });

  it("returns 404 when hash has expired (cache returns null)", async () => {
    mockGetCachedShare.mockReturnValue(null);

    const request = mockRequest(validHash);
    const params = mockParams(validHash);

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({
      error: "not_found",
      message: "Share link not found or expired",
    });
  });

  it("returns 200 with full audit result when hash is valid and cached", async () => {
    mockGetCachedShare.mockReturnValue(mockAuditResult);

    const request = mockRequest(validHash);
    const params = mockParams(validHash);

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockAuditResult);
    expect(mockGetCachedShare).toHaveBeenCalledWith(validHash);
  });
});