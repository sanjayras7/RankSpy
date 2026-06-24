"use client";

import { useEffect, useState } from "react";

const STILL_WORKING_AFTER_MS = 15000;

export default function LoadingState() {
  const [stillWorking, setStillWorking] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStillWorking(true), STILL_WORKING_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div role="status" className="flex flex-col items-center gap-3 py-16 text-center">
      <div
        aria-hidden="true"
        className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-600"
      />
      <p className="text-base text-gray-600">Analyzing your page...</p>
      {stillWorking && (
        <p className="text-sm text-gray-400">Still working...</p>
      )}
    </div>
  );
}
