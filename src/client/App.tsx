import React, { useState } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { UploadZone } from './components/UploadZone';
import { AnalyzingState } from './components/AnalyzingState';
import { ResultsDashboard } from './components/ResultsDashboard';
import { AppState, AnalysisResult } from './types';
import { analyzeResume } from './api';
import { CheckCircle2, Shield, Layers, Cpu, Award, ArrowRight } from 'lucide-react';

export const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('idle');
  const [currentFileName, setCurrentFileName] = useState<string | undefined>(undefined);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Trigger analysis for an uploaded file
  const handleFileSelect = async (file: File) => {
    setCurrentFileName(file.name);
    setAppState('analyzing');
    setErrorMessage(null);

    try {
      const result = await analyzeResume(file);
      setAnalysisResult(result);
      setAppState('results');
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setErrorMessage(err.message || 'Failed to process resume. Please try again or use a sample profile.');
      setAppState('idle');
    }
  };

  // Trigger analysis for a sample preset
  const handlePresetSelect = async (presetId: string) => {
    const titles: Record<string, string> = {
      fullstack: 'Alex_Rivera_FullStack.pdf',
      datascience: 'Dr_Elena_Rostova_DataScience.pdf',
      devops: 'Marcus_Chen_DevOps.pdf'
    };
    setCurrentFileName(titles[presetId] || 'Sample_Resume.pdf');
    setAppState('analyzing');
    setErrorMessage(null);

    try {
      const result = await analyzeResume(null, presetId);
      setAnalysisResult(result);
      setAppState('results');
    } catch (err: any) {
      console.error('Preset analysis failed:', err);
      setErrorMessage('Could not load sample profile.');
      setAppState('idle');
    }
  };

  const handleReset = () => {
    setAppState('idle');
    setAnalysisResult(null);
    setCurrentFileName(undefined);
    setErrorMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] pointer-events-none -z-10" />

      {/* Global Header */}
      <Header
        appState={appState}
        onReset={handleReset}
        onSelectSample={() => handlePresetSelect('fullstack')}
      />

      {/* Error notification banner */}
      {errorMessage && (
        <div className="max-w-3xl mx-auto px-4 mt-4">
          <div className="p-4 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-sm flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white text-xs font-bold">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {appState === 'idle' && (
          <>
            <Hero />
            <UploadZone
              onFileSelect={handleFileSelect}
              onPresetSelect={handlePresetSelect}
              isUploading={false}
            />

            {/* Explanatory How-It-Works & Architecture Section */}
            <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 pt-12 border-t border-slate-900">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Precision Pipeline
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
                  How TalentVector AI Benchmarks Candidates
                </h2>
                <p className="text-sm text-slate-400 mt-2">
                  Transparent, verifiable natural language processing without hallucinations
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-2xl bg-slate-900/50 border border-slate-800/80 p-6 backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">01. Structured PDF Parsing</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Decompiles arbitrary PDF layouts, extracting work history, degrees, and technology toolchains into clean semantic tokens.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-900/50 border border-slate-800/80 p-6 backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">02. Multi-Vector Cosine Matching</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Compares technical term frequency vectors against authentic job descriptions to measure true qualification overlap.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-900/50 border border-slate-800/80 p-6 backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-4">
                    <Award className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">03. Curated Upskilling Roadmaps</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Identifies missing competencies with concrete project ideas, learning hours, and direct study guides to maximize hiring odds.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

        {(appState === 'uploading' || appState === 'analyzing') && (
          <AnalyzingState fileName={currentFileName} />
        )}

        {appState === 'results' && analysisResult && (
          <ResultsDashboard
            result={analysisResult}
            onReset={handleReset}
          />
        )}
      </main>

      {/* Footer conforming to domain-design rules (clean unboxed links, no fake tickers) */}
      <footer className="w-full border-t border-slate-900 py-8 bg-slate-950/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <strong className="text-slate-400 font-semibold">TalentVector AI</strong> · Modern Resume & Job Matching Architecture
          </div>
          <div className="flex items-center gap-6">
            <a href="#how-it-works" className="hover:text-slate-300 transition-colors">Methodology</a>
            <button onClick={() => handlePresetSelect('fullstack')} className="hover:text-slate-300 transition-colors">
              Full Stack Demo
            </button>
            <button onClick={() => handlePresetSelect('datascience')} className="hover:text-slate-300 transition-colors">
              Data Science Demo
            </button>
            <button onClick={() => handlePresetSelect('devops')} className="hover:text-slate-300 transition-colors">
              DevOps Demo
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
