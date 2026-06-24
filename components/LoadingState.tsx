"use client";

import { useEffect, useState } from "react";

const STILL_WORKING_AFTER_MS = 15000;

export default function LoadingState() {
  const [stillWorking, setStillWorking] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStillWorking(true), STILL_WORKING_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  const loadingStages = [
    "Establishing secure connection...",
    "Downloading HTML document...",
    "Extracting metadata tags...",
    "Validating robots & canonicals...",
    "Running scoring algorithms...",
    "Generating AI-based tag optimizations..."
  ];

  const [stageIndex, setStageIndex] = useState(0);

  // Cycle through loading messages to provide rich interactive feedback
  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % loadingStages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [loadingStages.length]);

  return (
    <div role="status" className="flex flex-col items-center justify-center py-20 px-6 text-center max-w-md mx-auto">
      {/* Premium Multi-ring Radar Scanner */}
      <div className="relative w-20 h-20 mb-8" aria-hidden="true">
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-indigo-500/30 animate-spin" />
        
        {/* Middle Ring (Reverse direction) */}
        <div className="absolute inset-2 rounded-full border-2 border-indigo-400/40 border-t-transparent animate-spin-reverse" />
        
        {/* Inner Glowing Core */}
        <div className="absolute inset-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 animate-pulse shadow-lg shadow-indigo-500/50" />
      </div>

      <h3 className="text-xl font-bold tracking-tight text-white mb-2">
        Analyzing your page...
      </h3>
      
      <p className="text-sm text-zinc-400 font-mono transition-all duration-300">
        {loadingStages[stageIndex]}
      </p>

      {stillWorking && (
        <p className="mt-4 text-xs text-indigo-400 font-semibold tracking-wider uppercase animate-pulse">
          Taking longer than usual, please standby...
        </p>
      )}
    </div>
  );
}

