import type { ErrorResult } from "@/lib/auditTypes";
import { ERROR_MESSAGES, FALLBACK_ERROR_MESSAGE } from "@/lib/auditTypes";

interface ErrorStateProps {
  error: ErrorResult;
}

export default function ErrorState({ error }: ErrorStateProps) {
  const message = ERROR_MESSAGES[error.errorType] ?? FALLBACK_ERROR_MESSAGE;

  return (
    <div role="alert" className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-sm mx-auto glass-card rounded-2xl relative overflow-hidden shadow-xl border border-rose-500/20">
      {/* Glow background */}
      <div className="absolute inset-0 bg-rose-500/5 blur-2xl pointer-events-none" />
      
      <div aria-hidden="true" className="relative flex items-center justify-center w-16 h-16 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-4">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>

      <h3 className="text-xl font-bold text-white mb-2">Audit Failed</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{message}</p>
    </div>
  );
}

