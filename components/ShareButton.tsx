"use client";
import { useState } from "react";

const COPIED_FEEDBACK_MS = 2000;

async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface ShareButtonProps {
  url: string;
}

export default function ShareButton({ url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleShare() {
    if (loading || copied) return;
    setError(null);
    setLoading(true);

    try {
      const normalized = url.toLowerCase().replace(/\/$/, "");
      const hash = await sha256Hex(normalized);

      const response = await fetch(`/api/share/${hash}`);
      if (!response.ok) {
        setError("Share link not found. Try re-analyzing the URL.");
        return;
      }

      const shareLink = `https://rankspy.com/r/${hash}`;
      try {
        await navigator.clipboard.writeText(shareLink);
      } catch {
        const textarea = document.createElement("textarea");
        textarea.value = shareLink;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    } catch {
      setError("Failed to create share link. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <button
        type="button"
        onClick={handleShare}
        disabled={loading}
        className="w-full sm:w-auto rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 active:scale-98 border border-indigo-500/20 px-8 py-3.5 text-base font-semibold text-indigo-400 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/20"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Sharing...</span>
          </>
        ) : copied ? (
          <>
            <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>Copied!</span>
          </>
        ) : (
          <>
            <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742l5.052-2.526M8.684 13.258l5.052 2.526M21 12a3 3 0 11-6 0 3 3 0 016 0zm-6-6a3 3 0 11-6 0 3 3 0 016 0zm0 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Share Result</span>
          </>
        )}
      </button>
      {error && (
        <div role="alert" className="flex items-center gap-2 text-sm text-rose-400 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
          {error}
        </div>
      )}
    </div>
  );
}

