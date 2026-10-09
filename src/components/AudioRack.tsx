import React from 'react';
import { StudioSettings, MusicalScale } from '../types/audio';
import { 
  ShieldCheck, Disc3, Sliders, Activity, Flame, Waves, 
  Power, VolumeX, Sparkles, HelpCircle 
} from 'lucide-react';

interface AudioRackProps {
  settings: StudioSettings;
  onUpdateSettings: (newSettings: Partial<StudioSettings>) => void;
}

const MUSICAL_SCALES: MusicalScale[] = [
  'C Major', 'G Major', 'D Major', 'A Major', 'E Major', 'F Major',
  'A Minor', 'E Minor', 'B Minor', 'D Minor', 'G Minor', 'C Minor',
  'Chromatic', 'Pentatonic C'
];

export const AudioRack: React.FC<AudioRackProps> = ({
  settings,
  onUpdateSettings,
}) => {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-bold tracking-wider uppercase text-slate-200">
            Dàn Thiết Bị Xử Lý Âm Thanh Phòng Thu (Studio DSP Rack)
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
          REAL-TIME 48KHZ / 32-BIT FLOATING POINT DSP
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* MODULE 1: NOISE GATE & LỌC TẠP ÂM */}
        <div className={`p-4 rounded-2xl border transition-all ${
          settings.noiseGateEnabled 
            ? 'bg-slate-900/80 border-emerald-500/30 shadow-lg shadow-emerald-950/20' 
            : 'bg-slate-900/40 border-slate-800 opacity-60'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-200">Lọc Tạp Âm & Khử Nhiễu</h3>
                <p className="text-[10px] text-slate-400">Noise Gate & Cắt Tiếng Ù Nền</p>
              </div>
            </div>

            <button
              onClick={() => onUpdateSettings({ noiseGateEnabled: !settings.noiseGateEnabled })}
              className={`p-1.5 rounded-lg border transition-colors ${
                settings.noiseGateEnabled
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Bật/Tắt Lọc Tạp Âm"
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {/* Gate Threshold */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="text-slate-400">Ngưỡng Chặn Tạp Âm (Threshold):</span>
                <span className="font-mono text-emerald-400 font-semibold">{settings.noiseGateThreshold} dB</span>
              </div>
              <input
                type="range"
                min={-60}
                max={-15}
                step={1}
                value={settings.noiseGateThreshold}
                onChange={(e) => onUpdateSettings({ noiseGateThreshold: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-emerald-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">Tự động ngắt tiếng gió, quạt máy khi ngừng hát</span>
            </div>

            {/* Low-Cut Filter */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="text-slate-400">Cắt Âm Trầm Ù Rung (Low-Cut HPF):</span>
                <span className="font-mono text-emerald-400 font-semibold">{settings.lowCutFrequency} Hz</span>
              </div>
              <input
                type="range"
                min={40}
                max={160}
                step={5}
                value={settings.lowCutFrequency}
                onChange={(e) => onUpdateSettings({ lowCutFrequency: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-emerald-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">Triệt tiêu tiếng hơi thở mạnh & rung chân mic</span>
            </div>
          </div>
        </div>

        {/* MODULE 2: AUTO-TUNE & CHỈNH NỐT CA SĨ */}
        <div className={`p-4 rounded-2xl border transition-all ${
          settings.autoTuneEnabled 
            ? 'bg-slate-900/80 border-sky-500/30 shadow-lg shadow-sky-950/20' 
            : 'bg-slate-900/40 border-slate-800 opacity-60'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Disc3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-200">Auto-Tune & Chỉnh Cao Độ</h3>
                <p className="text-[10px] text-slate-400">Hát Chuẩn Tone Như Ca Sĩ</p>
              </div>
            </div>

            <button
              onClick={() => onUpdateSettings({ autoTuneEnabled: !settings.autoTuneEnabled })}
              className={`p-1.5 rounded-lg border transition-colors ${
                settings.autoTuneEnabled
                  ? 'bg-sky-500 text-slate-950 border-sky-400'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Bật/Tắt Auto-Tune"
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {/* Musical Scale */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="text-slate-400">Tone / Điệu Tính Bài Hát (Key):</span>
                <span className="font-mono text-sky-400 font-semibold">{settings.scale}</span>
              </div>
              <select
                value={settings.scale}
                onChange={(e) => onUpdateSettings({ scale: e.target.value as MusicalScale })}
                className="w-full bg-slate-950/90 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-sky-300 focus:outline-none focus:border-sky-400 cursor-pointer"
              >
                {MUSICAL_SCALES.map((scale) => (
                  <option key={scale} value={scale} className="bg-slate-900 text-slate-200">
                    {scale}
                  </option>
                ))}
              </select>
            </div>

            {/* Pitch Correction Speed */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="text-slate-400">Tốc Độ Bắt Nốt (Correction Speed):</span>
                <span className="font-mono text-sky-400 font-semibold">
                  {settings.pitchCorrectionSpeed === 0 ? 'Robot Hard-Snap' : `${settings.pitchCorrectionSpeed} ms`}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={70}
                step={2}
                value={settings.pitchCorrectionSpeed}
                onChange={(e) => onUpdateSettings({ pitchCorrectionSpeed: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-sky-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                <span>0ms (T-Pain/Trap)</span>
                <span>30ms (Pop Star)</span>
                <span>70ms (Tự nhiên)</span>
              </div>
            </div>

            {/* Pitch Shift Semitone */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="text-slate-400">Tăng/Giảm Tone (Pitch Shift):</span>
                <span className="font-mono text-sky-400 font-semibold">
                  {settings.pitchShiftSemitones > 0 ? `+${settings.pitchShiftSemitones}` : settings.pitchShiftSemitones} bán âm
                </span>
              </div>
              <input
                type="range"
                min={-12}
                max={12}
                step={1}
                value={settings.pitchShiftSemitones}
                onChange={(e) => onUpdateSettings({ pitchShiftSemitones: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-sky-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* MODULE 3: 4-BAND STUDIO PARAMETRIC EQ */}
        <div className={`p-4 rounded-2xl border transition-all ${
          settings.eqEnabled 
            ? 'bg-slate-900/80 border-amber-500/30 shadow-lg shadow-amber-950/20' 
            : 'bg-slate-900/40 border-slate-800 opacity-60'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-200">4-Band Studio Parametric EQ</h3>
                <p className="text-[10px] text-slate-400">Màu Sắc & Độ Sáng Của Giọng</p>
              </div>
            </div>

            <button
              onClick={() => onUpdateSettings({ eqEnabled: !settings.eqEnabled })}
              className={`p-1.5 rounded-lg border transition-colors ${
                settings.eqEnabled
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Bật/Tắt EQ"
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {/* Low Warmth */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="text-slate-400">Độ Ấm Trầm (Warmth 250Hz):</span>
                <span className="font-mono text-amber-400 font-semibold">{settings.eqWarmth > 0 ? `+${settings.eqWarmth}` : settings.eqWarmth} dB</span>
              </div>
              <input
                type="range"
                min={-6}
                max={6}
                step={0.5}
                value={settings.eqWarmth}
                onChange={(e) => onUpdateSettings({ eqWarmth: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-amber-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">Tạo cảm giác giọng dày dặn, đầm ấm</span>
            </div>

            {/* Mid Presence */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="text-slate-400">Độ Nổi Bật Lời Ca (Presence 3kHz):</span>
                <span className="font-mono text-amber-400 font-semibold">{settings.eqMidPresence > 0 ? `+${settings.eqMidPresence}` : settings.eqMidPresence} dB</span>
              </div>
              <input
                type="range"
                min={-6}
                max={6}
                step={0.5}
                value={settings.eqMidPresence}
                onChange={(e) => onUpdateSettings({ eqMidPresence: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-amber-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">Giúp lời ca đứng trước bản phối, rõ từng chữ</span>
            </div>

            {/* Air & Sheen */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="text-slate-400">Độ Tinh Khiết / Hơi Thở (Air 10kHz):</span>
                <span className="font-mono text-amber-400 font-semibold">{settings.eqAirSparkle > 0 ? `+${settings.eqAirSparkle}` : settings.eqAirSparkle} dB</span>
              </div>
              <input
                type="range"
                min={-4}
                max={8}
                step={0.5}
                value={settings.eqAirSparkle}
                onChange={(e) => onUpdateSettings({ eqAirSparkle: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-amber-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">Tạo chất bóng bẩy, sang trọng như đĩa CD</span>
            </div>
          </div>
        </div>

        {/* MODULE 4: OPTICAL COMPRESSOR & DE-ESSER */}
        <div className={`p-4 rounded-2xl border transition-all ${
          settings.compressorEnabled 
            ? 'bg-slate-900/80 border-purple-500/30 shadow-lg shadow-purple-950/20' 
            : 'bg-slate-900/40 border-slate-800 opacity-60'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-200">Compressor & Cắt Âm Xì</h3>
                <p className="text-[10px] text-slate-400">Kiểm Soát Độ Động & De-Esser</p>
              </div>
            </div>

            <button
              onClick={() => onUpdateSettings({ compressorEnabled: !settings.compressorEnabled })}
              className={`p-1.5 rounded-lg border transition-colors ${
                settings.compressorEnabled
                  ? 'bg-purple-500 text-slate-950 border-purple-400'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Bật/Tắt Compressor"
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {/* Threshold */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="text-slate-400">Ngưỡng Nén (Threshold):</span>
                <span className="font-mono text-purple-400 font-semibold">{settings.compressorThreshold} dB</span>
              </div>
              <input
                type="range"
                min={-40}
                max={-10}
                step={1}
                value={settings.compressorThreshold}
                onChange={(e) => onUpdateSettings({ compressorThreshold: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-purple-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">Giúp âm lượng hát to/nhỏ đều đặn và mượt mà</span>
            </div>

            {/* Ratio */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="text-slate-400">Tỷ Lệ Nén (Ratio):</span>
                <span className="font-mono text-purple-400 font-semibold">{settings.compressorRatio}:1</span>
              </div>
              <input
                type="range"
                min={1.5}
                max={8}
                step={0.5}
                value={settings.compressorRatio}
                onChange={(e) => onUpdateSettings({ compressorRatio: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-purple-400 cursor-pointer"
              />
            </div>

            {/* De-Esser */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="text-slate-400">Cắt Âm Xì Chói Tai (De-Esser):</span>
                <span className="font-mono text-purple-400 font-semibold">{settings.deEsserAmount}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={settings.deEsserAmount}
                onChange={(e) => onUpdateSettings({ deEsserAmount: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-purple-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">Khử tiếng chói gắt của âm &quot;s&quot;, &quot;x&quot;, &quot;ch&quot;</span>
            </div>
          </div>
        </div>

        {/* MODULE 5: TUBE SATURATION & VOCAL DOUBLER */}
        <div className={`p-4 rounded-2xl border transition-all ${
          settings.saturationEnabled 
            ? 'bg-slate-900/80 border-rose-500/30 shadow-lg shadow-rose-950/20' 
            : 'bg-slate-900/40 border-slate-800 opacity-60'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-200">Độ Ấm Đèn & Giọng Bè</h3>
                <p className="text-[10px] text-slate-400">Analog Tube & Vocal Doubler</p>
              </div>
            </div>

            <button
              onClick={() => onUpdateSettings({ saturationEnabled: !settings.saturationEnabled })}
              className={`p-1.5 rounded-lg border transition-colors ${
                settings.saturationEnabled
                  ? 'bg-rose-500 text-slate-950 border-rose-400'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Bật/Tắt Saturation"
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {/* Tube Saturation Drive */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="text-slate-400">Bão Hòa Đèn Điện Tử (Tube Drive):</span>
                <span className="font-mono text-rose-400 font-semibold">{settings.saturationDrive}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={70}
                step={2}
                value={settings.saturationDrive}
                onChange={(e) => onUpdateSettings({ saturationDrive: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-rose-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">Tạo sóng hài ấm nồng như thu qua preamp đèn cổ điển</span>
            </div>

            {/* Vocal Doubler */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="text-slate-400">Làm Dày Giọng / Giọng Bè Đôi (Doubler):</span>
                <span className="font-mono text-rose-400 font-semibold">{settings.doublerMix}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                step={5}
                value={settings.doublerMix}
                onChange={(e) => onUpdateSettings({ 
                  doublerMix: parseInt(e.target.value),
                  doublerEnabled: parseInt(e.target.value) > 0 
                })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-rose-400 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">Nhân đôi giọng stereo hai bên tai cực dày dặn</span>
            </div>
          </div>
        </div>

        {/* MODULE 6: STUDIO REVERB & STEREO ECHO */}
        <div className={`p-4 rounded-2xl border transition-all ${
          settings.reverbEnabled 
            ? 'bg-slate-900/80 border-cyan-500/30 shadow-lg shadow-cyan-950/20' 
            : 'bg-slate-900/40 border-slate-800 opacity-60'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Waves className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-200">Không Gian & Âm Vang (Space)</h3>
                <p className="text-[10px] text-slate-400">Studio Reverb & Stereo Tape Delay</p>
              </div>
            </div>

            <button
              onClick={() => onUpdateSettings({ reverbEnabled: !settings.reverbEnabled })}
              className={`p-1.5 rounded-lg border transition-colors ${
                settings.reverbEnabled
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Bật/Tắt Reverb"
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {/* Reverb Type */}
            <div className="flex gap-2 items-center">
              <span className="text-slate-400 whitespace-nowrap">Không Gian:</span>
              <div className="flex-1 grid grid-cols-4 gap-1">
                {(['Plate', 'Chamber', 'Room', 'Cathedral'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => onUpdateSettings({ reverbType: type })}
                    className={`py-1 text-[11px] font-medium rounded-md border transition-all ${
                      settings.reverbType === type
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Reverb Wet Mix */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="text-slate-400">Độ Vang Reverb (Wet Mix):</span>
                <span className="font-mono text-cyan-400 font-semibold">{settings.reverbWet}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={70}
                step={2}
                value={settings.reverbWet}
                onChange={(e) => onUpdateSettings({ reverbWet: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Stereo Delay Wet Mix */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span className="text-slate-400">Tiếng Nhại Stereo Delay (Echo):</span>
                <span className="font-mono text-cyan-400 font-semibold">{settings.delayWet}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={60}
                step={2}
                value={settings.delayWet}
                onChange={(e) => onUpdateSettings({ 
                  delayWet: parseInt(e.target.value),
                  delayEnabled: parseInt(e.target.value) > 0 
                })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
