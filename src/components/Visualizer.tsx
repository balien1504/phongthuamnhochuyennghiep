import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  isRecording: boolean;
  detectedNote: string;
  targetNote: string;
  cents: number;
  freq: number;
}

export const Visualizer: React.FC<VisualizerProps> = ({
  analyser,
  isPlaying,
  isRecording,
  detectedNote,
  targetNote,
  cents,
  freq,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      animId = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;

      // Dark studio background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#0a0d14');
      bgGrad.addColorStop(1, '#05070a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle studio grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (!analyser || (!isPlaying && !isRecording)) {
        // Idle ambient line with soft breathing wave
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const t = performance.now() * 0.002;
        for (let x = 0; x < width; x++) {
          const y = height / 2 + Math.sin(x * 0.02 + t) * 4;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const timeData = new Float32Array(bufferLength);
      const freqData = new Uint8Array(bufferLength);
      analyser.getFloatTimeDomainData(timeData);
      analyser.getByteFrequencyData(freqData);

      // 1. Draw Spectrum Frequency Bars (Lower Half Background)
      const barCount = 48;
      const barWidth = (width / barCount) - 2;
      for (let i = 0; i < barCount; i++) {
        const dataIdx = Math.floor(Math.pow(i / barCount, 1.8) * (bufferLength / 2));
        const val = freqData[dataIdx] || 0;
        const barHeight = (val / 255) * (height * 0.65);
        const x = i * (barWidth + 2);
        const y = height - barHeight;

        const barGrad = ctx.createLinearGradient(0, y, 0, height);
        barGrad.addColorStop(0, 'rgba(56, 189, 248, 0.65)'); // cyan
        barGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.45)'); // purple
        barGrad.addColorStop(1, 'rgba(30, 41, 59, 0.1)');
        ctx.fillStyle = barGrad;
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      // 2. Draw Glow Waveform Oscilloscope (Center)
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#0284c7';
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = timeData[i];
        const y = (v * (height * 0.45)) + (height / 2);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      ctx.stroke();
      ctx.shadowBlur = 0; // reset
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [analyser, isPlaying, isRecording]);

  // Pitch offset calculation for needle display
  const clampCents = Math.max(-50, Math.min(50, cents));
  const needlePercent = ((clampCents + 50) / 100) * 100;
  const isTunedIn = Math.abs(cents) <= 8 && detectedNote !== '--';

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-[#07090e] shadow-2xl">
      {/* Canvas Header / Info Bar */}
      <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between text-xs pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-700/60 backdrop-blur-md">
            <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span className="font-mono text-slate-300 font-medium">
              {isRecording ? 'REC LIVE' : isPlaying ? 'MASTER OUT' : 'READY'}
            </span>
          </div>
          {freq > 0 && (
            <span className="font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded-md border border-slate-800 backdrop-blur-md">
              {Math.round(freq)} Hz
            </span>
          )}
        </div>

        {/* Real-time Pitch Detector & Auto-Tune Snapper HUD */}
        <div className="flex items-center gap-3 bg-slate-950/85 border border-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-lg">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400">Giọng hát:</span>
            <span className="font-mono font-bold text-sky-400 text-sm">
              {detectedNote}
            </span>
          </div>

          <div className="h-3 w-px bg-slate-800" />

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400">Chuẩn nốt ca sĩ:</span>
            <span className={`font-mono font-bold text-sm ${isTunedIn ? 'text-emerald-400' : 'text-amber-400'}`}>
              {targetNote}
            </span>
          </div>

          {/* Micro Cent Tuner Gauge */}
          <div className="w-16 h-1.5 bg-slate-800 rounded-full relative overflow-hidden hidden sm:block">
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-500 -translate-x-1/2" />
            <div
              className={`absolute top-0 bottom-0 w-1.5 rounded-full transition-all duration-75 ${
                isTunedIn ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
              style={{ left: `calc(${needlePercent}% - 3px)` }}
            />
          </div>
        </div>
      </div>

      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        width={1000}
        height={190}
        className="w-full h-44 sm:h-48 block"
      />

      {/* Frequency Labels Scale at Bottom */}
      <div className="absolute bottom-1.5 left-4 right-4 flex justify-between text-[10px] font-mono text-slate-600 pointer-events-none select-none">
        <span>50Hz (Sub)</span>
        <span>250Hz (Warmth)</span>
        <span>1kHz (Body)</span>
        <span>3.5kHz (Presence)</span>
        <span>10kHz (Air & Sheen)</span>
      </div>
    </div>
  );
};
