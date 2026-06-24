import * as cheerio from "cheerio";

export interface ParsedTagObject {
  title: string | null;
  metaDescription: string | null;
  metaRobots: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogUrl: string | null;
  canonical: string | null;
  h1: string | null;
  jsonLd: object[] | null;
  bodyExcerpt: string | null;
}

const BODY_EXCERPT_LENGTH = 500;

function nullIfEmpty(value: string | undefined | null): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function extractJsonLd($: cheerio.CheerioAPI): object[] | null {
  const blocks: object[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).text();
    try {
      const parsed = JSON.parse(raw);
      blocks.push(parsed);
    } catch {
      // Skip malformed JSON-LD blocks; other valid blocks still count.
    }
  });
  return blocks.length > 0 ? blocks : null;
}

function extractBodyExcerpt($: cheerio.CheerioAPI): string | null {
  const body = $("body").clone();
  body.find("script, style").remove();
  const text = body.text().replace(/\s+/g, " ").trim();
  if (text === "") return null;
  return text.slice(0, BODY_EXCERPT_LENGTH);
}

export function parseTags(html: string): ParsedTagObject {
  const $ = cheerio.load(html);

  return {
    title: nullIfEmpty($("title").first().text()),
    metaDescription: nullIfEmpty($('meta[name="description"]').attr("content")),
    metaRobots: nullIfEmpty($('meta[name="robots"]').attr("content")),
    ogTitle: nullIfEmpty($('meta[property="og:title"]').attr("content")),
    ogDescription: nullIfEmpty($('meta[property="og:description"]').attr("content")),
    ogImage: nullIfEmpty($('meta[property="og:image"]').attr("content")),
    ogUrl: nullIfEmpty($('meta[property="og:url"]').attr("content")),
    canonical: nullIfEmpty($('link[rel="canonical"]').attr("href")),
    h1: nullIfEmpty($("h1").first().text()),
    jsonLd: extractJsonLd($),
    bodyExcerpt: extractBodyExcerpt($),
  };
}
