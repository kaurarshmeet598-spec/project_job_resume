import React from 'react';
import { Sparkles, FileText, RotateCcw, ArrowRight } from 'lucide-react';
import { AppState } from '../types';

interface HeaderProps {
  appState: AppState;
  onReset: () => void;
  onSelectSample: () => void;
}

export const Header: React.FC<HeaderProps> = ({ appState, onReset, onSelectSample }) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single Brand Wordmark */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={onReset}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
            TalentVector <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">AI</span>
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          <a href="#roles" className="hover:text-white transition-colors">Supported Roles</a>
          <a href="#methodology" className="hover:text-white transition-colors">Matching Engine</a>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-3">
          {appState === 'results' ? (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>New Analysis</span>
            </button>
          ) : (
            <button
              onClick={onSelectSample}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-lg transition-all"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sample Resumes</span>
            </button>
          )}

          <a
            href="#upload-section"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 rounded-lg shadow-md shadow-indigo-500/25 transition-all transform active:scale-95"
          >
            <span>Match Resume</span>
            <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </header>
  );
};
