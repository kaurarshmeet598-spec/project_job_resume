import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { RESUMES_CSV, JOBS_CSV } from './config.js';
import { cleanText, tokenize, ENGLISH_STOP_WORDS } from './matcher.js';

export interface PredictionResult {
  title: string;
  confidence: number;
}

interface CategoryProfile {
  category: string;
  centroid: Map<string, number>;
}

export class RoleClassifier {
  private categories: string[] = [];
  private profiles: CategoryProfile[] = [];
  private idf: Map<string, number> = new Map();
  private isTrained: boolean = false;

  constructor() {
    this.train();
  }

  public train(resumesCsvPath: string = RESUMES_CSV): void {
    let records: Array<{ Category: string; Resume: string }> = [];

    if (fs.existsSync(resumesCsvPath)) {
      const raw = fs.readFileSync(resumesCsvPath, 'utf-8');
      records = parse(raw, { columns: true, skip_empty_lines: true });
    }

    // Fallback to jobs if resumes.csv not available
    if (records.length === 0 && fs.existsSync(JOBS_CSV)) {
      const rawJobs = fs.readFileSync(JOBS_CSV, 'utf-8');
      const jobs = parse(rawJobs, { columns: true, skip_empty_lines: true });
      records = jobs.map((j: any) => ({
        Category: j.category,
        Resume: `${j.title} ${j.description} ${j.required_skills}`,
      }));
    }

    if (records.length === 0) {
      return;
    }

    const docFreq = new Map<string, number>();
    const categoryDocs = new Map<string, string[][]>();

    for (const rec of records) {
      const cat = rec.Category ? rec.Category.trim() : '';
      if (!cat) continue;

      if (!categoryDocs.has(cat)) {
        categoryDocs.set(cat, []);
      }

      const tokens = tokenize(rec.Resume || '');
      if (tokens.length > 0) {
        categoryDocs.get(cat)!.push(tokens);
        const unique = new Set(tokens);
        for (const t of unique) {
          docFreq.set(t, (docFreq.get(t) || 0) + 1);
        }
      }
    }

    const N = records.length;
    this.idf.clear();
    for (const [t, df] of docFreq.entries()) {
      this.idf.set(t, Math.log((N + 1) / (df + 1)) + 1);
    }

    this.profiles = [];
    this.categories = Array.from(categoryDocs.keys());

    for (const [cat, docList] of categoryDocs.entries()) {
      const centroid = new Map<string, number>();
      for (const doc of docList) {
        const tf = new Map<string, number>();
        for (const t of doc) tf.set(t, (tf.get(t) || 0) + 1);

        for (const [t, count] of tf.entries()) {
          const tfidf = (count / doc.length) * (this.idf.get(t) || 1.0);
          centroid.set(t, (centroid.get(t) || 0) + tfidf);
        }
      }

      // Normalize centroid
      let normSq = 0;
      for (const val of centroid.values()) {
        normSq += val * val;
      }
      const norm = Math.sqrt(normSq);
      if (norm > 0) {
        for (const [t, val] of centroid.entries()) {
          centroid.set(t, val / norm);
        }
      }

      this.profiles.push({
        category: cat,
        centroid,
      });
    }

    this.isTrained = true;
  }

  public predictRole(text: string): PredictionResult {
    const cleaned = cleanText(text);
    if (!cleaned) {
      return { title: 'Unknown', confidence: 0.0 };
    }

    const tokens = tokenize(cleaned);
    if (tokens.length === 0 || !this.isTrained || this.profiles.length === 0) {
      return { title: 'General', confidence: 0.5 };
    }

    // Build query vector
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);

    const queryVec = new Map<string, number>();
    let normSq = 0;
    for (const [t, count] of tf.entries()) {
      const weight = (count / tokens.length) * (this.idf.get(t) || 1.0);
      queryVec.set(t, weight);
      normSq += weight * weight;
    }
    const norm = Math.sqrt(normSq);
    if (norm > 0) {
      for (const [t, weight] of queryVec.entries()) {
        queryVec.set(t, weight / norm);
      }
    }

    // Calculate cosine similarity with each category profile
    const similarities: Array<{ category: string; score: number }> = [];
    for (const profile of this.profiles) {
      let dot = 0;
      for (const [t, qWeight] of queryVec.entries()) {
        const cWeight = profile.centroid.get(t);
        if (cWeight !== undefined) {
          dot += qWeight * cWeight;
        }
      }
      similarities.push({ category: profile.category, score: dot });
    }

    similarities.sort((a, b) => b.score - a.score);

    const top = similarities[0];
    if (!top || top.score <= 0) {
      return { title: 'General', confidence: 0.5 };
    }

    // Softmax scaling across category similarity scores
    const maxScore = top.score;
    let expSum = 0;
    const exps = similarities.map((s) => {
      // Temperature factor 12
      const e = Math.exp((s.score - maxScore) * 12);
      expSum += e;
      return e;
    });

    const confidence = expSum > 0 ? exps[0] / expSum : 0.5;
    const roundedConfidence = Math.max(0.1, Math.min(0.99, Math.round(confidence * 100) / 100));

    return {
      title: top.category,
      confidence: roundedConfidence,
    };
  }
}
