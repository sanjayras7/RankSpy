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

  return (
    <article className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2">
        <span aria-hidden="true">{STATUS_ICON[tagScore.status]}</span>
        <h3 className="font-semibold">{tagScore.tag}</h3>
      </div>
      <p className="mt-1 text-sm text-gray-600">{tagScore.value ?? "Not found"}</p>
      <p className="mt-2 text-sm">{tagScore.problem}</p>

      {needsFix && (
        <div className="mt-3 rounded-md bg-blue-50 p-3">
          {fix ? (
            <>
              <p className="text-sm text-blue-900">{fix.suggestedFix}</p>
              <button
                type="button"
                onClick={handleCopy}
                className="mt-2 rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </>
          ) : fixFailed ? (
            <p className="text-sm text-gray-500">Fix unavailable</p>
          ) : null}
        </div>
      )}
    </article>
  );
}
