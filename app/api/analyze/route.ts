import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { fetchPageHtml } from "@/lib/server/urlFetcher";
import { parseTags } from "@/lib/parseTags";
import { scoreTags } from "@/lib/server/scoringEngine";
import { generateFixes } from "@/lib/server/aiFixGenerator";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json(
      { errorType: "unreachable", message: "No URL provided." },
      { status: 400 },
    );
  }

  const fetchResult = await fetchPageHtml(url);
  if (!fetchResult.ok) {
    return NextResponse.json({
      errorType: fetchResult.errorType,
      message: fetchResult.message,
    });
  }

  const parsedTags = parseTags(fetchResult.html);
  const scoringResult = await scoreTags(parsedTags);

  const normalizedUrl = url.toLowerCase().replace(/\/$/, "");
  const urlHash = createHash("sha256").update(normalizedUrl).digest("hex");
  const fixResult = await generateFixes(parsedTags, scoringResult.scores, urlHash);

  const auditResult = {
    scores: scoringResult.scores,
    overallScore: scoringResult.overallScore,
    grade: scoringResult.grade,
    fixes: fixResult.fixes,
    failedTags: fixResult.failedTags,
  };

  return NextResponse.json(auditResult);
}
