"use client";

import { useState, type FormEvent } from "react";
import { isLikelyUrl, normalizeUrl } from "@/lib/url";

type ViewState = "idle" | "loading";

interface LandingPageProps {
  onAnalyze?: (normalizedUrl: string) => void;
}

export default function LandingPage({ onAnalyze }: LandingPageProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [viewState, setViewState] = useState<ViewState>("idle");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (viewState === "loading") return;

    const trimmed = url.trim();
    if (!trimmed) {
      setError("Please enter a URL.");
      return;
    }

    if (!isLikelyUrl(trimmed)) {
      setError("Enter a valid URL, like example.com or https://example.com");
      return;
    }

    setError(null);
    setViewState("loading");
    onAnalyze?.(normalizeUrl(trimmed));
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-xl text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">RankSpy</h1>
        <p className="mt-3 text-base text-gray-600 sm:text-lg">
          Paste your URL. Know your SEO problem. Fix it in 60 seconds.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 flex flex-col gap-3 sm:flex-row"
          noValidate
        >
          <input
            type="text"
            inputMode="url"
            aria-label="Website URL"
            placeholder="example.com"
            value={url}
            disabled={viewState === "loading"}
            onChange={(event) => setUrl(event.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-4 py-3 text-base outline-none focus:border-gray-500 disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={viewState === "loading"}
            className="rounded-md bg-black px-6 py-3 text-base font-medium text-white disabled:opacity-50"
          >
            {viewState === "loading" ? "Analyzing..." : "Analyze"}
          </button>
        </form>

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
