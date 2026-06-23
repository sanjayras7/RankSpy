import { describe, expect, it, vi } from "vitest";
import { scoreTags, type ParsedTagObject } from "../scoringEngine";

describe("scoreTags", () => {
  describe("title scoring", () => {
    it("scores title at full points when present and 50-60 chars", async () => {
      const parsed: ParsedTagObject = {
        title: "Buy Shoes Online - Free Shipping Today | ShoeStore",
        metaDescription: null,
        metaRobots: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        ogUrl: null,
        canonical: null,
        h1: null,
        jsonLd: null,
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);
      const titleScore = result.scores.find((s) => s.tag === "title");

      expect(titleScore?.score).toBe(20);
      expect(titleScore?.maxScore).toBe(20);
      expect(titleScore?.status).toBe("good");
      expect(titleScore?.problem).toBe("");
    });

    it("scores title with partial credit when present but too short", async () => {
      const parsed: ParsedTagObject = {
        title: "Buy Shoes Online | ShoeStore",
        metaDescription: null,
        metaRobots: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        ogUrl: null,
        canonical: null,
        h1: null,
        jsonLd: null,
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);
      const titleScore = result.scores.find((s) => s.tag === "title");

      expect(titleScore?.score).toBe(10);
      expect(titleScore?.maxScore).toBe(20);
      expect(titleScore?.status).toBe("warning");
      expect(titleScore?.problem).toContain("28 characters");
      expect(titleScore?.problem).toContain("too short");
    });

    it("scores title with partial credit when present but too long", async () => {
      const parsed: ParsedTagObject = {
        title: "A".repeat(61),
        metaDescription: null,
        metaRobots: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        ogUrl: null,
        canonical: null,
        h1: null,
        jsonLd: null,
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);
      const titleScore = result.scores.find((s) => s.tag === "title");

      expect(titleScore?.score).toBe(10);
      expect(titleScore?.status).toBe("warning");
      expect(titleScore?.problem).toContain("61 characters");
      expect(titleScore?.problem).toContain("too long");
    });

    it("scores title as missing when null", async () => {
      const parsed: ParsedTagObject = {
        title: null,
        metaDescription: null,
        metaRobots: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        ogUrl: null,
        canonical: null,
        h1: null,
        jsonLd: null,
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);
      const titleScore = result.scores.find((s) => s.tag === "title");

      expect(titleScore?.score).toBe(0);
      expect(titleScore?.status).toBe("missing");
      expect(titleScore?.problem).toContain("No title was found");
    });

    it("handles title length boundary at exactly 50 chars", async () => {
      const parsed: ParsedTagObject = {
        title: "A".repeat(50),
        metaDescription: null,
        metaRobots: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        ogUrl: null,
        canonical: null,
        h1: null,
        jsonLd: null,
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);
      const titleScore = result.scores.find((s) => s.tag === "title");

      expect(titleScore?.score).toBe(20);
      expect(titleScore?.status).toBe("good");
    });

    it("handles title length boundary at exactly 60 chars", async () => {
      const parsed: ParsedTagObject = {
        title: "A".repeat(60),
        metaDescription: null,
        metaRobots: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        ogUrl: null,
        canonical: null,
        h1: null,
        jsonLd: null,
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);
      const titleScore = result.scores.find((s) => s.tag === "title");

      expect(titleScore?.score).toBe(20);
      expect(titleScore?.status).toBe("good");
    });
  });

  describe("meta description scoring", () => {
    it("scores meta description at full points when present and 150-160 chars", async () => {
      const parsed: ParsedTagObject = {
        title: null,
        metaDescription: "A".repeat(155),
        metaRobots: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        ogUrl: null,
        canonical: null,
        h1: null,
        jsonLd: null,
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);
      const metaScore = result.scores.find((s) => s.tag === "metaDescription");

      expect(metaScore?.score).toBe(15);
      expect(metaScore?.maxScore).toBe(15);
      expect(metaScore?.status).toBe("good");
    });

    it("scores meta description with partial credit when too short", async () => {
      const parsed: ParsedTagObject = {
        title: null,
        metaDescription: "Short description.",
        metaRobots: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        ogUrl: null,
        canonical: null,
        h1: null,
        jsonLd: null,
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);
      const metaScore = result.scores.find((s) => s.tag === "metaDescription");

      expect(metaScore?.score).toBe(8);
      expect(metaScore?.status).toBe("warning");
      expect(metaScore?.problem).toContain("18 characters");
      expect(metaScore?.problem).toContain("too short");
    });

    it("scores meta description as missing when null", async () => {
      const parsed: ParsedTagObject = {
        title: null,
        metaDescription: null,
        metaRobots: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        ogUrl: null,
        canonical: null,
        h1: null,
        jsonLd: null,
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);
      const metaScore = result.scores.find((s) => s.tag === "metaDescription");

      expect(metaScore?.score).toBe(0);
      expect(metaScore?.status).toBe("missing");
    });
  });

  describe("meta robots scoring", () => {
    it("scores full points when robots meta is absent (default allows indexing)", async () => {
      const parsed: ParsedTagObject = {
        title: null,
        metaDescription: null,
        metaRobots: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        ogUrl: null,
        canonical: null,
        h1: null,
        jsonLd: null,
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);
      const robotsScore = result.scores.find((s) => s.tag === "metaRobots");

      expect(robotsScore?.score).toBe(15);
      expect(robotsScore?.status).toBe("good");
    });

    it("scores full points when robots is set to index,follow", async () => {
      const parsed: ParsedTagObject = {
        title: null,
        metaDescription: null,
        metaRobots: "index,follow",
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        ogUrl: null,
        canonical: null,
        h1: null,
        jsonLd: null,
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);
      const robotsScore = result.scores.find((s) => s.tag === "metaRobots");

      expect(robotsScore?.score).toBe(15);
      expect(robotsScore?.status).toBe("good");
    });

    it("scores zero when robots contains noindex", async () => {
      const parsed: ParsedTagObject = {
        title: null,
        metaDescription: null,
        metaRobots: "noindex,nofollow",
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        ogUrl: null,
        canonical: null,
        h1: null,
        jsonLd: null,
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);
      const robotsScore = result.scores.find((s) => s.tag === "metaRobots");

      expect(robotsScore?.score).toBe(0);
      expect(robotsScore?.status).toBe("warning");
      expect(robotsScore?.problem).toContain("block search engine indexing");
    });

    it("scores zero when robots is set to none", async () => {
      const parsed: ParsedTagObject = {
        title: null,
        metaDescription: null,
        metaRobots: "none",
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        ogUrl: null,
        canonical: null,
        h1: null,
        jsonLd: null,
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);
      const robotsScore = result.scores.find((s) => s.tag === "metaRobots");

      expect(robotsScore?.score).toBe(0);
      expect(robotsScore?.status).toBe("warning");
    });
  });

  describe("canonical link scoring", () => {
    it("scores full points when canonical is present", async () => {
      const parsed: ParsedTagObject = {
        title: null,
        metaDescription: null,
        metaRobots: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        ogUrl: null,
        canonical: "https://example.com/page",
        h1: null,
        jsonLd: null,
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);
      const canonicalScore = result.scores.find((s) => s.tag === "canonical");

      expect(canonicalScore?.score).toBe(10);
      expect(canonicalScore?.status).toBe("good");
    });

    it("scores as missing when canonical is null", async () => {
      const parsed: ParsedTagObject = {
        title: null,
        metaDescription: null,
        metaRobots: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        ogUrl: null,
        canonical: null,
        h1: null,
        jsonLd: null,
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);
      const canonicalScore = result.scores.find((s) => s.tag === "canonical");

      expect(canonicalScore?.score).toBe(0);
      expect(canonicalScore?.status).toBe("missing");
    });

    it("scores zero when canonical is empty string", async () => {
      const parsed: ParsedTagObject = {
        title: null,
        metaDescription: null,
        metaRobots: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        ogUrl: null,
        canonical: "",
        h1: null,
        jsonLd: null,
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);
      const canonicalScore = result.scores.find((s) => s.tag === "canonical");

      expect(canonicalScore?.score).toBe(0);
      expect(canonicalScore?.status).toBe("warning");
    });
  });

  describe("H1 scoring", () => {
    it("scores full points when H1 is present and non-empty", async () => {
      const parsed: ParsedTagObject = {
        title: null,
        metaDescription: null,
        metaRobots: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        ogUrl: null,
        canonical: null,
        h1: "Main Heading",
        jsonLd: null,
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);
      const h1Score = result.scores.find((s) => s.tag === "h1");

      expect(h1Score?.score).toBe(10);
      expect(h1Score?.status).toBe("good");
    });

    it("scores as missing when H1 is null", async () => {
      const parsed: ParsedTagObject = {
        title: null,
        metaDescription: null,
        metaRobots: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        ogUrl: null,
        canonical: null,
        h1: null,
        jsonLd: null,
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);
      const h1Score = result.scores.find((s) => s.tag === "h1");

      expect(h1Score?.score).toBe(0);
      expect(h1Score?.status).toBe("missing");
    });

    it("scores zero when H1 is empty string", async () => {
      const parsed: ParsedTagObject = {
        title: null,
        metaDescription: null,
        metaRobots: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        ogUrl: null,
        canonical: null,
        h1: "",
        jsonLd: null,
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);
      const h1Score = result.scores.find((s) => s.tag === "h1");

      expect(h1Score?.score).toBe(0);
      expect(h1Score?.status).toBe("warning");
    });
  });

  describe("Open Graph tags scoring", () => {
    it("scores og:title full points when present", async () => {
      const parsed: ParsedTagObject = {
        title: null,
        metaDescription: null,
        metaRobots: null,
        ogTitle: "Social Title",
        ogDescription: null,
        ogImage: null,
        ogUrl: null,
        canonical: null,
        h1: null,
        jsonLd: null,
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);
      const ogTitleScore = result.scores.find((s) => s.tag === "ogTitle");

      expect(ogTitleScore?.score).toBe(5);
      expect(ogTitleScore?.status).toBe("good");
    });

    it("scores og:description full points when present", async () => {
      const parsed: ParsedTagObject = {
        title: null,
        metaDescription: null,
        metaRobots: null,
        ogTitle: null,
        ogDescription: "Social description",
        ogImage: null,
        ogUrl: null,
        canonical: null,
        h1: null,
        jsonLd: null,
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);
      const ogDescScore = result.scores.find((s) => s.tag === "ogDescription");

      expect(ogDescScore?.score).toBe(5);
      expect(ogDescScore?.status).toBe("good");
    });

    it("scores og:url full points when present", async () => {
      const parsed: ParsedTagObject = {
        title: null,
        metaDescription: null,
        metaRobots: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        ogUrl: "https://example.com/page",
        canonical: null,
        h1: null,
        jsonLd: null,
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);
      const ogUrlScore = result.scores.find((s) => s.tag === "ogUrl");

      expect(ogUrlScore?.score).toBe(5);
      expect(ogUrlScore?.status).toBe("good");
    });

    it("scores all OG tags as missing when null", async () => {
      const parsed: ParsedTagObject = {
        title: null,
        metaDescription: null,
        metaRobots: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        ogUrl: null,
        canonical: null,
        h1: null,
        jsonLd: null,
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);
      const ogTitleScore = result.scores.find((s) => s.tag === "ogTitle");
      const ogDescScore = result.scores.find((s) => s.tag === "ogDescription");
      const ogUrlScore = result.scores.find((s) => s.tag === "ogUrl");

      expect(ogTitleScore?.score).toBe(0);
      expect(ogTitleScore?.status).toBe("missing");
      expect(ogDescScore?.score).toBe(0);
      expect(ogDescScore?.status).toBe("missing");
      expect(ogUrlScore?.score).toBe(0);
      expect(ogUrlScore?.status).toBe("missing");
    });
  });

  describe("og:image scoring with resolution check", () => {
    it("scores full points when image URL resolves successfully", async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true });

      const parsed: ParsedTagObject = {
        title: null,
        metaDescription: null,
        metaRobots: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: "https://example.com/image.png",
        ogUrl: null,
        canonical: null,
        h1: null,
        jsonLd: null,
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);
      const ogImageScore = result.scores.find((s) => s.tag === "ogImage");

      expect(ogImageScore?.score).toBe(5);
      expect(ogImageScore?.status).toBe("good");
    });

    it("scores zero when image URL does not resolve (404)", async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false });

      const parsed: ParsedTagObject = {
        title: null,
        metaDescription: null,
        metaRobots: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: "https://example.com/missing.png",
        ogUrl: null,
        canonical: null,
        h1: null,
        jsonLd: null,
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);
      const ogImageScore = result.scores.find((s) => s.tag === "ogImage");

      expect(ogImageScore?.score).toBe(0);
      expect(ogImageScore?.status).toBe("warning");
      expect(ogImageScore?.problem).toContain("does not resolve");
    });

    it("scores zero when image URL times out", async () => {
      global.fetch = vi.fn().mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 4000))
      );

      const parsed: ParsedTagObject = {
        title: null,
        metaDescription: null,
        metaRobots: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: "https://slow.example.com/image.png",
        ogUrl: null,
        canonical: null,
        h1: null,
        jsonLd: null,
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);
      const ogImageScore = result.scores.find((s) => s.tag === "ogImage");

      expect(ogImageScore?.score).toBe(0);
      expect(ogImageScore?.status).toBe("warning");
    });

    it("scores zero when og:image is not a valid URL", async () => {
      const parsed: ParsedTagObject = {
        title: null,
        metaDescription: null,
        metaRobots: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: "/relative/path/image.png",
        ogUrl: null,
        canonical: null,
        h1: null,
        jsonLd: null,
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);
      const ogImageScore = result.scores.find((s) => s.tag === "ogImage");

      expect(ogImageScore?.score).toBe(0);
      expect(ogImageScore?.status).toBe("warning");
    });

    it("scores as missing when og:image is null", async () => {
      const parsed: ParsedTagObject = {
        title: null,
        metaDescription: null,
        metaRobots: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        ogUrl: null,
        canonical: null,
        h1: null,
        jsonLd: null,
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);
      const ogImageScore = result.scores.find((s) => s.tag === "ogImage");

      expect(ogImageScore?.score).toBe(0);
      expect(ogImageScore?.status).toBe("missing");
    });
  });

  describe("JSON-LD scoring", () => {
    it("scores full points when any schema is present", async () => {
      const parsed: ParsedTagObject = {
        title: null,
        metaDescription: null,
        metaRobots: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        ogUrl: null,
        canonical: null,
        h1: null,
        jsonLd: [{ "@type": "Product", name: "Shoe" }],
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);
      const jsonLdScore = result.scores.find((s) => s.tag === "jsonLd");

      expect(jsonLdScore?.score).toBe(10);
      expect(jsonLdScore?.status).toBe("good");
    });

    it("scores as missing when jsonLd is null", async () => {
      const parsed: ParsedTagObject = {
        title: null,
        metaDescription: null,
        metaRobots: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        ogUrl: null,
        canonical: null,
        h1: null,
        jsonLd: null,
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);
      const jsonLdScore = result.scores.find((s) => s.tag === "jsonLd");

      expect(jsonLdScore?.score).toBe(0);
      expect(jsonLdScore?.status).toBe("missing");
    });
  });

  describe("overall score and grade calculation", () => {
    it("calculates overall score as sum of all tag scores", async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true });

      const parsed: ParsedTagObject = {
        title: "A".repeat(55),
        metaDescription: "A".repeat(155),
        metaRobots: null,
        ogTitle: "Title",
        ogDescription: "Desc",
        ogImage: "https://example.com/img.png",
        ogUrl: "https://example.com",
        canonical: "https://example.com",
        h1: "Heading",
        jsonLd: [{ "@type": "Product" }],
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);

      expect(result.overallScore).toBe(100);
    });

    it("assigns grade A for score 90-100", async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true });

      const parsed: ParsedTagObject = {
        title: "A".repeat(55),
        metaDescription: "A".repeat(155),
        metaRobots: null,
        ogTitle: "Title",
        ogDescription: "Desc",
        ogImage: "https://example.com/img.png",
        ogUrl: "https://example.com",
        canonical: "https://example.com",
        h1: "Heading",
        jsonLd: [{ "@type": "Product" }],
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);

      expect(result.grade).toBe("A");
    });

    it("assigns grade B for score 75-89", async () => {
      const parsed: ParsedTagObject = {
        title: "A".repeat(55),
        metaDescription: "A".repeat(155),
        metaRobots: null,
        ogTitle: "Title",
        ogDescription: "Desc",
        ogImage: null,
        ogUrl: null,
        canonical: null,
        h1: "Heading",
        jsonLd: [{ "@type": "Product" }],
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);

      expect(result.overallScore).toBe(80);
      expect(result.grade).toBe("B");
    });

    it("assigns grade C for score 60-74", async () => {
      const parsed: ParsedTagObject = {
        title: "A".repeat(55),
        metaDescription: "A".repeat(155),
        metaRobots: null,
        ogTitle: "Title",
        ogDescription: null,
        ogImage: null,
        ogUrl: null,
        canonical: null,
        h1: "Heading",
        jsonLd: null,
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);

      expect(result.overallScore).toBe(65);
      expect(result.grade).toBe("C");
    });

    it("assigns grade D for score 45-59", async () => {
      const parsed: ParsedTagObject = {
        title: "Short",
        metaDescription: "Short",
        metaRobots: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        ogUrl: null,
        canonical: "https://example.com",
        h1: "Heading",
        jsonLd: null,
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);

      expect(result.overallScore).toBe(53);
      expect(result.grade).toBe("D");
    });

    it("assigns grade F for score below 45", async () => {
      const parsed: ParsedTagObject = {
        title: null,
        metaDescription: null,
        metaRobots: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        ogUrl: null,
        canonical: null,
        h1: null,
        jsonLd: null,
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);

      expect(result.overallScore).toBe(15);
      expect(result.grade).toBe("F");
    });

    it("handles grade boundary at exactly 90", async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true });

      const parsed: ParsedTagObject = {
        title: "A".repeat(55),
        metaDescription: "A".repeat(155),
        metaRobots: null,
        ogTitle: "Title",
        ogDescription: "Desc",
        ogImage: "https://example.com/img.png",
        ogUrl: null,
        canonical: "https://example.com",
        h1: "Heading",
        jsonLd: [{ "@type": "Product" }],
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);

      expect(result.overallScore).toBe(95);
      expect(result.grade).toBe("A");
    });

    it("handles grade boundary at exactly 89", async () => {
      const parsed: ParsedTagObject = {
        title: "A".repeat(55),
        metaDescription: "A".repeat(100),
        metaRobots: null,
        ogTitle: "Title",
        ogDescription: "Desc",
        ogImage: null,
        ogUrl: "https://example.com",
        canonical: "https://example.com",
        h1: "Heading",
        jsonLd: [{ "@type": "Product" }],
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);

      expect(result.overallScore).toBe(88);
      expect(result.grade).toBe("B");
    });
  });

  describe("end-to-end scoring", () => {
    it("produces correct scores array with all 10 tags", async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true });

      const parsed: ParsedTagObject = {
        title: "A".repeat(55),
        metaDescription: "A".repeat(155),
        metaRobots: null,
        ogTitle: "Title",
        ogDescription: "Desc",
        ogImage: "https://example.com/img.png",
        ogUrl: "https://example.com",
        canonical: "https://example.com",
        h1: "Heading",
        jsonLd: [{ "@type": "Product" }],
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);

      expect(result.scores).toHaveLength(10);
      expect(result.scores.map((s) => s.tag)).toEqual([
        "title",
        "metaDescription",
        "metaRobots",
        "canonical",
        "h1",
        "ogTitle",
        "ogDescription",
        "ogImage",
        "ogUrl",
        "jsonLd",
      ]);
    });

    it("returns correct problem strings for multiple failing tags", async () => {
      const parsed: ParsedTagObject = {
        title: "Short",
        metaDescription: "Also short",
        metaRobots: "noindex",
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        ogUrl: null,
        canonical: null,
        h1: null,
        jsonLd: null,
        bodyExcerpt: null,
      };

      const result = await scoreTags(parsed);

      const titleScore = result.scores.find((s) => s.tag === "title");
      const descScore = result.scores.find((s) => s.tag === "metaDescription");
      const robotsScore = result.scores.find((s) => s.tag === "metaRobots");

      expect(titleScore?.problem).toContain("5 characters");
      expect(descScore?.problem).toContain("10 characters");
      expect(robotsScore?.problem).toContain("block search engine indexing");
    });
  });
});