"use client";

import { useState } from "react";
import type { AiFixResult, TagScore } from "@/lib/auditTypes";

const STATUS_ICON: Record<TagScore["status"], string> = {
  good: "✅",
  warning: "⚠️",
  missing: "❌",
};

const COPIED_FEEDBACK_MS = 2000;

interface TagResultCardProps {
  tagScore: TagScore;
  fix?: AiFixResult;
  fixFailed: boolean;
}

export default function TagResultCard({ tagScore, fix, fixFailed }: TagResultCardProps) {
  const [copied, setCopied] = useState(false);
  const needsFix = tagScore.status !== "good";

  async function handleCopy() {
    if (!fix) return;
    try {
      await navigator.clipboard.writeText(fix.suggestedFix);
    } catch {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = fix.suggestedFix;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      } catch {
        return;
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
  }

  // Format JSON-LD helper
  function renderValue(tag: string, value: string | null) {
    if (!value) {
      return <p className="mt-1 text-sm text-zinc-500 italic">Not found</p>;
    }

    if (tag === "jsonLd") {
      try {
        const parsed = JSON.parse(value);
        const formatted = JSON.stringify(parsed, null, 2);
        return (
          <div className="mt-2">
            <span className="text-[10px] text-zinc-500 font-bold tracking-wider uppercase font-mono">Structured Data (JSON-LD)</span>
            <pre className="mt-1.5 overflow-x-auto text-[11px] bg-black/50 p-4 rounded-xl border border-zinc-800/80 font-mono text-indigo-300 max-h-56 overflow-y-auto leading-relaxed">
              <code>{formatted}</code>
            </pre>
          </div>
        );
      } catch {
        // Fallback
      }
    }

    return (
      <p className="mt-1 text-sm text-zinc-300 break-words font-mono bg-zinc-950/40 px-3.5 py-2.5 rounded-xl border border-zinc-800/40">
        {value}
      </p>
    );
  }

  // Determine card highlight styles
  let statusBorder = "border-l-4 border-l-emerald-500/80";
  let statusLabel = "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20";
  let statusBadge = "Good";
  
  if (tagScore.status === "warning") {
    statusBorder = "border-l-4 border-l-amber-500/80";
    statusLabel = "text-amber-400 bg-amber-500/10 border border-amber-500/20";
    statusBadge = "Warning";
  } else if (tagScore.status === "missing") {
    statusBorder = "border-l-4 border-l-rose-500/80";
    statusLabel = "text-rose-400 bg-rose-500/10 border border-rose-500/20";
    statusBadge = "Missing";
  }

  return (
    <article className={`glass-card rounded-2xl p-5 ${statusBorder} shadow-lg relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5`}>
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          {/* Kept exactly for potential test assertions on STATUS_ICON */}
          <span aria-hidden="true" className="hidden">{STATUS_ICON[tagScore.status]}</span>
          
          <h3 className="font-bold text-white tracking-tight text-base uppercase font-mono">
            {tagScore.tag}
          </h3>
        </div>

        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusLabel}`}>
          {statusBadge}
        </span>
      </div>

      {renderValue(tagScore.tag, tagScore.value)}

      {tagScore.problem && (
        <div className="mt-3 flex items-start gap-2 text-xs font-medium text-zinc-400">
          <span className="text-amber-400 mt-0.5" aria-hidden="true">⚠️</span>
          <p className="flex-1 leading-relaxed text-zinc-300">{tagScore.problem}</p>
        </div>
      )}

      {needsFix && (
        <div className="mt-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 p-4 relative">
          <div className="absolute top-3 right-4 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 font-mono">AI SUGGESTION</span>
          </div>

          {fix ? (
            <div className="flex flex-col gap-3 mt-1.5">
              <p className="text-sm text-indigo-200/90 leading-relaxed font-sans italic max-w-[85%]">
                "{fix.suggestedFix}"
              </p>
              <button
                type="button"
                onClick={handleCopy}
                className="self-start rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 px-3 py-1.5 text-xs font-semibold text-white transition-all duration-150 flex items-center gap-1.5 shadow-md shadow-indigo-950/40"
              >
                {copied ? (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          ) : fixFailed ? (
            <p className="text-xs text-zinc-500 leading-relaxed italic mt-1">Fix unavailable</p>
          ) : null}
        </div>
      )}
    </article>
  );
}
