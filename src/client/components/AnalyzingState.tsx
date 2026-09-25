import React, { useState, useEffect } from 'react';
import { Cpu, CheckCircle2, Loader2, Sparkles, Binary } from 'lucide-react';

interface AnalyzingStateProps {
  fileName?: string;
}

export const AnalyzingState: React.FC<AnalyzingStateProps> = ({ fileName }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(15);

  const steps = [
    { title: 'Decompiling PDF document', detail: 'Extracting text streams and formatting structure...' },
    { title: 'Semantic skill extraction', detail: 'Tokenizing technical skills, tools & certifications...' },
    { title: 'Cosine vector calculation', detail: 'Matching profile embeddings against live job catalog...' },
    { title: 'Generating gap roadmaps', detail: 'Calculating skill coverage and personalized learning paths...' }
  ];

  useEffect(() => {
    // Smooth progress bar and step progression
    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        return prev;
      });
    }, 400);

    const progressInterval = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev < 92) return prev + Math.floor(Math.random() * 8) + 3;
        return prev;
      });
    }, 120);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [steps.length]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Central Card with Glassmorphism */}
      <div className="rounded-2xl border border-slate-700/80 bg-slate-900/80 backdrop-blur-xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Top ambient glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-32 bg-cyan-500/20 blur-3xl pointer-events-none" />

        <div className="text-center">
          {/* Animated Central Node */}
          <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-cyan-400 animate-spin opacity-40 blur-md" style={{ animationDuration: '4s' }} />
            <div className="relative w-18 h-18 rounded-2xl bg-slate-950 border border-slate-700 flex items-center justify-center shadow-inner">
              <Cpu className="w-8 h-8 text-cyan-400 animate-pulse" />
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Analyzing Resume with AI
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {fileName ? (
              <span className="font-mono text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {fileName}
              </span>
            ) : (
              'Benchmarking candidate against industry job roles...'
            )}
          </p>

          {/* Animated Gradient Progress Bar */}
          <div className="mt-8 max-w-md mx-auto">
            <div className="flex justify-between text-xs font-mono text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Binary className="w-3.5 h-3.5" />
                <span>Vectorizing</span>
              </span>
              <span className="font-semibold text-white tabular-nums">{progressPercent}%</span>
            </div>

            <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 transition-all duration-300 shadow-[0_0_12px_rgba(6,182,212,0.6)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Step Sequence Checklist */}
          <div className="mt-8 max-w-md mx-auto text-left space-y-3">
            {steps.map((step, idx) => {
              const isCompleted = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div
                  key={step.title}
                  className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-300 border ${
                    isCurrent
                      ? 'bg-slate-800/80 border-indigo-500/40 shadow-sm'
                      : isCompleted
                      ? 'bg-slate-950/40 border-slate-800/60 opacity-80'
                      : 'bg-transparent border-transparent opacity-40'
                  }`}
                >
                  <div className="mt-0.5">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${isCurrent ? 'text-white' : 'text-slate-300'}`}>
                      {step.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{step.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Shimmering Skeleton Loader below indicating incoming dashboard */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 opacity-40">
        <div className="h-32 rounded-xl bg-slate-900 border border-slate-800 animate-pulse p-4 flex flex-col justify-between">
          <div className="h-4 bg-slate-800 rounded w-1/2" />
          <div className="h-10 bg-slate-800/60 rounded w-full" />
        </div>
        <div className="h-32 rounded-xl bg-slate-900 border border-slate-800 animate-pulse p-4 flex flex-col justify-between">
          <div className="h-4 bg-slate-800 rounded w-1/3" />
          <div className="h-10 bg-slate-800/60 rounded w-3/4" />
        </div>
        <div className="h-32 rounded-xl bg-slate-900 border border-slate-800 animate-pulse p-4 flex flex-col justify-between">
          <div className="h-4 bg-slate-800 rounded w-2/3" />
          <div className="h-10 bg-slate-800/60 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
};
