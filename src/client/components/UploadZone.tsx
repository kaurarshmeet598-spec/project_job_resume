import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, ArrowUpRight, Sparkles, UserCheck } from 'lucide-react';
import { PRESET_RESUMES } from '../api';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  onPresetSelect: (presetId: string) => void;
  isUploading: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFileSelect,
  onPresetSelect,
  isUploading
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const processFile = (file: File) => {
    setErrorMessage(null);
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMessage('Please upload a valid PDF document (.pdf format only).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Resume file size must be under 10 MB.');
      return;
    }

    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div id="upload-section" className="max-w-3xl mx-auto px-4 py-6">
      {/* Upload Card Container with Glassmorphism and Glow */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 cursor-pointer p-8 sm:p-12 text-center backdrop-blur-xl ${
          isDragOver
            ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_40px_rgba(6,182,212,0.25)] scale-[1.01]'
            : 'border-slate-700/80 hover:border-indigo-500/70 bg-slate-900/60 hover:bg-slate-900/80 shadow-[0_4px_24px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]'
        }`}
      >
        {/* Animated ambient gradient edge */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-cyan-500/5 pointer-events-none" />

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
        />

        {/* Upload Visual Centerpiece */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              isDragOver
                ? 'bg-gradient-to-tr from-cyan-500 to-indigo-500 text-white scale-110 shadow-lg shadow-cyan-500/30'
                : 'bg-slate-800/80 text-cyan-400 group-hover:scale-105 group-hover:text-white group-hover:bg-indigo-600/30 border border-slate-700'
            }`}
          >
            <UploadCloud className="w-10 h-10 transition-transform group-hover:-translate-y-1" />
          </div>

          <h3 className="mt-5 text-xl sm:text-2xl font-bold text-white tracking-tight">
            Drop your PDF resume here, or <span className="text-cyan-400 underline decoration-cyan-400/40 underline-offset-4">browse</span>
          </h3>

          <p className="mt-2 text-sm text-slate-400 max-w-md">
            Supports standard PDF resumes up to 10MB. Text is analyzed in-memory for instant skill extraction.
          </p>

          {/* Quick File Format Guidance */}
          <div className="mt-5 inline-flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
            <span className="flex items-center gap-1 text-slate-300">
              <FileText className="w-3.5 h-3.5 text-indigo-400" /> PDF Resume Only
            </span>
            <span>·</span>
            <span>Fast Semantic AI Scan</span>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mt-4 flex items-center gap-2 px-3.5 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Preset Resumes for 1-Click Instant Testing */}
      <div className="mt-8 pt-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Or test instantly with pre-loaded profiles
          </span>
          <span className="text-xs text-slate-500">1-click demo</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PRESET_RESUMES.map((preset) => (
            <button
              key={preset.id}
              onClick={(e) => {
                e.stopPropagation();
                onPresetSelect(preset.id);
              }}
              className="group text-left p-4 rounded-xl bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow-md hover:shadow-indigo-500/10"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-200 group-hover:text-white flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{preset.name}</span>
                  </div>
                  <div className="text-xs text-indigo-400 mt-0.5 font-medium">{preset.role}</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </div>
              <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {preset.summary}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
