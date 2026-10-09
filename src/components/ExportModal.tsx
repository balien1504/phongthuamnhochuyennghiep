import React, { useState } from 'react';
import { Download, X, CheckCircle, Loader2, Music, Sparkles } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (filename: string, includeBeat: boolean) => Promise<void>;
  isExporting: boolean;
  exportProgress: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  isExporting,
  exportProgress,
}) => {
  const [trackName, setTrackName] = useState('Ban_Thu_Phong_Thu_Vocal_Master');
  const [includeBeat, setIncludeBeat] = useState(true);

  if (!isOpen) return null;

  const handleExportClick = async () => {
    const finalName = trackName.trim() || 'VocalStudio_Master';
    await onExport(finalName, includeBeat);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0c1017] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-slate-100">
              Xuất File Âm Thanh Phòng Thu (Master WAV)
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-slate-300">
          <div>
            <label className="block text-slate-400 mb-1.5 font-medium">Tên Bản Thu Xuất:</label>
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
              <input
                type="text"
                value={trackName}
                onChange={(e) => setTrackName(e.target.value)}
                placeholder="Nhap_Ten_Bai_Hat"
                className="flex-1 bg-transparent text-slate-100 focus:outline-none font-mono"
              />
              <span className="font-mono text-slate-500 text-xs">.wav</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeBeat}
                onChange={(e) => setIncludeBeat(e.target.checked)}
                className="w-4 h-4 rounded accent-sky-500"
              />
              <span className="text-slate-200 font-medium">
                Xuất kèm Nhạc Nền Beat (Master Song Mix)
              </span>
            </label>
            <p className="text-[11px] text-slate-400 pl-6">
              Bỏ chọn nếu bạn chỉ muốn xuất riêng file giọng hát sạch đã qua xử lý (Vocal Stem).
            </p>
          </div>

          <div className="p-3 bg-sky-950/20 border border-sky-800/40 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-sky-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Định Dạng Tiêu Chuẩn Phòng Thu Quốc Tế:</span>
            </div>
            <p className="text-[11px] text-slate-400">
              16-bit PCM Linear WAV, 44.1kHz Stereo không nén, tương thích với mọi nền tảng phát nhạc và phần mềm dựng video.
            </p>
          </div>

          {/* Progress bar if rendering */}
          {isExporting && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs text-sky-400 font-mono">
                <span>Đang render âm thanh bằng DSP engine...</span>
                <span>{exportProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-purple-500 transition-all duration-150"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleExportClick}
            disabled={isExporting}
            className="w-full py-3 px-4 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/20"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang Xuất File Âm Thanh...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Tải Bản Master WAV Về Máy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
