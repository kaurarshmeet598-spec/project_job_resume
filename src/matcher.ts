export function cleanText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Convert to lowercase
  let cleaned = text.toLowerCase();

  // Remove URLs
  cleaned = cleaned.replace(/https?:\/\/\S+|www\.\S+/g, ' ');

  // Remove special characters, email addresses punctuation, and symbols
  cleaned = cleaned.replace(/[^\w\s]/g, ' ');

  // Collapse multiple whitespaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

export const ENGLISH_STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'could', 'd', 'did', 'didn', 'do', 'does', 'doesn', 'doing', 'don', 'down', 'during',
  'each', 'few', 'for', 'from', 'further', 'had', 'hadn', 'has', 'hasn', 'have', 'haven', 'having',
  'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into',
  'is', 'isn', 'it', 'its', 'itself', 'just', 'll', 'm', 'ma', 'me', 'might', 'more', 'most', 'my',
  'myself', 'no', 'nor', 'not', 'now', 'o', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our',
  'ours', 'ourselves', 'out', 'over', 'own', 're', 's', 'same', 'shan', 'she', 'should', 'so', 'some',
  'such', 't', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these',
  'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 've', 'very', 'was', 'wasn',
  'we', 'were', 'weren', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'will',
  'with', 'won', 'would', 'y', 'you', 'your', 'yours', 'yourself', 'yourselves',
]);

export function tokenize(text: string): string[] {
  const cleaned = cleanText(text);
  if (!cleaned) return [];
  return cleaned
    .split(/\s+/)
    .filter((word) => word.length > 1 && !ENGLISH_STOP_WORDS.has(word));
}

export interface JobItem {
  job_id: number;
  title: string;
  category: string;
  required_skills: string[];
  description: string;
}

export interface JobEmbedding {
  job_id: number;
  vector: Map<string, number>;
}

export class TfidfMatcher {
  private idf: Map<string, number> = new Map();
  private docCount: number = 0;
  private jobEmbeddings: JobEmbedding[] = [];

  constructor(jobs: JobItem[] = []) {
    if (jobs.length > 0) {
      this.fit(jobs);
    }
  }

  public fit(jobs: JobItem[]) {
    this.docCount = jobs.length;
    const docFreq = new Map<string, number>();

    const jobDocs: string[][] = [];
    for (const job of jobs) {
      const skillsStr = job.required_skills.join(' ');
      const combined = `${job.title}. ${job.description} Skills: ${skillsStr}`;
      const tokens = tokenize(combined);
      jobDocs.push(tokens);

      const uniqueTokens = new Set(tokens);
      for (const t of uniqueTokens) {
        docFreq.set(t, (docFreq.get(t) || 0) + 1);
      }
    }

    this.idf.clear();
    for (const [t, df] of docFreq.entries()) {
      // Standard smooth IDF
      this.idf.set(t, Math.log((this.docCount + 1) / (df + 1)) + 1);
    }

    // Precompute job vectors
    this.jobEmbeddings = [];
    for (let i = 0; i < jobs.length; i++) {
      const tokens = jobDocs[i];
      const vector = this.createVector(tokens);
      this.jobEmbeddings.push({
        job_id: jobs[i].job_id,
        vector,
      });
    }
  }

  public createVector(tokens: string[]): Map<string, number> {
    const vector = new Map<string, number>();
    if (tokens.length === 0) return vector;

    const tf = new Map<string, number>();
    for (const t of tokens) {
      tf.set(t, (tf.get(t) || 0) + 1);
    }

    let normSq = 0;
    for (const [t, count] of tf.entries()) {
      const idfVal = this.idf.get(t) || 1.0;
      const weight = (count / tokens.length) * idfVal;
      vector.set(t, weight);
      normSq += weight * weight;
    }

    const norm = Math.sqrt(normSq);
    if (norm > 0) {
      for (const [t, weight] of vector.entries()) {
        vector.set(t, weight / norm);
      }
    }

    return vector;
  }

  public semanticScores(resumeText: string): number[] {
    if (!resumeText || this.jobEmbeddings.length === 0) {
      return new Array(this.jobEmbeddings.length).fill(0);
    }

    const tokens = tokenize(resumeText);
    const resumeVector = this.createVector(tokens);

    const scores: number[] = [];
    for (const jobEmb of this.jobEmbeddings) {
      let dotProduct = 0;
      for (const [term, weight] of resumeVector.entries()) {
        const jobWeight = jobEmb.vector.get(term);
        if (jobWeight !== undefined) {
          dotProduct += weight * jobWeight;
        }
      }
      const clipped = Math.max(0.0, Math.min(1.0, dotProduct));
      scores.push(Math.round(clipped * 10000) / 10000);
    }

    return scores;
  }
}
