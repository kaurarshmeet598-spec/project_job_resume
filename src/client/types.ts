export interface Candidate {
  name: string;
  email: string;
  phone: string;
  education: string[];
  skills: string[];
  experienceEstimate?: string;
}

export interface PredictedRole {
  title: string;
  confidence: number;
}

export interface JobMatch {
  job_id: number;
  title: string;
  category: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  match_percent: number;
  semantic_score: number;
  skill_overlap: number;
  matched_skills: string[];
  missing_skills: string[];
  reason: string;
}

export interface MissingSkillDetail {
  name: string;
  category: string;
  importance: 'high' | 'medium' | 'recommended';
  recommendedResource: string;
  learningProject: string;
  estimatedHours: string;
}

export interface AnalysisResult {
  status: 'success' | 'error';
  candidate: Candidate;
  predicted_role: PredictedRole;
  suitability_score: number;
  recommended_jobs: JobMatch[];
  missing_skills_details: MissingSkillDetail[];
  summary: string;
  totalMarketJobsCompared: number;
}

export type AppState = 'idle' | 'uploading' | 'analyzing' | 'results';

export interface PresetResume {
  id: string;
  name: string;
  role: string;
  summary: string;
  skills: string[];
  iconName: string;
}
