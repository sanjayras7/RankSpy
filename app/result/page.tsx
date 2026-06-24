"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ResultsPage from "@/components/ResultsPage";

function ResultPageContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url") ?? "";

  return <ResultsPage url={url} />;
}

export default function ResultPage() {
  return (
    <Suspense fallback={null}>
      <ResultPageContent />
    </Suspense>
  );
}
