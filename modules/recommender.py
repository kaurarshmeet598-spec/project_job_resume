"""Job recommendation module calculating semantic similarity and skill overlap."""

import pandas as pd
import numpy as np
from modules.matcher import semantic_scores


def recommend(
    resume_text: str,
    resume_skills: list[str],
    jobs_df: pd.DataFrame,
    job_embeddings: np.ndarray,
    top_n: int = 5,
) -> list[dict]:
    """Recommend top matching jobs based on semantic score and skill overlap.

    Args:
        resume_text: Full raw resume text.
        resume_skills: List of extracted skills from candidate's resume.
        jobs_df: DataFrame containing the catalogue of available jobs.
        job_embeddings: Precomputed embeddings for each job.
        top_n: Number of top job recommendations to return (default 5).

    Returns:
        list[dict]: List of top_n job recommendations sorted by match score.
    """
    if jobs_df is None or jobs_df.empty:
        return []

    # Calculate semantic similarity scores between resume and all jobs
    sim_scores = semantic_scores(resume_text, job_embeddings)

    resume_skills_set = set(skill.strip().lower() for skill in resume_skills)
    job_results = []

    for idx, (_, row) in enumerate(jobs_df.iterrows()):
        # Parse required skills from semicolon-separated string
        raw_skills = str(row.get("required_skills", ""))
        job_skills = [s.strip().lower() for s in raw_skills.split(";") if s.strip()]

        # Identify matched and missing skills
        matched = [s for s in job_skills if s in resume_skills_set]
        missing = [s for s in job_skills if s not in resume_skills_set]

        # Calculate skill overlap ratio
        total_req = len(job_skills)
        skill_overlap = (len(matched) / total_req) if total_req > 0 else 0.0

        sem_score = sim_scores[idx] if idx < len(sim_scores) else 0.0

        # Weighted final score specified in SRS FR-5: 60% semantic + 40% skill overlap
        final_score = (0.6 * sem_score) + (0.4 * skill_overlap)
        match_percent = round(final_score * 100, 1)

        job_results.append(
            {
                "job_id": int(row.get("job_id", idx + 1)),
                "title": str(row.get("title", "")),
                "category": str(row.get("category", "")),
                "match_percent": match_percent,
                "semantic_score": round(float(sem_score), 2),
                "skill_overlap": round(float(skill_overlap), 2),
                "matched_skills": matched,
                "missing_skills": missing,
                "_sort_key": final_score,
            }
        )

    # Sort descending by final score
    job_results.sort(key=lambda x: x["_sort_key"], reverse=True)

    # Clean up internal sort key and truncate to top_n
    top_recommendations = []
    for item in job_results[:top_n]:
        item.pop("_sort_key", None)
        top_recommendations.append(item)

    return top_recommendations
