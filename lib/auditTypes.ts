import type { TagStatus, TagScore, Grade } from "./server/scoringEngine";
import type { AiFixResult } from "./server/aiFixGenerator";
import type { FetchErrorType } from "./server/urlFetcher";

export type { TagStatus, TagScore, Grade, AiFixResult };

export interface AuditResult {
  scores: TagScore[];
  overallScore: number;
  grade: Grade;
  fixes: AiFixResult[];
  failedTags: string[];
}

export type ErrorType = FetchErrorType;

export interface ErrorResult {
  errorType: ErrorType;
  message: string;
}

export const ERROR_MESSAGES: Record<ErrorType, string> = {
  not_found: "We couldn't find a page at that URL (404).",
  blocked: "This site is blocking automated requests, so we can't analyze it.",
  private: "This page requires login, so we can't see its content.",
  timeout: "This page took too long to load.",
  unreachable: "We couldn't reach that URL.",
};

export const FALLBACK_ERROR_MESSAGE = "Something went wrong. Please try again.";
