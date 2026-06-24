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
    <div className="bg-radial-gradient min-h-screen w-full py-12 px-4 sm:px-6">
      <main className="mx-auto flex max-w-2xl flex-col gap-6">
        {/* Page context audit target header */}
        <div className="flex flex-col gap-1.5 mb-2">
          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest font-mono">Target Audit Host</span>
          <h1 className="text-sm sm:text-base font-medium text-zinc-300 break-all font-mono bg-zinc-950/50 px-4 py-3 rounded-xl border border-zinc-800/50 flex items-center gap-2.5 shadow-lg shadow-indigo-950/10">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
            </span>
            {url}
          </h1>
        </div>

        <ScoreCard result={result} />
        
        <ShareButton url={url} />
        
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
        
        <div className="flex justify-center pt-6">
          <Link
            href="/"
            className="w-full sm:w-auto rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 px-8 py-3.5 text-base font-semibold text-zinc-300 transition-all duration-150 text-center active:scale-95 shadow-md shadow-zinc-950/80"
          >
            Analyze Another URL
          </Link>
        </div>
      </main>
    </div>
  );
}

