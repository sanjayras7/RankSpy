"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AuditResult, ErrorResult } from "@/lib/auditTypes";
import ScoreCard from "@/components/ScoreCard";
import TagResultCard from "@/components/TagResultCard";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import PerfectScoreState from "@/components/PerfectScoreState";
import ShareButton from "@/components/ShareButton";

export type AnalyzeFn = (url: string) => Promise<AuditResult | ErrorResult>;

function isErrorResult(value: AuditResult | ErrorResult): value is ErrorResult {
  return "errorType" in value;
}

async function defaultAnalyze(url: string): Promise<AuditResult | ErrorResult> {
  const response = await fetch(`/api/analyze?url=${encodeURIComponent(url)}`);
  return response.json();
}

interface ResultsPageProps {
  url: string;
  analyze?: AnalyzeFn;
}

export default function ResultsPage({ url, analyze = defaultAnalyze }: ResultsPageProps) {
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<ErrorResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setResult(null);
    setError(null);

    analyze(url).then(
      (data) => {
        if (cancelled) return;
        if (isErrorResult(data)) {
          setError(data);
        } else {
          setResult(data);
        }
        setLoading(false);
      },
      () => {
        if (cancelled) return;
        setError({ errorType: "unreachable", message: "We couldn't reach that URL." });
        setLoading(false);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [url, analyze]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!result || !Array.isArray(result.scores) || result.scores.length === 0) {
    return (
      <ErrorState
        error={{ errorType: "unreachable", message: "Something went wrong. Please try again." }}
      />
    );
  }

  const isPerfectScore = result.overallScore === 100;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12 sm:px-6">
      <ScoreCard result={result} />
      {url && <ShareButton url={url} />}
      {isPerfectScore ? (
        <PerfectScoreState />
      ) : (
        <div className="flex flex-col gap-4">
          {result.scores.map((tagScore) => (
            <TagResultCard
              key={tagScore.tag}
              tagScore={tagScore}
              fix={result.fixes.find((fix) => fix.tag === tagScore.tag)}
              fixFailed={result.failedTags.includes(tagScore.tag)}
            />
          ))}
        </div>
      )}
      <div className="flex justify-center pt-4">
        <Link
          href="/"
          className="rounded-md bg-black px-6 py-3 text-base font-medium text-white"
        >
          Analyze Another URL
        </Link>
      </div>
    </main>
  );
}
