import React, { useState } from 'react';
import { AIVocalAnalysis, StudioSettings } from '../types/audio';
import { 
  Sparkles, Award, Lightbulb, CheckCircle2, Sliders, 
  X, Loader2, BookOpen, Quote, ChevronRight 
} from 'lucide-react';

interface AIVocalCoachProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: AIVocalAnalysis | null;
  isLoading: boolean;
  onAnalyze: (genre: string, lyrics: string) => Promise<void>;
  onApplyRecommendedSettings: (rec: AIVocalAnalysis['recommendedSettings']) => void;
  currentGenre: string;
  currentKey: string;
}

export const AIVocalCoach: React.FC<AIVocalCoachProps> = ({
  isOpen,
  onClose,
  analysis,
  isLoading,
  onAnalyze,
  onApplyRecommendedSettings,
  currentGenre,
  currentKey,
}) => {
  const [selectedGenre, setSelectedGenre] = useState(currentGenre || 'Pop Ballad');
  const [lyrics, setLyrics] = useState('');
  const [applied, setApplied] = useState(false);

  if (!isOpen) return null;

  const handleRunAnalysis = async () => {
    setApplied(false);
    await onAnalyze(selectedGenre, lyrics);
  };

  const handleApply = () => {
    if (analysis?.recommendedSettings) {
      onApplyRecommendedSettings(analysis.recommendedSettings);
      setApplied(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0c1017] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                AI Vocal Coach & Bác Sĩ Giọng Hát Phòng Thu
              </h2>
              <p className="text-xs text-slate-400">
                Phân tích chất giọng, hướng dẫn hát như ca sĩ chuyên nghiệp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Analysis Form Controls */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Thể Loại Bài Hát:</label>
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-400"
                >
                  <option value="Pop Ballad">V-Pop Ballad Trữ Tình</option>
                  <option value="R&B Soul">R&B / Soul Hiện Đại</option>
                  <option value="Trap HipHop">Rap Melody & Trap Auto-Tune</option>
                  <option value="Acoustic Folk">Acoustic Mộc Mạc & Trầm Ấm</option>
                  <option value="Rock Indie">Rock & Indie Năng Lượng</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Tone Bài Hát Đang Đặt:</label>
                <div className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg font-mono text-sky-400 font-semibold">
                  {currentKey}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                Lời Bài Hát (Để AI hướng dẫn cách nhả chữ & lấy hơi theo câu):
              </label>
              <textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                placeholder="Dán hoặc gõ lời bài hát vào đây..."
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-400 resize-none"
              />
            </div>

            <button
              onClick={handleRunAnalysis}
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-sky-600 hover:from-purple-500 hover:to-sky-500 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Chuyên Gia AI Đang Thẩm Âm & Đo Đạc Tần Số...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Phân Tích Giọng Hát & Nhận Đề Xuất Tinh Chỉnh</span>
                </>
              )}
            </button>
          </div>

          {/* Results Display */}
          {analysis && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Vocal Assessment */}
              <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-800/40">
                <div className="flex items-center gap-2 text-purple-300 font-bold mb-1.5">
                  <Award className="w-4 h-4 text-purple-400" />
                  <span>Đánh Giá Chất Giọng & Tiềm Năng Bản Thu:</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {analysis.vocalAssessment}
                </p>
              </div>

              {/* Pitch Guidance */}
              <div className="p-3.5 rounded-xl bg-sky-950/20 border border-sky-800/40">
                <div className="flex items-center gap-2 text-sky-300 font-bold mb-1.5">
                  <Lightbulb className="w-4 h-4 text-sky-400" />
                  <span>Kỹ Thuật Cột Hơi, Luyến Láy & Chuyển Giọng:</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {analysis.pitchGuidance}
                </p>
              </div>

              {/* Tips */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="font-bold text-amber-400 block">
                  3 Bí Quyết Hát Tròn Vành Rõ Chữ Như Ca Sĩ Chuyên Nghiệp:
                </span>
                <ul className="space-y-2">
                  {analysis.singLikeStarTips?.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Coach Quote */}
              {analysis.coachQuote && (
                <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/60 italic text-slate-400 flex items-center gap-2">
                  <Quote className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>&quot;{analysis.coachQuote}&quot;</span>
                </div>
              )}

              {/* Apply Recommended DSP Settings Button */}
              {analysis.recommendedSettings && (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/30 to-sky-950/30 border border-emerald-500/30 flex items-center justify-between gap-4">
                  <div>
                    <span className="font-bold text-emerald-300 block">
                      Thông Số Dàn Rack Được AI Tinh Chỉnh Riêng:
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Tự động tối ưu Auto-Tune ({analysis.recommendedSettings.autoTuneStrength}%), Reverb, EQ, De-Esser và Nén.
                    </span>
                  </div>

                  <button
                    onClick={handleApply}
                    disabled={applied}
                    className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-all flex-shrink-0 ${
                      applied
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                    }`}
                  >
                    {applied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Đã Áp Dụng</span>
                      </>
                    ) : (
                      <>
                        <Sliders className="w-4 h-4" />
                        <span>Áp Dụng Cho Dàn Rack Ngay</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
