import { JobItem, TfidfMatcher } from './matcher.js';

export interface RecommendedJob {
  job_id: number;
  title: string;
  category: string;
  match_percent: number;
  semantic_score: number;
  skill_overlap: number;
  matched_skills: string[];
  missing_skills: string[];
  _sort_key?: number;
}

/**
 * Recommend top matching jobs based on semantic similarity (60%) and skill overlap (40%).
 */
export function recommendJobs(
  resumeText: string,
  resumeSkills: string[],
  jobs: JobItem[],
  matcher: TfidfMatcher,
  topN: number = 5
): RecommendedJob[] {
  if (!jobs || jobs.length === 0) {
    return [];
  }

  const simScores = matcher.semanticScores(resumeText);
  const resumeSkillsSet = new Set(
    (resumeSkills || []).map((s) => s.trim().toLowerCase()).filter(Boolean)
  );

  const jobResults: RecommendedJob[] = [];

  for (let idx = 0; idx < jobs.length; idx++) {
    const job = jobs[idx];
    const jobSkills = job.required_skills.map((s) => s.trim().toLowerCase()).filter(Boolean);

    const matched = jobSkills.filter((s) => resumeSkillsSet.has(s));
    const missing = jobSkills.filter((s) => !resumeSkillsSet.has(s));

    const totalReq = jobSkills.length;
    const skillOverlap = totalReq > 0 ? matched.length / totalReq : 0.0;
    const semScore = idx < simScores.length ? simScores[idx] : 0.0;

    // SRS FR-5: 60% semantic similarity + 40% skill overlap
    const finalScore = 0.6 * semScore + 0.4 * skillOverlap;
    const matchPercent = Math.round(finalScore * 1000) / 10;

    jobResults.push({
      job_id: job.job_id,
      title: job.title,
      category: job.category,
      match_percent: matchPercent,
      semantic_score: Math.round(semScore * 100) / 100,
      skill_overlap: Math.round(skillOverlap * 100) / 100,
      matched_skills: matched,
      missing_skills: missing,
      _sort_key: finalScore,
    });
  }

  // Sort descending by final score
  jobResults.sort((a, b) => (b._sort_key ?? 0) - (a._sort_key ?? 0));

  return jobResults.slice(0, topN).map((item) => {
    delete item._sort_key;
    return item;
  });
}
