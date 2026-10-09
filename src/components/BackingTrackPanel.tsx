import React, { useRef } from 'react';
import { BUILT_IN_BEATS, BeatPreset } from '../services/synthBeats';
import { MusicalScale } from '../types/audio';
import { Music, Upload, Volume2, VolumeX, Disc, Sparkles } from 'lucide-react';

interface BackingTrackPanelProps {
  currentBeatId: string | null;
  beatVolume: number;
  isBeatMuted: boolean;
  onSelectBeat: (beat: BeatPreset) => void;
  onUploadBeat: (file: File) => void;
  onChangeBeatVolume: (vol: number) => void;
  onToggleBeatMute: () => void;
  onSyncScaleToBeat: (scale: MusicalScale) => void;
}

export const BackingTrackPanel: React.FC<BackingTrackPanelProps> = ({
  currentBeatId,
  beatVolume,
  isBeatMuted,
  onSelectBeat,
  onUploadBeat,
  onChangeBeatVolume,
  onToggleBeatMute,
  onSyncScaleToBeat,
}) => {
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const handleUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadBeat(file);
      e.target.value = '';
    }
  };

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Disc className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Nhạc Nền / Beat Đệm Hát Karaoke
          </h3>
        </div>

        {/* Mixer Controls for Beat */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleBeatMute}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              isBeatMuted
                ? 'bg-red-500/20 border-red-500/40 text-red-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={isBeatMuted ? 'Mở lại tiếng Beat' : 'Tắt tiếng Beat (Mute)'}
          >
            {isBeatMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400">Vol Beat:</span>
            <input
              type="range"
              min={0}
              max={1.5}
              step={0.05}
              value={isBeatMuted ? 0 : beatVolume}
              onChange={(e) => onChangeBeatVolume(parseFloat(e.target.value))}
              className="w-20 h-1.5 bg-slate-800 rounded-lg appearance-none accent-emerald-400 cursor-pointer"
            />
          </div>

          <input
            ref={uploadInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleUploadChange}
          />
          <button
            onClick={() => uploadInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Tải Beat Của Bạn</span>
          </button>
        </div>
      </div>

      {/* Built-in Beats Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {BUILT_IN_BEATS.map((beat) => {
          const isSelected = currentBeatId === beat.id;
          return (
            <div
              key={beat.id}
              onClick={() => onSelectBeat(beat)}
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                isSelected
                  ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                  : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs text-slate-100 truncate pr-1">
                  {beat.vietnameseTitle}
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700/60">
                  {beat.bpm} BPM
                </span>
              </div>

              <p className="text-[11px] text-slate-400 line-clamp-1 mb-2">
                {beat.description}
              </p>

              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                <span className="text-[10px] text-slate-400 font-mono">
                  Tone: <strong className="text-sky-400">{beat.key}</strong>
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSyncScaleToBeat(beat.key);
                  }}
                  className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
                  title="Tự động đồng bộ Tone Auto-Tune sang giọng bài này"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Khóa Tone Auto-Tune</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
