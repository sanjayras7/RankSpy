import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchPageHtml, needsJsRendering } from "../urlFetcher";

const STATIC_PAGE_HTML = `
<html>
  <head><title>Buy Shoes Online | ShoeStore</title></head>
  <body><h1>Shoes</h1><p>${"Lorem ipsum dolor sit amet. ".repeat(20)}</p></body>
</html>
`;

const JS_SHELL_HTML = `<html><head></head><body><div id="root"></div></body></html>`;

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

function htmlResponse(html: string, status = 200) {
  return new Response(html, { status });
}

describe("needsJsRendering", () => {
  it("returns false for a static page with title, h1, and real body text", () => {
    expect(needsJsRendering(STATIC_PAGE_HTML)).toBe(false);
  });

  it("returns true for a JS-shell page with no meaningful content", () => {
    expect(needsJsRendering(JS_SHELL_HTML)).toBe(true);
  });
});

describe("fetchPageHtml", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
    delete process.env.PUPPETEER_SERVICE_URL;
  });

  it("returns html via the primary fetch for a normal static page", async () => {
    global.fetch = vi.fn().mockResolvedValue(htmlResponse(STATIC_PAGE_HTML));

    const result = await fetchPageHtml("https://example.com");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.renderedVia).toBe("fetch");
      expect(result.html).toBe(STATIC_PAGE_HTML);
    }
  });

  it("falls back to Puppeteer when the primary fetch returns a JS-shell", async () => {
    process.env.PUPPETEER_SERVICE_URL = "https://puppeteer.example.fly.dev";

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(htmlResponse(JS_SHELL_HTML))
      .mockResolvedValueOnce(jsonResponse({ html: STATIC_PAGE_HTML }));

    const result = await fetchPageHtml("https://spa.example.com");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.renderedVia).toBe("puppeteer");
      expect(result.html).toBe(STATIC_PAGE_HTML);
    }
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("returns a not_found error for a 404 response", async () => {
    global.fetch = vi.fn().mockResolvedValue(htmlResponse("", 404));

    const result = await fetchPageHtml("https://example.com/missing");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorType).toBe("not_found");
  });

  it("returns a blocked error for a 403 response", async () => {
    global.fetch = vi.fn().mockResolvedValue(htmlResponse("", 403));

    const result = await fetchPageHtml("https://example.com/blocked");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorType).toBe("blocked");
  });

  it("returns a private error for a 401 response", async () => {
    global.fetch = vi.fn().mockResolvedValue(htmlResponse("", 401));

    const result = await fetchPageHtml("https://example.com/private");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorType).toBe("private");
  });

  it("returns a timeout error when the primary fetch aborts", async () => {
    global.fetch = vi.fn().mockImplementation((_url, init) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const err = new Error("aborted");
          err.name = "AbortError";
          reject(err);
        });
      });
    });

    const result = await fetchPageHtml("https://slow.example.com");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorType).toBe("timeout");
  }, 15_000);

  it("returns an unreachable error for a network-level failure", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("getaddrinfo ENOTFOUND"));

    const result = await fetchPageHtml("https://does-not-exist.invalid");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorType).toBe("unreachable");
  });

  it("returns an unreachable error for a malformed URL", async () => {
    const result = await fetchPageHtml("not-a-url");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorType).toBe("unreachable");
  });

  it("returns unreachable when Puppeteer service is unset and rendering is needed", async () => {
    global.fetch = vi.fn().mockResolvedValue(htmlResponse(JS_SHELL_HTML));

    const result = await fetchPageHtml("https://spa.example.com");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorType).toBe("unreachable");
  });
});
