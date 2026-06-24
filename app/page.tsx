"use client";

import { useRouter } from "next/navigation";
import LandingPage from "@/components/LandingPage";

export default function Page() {
  const router = useRouter();

  return (
    <LandingPage
      onAnalyze={(normalizedUrl) => {
        router.push(`/result?url=${encodeURIComponent(normalizedUrl)}`);
      }}
    />
  );
}
