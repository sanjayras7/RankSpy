import * as cheerio from "cheerio";

const PRIMARY_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const TOTAL_BUDGET_MS = 10_000;
const MIN_BODY_TEXT_LENGTH = 200;

export type FetchSuccess = {
  ok: true;
  html: string;
  renderedVia: "fetch" | "puppeteer";
};

export type FetchErrorType =
  | "not_found"
  | "blocked"
  | "private"
  | "timeout"
  | "unreachable";

export type FetchError = {
  ok: false;
  errorType: FetchErrorType;
  message: string;
};

export type FetchResult = FetchSuccess | FetchError;

const ERROR_MESSAGES: Record<FetchErrorType, string> = {
  not_found: "We couldn't find a page at that URL (404).",
  blocked: "This site is blocking automated requests, so we can't analyze it.",
  private: "This page requires login, so we can't see its content.",
  timeout: "This page took too long to load.",
  unreachable: "We couldn't reach that URL.",
};

function makeError(errorType: FetchErrorType): FetchError {
  return { ok: false, errorType, message: ERROR_MESSAGES[errorType] };
}

/**
 * Detects whether a successfully-fetched page is a JS-shell that needs
 * Puppeteer rendering, vs. real static content. Content-completeness check,
 * not a speed check: a slow-but-complete page is never sent to Puppeteer.
 */
export function needsJsRendering(html: string): boolean {
  const $ = cheerio.load(html);
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const hasTitle = $("title").text().trim().length > 0;
  const hasMetaDescription = ($('meta[name="description"]').attr("content") ?? "").trim().length > 0;
  const hasH1 = $("h1").first().text().trim().length > 0;

  const hasMeaningfulSignal = hasTitle || hasMetaDescription || hasH1;
  return bodyText.length < MIN_BODY_TEXT_LENGTH && !hasMeaningfulSignal;
}

function statusToError(status: number): FetchError | null {
  if (status === 404) return makeError("not_found");
  if (status === 403 || status === 429) return makeError("blocked");
  if (status === 401) return makeError("private");
  return null;
}

async function fetchPrimary(
  url: string,
  timeoutMs: number,
): Promise<{ html: string } | FetchError> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": PRIMARY_USER_AGENT },
      signal: controller.signal,
    });

    if (!response.ok) {
      return statusToError(response.status) ?? makeError("unreachable");
    }

    const html = await response.text();
    return { html };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return makeError("timeout");
    }
    return makeError("unreachable");
  } finally {
    clearTimeout(timer);
  }
}

async function fetchViaPuppeteer(
  url: string,
  timeoutMs: number,
): Promise<{ html: string } | FetchError> {
  const puppeteerServiceUrl = process.env.PUPPETEER_SERVICE_URL ?? "";
  if (!puppeteerServiceUrl) {
    return makeError("unreachable");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${puppeteerServiceUrl}/render`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return makeError("unreachable");
    }

    const data = await response.json();
    if (typeof data.html !== "string") {
      return makeError("unreachable");
    }
    return { html: data.html };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return makeError("timeout");
    }
    return makeError("unreachable");
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetches raw HTML for a user-submitted URL, server-side only. Falls back to
 * a Puppeteer rendering service when the primary fetch returns a JS-shell.
 * Never runs longer than the combined 10s budget for primary + fallback.
 */
export async function fetchPageHtml(url: string): Promise<FetchResult> {
  try {
    new URL(url);
  } catch {
    return makeError("unreachable");
  }

  const startedAt = Date.now();
  const primaryResult = await fetchPrimary(url, TOTAL_BUDGET_MS);

  if ("errorType" in primaryResult) {
    return primaryResult;
  }

  if (!needsJsRendering(primaryResult.html)) {
    return { ok: true, html: primaryResult.html, renderedVia: "fetch" };
  }

  const remainingBudget = TOTAL_BUDGET_MS - (Date.now() - startedAt);
  if (remainingBudget <= 0) {
    return makeError("timeout");
  }

  const puppeteerResult = await fetchViaPuppeteer(url, remainingBudget);
  if ("errorType" in puppeteerResult) {
    return puppeteerResult;
  }

  return { ok: true, html: puppeteerResult.html, renderedVia: "puppeteer" };
}
