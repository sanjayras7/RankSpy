export interface ParsedTagObject {
  title: string | null;
  metaDescription: string | null;
  metaRobots: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogUrl: string | null;
  canonical: string | null;
  h1: string | null;
  jsonLd: object[] | null;
  bodyExcerpt: string | null;
}

export type TagStatus = "good" | "warning" | "missing";

export interface TagScore {
  tag: string;
  value: string | null;
  score: number;
  maxScore: number;
  status: TagStatus;
  problem: string;
}

export type Grade = "A" | "B" | "C" | "D" | "F";

export interface ScoringResult {
  scores: TagScore[];
  overallScore: number;
  grade: Grade;
}

function calculateGrade(score: number): Grade {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 45) return "D";
  return "F";
}

async function checkImageResolution(url: string): Promise<boolean> {
  try {
    new URL(url);
  } catch {
    return false;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function scoreTitle(value: string | null): TagScore {
  const maxScore = 20;
  let score = 0;
  let problem = "";

  if (value === null) {
    return {
      tag: "title",
      value,
      score: 0,
      maxScore,
      status: "missing",
      problem: "No title was found on this page.",
    };
  }

  const length = value.length;
  score += 10; // Present

  if (length >= 50 && length <= 60) {
    score += 10;
  } else {
    problem = `Your title is ${length} characters — ${length < 50 ? "too short" : "too long"}. Google uses up to 60 chars.`;
  }

  return {
    tag: "title",
    value,
    score,
    maxScore,
    status: score === maxScore ? "good" : "warning",
    problem,
  };
}

function scoreMetaDescription(value: string | null): TagScore {
  const maxScore = 15;
  let score = 0;
  let problem = "";

  if (value === null) {
    return {
      tag: "metaDescription",
      value,
      score: 0,
      maxScore,
      status: "missing",
      problem: "No meta description was found on this page.",
    };
  }

  const length = value.length;
  score += 8; // Present

  if (length >= 150 && length <= 160) {
    score += 7;
  } else {
    problem = `Your meta description is ${length} characters — ${length < 150 ? "too short" : "too long"}. Google uses up to 160 chars.`;
  }

  return {
    tag: "metaDescription",
    value,
    score,
    maxScore,
    status: score === maxScore ? "good" : "warning",
    problem,
  };
}

function scoreMetaRobots(value: string | null): TagScore {
  const maxScore = 15;

  if (value === null) {
    return {
      tag: "metaRobots",
      value,
      score: maxScore,
      maxScore,
      status: "good",
      problem: "",
    };
  }

  const hasNoindex = value.toLowerCase().includes("noindex") || value.toLowerCase().includes("none");
  if (hasNoindex) {
    return {
      tag: "metaRobots",
      value,
      score: 0,
      maxScore,
      status: "warning",
      problem: "Your robots meta tag is set to block search engine indexing.",
    };
  }

  return {
    tag: "metaRobots",
    value,
    score: maxScore,
    maxScore,
    status: "good",
    problem: "",
  };
}

function scoreCanonical(value: string | null): TagScore {
  const maxScore = 10;

  if (value === null) {
    return {
      tag: "canonical",
      value,
      score: 0,
      maxScore,
      status: "missing",
      problem: "No canonical link was found on this page.",
    };
  }

  if (value === "") {
    return {
      tag: "canonical",
      value,
      score: 0,
      maxScore,
      status: "warning",
      problem: "Canonical link is present but empty.",
    };
  }

  return {
    tag: "canonical",
    value,
    score: maxScore,
    maxScore,
    status: "good",
    problem: "",
  };
}

function scoreH1(value: string | null): TagScore {
  const maxScore = 10;

  if (value === null) {
    return {
      tag: "h1",
      value,
      score: 0,
      maxScore,
      status: "missing",
      problem: "No H1 heading was found on this page.",
    };
  }

  if (value === "") {
    return {
      tag: "h1",
      value,
      score: 0,
      maxScore,
      status: "warning",
      problem: "H1 heading is present but empty.",
    };
  }

  return {
    tag: "h1",
    value,
    score: maxScore,
    maxScore,
    status: "good",
    problem: "",
  };
}

function scoreOgTitle(value: string | null): TagScore {
  const maxScore = 5;

  if (value === null) {
    return {
      tag: "ogTitle",
      value,
      score: 0,
      maxScore,
      status: "missing",
      problem: "No og:title was found on this page.",
    };
  }

  return {
    tag: "ogTitle",
    value,
    score: maxScore,
    maxScore,
    status: "good",
    problem: "",
  };
}

function scoreOgDescription(value: string | null): TagScore {
  const maxScore = 5;

  if (value === null) {
    return {
      tag: "ogDescription",
      value,
      score: 0,
      maxScore,
      status: "missing",
      problem: "No og:description was found on this page.",
    };
  }

  return {
    tag: "ogDescription",
    value,
    score: maxScore,
    maxScore,
    status: "good",
    problem: "",
  };
}

async function scoreOgImage(value: string | null): Promise<TagScore> {
  const maxScore = 5;

  if (value === null) {
    return {
      tag: "ogImage",
      value,
      score: 0,
      maxScore,
      status: "missing",
      problem: "No og:image was found on this page.",
    };
  }

  const resolves = await checkImageResolution(value);
  if (!resolves) {
    return {
      tag: "ogImage",
      value,
      score: 0,
      maxScore,
      status: "warning",
      problem: "og:image URL does not resolve or is not a valid URL.",
    };
  }

  return {
    tag: "ogImage",
    value,
    score: maxScore,
    maxScore,
    status: "good",
    problem: "",
  };
}

function scoreOgUrl(value: string | null): TagScore {
  const maxScore = 5;

  if (value === null) {
    return {
      tag: "ogUrl",
      value,
      score: 0,
      maxScore,
      status: "missing",
      problem: "No og:url was found on this page.",
    };
  }

  return {
    tag: "ogUrl",
    value,
    score: maxScore,
    maxScore,
    status: "good",
    problem: "",
  };
}

function scoreJsonLd(value: object[] | null): TagScore {
  const maxScore = 10;

  if (value === null) {
    return {
      tag: "jsonLd",
      value: null,
      score: 0,
      maxScore,
      status: "missing",
      problem: "No JSON-LD schema was found on this page.",
    };
  }

  return {
    tag: "jsonLd",
    value: JSON.stringify(value),
    score: maxScore,
    maxScore,
    status: "good",
    problem: "",
  };
}

export async function scoreTags(parsedTags: ParsedTagObject): Promise<ScoringResult> {
  const scores: TagScore[] = [
    scoreTitle(parsedTags.title),
    scoreMetaDescription(parsedTags.metaDescription),
    scoreMetaRobots(parsedTags.metaRobots),
    scoreCanonical(parsedTags.canonical),
    scoreH1(parsedTags.h1),
    scoreOgTitle(parsedTags.ogTitle),
    scoreOgDescription(parsedTags.ogDescription),
    await scoreOgImage(parsedTags.ogImage),
    scoreOgUrl(parsedTags.ogUrl),
    scoreJsonLd(parsedTags.jsonLd),
  ];

  const overallScore = scores.reduce((sum, s) => sum + s.score, 0);
  const grade = calculateGrade(overallScore);

  return {
    scores,
    overallScore,
    grade,
  };
}
