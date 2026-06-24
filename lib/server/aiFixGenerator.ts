import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "crypto";
import { ParsedTagObject, TagScore } from "./scoringEngine";
import { AuditResult } from "../auditTypes";

export interface AiFixResult {
  tag: string;
  suggestedFix: string;
  charCount: number;
}

export interface AiFixOutput {
  fixes: AiFixResult[];
  failedTags: string[];
}

interface CacheEntry {
  data: AiFixOutput | AuditResult;
  expiresAt: number;
}

// In-memory cache shared with Issue 7 (Share Feature)
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function normalizeUrl(url: string): string {
  return url.toLowerCase().replace(/\/$/, "");
}

function hashUrl(url: string): string {
  return createHash("sha256").update(normalizeUrl(url)).digest("hex");
}

function getCachedFixes(urlHash: string): AiFixOutput | null {
  const entry = cache.get(`fix:${urlHash}`);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(`fix:${urlHash}`);
    return null;
  }
  return entry.data;
}

function setCachedFixes(urlHash: string, data: AiFixOutput): void {
  cache.set(`fix:${urlHash}`, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

function getCachedShare(urlHash: string): AuditResult | null {
  const entry = cache.get(`share:${urlHash}`);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(`share:${urlHash}`);
    return null;
  }
  return entry.data as AuditResult;
}

function setCachedShare(urlHash: string, data: AuditResult): void {
  cache.set(`share:${urlHash}`, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

export { getCachedShare, setCachedShare };
export function getShareCacheKey(urlHash: string): string {
  return `share:${urlHash}`;
}

export function getFixCacheKey(urlHash: string): string {
  return `fix:${urlHash}`;
}

function buildPrompt(
  tag: string,
  currentValue: string | null,
  problem: string,
  h1: string | null,
  bodyExcerpt: string | null
): string {
  const tagDisplayName = tag === "metaDescription" ? "meta description" : tag;
  
  return `You are an SEO expert. Given the following page context, generate an optimized ${tagDisplayName}.

Page H1: ${h1 || "N/A"}
Page excerpt: ${bodyExcerpt || "N/A"}

Current value: ${currentValue || "MISSING"}
Problem: ${problem}

Rules:
- Title: 50–60 characters, include primary keyword naturally
- Description: 150–160 characters, include a soft CTA
- OG tags: engaging, social-share optimized

Return ONLY the replacement value, nothing else.`;
}

function validateResponse(response: string, tag: string): { valid: boolean; trimmed?: string } {
  if (!response || response.trim() === "") {
    return { valid: false };
  }
  
  // Check for explanation patterns
  const explanationPatterns = [/^here is/i, /^i've generated/i, /^i would suggest/i];
  if (explanationPatterns.some((pattern) => pattern.test(response))) {
    return { valid: false };
  }

  const trimmed = response.trim();
  
  // Length validation per tag type
  if (tag === "title") {
    if (trimmed.length > 60) {
      return { valid: true, trimmed: trimmed.substring(0, 60) };
    }
  } else if (tag === "metaDescription") {
    if (trimmed.length > 160) {
      return { valid: true, trimmed: trimmed.substring(0, 160) };
    }
  }
  
  return { valid: true, trimmed };
}

async function callClaudeWithRetry(
  client: Anthropic,
  prompt: string,
  maxRetries = 3
): Promise<string> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const message = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      });
      
      const content = message.content[0];
      if (content.type === "text") {
        return content.text;
      }
      throw new Error("Unexpected response type from Claude");
    } catch (error: unknown) {
      lastError = error as Error;
      
      // Check if it's a non-transient error (status 400, 401, 403)
      const status = (error as { status?: number }).status;
      if (status === 400 || status === 401 || status === 403) {
        throw error;
      }
      
      // Exponential backoff for transient errors
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  throw lastError || new Error("Claude API call failed after retries");
}

async function generateFixForTag(
  client: Anthropic,
  tag: string,
  value: string | null,
  problem: string,
  h1: string | null,
  bodyExcerpt: string | null
): Promise<AiFixResult> {
  const prompt = buildPrompt(tag, value, problem, h1, bodyExcerpt);
  const response = await callClaudeWithRetry(client, prompt);
  const validation = validateResponse(response, tag);
  
  if (!validation.valid) {
    throw new Error("Invalid response from AI");
  }
  
  const suggestedFix = validation.trimmed || response.trim();
  
  return {
    tag,
    suggestedFix,
    charCount: suggestedFix.length,
  };
}

export async function generateFixes(
  parsedTags: ParsedTagObject,
  scores: TagScore[],
  urlHash: string
): Promise<AiFixOutput> {
  // Check cache first
  const cached = getCachedFixes(urlHash);
  if (cached) {
    return cached;
  }
  
  // Filter broken tags (warning or missing status)
  const brokenTags = scores.filter((s) => s.status === "warning" || s.status === "missing");
  
  // No broken tags, return empty result
  if (brokenTags.length === 0) {
    const result: AiFixOutput = { fixes: [], failedTags: [] };
    setCachedFixes(urlHash, result);
    return result;
  }
  
  // Check for API key
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    return {
      fixes: [],
      failedTags: brokenTags.map((t) => t.tag),
    };
  }
  
  const client = new Anthropic({ apiKey });
  
  // Fire parallel requests using Promise.allSettled
  const results = await Promise.allSettled(
    brokenTags.map((tagScore) =>
      generateFixForTag(
        client,
        tagScore.tag,
        tagScore.value,
        tagScore.problem,
        parsedTags.h1,
        parsedTags.bodyExcerpt
      )
    )
  );
  
  const fixes: AiFixResult[] = [];
  const failedTags: string[] = [];
  
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      fixes.push(result.value);
    } else {
      failedTags.push(brokenTags[index].tag);
    }
  });
  
  const output: AiFixOutput = { fixes, failedTags };
  setCachedFixes(urlHash, output);
  
  return output;
}
