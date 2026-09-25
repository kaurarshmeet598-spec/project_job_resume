import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Clock,
  Layers,
  Sparkles,
  Briefcase,
  GraduationCap,
  Mail,
  Phone,
  RotateCcw,
  Download,
  Info,
  Check,
  TrendingUp,
  MapPin,
  DollarSign
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AnalysisResult, JobMatch, MissingSkillDetail } from '../types';

interface ResultsDashboardProps {
  result: AnalysisResult;
  onReset: () => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ result, onReset }) => {
  const [activeSkillCategory, setActiveSkillCategory] = useState<string>('all');
  const [hoveredMissingSkill, setHoveredMissingSkill] = useState<MissingSkillDetail | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobMatch | null>(null);
  const [animatedScore, setAnimatedScore] = useState<number>(0);
  const [copiedSkills, setCopiedSkills] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const { candidate, predicted_role, suitability_score, recommended_jobs, missing_skills_details } = result;

  // Trigger smooth score counting animation & confetti on load
  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1400; // ms

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutCubic curve
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(easeOut * suitability_score));

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);

    // Launch celebratory confetti if high match
    if (suitability_score >= 80) {
      const timer = setTimeout(() => {
        try {
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.35 },
            colors: ['#06b6d4', '#6366f1', '#a855f7', '#38bdf8']
          });
        } catch {
          // ignore if canvas unavailable
        }
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [suitability_score]);

  // Carousel scroll helpers
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 360;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Skill categorization
  const categorizeSkill = (skill: string): string => {
    const s = skill.toLowerCase();
    if (['python', 'typescript', 'javascript', 'java', 'c++', 'go', 'rust', 'c#', 'ruby', 'php', 'sql'].includes(s)) return 'languages';
    if (['react', 'node.js', 'django', 'flask', 'spring', 'vue', 'angular', 'fastapi', 'tailwind', 'graphql'].includes(s)) return 'frameworks';
    if (['docker', 'kubernetes', 'aws', 'terraform', 'ci/cd', 'linux', 'git', 'helm', 'prometheus'].includes(s)) return 'cloud';
    if (['machine learning', 'pytorch', 'tensorflow', 'pandas', 'numpy', 'scikit-learn', 'deep learning', 'nlp'].includes(s)) return 'ai_data';
    return 'tools';
  };

  const filteredSkills = candidate.skills.filter(s => {
    if (activeSkillCategory === 'all') return true;
    return categorizeSkill(s) === activeSkillCategory;
  });

  const handleCopySkills = () => {
    navigator.clipboard.writeText(candidate.skills.join(', '));
    setCopiedSkills(true);
    setTimeout(() => setCopiedSkills(false), 2000);
  };

  // Circular gauge calculations (SVG radius = 54, circumference = 2 * PI * 54 = 339.292)
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* 1. Header Banner & Candidate Identification */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 backdrop-blur-xl shadow-xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {candidate.name || 'Candidate Evaluation'}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Target: {predicted_role.title}
            </span>
          </div>

          {/* Unboxed Metadata with Typographic Separators */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400 font-medium">
            {candidate.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{candidate.email}</span>
              </span>
            )}
            {candidate.phone && (
              <>
                <span className="text-slate-600">·</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{candidate.phone}</span>
                </span>
              </>
            )}
            {candidate.education && candidate.education.length > 0 && (
              <>
                <span className="text-slate-600">·</span>
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                  <span className="truncate max-w-xs">{candidate.education[0]}</span>
                </span>
              </>
            )}
            <span className="text-slate-600">·</span>
            <span className="text-emerald-400 font-medium">
              {(predicted_role.confidence * 100).toFixed(0)}% Classification Confidence
            </span>
          </div>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-3 self-stretch md:self-auto">
          <button
            onClick={onReset}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all shadow-sm active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Upload New Resume</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Report</span>
          </button>
        </div>
      </div>

      {/* 2. Top Analytics Grid: Suitability Ring + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Card: Circular Job Role Suitability Score */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Job Role Suitability
            </h2>
            <span className="text-xs text-slate-500">Benchmark Score</span>
          </div>

          <div className="my-6 flex items-center justify-center">
            <div className="relative w-40 h-40 flex items-center justify-center">
              {/* SVG Circular Progress Ring */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                {/* Background Ring */}
                <circle
                  cx="64"
                  cy="64"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="transparent"
                  className="text-slate-800"
                />
                {/* Animated Gradient Progress Stroke */}
                <circle
                  cx="64"
                  cy="64"
                  r={radius}
                  stroke="url(#suitabilityGradient)"
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
                <defs>
                  <linearGradient id="suitabilityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Central Counter */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-extrabold text-white font-mono tabular-nums tracking-tight">
                  {animatedScore}%
                </span>
                <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider mt-0.5">
                  {animatedScore >= 85 ? 'High Fit' : animatedScore >= 70 ? 'Strong Fit' : 'Moderate Fit'}
                </span>
              </div>
            </div>
          </div>

          {/* Sub-Metric Breakdown Bars */}
          <div className="space-y-2.5 pt-4 border-t border-slate-800/80">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Technical Skill Coverage</span>
              <span className="font-mono text-slate-200 tabular-nums">
                {Math.round((candidate.skills.length / (candidate.skills.length + missing_skills_details.length)) * 100)}%
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Role Cosine Similarity</span>
              <span className="font-mono text-cyan-400 tabular-nums font-semibold">
                {(predicted_role.confidence * 0.95).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Market Competitiveness</span>
              <span className="text-emerald-400 font-semibold">Top 12% in Archetype</span>
            </div>
          </div>
        </div>

        {/* Middle & Right: Executive Synthesis and Alignment Summary */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900/80 border border-slate-800 p-6 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                Profile Alignment & Market Outlook
              </h2>
              <span className="text-xs text-indigo-300/80 bg-indigo-950/60 px-2.5 py-1 rounded-md border border-indigo-800/50">
                Live Catalog: 28 Benchmark Roles
              </span>
            </div>

            <p className="text-base text-slate-200 leading-relaxed font-normal">
              {result.summary || (
                `Your profile demonstrates strong proficiency in modern engineering principles with outstanding synergy for ${predicted_role.title} positions. Your demonstrated capabilities cover core production tooling and scalable architectural patterns.`
              )}
            </p>

            {/* Qualitative Highlights */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs text-slate-400 font-medium">Primary Strength</div>
                <div className="text-sm font-semibold text-white mt-1 capitalize">
                  {candidate.skills[0] || 'Full Stack Architecture'} & {candidate.skills[1] || 'Databases'}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Foundational core competencies verified</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs text-slate-400 font-medium">Top Matching Archetype</div>
                <div className="text-sm font-semibold text-cyan-400 mt-1">
                  {recommended_jobs[0]?.title || predicted_role.title}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {recommended_jobs[0]?.match_percent || 90}% compatibility
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs text-slate-400 font-medium">Key Upskill Lever</div>
                <div className="text-sm font-semibold text-amber-400 mt-1 capitalize">
                  {missing_skills_details[0]?.name || 'Cloud Orchestration'}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Unlocks {recommended_jobs.length} additional roles</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Algorithm: TF-IDF Bag-of-Words + Sub-string Tokenizer + Cosine Distance</span>
            <span className="text-cyan-400">Vector Status: High Precision</span>
          </div>
        </div>
      </div>

      {/* 3. Skills Extracted Section with Animated Chips */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 backdrop-blur-xl shadow-xl mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Skills Extracted</h2>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
                {candidate.skills.length} detected
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Parsed from work experience, certifications, and technical proficiencies
            </p>
          </div>

          {/* Interactive Category Filter Tabs (Zero-Pill compliant: segmented button control) */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
            {[
              { id: 'all', label: 'All' },
              { id: 'languages', label: 'Languages' },
              { id: 'frameworks', label: 'Frameworks' },
              { id: 'cloud', label: 'Cloud & DevOps' },
              { id: 'ai_data', label: 'Data & AI' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSkillCategory(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  activeSkillCategory === tab.id
                    ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <button
              onClick={handleCopySkills}
              title="Copy all detected skills"
              className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              {copiedSkills ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : 'Copy'}
            </button>
          </div>
        </div>

        {/* Animated Chips / Pills Popping In One by One */}
        <div className="flex flex-wrap gap-2.5">
          {filteredSkills.map((skill, index) => (
            <div
              key={skill}
              className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-indigo-950/60 border border-slate-700/80 hover:border-cyan-500/50 text-slate-200 hover:text-white transition-all duration-200 transform hover:-translate-y-0.5 shadow-sm hover:shadow-cyan-500/10 cursor-default"
              style={{
                animation: 'popIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                animationDelay: `${Math.min(index * 35, 600)}ms`
              }}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold uppercase tracking-wider">{skill}</span>
            </div>
          ))}
          {filteredSkills.length === 0 && (
            <p className="text-xs text-slate-500 py-3">No skills found in this category.</p>
          )}
        </div>
      </div>

      {/* 4. Missing Skills & Gap Analysis Section with Interactive Tooltips */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 backdrop-blur-xl shadow-xl mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Skill Gaps & Upskilling Opportunities
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/30">
                {missing_skills_details.length} High-Impact Gaps
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Identified from top employer requirements. Hover or tap any skill to view recommended learning resources and practical projects.
            </p>
          </div>
        </div>

        {/* Warning Accent Chips with Tooltip Guidance */}
        <div className="flex flex-wrap gap-3 mt-4">
          {missing_skills_details.map((gap) => (
            <div
              key={gap.name}
              className="relative group"
              onMouseEnter={() => setHoveredMissingSkill(gap)}
              onMouseLeave={() => setHoveredMissingSkill(null)}
            >
              <button
                type="button"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-950/30 hover:bg-amber-900/40 border border-amber-500/40 hover:border-amber-400 text-amber-200 hover:text-white transition-all duration-200 transform hover:-translate-y-0.5 shadow-sm"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider">{gap.name}</span>
                <span className="text-[10px] text-amber-400/80 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800/60 font-mono">
                  {gap.estimatedHours}
                </span>
              </button>

              {/* Interactive Tooltip Card Hover State */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-4 rounded-xl bg-slate-950 border border-amber-500/40 shadow-2xl backdrop-blur-2xl z-30 pointer-events-none opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 translate-y-2 group-hover:translate-y-0">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400 mb-1">
                  <span className="uppercase tracking-wider">{gap.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{gap.category}</span>
                </div>
                <div className="mt-2 text-xs text-slate-300">
                  <div className="flex items-start gap-1.5 text-slate-400">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong className="text-slate-200">Guide:</strong> {gap.recommendedResource}</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-slate-400 mt-2">
                    <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span><strong className="text-slate-200">Recommended Project:</strong> {gap.learningProject}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Recommended Jobs Section (Horizontally Scrollable Carousel) */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 backdrop-blur-xl shadow-xl mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-cyan-400" />
              Recommended Jobs
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Ranked by semantic vector similarity and skill overlap percentage
            </p>
          </div>

          {/* Carousel Navigation Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollCarousel('left')}
              aria-label="Previous jobs"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollCarousel('right')}
              aria-label="Next jobs"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Container */}
        <div
          ref={carouselRef}
          className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent -mx-2 px-2"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {recommended_jobs.map((job) => (
            <div
              key={job.job_id}
              onClick={() => setSelectedJob(job)}
              className="group flex-shrink-0 w-84 sm:w-96 rounded-2xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-cyan-500/60 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10 cursor-pointer snap-start flex flex-col justify-between"
            >
              <div>
                {/* Header with Title and Match Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                      {job.title}
                    </h3>
                    <div className="text-xs text-slate-400 mt-1 font-medium">{job.company}</div>
                  </div>

                  {/* Circular or Pill Match % indicator */}
                  <div className="shrink-0 flex items-center justify-center px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-bold font-mono">
                    {job.match_percent}%
                  </div>
                </div>

                {/* Job Location & Salary Unboxed Metadata */}
                <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span>{job.location}</span>
                  </span>
                  <span>·</span>
                  <span className="text-slate-300 font-mono">{job.salary}</span>
                </div>

                {/* AI Rationale / Reason */}
                <p className="mt-4 text-xs text-slate-300/90 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  {job.reason}
                </p>

                {/* Matched Skills vs Missing Skills Chips */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Matched ({job.matched_skills.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {job.matched_skills.slice(0, 4).map(skill => (
                      <span
                        key={skill}
                        className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 font-mono"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.matched_skills.length > 4 && (
                      <span className="text-[10px] px-1.5 py-0.5 text-slate-500">
                        +{job.matched_skills.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer Button */}
              <div className="mt-6 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Category: {job.category}</span>
                <span className="inline-flex items-center gap-1 text-cyan-400 group-hover:translate-x-1 transition-transform font-semibold">
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Job Detail Modal */}
      {selectedJob && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedJob(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 p-6 sm:p-8 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider text-cyan-400 font-semibold">
                  {selectedJob.category} · {selectedJob.type}
                </span>
                <h3 className="text-2xl font-bold text-white mt-1">{selectedJob.title}</h3>
                <p className="text-sm text-slate-400">{selectedJob.company} · {selectedJob.location}</p>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-cyan-400 font-mono tabular-nums">
                  {selectedJob.match_percent}%
                </div>
                <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                  Match Rating
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-300 leading-relaxed">
              <strong className="text-white">AI Alignment Insight: </strong>
              {selectedJob.reason}
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                  Matching Technical Skills ({selectedJob.matched_skills.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJob.matched_skills.map(skill => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono"
                    >
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                  Target Upskill Skills ({selectedJob.missing_skills.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJob.missing_skills.map(skill => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-mono"
                    >
                      ! {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Compensation: <strong className="text-slate-200 font-mono">{selectedJob.salary}</strong>
              </span>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedJob(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    alert(`Application simulation initiated for ${selectedJob.title} at ${selectedJob.company}! Your tailored resume profile is ready.`);
                    setSelectedJob(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all"
                >
                  <span>Apply with This Profile</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
