import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import type { AuditResult } from "@/lib/auditTypes";
import ResultsPage from "@/components/ResultsPage";

interface Props {
  params: Promise<{ hash: string }>;
}

async function fetchShareResult(hash: string): Promise<{ data: AuditResult } | { error: string } | null> {
  if (!hash || hash.length !== 64) {
    return { error: "Share link not found or expired" };
  }

  try {
    const headersList = await headers();
    const host = headersList.get("host") ?? "localhost:3000";
    const protocol = host.includes("localhost") && !host.startsWith("localhost:") ? "http" : "http";
    const base = `${protocol}://${host}`;

    const response = await fetch(`${base}/api/share/${hash}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return { error: "Share link not found or expired" };
    }

    const data: AuditResult = await response.json();
    return { data };
  } catch {
    return { error: "Share link not found or expired" };
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { hash } = await params;
  const result = await fetchShareResult(hash);

  if (result && "data" in result) {
    const { data } = result;
    const issueCount = data.scores.filter((s) => s.status !== "good").length;

    return {
      title: `RankSpy Audit — ${data.grade} (${data.overallScore}/100)`,
      description: `${issueCount} issue(s) found. Fix these to improve your Google ranking.`,
      openGraph: {
        title: `RankSpy Audit — ${data.grade} (${data.overallScore}/100)`,
        description: `${issueCount} issue(s) found. Fix these to improve your Google ranking.`,
        images: [{ url: "/og-image.png", width: 1200, height: 630 }],
      },
    };
  }

  return {
    title: "RankSpy — Shared Result",
    description: "View a shared RankSpy SEO audit result.",
    openGraph: {
      title: "RankSpy — Shared Result",
      description: "View a shared RankSpy SEO audit result.",
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
  };
}

export default async function SharedResultPage({ params }: Props) {
  const { hash } = await params;
  const result = await fetchShareResult(hash);

  if (!result || "error" in result) {
    const message = result && "error" in result ? result.error : "Share link not found or expired";
    return (
      <main className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6">
        <span aria-hidden="true" className="text-4xl">⚠️</span>
        <h1 className="text-xl font-semibold">{message}</h1>
        <p className="text-base text-gray-600">
          Shared results expire after 24 hours. Try re-analyzing the original URL.
        </p>
        <Link
          href="/"
          className="rounded-md bg-black px-6 py-3 text-base font-medium text-white"
        >
          Analyze a URL
        </Link>
      </main>
    );
  }

  return (
    <ResultsPage
      url=""
      analyze={async () => result.data}
    />
  );
}
