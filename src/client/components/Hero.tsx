import React from 'react';
import { Target, Zap, ShieldCheck, Compass } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="relative pt-12 pb-8 text-center max-w-4xl mx-auto px-4">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-indigo-600/15 via-violet-600/10 to-cyan-500/15 blur-3xl -z-10 pointer-events-none rounded-full" />

      {/* Natural editorial badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/60 text-xs font-medium text-slate-300 mb-6 shadow-sm">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span>Next-Generation Vector Semantic Analysis</span>
        <span className="text-slate-600">·</span>
        <span className="text-slate-400">TF-IDF & Role Classification</span>
      </div>

      {/* Main Bold Headline */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.15] text-balance">
        Find Your <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-400 bg-clip-text text-transparent">Perfect Job Match</span>
      </h1>

      {/* Subtitle */}
      <p className="mt-5 text-lg sm:text-xl text-slate-300/90 max-w-2xl mx-auto leading-relaxed text-balance font-normal">
        Our AI parses your resume, extracts verified technical competencies, predicts your ideal career path, and scores compatibility across live job openings with personalized skill gap roadmaps.
      </p>

      {/* Key Architectural Proof Points */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
        <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-cyan-400 mb-1">
            <Zap className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Extraction</span>
          </div>
          <p className="text-xs text-slate-300 font-medium">85+ Technical Skill Ontologies</p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-indigo-400 mb-1">
            <Target className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Matching</span>
          </div>
          <p className="text-xs text-slate-300 font-medium">Cosine Vector Similarity</p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-violet-400 mb-1">
            <Compass className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Gap Analysis</span>
          </div>
          <p className="text-xs text-slate-300 font-medium">Curated Learning Roadmaps</p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Privacy</span>
          </div>
          <p className="text-xs text-slate-300 font-medium">In-Memory Secure Evaluation</p>
        </div>
      </div>
    </section>
  );
};
