import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const BASE_DIR = path.resolve(__dirname, '..');
export const DATA_DIR = path.join(BASE_DIR, 'data');
export const TEMPLATES_DIR = path.join(BASE_DIR, 'templates');
export const PUBLIC_DIR = path.join(BASE_DIR, 'public');

export const JOBS_CSV = path.join(DATA_DIR, 'jobs.csv');
export const RESUMES_CSV = path.join(DATA_DIR, 'resumes.csv');
export const SKILLS_TXT = path.join(DATA_DIR, 'skills.txt');

export const MAX_CONTENT_LENGTH = 5 * 1024 * 1024; // 5 MB
export const TOP_N_RECOMMENDATIONS = 5;
export const HOST = process.env.HOST || '0.0.0.0';
export const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
