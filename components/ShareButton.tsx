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
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleShare}
        disabled={loading}
        className="rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white disabled:opacity-50"
      >
        {loading ? "Sharing..." : copied ? "Copied!" : "Share Result"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
