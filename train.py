"""Model training script for role classification with synthetic dataset fallback."""

import random
from pathlib import Path
import pandas as pd

import config
from modules import classifier


def generate_synthetic_resumes(jobs_df: pd.DataFrame, samples_per_category: int = 40) -> pd.DataFrame:
    """Generate synthetic resumes when resumes.csv is missing (as specified in SRS Section 4).

    Args:
        jobs_df: DataFrame containing job roles, categories, and required skills.
        samples_per_category: Number of synthetic resume samples to create per category.

    Returns:
        pd.DataFrame: DataFrame with 'Category' and 'Resume' columns.
    """
    random.seed(42)

    filler_templates = [
        "Experienced software professional with demonstrated history of working in enterprise technology.",
        "Passionate problem solver dedicated to delivering high quality scalable software solutions.",
        "Strong engineering background with proven expertise in agile methodologies and clean code design.",
        "Collaborated across cross-functional engineering teams to architect reliable cloud-native services.",
        "Skilled in full life cycle development, system optimization, code reviews, and performance tuning.",
        "Holds a Bachelor degree in Computer Science with a solid foundation in algorithms and system architecture.",
        "Successfully implemented automated workflows and modern development practices across multiple client projects.",
        "Detail-oriented developer with continuous learning attitude and strong communication and teamwork abilities.",
        "Demonstrated ability to troubleshoot mission critical production incidents and deliver timely resolutions.",
        "Contributed to enterprise digital transformation projects adhering to strict industry security standards."
    ]

    records = []
    categories = jobs_df["category"].unique()

    for category in categories:
        category_jobs = jobs_df[jobs_df["category"] == category]

        # Gather all skills available in this category
        all_cat_skills = []
        for skills_str in category_jobs["required_skills"]:
            skills = [s.strip() for s in skills_str.split(";") if s.strip()]
            all_cat_skills.extend(skills)
        all_cat_skills = list(set(all_cat_skills))

        for i in range(samples_per_category):
            # Select random 60-90% subset of skills
            job_sample = category_jobs.sample(1).iloc[0]
            job_skills = [s.strip() for s in job_sample["required_skills"].split(";") if s.strip()]

            # Sample 60-90% of job skills
            sample_ratio = random.uniform(0.60, 0.90)
            sample_count = max(2, int(len(job_skills) * sample_ratio))
            chosen_skills = random.sample(job_skills, min(sample_count, len(job_skills)))

            # Optionally add a category-wide skill
            if all_cat_skills and random.random() > 0.4:
                chosen_skills.append(random.choice(all_cat_skills))
            chosen_skills = list(set(chosen_skills))

            # Pick 2-4 filler sentences
            fillers = random.sample(filler_templates, random.randint(2, 4))

            # Construct synthetic resume text
            resume_parts = [
                f"Professional Profile: {category} Specialist.",
                " ".join(fillers),
                f"Core Competencies and Technical Skills: {', '.join(chosen_skills)}.",
                f"Experience Summary: Working as a {job_sample['title']} building mission-critical services.",
                f"Key projects involved leveraging {', '.join(chosen_skills[:3])} to optimize workflow efficiency.",
                "Education: Bachelor of Technology (B.Tech) in Computer Science and Engineering."
            ]

            resume_text = "\n".join(resume_parts)
            records.append({"Category": category, "Resume": resume_text})

    return pd.DataFrame(records)


def main():
    """Main training workflow: loads or generates data, trains the pipeline, and saves model."""
    print("=" * 60)
    print("Resume Role Classifier - Model Training")
    print("=" * 60)

    resumes_path = Path(config.RESUMES_CSV)

    if not resumes_path.exists():
        print(f"[!] {resumes_path} not found.")
        print("[+] Generating synthetic dataset fallback from jobs catalogue as per SRS Section 4...")

        if not Path(config.JOBS_CSV).exists():
            raise FileNotFoundError(f"Jobs file {config.JOBS_CSV} is required to generate synthetic data.")

        jobs_df = pd.read_csv(config.JOBS_CSV)
        synthetic_df = generate_synthetic_resumes(jobs_df, samples_per_category=40)

        # Save synthetic resumes for inspection and reproducibility
        resumes_path.parent.mkdir(parents=True, exist_ok=True)
        synthetic_df.to_csv(resumes_path, index=False)
        print(f"[+] Saved {len(synthetic_df)} synthetic resumes to {resumes_path}")

    print(f"[+] Training role classifier from {resumes_path}...")
    metrics = classifier.train(str(resumes_path), str(config.ROLE_CLASSIFIER_PATH))

    print("-" * 60)
    print(f"Training Successful!")
    print(f"Number of Categories / Classes: {metrics['num_classes']}")
    print(f"Stratified Test Accuracy:       {metrics['accuracy'] * 100:.2f}%")
    print(f"Model saved to:                 {config.ROLE_CLASSIFIER_PATH}")
    print("=" * 60)


if __name__ == "__main__":
    main()
