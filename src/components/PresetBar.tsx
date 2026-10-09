import React, { useState } from 'react';
import { VocalPreset } from '../types/audio';
import { Sparkles, Wand2, Music, Check, Loader2 } from 'lucide-react';

interface PresetBarProps {
  presets: VocalPreset[];
  activePresetId: string;
  onSelectPreset: (preset: VocalPreset) => void;
  onApplyCustomAIPreset: (prompt: string) => Promise<void>;
  isLoadingAI: boolean;
}

export const PresetBar: React.FC<PresetBarProps> = ({
  presets,
  activePresetId,
  onSelectPreset,
  onApplyCustomAIPreset,
  isLoadingAI,
}) => {
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  const handleAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    await onApplyCustomAIPreset(customPrompt);
    setShowAIPrompt(false);
  };

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 backdrop-blur-md">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Presets Giọng Hát Ca Sĩ & Phòng Thu (1-Click)
          </h3>
        </div>

        <button
          onClick={() => setShowAIPrompt(!showAIPrompt)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-purple-500/20 to-sky-500/20 hover:from-purple-500/30 hover:to-sky-500/30 text-purple-300 border border-purple-500/30 transition-all shadow-sm"
        >
          <Wand2 className="w-3.5 h-3.5 text-purple-400" />
          <span>AI Tự Thiết Lập Giọng</span>
        </button>
      </div>

      {/* AI Prompt Input Bar (Collapsible) */}
      {showAIPrompt && (
        <form onSubmit={handleAISubmit} className="mb-3 p-3 bg-purple-950/20 border border-purple-800/40 rounded-xl flex flex-wrap gap-2 items-center">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Ví dụ: Giọng ấm ngọt ngào như ca sĩ ballad, nhiều reverb sâu, autotune mượt..."
            className="flex-1 min-w-[260px] bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
          />
          <button
            type="submit"
            disabled={isLoadingAI || !customPrompt.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            {isLoadingAI ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>AI Đang Tinh Chỉnh...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5" />
                <span>Áp Dụng Preset AI</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Presets Horizontal Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {presets.map((preset) => {
          const isActive = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`flex flex-col text-left p-2.5 rounded-xl border transition-all text-xs relative ${
                isActive
                  ? 'bg-sky-500/15 border-sky-500/50 text-sky-200 shadow-md ring-1 ring-sky-500/30'
                  : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-semibold text-slate-100 truncate pr-1">
                  {preset.vietnameseName}
                </span>
                {isActive && (
                  <Check className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1 leading-tight">
                {preset.tagline}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
