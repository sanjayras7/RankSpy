import { describe, expect, it } from "vitest";
import { parseTags } from "./parseTags";

describe("parseTags", () => {
  it("returns a fully populated object when all tags are present", () => {
    const html = `
      <html>
        <head>
          <title>Buy Shoes Online | ShoeStore</title>
          <meta name="description" content="Great shoes for everyone.">
          <meta name="robots" content="index,follow">
          <meta property="og:title" content="Buy Shoes Online">
          <meta property="og:description" content="Great shoes.">
          <meta property="og:image" content="https://example.com/shoe.png">
          <meta property="og:url" content="https://example.com/shoes">
          <link rel="canonical" href="https://example.com/shoes">
        </head>
        <body>
          <h1>Shoes For Everyone</h1>
          <p>Welcome to our store.</p>
        </body>
      </html>
    `;

    const result = parseTags(html);

    expect(result).toEqual({
      title: "Buy Shoes Online | ShoeStore",
      metaDescription: "Great shoes for everyone.",
      metaRobots: "index,follow",
      ogTitle: "Buy Shoes Online",
      ogDescription: "Great shoes.",
      ogImage: "https://example.com/shoe.png",
      ogUrl: "https://example.com/shoes",
      canonical: "https://example.com/shoes",
      h1: "Shoes For Everyone",
      jsonLd: null,
      bodyExcerpt: "Shoes For Everyone Welcome to our store.",
    });
  });

  it("returns null for each missing tag, not an empty string or omitted key", () => {
    const html = `
      <html>
        <head><title>Only A Title</title></head>
        <body><p>Some text.</p></body>
      </html>
    `;

    const result = parseTags(html);

    expect(result.title).toBe("Only A Title");
    expect(result.metaDescription).toBeNull();
    expect(result.metaRobots).toBeNull();
    expect(result.ogTitle).toBeNull();
    expect(result.ogDescription).toBeNull();
    expect(result.ogImage).toBeNull();
    expect(result.ogUrl).toBeNull();
    expect(result.canonical).toBeNull();
    expect(result.h1).toBeNull();
    expect(result.jsonLd).toBeNull();
    expect(Object.keys(result)).toEqual([
      "title",
      "metaDescription",
      "metaRobots",
      "ogTitle",
      "ogDescription",
      "ogImage",
      "ogUrl",
      "canonical",
      "h1",
      "jsonLd",
      "bodyExcerpt",
    ]);
  });

  it("returns null for h1 when no h1 tag exists", () => {
    const html = `<html><body><p>No heading here.</p></body></html>`;

    const result = parseTags(html);

    expect(result.h1).toBeNull();
  });

  it("returns only the first h1's text when multiple h1 tags exist", () => {
    const html = `
      <html>
        <body>
          <h1>First Heading</h1>
          <h1>Second Heading</h1>
        </body>
      </html>
    `;

    const result = parseTags(html);

    expect(result.h1).toBe("First Heading");
  });

  it("parses a single JSON-LD block into a one-element array", () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
            {"@context":"https://schema.org","@type":"Product","name":"Shoe"}
          </script>
        </head>
        <body><h1>Shoe</h1></body>
      </html>
    `;

    const result = parseTags(html);

    expect(result.jsonLd).toEqual([
      { "@context": "https://schema.org", "@type": "Product", name: "Shoe" },
    ]);
  });

  it("parses multiple JSON-LD blocks in document order", () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">{"@type":"Product","name":"Shoe"}</script>
          <script type="application/ld+json">{"@type":"Organization","name":"ShoeStore"}</script>
        </head>
        <body></body>
      </html>
    `;

    const result = parseTags(html);

    expect(result.jsonLd).toEqual([
      { "@type": "Product", name: "Shoe" },
      { "@type": "Organization", name: "ShoeStore" },
    ]);
  });

  it("skips malformed JSON-LD blocks but keeps valid ones", () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">{ not valid json </script>
          <script type="application/ld+json">{"@type":"Organization","name":"ShoeStore"}</script>
        </head>
        <body></body>
      </html>
    `;

    const result = parseTags(html);

    expect(result.jsonLd).toEqual([{ "@type": "Organization", name: "ShoeStore" }]);
  });

  it("returns null for jsonLd when no JSON-LD blocks are present", () => {
    const html = `<html><head></head><body><h1>No schema</h1></body></html>`;

    const result = parseTags(html);

    expect(result.jsonLd).toBeNull();
  });

  it("returns the body excerpt with tags stripped and no leftover HTML entities", () => {
    const html = `
      <html>
        <body>
          <p>Shoes &amp; socks &mdash; available now.</p>
          <div><span>Free shipping</span> on all orders.</div>
        </body>
      </html>
    `;

    const result = parseTags(html);

    expect(result.bodyExcerpt).toBe(
      "Shoes & socks — available now. Free shipping on all orders."
    );
    expect(result.bodyExcerpt).not.toMatch(/&\w+;/);
    expect(result.bodyExcerpt).not.toMatch(/<[^>]+>/);
  });

  it("truncates the body excerpt to exactly the first 500 characters", () => {
    const longText = "word ".repeat(200); // 1000 characters
    const html = `<html><body><p>${longText}</p></body></html>`;

    const result = parseTags(html);

    expect(result.bodyExcerpt).toHaveLength(500);
    expect(result.bodyExcerpt).toBe(longText.trim().slice(0, 500));
  });

  it("returns the full text when body content is shorter than 500 characters", () => {
    const html = `<html><body><p>Short body text.</p></body></html>`;

    const result = parseTags(html);

    expect(result.bodyExcerpt).toBe("Short body text.");
  });

  it("excludes script and style content from the body excerpt", () => {
    const html = `
      <html>
        <body>
          <script>console.log("should not appear");</script>
          <style>.a { color: red; }</style>
          <p>Visible text only.</p>
        </body>
      </html>
    `;

    const result = parseTags(html);

    expect(result.bodyExcerpt).toBe("Visible text only.");
  });

  it("returns null for bodyExcerpt when there is no body content", () => {
    const html = `<html><head><title>Empty</title></head></html>`;

    const result = parseTags(html);

    expect(result.bodyExcerpt).toBeNull();
  });
});
