import assert from 'assert';
import fs from 'fs';
import { extractText } from '../src/parser.js';
import { extractInfo } from '../src/extractor.js';
import { cleanText, TfidfMatcher, JobItem } from '../src/matcher.js';
import { RoleClassifier } from '../src/classifier.js';
import { recommendJobs } from '../src/recommender.js';
import { parse } from 'csv-parse/sync';
import { JOBS_CSV } from '../src/config.js';

const SAMPLE_PDF_BYTES = Buffer.from(`%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length 260 >> stream
BT
/F1 12 Tf
72 700 Td
(Candidate Name: John Doe) Tj
0 -20 Td
(Email: john.doe@example.com Phone: +91 9876543210) Tj
0 -20 Td
(Education: Bachelor of Technology B.Tech in CSE 2018-2022) Tj
0 -20 Td
(Technical Skills: Python, Flask, Docker, SQL, PostgreSQL, Git, Machine Learning) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000234 00000 n 
0000000305 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
618
%%EOF`);

async function runTests() {
  console.log('Running test suite...\n');

  // 1. Parser tests
  console.log('[+] Testing Parser...');
  const text = await extractText(SAMPLE_PDF_BYTES);
  assert(text.includes('John Doe'), 'Parser missing John Doe');
  assert(text.includes('john.doe@example.com'), 'Parser missing email');
  assert(text.includes('Python'), 'Parser missing Python');

  await assert.rejects(
    async () => {
      await extractText(Buffer.from('Not a valid PDF header'));
    },
    /Could not extract text from PDF/,
    'Corrupt PDF should reject'
  );

  await assert.rejects(
    async () => {
      await extractText(Buffer.from(''));
    },
    /Could not extract text from PDF/,
    'Empty PDF should reject'
  );
  console.log('  -> Parser tests passed!');

  // 2. Extractor tests
  console.log('[+] Testing Extractor...');
  const sampleResume = `
    Jane Smith
    Email: jane.smith@techcorp.io
    Phone: +1 (555) 234-5678
    Experience: 2019-2023 Senior Engineer
    Education:
    Master of Science (M.Sc) in Artificial Intelligence
    Bachelor of Technology (B.Tech) in Computer Science

    Skills:
    Python, PyTorch, Docker, Kubernetes, AWS, Machine Learning, Deep Learning, SQL
  `;
  const info = extractInfo(sampleResume);
  assert.strictEqual(info.email, 'jane.smith@techcorp.io');
  assert.strictEqual(info.phone, '+1 (555) 234-5678');
  assert.strictEqual(info.education.length, 2);
  assert(info.education.some((e) => e.toLowerCase().includes('m.sc')));
  assert(info.education.some((e) => e.toLowerCase().includes('b.tech')));

  const expectedSkills = [
    'python',
    'pytorch',
    'docker',
    'kubernetes',
    'aws',
    'machine learning',
    'deep learning',
    'sql',
  ];
  for (const s of expectedSkills) {
    assert(info.skills.includes(s), `Missing skill: ${s}`);
  }

  // Sorted, unique, lowercase
  const sortedCopy = [...info.skills].sort();
  assert.deepStrictEqual(info.skills, sortedCopy);

  // Phone edge cases
  const edgePhone = extractInfo('Attended Akal University from 2018-2022. No contact number provided.');
  assert.strictEqual(edgePhone.phone, null);

  // Scrum master not education
  const scrumText = 'John is an Agile Practitioner and Certified Scrum Master.\nEducation: B.Tech in IT';
  const scrumInfo = extractInfo(scrumText);
  assert.strictEqual(scrumInfo.education.length, 1);
  assert(!scrumInfo.education[0].toLowerCase().includes('scrum master'));

  // Empty text
  const emptyInfo = extractInfo('');
  assert.deepStrictEqual(emptyInfo, { email: null, phone: null, education: [], skills: [] });
  console.log('  -> Extractor tests passed!');

  // 3. Classifier tests
  console.log('[+] Testing Classifier...');
  const rawText = 'Visit https://example.com/profile! Python & Flask developer... Email: test@test.com';
  const cleaned = cleanText(rawText);
  assert(!cleaned.includes('https'));
  assert(!cleaned.includes('example com'));
  assert(!cleaned.includes('!'));
  assert(!cleaned.includes('&'));
  assert(cleaned.includes('python'));
  assert(cleaned.includes('flask developer'));

  const classifier = new RoleClassifier();
  const pred = classifier.predictRole(
    'Extensive experience in Python, Django, Flask, PostgreSQL, building REST microservices.'
  );
  assert(typeof pred.title === 'string' && pred.title.length > 0);
  assert(pred.confidence >= 0.0 && pred.confidence <= 1.0);
  console.log('  -> Classifier tests passed!');

  // 4. Matcher & Recommender tests
  console.log('[+] Testing Matcher & Recommender...');
  const rawJobs = fs.readFileSync(JOBS_CSV, 'utf-8');
  const records = parse(rawJobs, { columns: true, skip_empty_lines: true });
  const jobs: JobItem[] = records.map((r: any) => ({
    job_id: parseInt(r.job_id, 10),
    title: String(r.title || ''),
    category: String(r.category || ''),
    required_skills: String(r.required_skills || '')
      .split(';')
      .map((s: string) => s.trim().toLowerCase())
      .filter(Boolean),
    description: String(r.description || ''),
  }));

  const matcher = new TfidfMatcher(jobs);
  const recs = recommendJobs(
    'Proficient in Python, Django, Docker, PostgreSQL, REST APIs, and Git.',
    ['python', 'django', 'docker', 'postgresql', 'rest api', 'git'],
    jobs,
    matcher,
    5
  );

  assert.strictEqual(recs.length, 5);
  for (let i = 0; i < recs.length - 1; i++) {
    assert(recs[i].match_percent >= recs[i + 1].match_percent);
  }

  for (const job of recs) {
    assert('job_id' in job);
    assert('title' in job);
    assert('category' in job);
    assert('match_percent' in job);
    assert('semantic_score' in job);
    assert('skill_overlap' in job);
    assert('matched_skills' in job);
    assert('missing_skills' in job);

    const orig = jobs.find((j) => j.job_id === job.job_id)!;
    const allSkills = new Set([...job.matched_skills, ...job.missing_skills]);
    const expectedJobSkills = new Set(orig.required_skills);
    assert.deepStrictEqual(allSkills, expectedJobSkills);

    const intersection = job.matched_skills.filter((s) => job.missing_skills.includes(s));
    assert.strictEqual(intersection.length, 0);
  }
  console.log('  -> Matcher & Recommender tests passed!');

  console.log('\nAll core logic tests passed successfully!');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
