import React from 'react';
import { Sparkles, Download, RotateCcw, Mic2, HelpCircle } from 'lucide-react';

interface HeaderProps {
  onOpenCoach: () => void;
  onOpenExport: () => void;
  onReset: () => void;
  hasAudio: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCoach,
  onOpenExport,
  onReset,
  hasAudio,
}) => {
  return (
    <header className="w-full flex flex-wrap items-center justify-between gap-4 py-3 border-b border-slate-800/80">
      {/* Brand & Subtitle */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-sky-500 to-purple-600 shadow-lg shadow-sky-500/20 text-slate-950">
          <Mic2 className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-sky-300 bg-clip-text text-transparent">
              VocalStudio AI
            </h1>
            <span className="text-[10px] font-mono tracking-widest px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 uppercase">
              Pro Studio Edition
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Phòng thu âm thông minh · Lọc tạp âm · Chỉnh hát như ca sĩ với Auto-Tune & Hiệu ứng DSP
          </p>
        </div>
      </div>

      {/* Top Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Reset Button */}
        <button
          onClick={onReset}
          className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
          title="Đặt lại thông số mặc định"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* AI Vocal Coach Modal Trigger */}
        <button
          onClick={onOpenCoach}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/25 transition-all"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Bác Sĩ Giọng Hát AI</span>
        </button>

        {/* Export WAV Button */}
        <button
          onClick={onOpenExport}
          disabled={!hasAudio}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 shadow-md shadow-sky-500/20 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Xuất Master WAV</span>
        </button>
      </div>
    </header>
  );
};
