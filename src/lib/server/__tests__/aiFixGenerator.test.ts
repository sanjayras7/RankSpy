import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateFixes } from "../aiFixGenerator";
import type { ParsedTagObject, TagScore } from "../scoringEngine";
import Anthropic from "@anthropic-ai/sdk";

// Mock the Anthropic SDK
vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: vi.fn(),
  };
});

describe("aiFixGenerator", () => {
  const mockParsedTags: ParsedTagObject = {
    title: "Short",
    metaDescription: null,
    metaRobots: null,
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    ogUrl: null,
    canonical: null,
    h1: "Welcome to Our Site",
    jsonLd: null,
    bodyExcerpt: "We offer the best shoes online with free shipping.",
  };

  const mockScoresWithBrokenTags: TagScore[] = [
    {
      tag: "title",
      value: "Short",
      score: 10,
      maxScore: 20,
      status: "warning",
      problem: "Your title is 5 characters — too short. Google uses up to 60 chars.",
    },
    {
      tag: "metaDescription",
      value: null,
      score: 0,
      maxScore: 15,
      status: "missing",
      problem: "No meta description was found on this page.",
    },
    {
      tag: "ogTitle",
      value: null,
      score: 0,
      maxScore: 5,
      status: "missing",
      problem: "No og:title was found on this page.",
    },
  ];

  const mockScoresAllGood: TagScore[] = [
    {
      tag: "title",
      value: "Perfect Title Length Here For SEO Optimization Test",
      score: 20,
      maxScore: 20,
      status: "good",
      problem: "",
    },
  ];

  let mockClient: {
    messages: {
      create: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockClient = {
      messages: {
        create: vi.fn(),
      },
    };

    (Anthropic as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => mockClient);
    
    // Set API key for tests
    process.env.CLAUDE_API_KEY = "test-api-key";
  });

  afterEach(() => {
    delete process.env.CLAUDE_API_KEY;
  });

  it("should return empty fixes when no broken tags exist", async () => {
    const result = await generateFixes(mockParsedTags, mockScoresAllGood, "hash123");

    expect(result.fixes).toEqual([]);
    expect(result.failedTags).toEqual([]);
    expect(mockClient.messages.create).not.toHaveBeenCalled();
  });

  it("should generate fixes for multiple broken tags in parallel", async () => {
    const titleText = "Buy Shoes Online - Free Shipping | ShoeStore";
    const descText = "Shop the best shoes online with free shipping on all orders. Find your perfect pair today and enjoy fast delivery to your door.";
    const ogTitleText = "Buy Shoes Online with Free Shipping";
    
    mockClient.messages.create
      .mockResolvedValueOnce({
        content: [{ type: "text", text: titleText }],
      })
      .mockResolvedValueOnce({
        content: [{ type: "text", text: descText }],
      })
      .mockResolvedValueOnce({
        content: [{ type: "text", text: ogTitleText }],
      });

    const result = await generateFixes(mockParsedTags, mockScoresWithBrokenTags, "hash456");

    expect(result.fixes).toHaveLength(3);
    expect(result.failedTags).toEqual([]);
    
    // Verify parallel calls were made
    expect(mockClient.messages.create).toHaveBeenCalledTimes(3);
    
    // Check fix structure
    const titleFix = result.fixes.find(f => f.tag === "title");
    expect(titleFix).toBeDefined();
    expect(titleFix?.suggestedFix).toBe(titleText);
    expect(titleFix?.charCount).toBe(titleText.length);

    const descFix = result.fixes.find(f => f.tag === "metaDescription");
    expect(descFix).toBeDefined();
    expect(descFix?.charCount).toBe(descFix?.suggestedFix.length);
  });

  it("should cache results and avoid duplicate API calls", async () => {
    mockClient.messages.create.mockResolvedValue({
      content: [{ type: "text", text: "Buy Shoes Online – Free Shipping | ShoeStore" }],
    });

    const urlHash = "same-hash";
    
    // First call
    const result1 = await generateFixes(
      mockParsedTags,
      mockScoresWithBrokenTags,
      urlHash
    );
    
    expect(mockClient.messages.create).toHaveBeenCalledTimes(3);
    expect(result1.fixes).toHaveLength(3);
    
    // Second call with same hash - should use cache
    const result2 = await generateFixes(
      mockParsedTags,
      mockScoresWithBrokenTags,
      urlHash
    );
    
    // No additional API calls
    expect(mockClient.messages.create).toHaveBeenCalledTimes(3);
    expect(result2).toEqual(result1);
  });

  it("should handle individual tag API failures gracefully", async () => {
    mockClient.messages.create
      .mockResolvedValueOnce({
        content: [{ type: "text", text: "Buy Shoes Online – Free Shipping | ShoeStore" }],
      })
      .mockRejectedValueOnce(new Error("Rate limit exceeded"))
      .mockResolvedValueOnce({
        content: [{ type: "text", text: "Buy Shoes Online with Free Shipping" }],
      });

    const result = await generateFixes(mockParsedTags, mockScoresWithBrokenTags, "hash789");

    expect(result.fixes).toHaveLength(2);
    expect(result.failedTags).toEqual(["metaDescription"]);
    
    // Check successful fixes exist
    expect(result.fixes.find(f => f.tag === "title")).toBeDefined();
    expect(result.fixes.find(f => f.tag === "ogTitle")).toBeDefined();
  });

  it("should handle all tags failing", async () => {
    mockClient.messages.create.mockRejectedValue(new Error("API unavailable"));

    const result = await generateFixes(mockParsedTags, mockScoresWithBrokenTags, "hash-fail");

    expect(result.fixes).toEqual([]);
    expect(result.failedTags).toEqual(["title", "metaDescription", "ogTitle"]);
  });

  it("should return all tags as failed when API key is missing", async () => {
    delete process.env.CLAUDE_API_KEY;

    const result = await generateFixes(mockParsedTags, mockScoresWithBrokenTags, "hash-no-key");

    expect(result.fixes).toEqual([]);
    expect(result.failedTags).toEqual(["title", "metaDescription", "ogTitle"]);
    expect(mockClient.messages.create).not.toHaveBeenCalled();
  });

  it("should trim title responses exceeding 60 characters", async () => {
    const longTitle = "Buy Shoes Online with Free Shipping on All Orders at Our Amazing Store Today";
    mockClient.messages.create.mockResolvedValue({
      content: [{ type: "text", text: longTitle }],
    });

    const singleBrokenTag: TagScore[] = [{
      tag: "title",
      value: "Short",
      score: 10,
      maxScore: 20,
      status: "warning",
      problem: "Your title is 5 characters — too short.",
    }];

    const result = await generateFixes(mockParsedTags, singleBrokenTag, "hash-trim");

    expect(result.fixes).toHaveLength(1);
    expect(result.fixes[0].suggestedFix.length).toBeLessThanOrEqual(60);
    expect(result.fixes[0].charCount).toBe(result.fixes[0].suggestedFix.length);
  });

  it("should trim description responses exceeding 160 characters", async () => {
    const longDesc = "Shop the best shoes online with free shipping on all orders. Find your perfect pair today and enjoy fast delivery to your door. We have thousands of styles in stock right now.";
    mockClient.messages.create.mockResolvedValue({
      content: [{ type: "text", text: longDesc }],
    });

    const singleBrokenTag: TagScore[] = [{
      tag: "metaDescription",
      value: null,
      score: 0,
      maxScore: 15,
      status: "missing",
      problem: "No meta description was found.",
    }];

    const result = await generateFixes(mockParsedTags, singleBrokenTag, "hash-trim-desc");

    expect(result.fixes).toHaveLength(1);
    expect(result.fixes[0].suggestedFix.length).toBeLessThanOrEqual(160);
    expect(result.fixes[0].charCount).toBe(result.fixes[0].suggestedFix.length);
  });

  it("should reject empty or explanation-like responses", async () => {
    mockClient.messages.create.mockResolvedValue({
      content: [{ type: "text", text: "Here is the optimized title: Buy Shoes Online" }],
    });

    const singleBrokenTag: TagScore[] = [{
      tag: "title",
      value: null,
      score: 0,
      maxScore: 20,
      status: "missing",
      problem: "No title found.",
    }];

    const result = await generateFixes(mockParsedTags, singleBrokenTag, "hash-invalid");

    expect(result.fixes).toEqual([]);
    expect(result.failedTags).toEqual(["title"]);
  });

  it("should retry transient errors with exponential backoff", async () => {
    // Simulate rate limit errors (status 429)
    const rateLimitError = Object.assign(new Error("Rate limited"), { status: 429 });
    
    mockClient.messages.create
      .mockRejectedValueOnce(rateLimitError)
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValueOnce({
        content: [{ type: "text", text: "Buy Shoes Online - Free Shipping | ShoeStore" }],
      });

    const singleBrokenTag: TagScore[] = [{
      tag: "title",
      value: null,
      score: 0,
      maxScore: 20,
      status: "missing",
      problem: "No title found.",
    }];

    const result = await generateFixes(mockParsedTags, singleBrokenTag, "hash-retry");

    expect(result.fixes).toHaveLength(1);
    expect(mockClient.messages.create).toHaveBeenCalledTimes(3);
  });

  it("should not retry non-transient errors like 400", async () => {
    // Simulate 400 error (non-transient)
    const badRequestError = Object.assign(new Error("Bad request"), { status: 400 });
    
    mockClient.messages.create.mockRejectedValue(badRequestError);

    const singleBrokenTag: TagScore[] = [{
      tag: "title",
      value: null,
      score: 0,
      maxScore: 20,
      status: "missing",
      problem: "No title found.",
    }];

    const result = await generateFixes(mockParsedTags, singleBrokenTag, "hash-no-retry");

    expect(result.fixes).toEqual([]);
    expect(result.failedTags).toEqual(["title"]);
    expect(mockClient.messages.create).toHaveBeenCalledTimes(1);
  });

  it("should include page context in the prompt", async () => {
    mockClient.messages.create.mockResolvedValue({
      content: [{ type: "text", text: "Buy Quality Shoes Online with Free Shipping" }],
    });

    const singleBrokenTag: TagScore[] = [{
      tag: "title",
      value: null,
      score: 0,
      maxScore: 20,
      status: "missing",
      problem: "No title found.",
    }];

    await generateFixes(mockParsedTags, singleBrokenTag, "hash-context");

    expect(mockClient.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "claude-sonnet-4-20250514",
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: expect.stringContaining("Welcome to Our Site")
          }
        ]
      })
    );

    expect(mockClient.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          {
            role: "user",
            content: expect.stringContaining("We offer the best shoes online with free shipping.")
          }
        ]
      })
    );
  });
});
