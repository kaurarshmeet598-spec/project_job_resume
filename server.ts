import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

import { JOBS_CSV, MAX_CONTENT_LENGTH, PORT, HOST, PUBLIC_DIR } from './src/config.js';
import { extractText } from './src/parser.js';
import { extractInfo } from './src/extractor.js';
import { RoleClassifier } from './src/classifier.js';
import { TfidfMatcher, JobItem } from './src/matcher.js';
import { recommendJobs } from './src/recommender.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Load jobs catalogue once at startup
let jobs: JobItem[] = [];
if (fs.existsSync(JOBS_CSV)) {
  const rawJobs = fs.readFileSync(JOBS_CSV, 'utf-8');
  const records = parse(rawJobs, { columns: true, skip_empty_lines: true });
  jobs = records.map((r: any) => ({
    job_id: parseInt(r.job_id, 10),
    title: String(r.title || ''),
    category: String(r.category || ''),
    required_skills: String(r.required_skills || '')
      .split(';')
      .map((s: string) => s.trim().toLowerCase())
      .filter(Boolean),
    description: String(r.description || ''),
  }));
}

// Precompute embeddings / matcher & classifier once at startup
const matcher = new TfidfMatcher(jobs);
const classifier = new RoleClassifier();

// Configure Multer for in-memory upload handling
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: MAX_CONTENT_LENGTH,
  },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(PUBLIC_DIR));

// Serve index.html on root
app.get('/', (_req: Request, res: Response) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Jobs catalog endpoint
app.get('/api/jobs', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    count: jobs.length,
    jobs,
  });
});

// Resume analysis endpoint
app.post(
  '/api/analyze',
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('resume')(req, res, (err: any) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            status: 'error',
            message: 'File exceeds the maximum allowed size of 5 MB',
          });
        }
        return res.status(400).json({
          status: 'error',
          message: err.message || 'File upload error',
        });
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    // 1. Validate file field
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: "Missing 'resume' file in upload",
      });
    }

    const filename = (req.file.originalname || '').trim();
    if (!filename) {
      return res.status(400).json({
        status: 'error',
        message: 'No file selected',
      });
    }

    if (!filename.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({
        status: 'error',
        message: 'Only PDF files are supported',
      });
    }

    const fileBytes = req.file.buffer;
    if (!fileBytes || fileBytes.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Uploaded PDF file is empty',
      });
    }

    if (fileBytes.length > MAX_CONTENT_LENGTH) {
      return res.status(413).json({
        status: 'error',
        message: 'File exceeds the maximum allowed size of 5 MB',
      });
    }

    try {
      // 2. Extract text using PDF parser
      let resumeText = '';
      try {
        resumeText = await extractText(fileBytes);
      } catch (parseError: any) {
        return res.status(400).json({
          status: 'error',
          message: parseError.message || 'Could not extract text from PDF',
        });
      }

      // 3. Extract candidate information
      const candidateInfo = extractInfo(resumeText);

      // 4. Predict role category and confidence
      const predictedRole = classifier.predictRole(resumeText);

      // 5. Recommend jobs and skill gaps
      const recommended = recommendJobs(
        resumeText,
        candidateInfo.skills,
        jobs,
        matcher,
        5
      );

      return res.status(200).json({
        status: 'success',
        candidate: candidateInfo,
        predicted_role: predictedRole,
        recommended_jobs: recommended,
      });
    } catch (err: any) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to analyze resume',
      });
    }
  }
);

// Generic Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      status: 'error',
      message: 'File exceeds the maximum allowed size of 5 MB',
    });
  }
  res.status(500).json({
    status: 'error',
    message: 'An unexpected server error occurred',
  });
});

app.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});

export default app;
