import type { ErrorResult } from "@/lib/auditTypes";
import { ERROR_MESSAGES, FALLBACK_ERROR_MESSAGE } from "@/lib/auditTypes";

interface ErrorStateProps {
  error: ErrorResult;
}

export default function ErrorState({ error }: ErrorStateProps) {
  const message = ERROR_MESSAGES[error.errorType] ?? FALLBACK_ERROR_MESSAGE;

  return (
    <div role="alert" className="flex flex-col items-center gap-3 py-16 text-center">
      <span aria-hidden="true" className="text-4xl">
        ⚠️
      </span>
      <p className="text-base text-gray-700">{message}</p>
    </div>
  );
}
