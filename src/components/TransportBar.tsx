import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Square, Mic, MicOff, Upload, Volume2, 
  RotateCcw, Headphones, Music2, Sparkles, Check
} from 'lucide-react';

interface TransportBarProps {
  isPlaying: boolean;
  isRecording: boolean;
  currentTime: number;
  duration: number;
  masterVolume: number;
  vocalVolume: number;
  monitorMic: boolean;
  hasVocal: boolean;
  hasBeat: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onStartRecord: () => void;
  onStopRecord: () => void;
  onUploadFile: (file: File) => void;
  onLoadDemoVocal: () => void;
  onToggleMonitor: () => void;
  onChangeMasterVolume: (val: number) => void;
  onChangeVocalVolume: (val: number) => void;
}

export const TransportBar: React.FC<TransportBarProps> = ({
  isPlaying,
  isRecording,
  currentTime,
  duration,
  masterVolume,
  vocalVolume,
  monitorMic,
  hasVocal,
  hasBeat,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onStartRecord,
  onStopRecord,
  onUploadFile,
  onLoadDemoVocal,
  onToggleMonitor,
  onChangeMasterVolume,
  onChangeVocalVolume,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [recordTimer, setRecordTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      setRecordTimer(0);
      interval = setInterval(() => {
        setRecordTimer(prev => prev + 1);
      }, 1000);
    } else {
      setRecordTimer(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
      e.target.value = '';
    }
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-xl">
      {/* Top Track Bar: Scrubber & Time */}
      <div className="flex items-center gap-3 mb-4">
        <span className="font-mono text-xs text-sky-400 w-16 text-right select-none">
          {formatTime(currentTime)}
        </span>

        <div className="relative flex-1 flex items-center group">
          <input
            type="range"
            min={0}
            max={duration > 0 ? duration : 100}
            step={0.1}
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            disabled={duration <= 0}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400 focus:outline-none transition-all group-hover:h-2.5"
          />
        </div>

        <span className="font-mono text-xs text-slate-500 w-16 select-none">
          {formatTime(duration)}
        </span>
      </div>

      {/* Main Transport Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Input Sources Buttons */}
        <div className="flex items-center gap-2">
          {/* Record Live Mic Button */}
          <button
            onClick={isRecording ? onStopRecord : onStartRecord}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-md ${
              isRecording
                ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse ring-4 ring-red-500/30'
                : 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30'
            }`}
          >
            <Mic className={`w-4 h-4 ${isRecording ? 'animate-bounce' : ''}`} />
            <span>{isRecording ? `Dừng Thu (${recordTimer}s)` : 'Bắt Đầu Thu Giọng'}</span>
          </button>

          {/* Upload Vocal / Audio File */}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 transition-colors"
            title="Tải lên tệp âm thanh giọng hát MP3, WAV, M4A"
          >
            <Upload className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Tải File Âm Thanh</span>
          </button>

          {/* Quick Demo Vocal Audition */}
          <button
            onClick={onLoadDemoVocal}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 transition-colors"
            title="Nghe thử mẫu giọng hát phòng thu để trải nghiệm hiệu ứng ngay"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Mẫu Giọng Thử</span>
          </button>
        </div>

        {/* Center: Play / Pause / Stop Controls */}
        <div className="flex items-center gap-2 mx-auto">
          <button
            onClick={onStop}
            disabled={!hasVocal && !hasBeat}
            className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Dừng và về đầu"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={isPlaying ? onPause : onPlay}
            disabled={!hasVocal && !hasBeat}
            className={`p-4 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 ring-4 ring-amber-500/25'
                : 'bg-sky-500 hover:bg-sky-400 text-slate-950 ring-4 ring-sky-500/25 disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
            title={isPlaying ? 'Tạm dừng' : 'Phát bản thu & hiệu ứng'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Right: Monitoring & Volume Levels */}
        <div className="flex items-center gap-4">
          {/* Live Mic Monitor (Headphone) */}
          <button
            onClick={onToggleMonitor}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
              monitorMic
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-slate-200'
            }`}
            title="Nghe trực tiếp giọng thu qua tai nghe (Direct Monitoring)"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Kiểm Âm Tai Nghe</span>
            {monitorMic && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />}
          </button>

          {/* Vocal Level */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400 hidden xl:inline">Vocal:</span>
            <input
              type="range"
              min={0}
              max={1.5}
              step={0.05}
              value={vocalVolume}
              onChange={(e) => onChangeVocalVolume(parseFloat(e.target.value))}
              className="w-16 sm:w-20 h-1.5 bg-slate-800 rounded-lg appearance-none accent-sky-400 cursor-pointer"
              title="Âm lượng Giọng Hát"
            />
          </div>

          {/* Master Level */}
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-slate-400" />
            <input
              type="range"
              min={0}
              max={1.5}
              step={0.05}
              value={masterVolume}
              onChange={(e) => onChangeMasterVolume(parseFloat(e.target.value))}
              className="w-16 sm:w-24 h-1.5 bg-slate-800 rounded-lg appearance-none accent-sky-400 cursor-pointer"
              title="Tổng Âm Lượng Master"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
