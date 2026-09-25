import fs from 'fs';
import { SKILLS_TXT } from './config.js';

export interface CandidateInfo {
  email: string | null;
  phone: string | null;
  education: string[];
  skills: string[];
}

// Regular expressions for contact information matching Python specifications
const EMAIL_REGEX = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/;
const PHONE_REGEX = /(?:(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})|(?:\+?\d{1,3}[-.\s]?)?\b\d{10}\b|(?:\+\d{1,3}[-.\s]?\d{5}[-.\s]?\d{5}))/;

const DEGREE_KEYWORDS = [
  /\bb\.?tech\b/i,
  /\bbca\b/i,
  /\bmca\b/i,
  /\bb\.?sc\b/i,
  /\bm\.?sc\b/i,
  /\bmba\b/i,
  /\bbachelor\b/i,
  /\bmaster\b/i,
  /\bphd\b/i,
  /\bdiploma\b/i,
  /\bb\.?e\.?\b/i,
  /\bm\.?tech\b/i,
];

const DEGREE_VALIDATION = /\b(bachelor|degree|university|college|institute|graduat|b\.?tech|m\.?tech|bca|mca|b\.?sc|m\.?sc|mba|phd|diploma)\b/i;

// Preload skills from skills.txt
let skillPhrases: string[] = [];
interface SkillMatcher {
  skill: string;
  regex: RegExp;
}
let skillMatchers: SkillMatcher[] = [];

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function initSkills(skillsFilePath: string = SKILLS_TXT) {
  if (!fs.existsSync(skillsFilePath)) {
    return;
  }
  const fileContent = fs.readFileSync(skillsFilePath, 'utf-8');
  skillPhrases = fileContent
    .split(/\r?\n/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  skillMatchers = skillPhrases.map((skill) => {
    const escaped = escapeRegExp(skill);
    const startBound = /^[a-zA-Z0-9]/.test(skill) ? '(?<=^|[^a-zA-Z0-9])' : '';
    const endBound = /[a-zA-Z0-9]$/.test(skill) ? '(?=[^a-zA-Z0-9]|$)' : '';
    return {
      skill,
      regex: new RegExp(`${startBound}${escaped}${endBound}`, 'i'),
    };
  });
}

// Initialize skills at module load
initSkills();

/**
 * Extract email, phone, education, and skills from raw resume text.
 */
export function extractInfo(text: string): CandidateInfo {
  if (!text || typeof text !== 'string') {
    return {
      email: null,
      phone: null,
      education: [],
      skills: [],
    };
  }

  // 1. Email extraction
  const emailMatch = text.match(EMAIL_REGEX);
  const email = emailMatch ? emailMatch[0] : null;

  // 2. Phone extraction
  const phoneMatch = text.match(PHONE_REGEX);
  const phone = phoneMatch ? phoneMatch[0].trim() : null;

  // 3. Education extraction
  const educationLines: string[] = [];
  const lines = text.split(/\r?\n/);
  for (const rawLine of lines) {
    const cleanedLine = rawLine.trim();
    if (!cleanedLine) continue;

    const matchesDegree = DEGREE_KEYWORDS.some((kw) => kw.test(cleanedLine));
    if (matchesDegree) {
      // Disqualify 'scrum master' unless an actual degree word is also present
      if (/\bscrum master\b/i.test(cleanedLine) && !DEGREE_VALIDATION.test(cleanedLine)) {
        continue;
      }

      if (!educationLines.includes(cleanedLine)) {
        educationLines.push(cleanedLine);
      }
      if (educationLines.length >= 5) {
        break;
      }
    }
  }

  // 4. Skills extraction
  const extractedSkills = new Set<string>();
  for (const { skill, regex } of skillMatchers) {
    if (skill === 'c') {
      // Avoid matching 'c' in general sentences unless explicitly referencing C language
      if (/(?:programming\s+in\s+c|\bc\s*[,/]\s*c\+\+|\bc\s*[,/]|skills:.*\bc\b)/i.test(text)) {
        extractedSkills.add('c');
      }
      continue;
    }
    if (regex.test(text)) {
      extractedSkills.add(skill);
    }
  }

  const skills = Array.from(extractedSkills).sort();

  return {
    email,
    phone,
    education: educationLines,
    skills,
  };
}
