import { describe, expect, it } from "vitest";
import { isLikelyUrl, normalizeUrl } from "./url";

describe("isLikelyUrl", () => {
  it("accepts a full https URL", () => {
    expect(isLikelyUrl("https://example.com")).toBe(true);
  });

  it("accepts a full http URL", () => {
    expect(isLikelyUrl("http://example.com")).toBe(true);
  });

  it("accepts a bare domain without scheme", () => {
    expect(isLikelyUrl("example.com")).toBe(true);
  });

  it("rejects an empty string", () => {
    expect(isLikelyUrl("")).toBe(false);
  });

  it("rejects whitespace-only input", () => {
    expect(isLikelyUrl("   ")).toBe(false);
  });

  it("rejects input containing internal whitespace", () => {
    expect(isLikelyUrl("example .com")).toBe(false);
  });

  it("rejects a scheme with no host", () => {
    expect(isLikelyUrl("http://")).toBe(false);
  });

  it("rejects a host without a dot", () => {
    expect(isLikelyUrl("localhost")).toBe(false);
  });

  it("rejects disallowed schemes", () => {
    expect(isLikelyUrl("ftp://example.com")).toBe(false);
    expect(isLikelyUrl("javascript:alert(1)")).toBe(false);
  });
});

describe("normalizeUrl", () => {
  it("leaves an already-schemed URL untouched", () => {
    expect(normalizeUrl("https://example.com")).toBe("https://example.com");
  });

  it("prepends https:// to a bare domain", () => {
    expect(normalizeUrl("example.com")).toBe("https://example.com");
  });

  it("trims surrounding whitespace before normalizing", () => {
    expect(normalizeUrl("  example.com  ")).toBe("https://example.com");
  });
});
