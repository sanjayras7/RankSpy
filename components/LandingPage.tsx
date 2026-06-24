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
    <main className="bg-radial-gradient flex min-h-screen flex-col items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-xl text-center">
        {/* Animated ambient glow header element */}
        <div className="relative inline-block">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-xl"></div>
          <h1 className="relative text-5xl font-extrabold sm:text-6xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-400 text-glow">
            RankSpy
          </h1>
        </div>
        
        <p className="mt-4 text-lg text-zinc-400 sm:text-xl font-light tracking-wide max-w-md mx-auto">
          Paste your URL. Know your SEO problem. <span className="text-purple-300 font-normal">Fix it in 60 seconds.</span>
        </p>

        <div className="mt-10 glass-card p-6 sm:p-8 rounded-2xl shadow-2xl relative overflow-hidden">
          {/* Subtle background glow inside the card */}
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 sm:flex-row relative z-10"
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
              className="flex-1 rounded-xl glass-input px-4 py-3.5 text-base outline-none disabled:opacity-40"
            />
            <button
              type="submit"
              disabled={viewState === "loading"}
              className="rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 px-7 py-3.5 text-base font-semibold text-white transition-all duration-200 active:scale-95 shadow-lg shadow-indigo-900/30 disabled:opacity-40 disabled:pointer-events-none"
            >
              {viewState === "loading" ? "Analyzing..." : "Analyze"}
            </button>
          </form>

          {error && (
            <div role="alert" className="mt-4 flex items-center justify-center gap-2 text-sm text-rose-400 font-medium relative z-10">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
              {error}
            </div>
          )}
        </div>
        
        {/* Subtle decorative background footer details */}
        <p className="mt-8 text-xs text-zinc-500 font-mono tracking-widest uppercase">
          Automated Meta-Tag Audit Engine
        </p>
      </div>
    </main>
  );
}

