import type { Grade } from "./auditTypes";

interface GradeColors {
  text: string;
  bg: string;
}

const GRADE_COLORS: Record<Grade, GradeColors> = {
  A: { text: "text-green-600", bg: "bg-green-100" },
  B: { text: "text-green-600", bg: "bg-green-100" },
  C: { text: "text-yellow-600", bg: "bg-yellow-100" },
  D: { text: "text-orange-600", bg: "bg-orange-100" },
  F: { text: "text-red-600", bg: "bg-red-100" },
};

export function gradeColors(grade: Grade): GradeColors {
  return GRADE_COLORS[grade];
}
