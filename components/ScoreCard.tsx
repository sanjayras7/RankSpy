import type { AuditResult } from "@/lib/auditTypes";
import { gradeColors } from "@/lib/grade";

interface ScoreCardProps {
  result: AuditResult;
}

export default function ScoreCard({ result }: ScoreCardProps) {
  const { overallScore, grade, scores } = result;
  const colors = gradeColors(grade);
  const issueCount = scores.filter((tagScore) => tagScore.status !== "good").length;

  return (
    <section className="flex flex-col items-center gap-3 rounded-lg border border-gray-200 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
      <div className="flex items-center gap-4">
        <span className="text-5xl font-bold">{overallScore}/100</span>
        <span
          className={`rounded-full px-3 py-1 text-lg font-semibold ${colors.bg} ${colors.text}`}
        >
          {grade}
        </span>
      </div>
      <p className="text-base text-gray-600">
        {issueCount} issue{issueCount === 1 ? "" : "s"} found. Fix these to improve your
        Google ranking.
      </p>
    </section>
  );
}
