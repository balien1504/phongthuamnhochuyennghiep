import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AudioEngine } from './services/audioEngine';
import { DEFAULT_SETTINGS, VOCAL_PRESETS } from './services/presets';
import { BUILT_IN_BEATS, generateProceduralBeat, BeatPreset } from './services/synthBeats';
import { generateDemoVocal } from './services/demoVocals';
import { StudioSettings, VocalPreset, AIVocalAnalysis, MusicalScale } from './types/audio';

import { Header } from './components/Header';
import { Visualizer } from './components/Visualizer';
import { TransportBar } from './components/TransportBar';
import { PresetBar } from './components/PresetBar';
import { AudioRack } from './components/AudioRack';
import { BackingTrackPanel } from './components/BackingTrackPanel';
import { AIVocalCoach } from './components/AIVocalCoach';
import { ExportModal } from './components/ExportModal';

export default function App() {
  // Audio Engine instance ref
  const engineRef = useRef<AudioEngine | null>(null);

  // Studio Settings state
  const [settings, setSettings] = useState<StudioSettings>(DEFAULT_SETTINGS);
  const [activePresetId, setActivePresetId] = useState<string>('pop-star');

  // Playback & Recording state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [hasVocal, setHasVocal] = useState<boolean>(false);
  const [hasBeat, setHasBeat] = useState<boolean>(false);

  // Pitch Detector HUD state
  const [pitchData, setPitchData] = useState({
    detectedNote: '--',
    targetNote: '--',
    cents: 0,
    freq: 0,
  });

  // Backing beat state
  const [currentBeatId, setCurrentBeatId] = useState<string | null>('pop-ballad');
  const [isBeatMuted, setIsBeatMuted] = useState<boolean>(false);

  // Modals state
  const [isCoachOpen, setIsCoachOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);

  // AI Vocal Coach state
  const [analysis, setAnalysis] = useState<AIVocalAnalysis | null>(null);
  const [isLoadingCoach, setIsLoadingCoach] = useState<boolean>(false);
  const [isLoadingCustomAI, setIsLoadingCustomAI] = useState<boolean>(false);

  // Notification Banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 4000);
  };

  // Initialize AudioEngine on first user interaction or mount
  const getOrCreateEngine = useCallback(() => {
    if (!engineRef.current) {
      const engine = new AudioEngine(settings);

      engine.onPlaybackEnd = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      engine.onRecordingComplete = (buffer) => {
        setHasVocal(true);
        setDuration(engine.getDuration());
        showToast('Đã thu âm xong giọng hát! Hãy bấm Phát để nghe hiệu ứng.');
      };

      engine.onPitchUpdate = (info) => {
        setPitchData(info);
      };

      engineRef.current = engine;
    }
    return engineRef.current;
  }, [settings]);

  // Setup default backing beat on start
  useEffect(() => {
    const initBeat = async () => {
      const engine = getOrCreateEngine();
      await engine.init();
      // Generate default Pop Ballad beat
      const audioCtx = (engine as any).ctx;
      if (audioCtx) {
        const beatBuf = generateProceduralBeat(audioCtx, 'pop-ballad', 32);
        engine.setBeatBuffer(beatBuf);
        setHasBeat(true);
        setDuration(engine.getDuration());
      }
    };

    // Auto-init beat on load or first click
    const handleFirstGesture = () => {
      initBeat();
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
    window.addEventListener('click', handleFirstGesture);
    window.addEventListener('keydown', handleFirstGesture);

    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, [getOrCreateEngine]);

  // Time tracker animation frame loop
  useEffect(() => {
    let animId: number;
    const updateProgress = () => {
      if (engineRef.current) {
        setCurrentTime(engineRef.current.getCurrentTime());
        setIsPlaying(engineRef.current.getIsPlaying());
        setIsRecording(engineRef.current.getIsRecording());
      }
      animId = requestAnimationFrame(updateProgress);
    };
    animId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Update DSP engine whenever settings change
  const handleUpdateSettings = (newSettings: Partial<StudioSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (engineRef.current) {
        engineRef.current.applySettings(updated);
      }
      return updated;
    });
  };

  // Preset Selection
  const handleSelectPreset = (preset: VocalPreset) => {
    setActivePresetId(preset.id);
    handleUpdateSettings(preset.settings);
    showToast(`Đã nạp preset: ${preset.vietnameseName}`);
  };

  // Playback Controls
  const handlePlay = async () => {
    const engine = getOrCreateEngine();
    await engine.play();
    setIsPlaying(true);
  };

  const handlePause = () => {
    if (engineRef.current) {
      engineRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (engineRef.current) {
      engineRef.current.stop();
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleSeek = (timeSecs: number) => {
    if (engineRef.current) {
      engineRef.current.seek(timeSecs);
      setCurrentTime(timeSecs);
    }
  };

  // Recording Controls
  const handleStartRecord = async () => {
    try {
      const engine = getOrCreateEngine();
      await engine.startRecording();
      setIsRecording(true);
      showToast('Đang thu âm qua Micro! Hãy hát theo nhạc nền...');
    } catch (err) {
      console.error(err);
      showToast('Không thể truy cập Micro. Hãy cấp quyền microphone trong trình duyệt.');
    }
  };

  const handleStopRecord = () => {
    if (engineRef.current) {
      engineRef.current.stopRecording();
      setIsRecording(false);
    }
  };

  // Headphone Monitor
  const handleToggleMonitor = async () => {
    const engine = getOrCreateEngine();
    const nextVal = !settings.monitorMic;
    handleUpdateSettings({ monitorMic: nextVal });

    if (nextVal) {
      try {
        await engine.startMicMonitoring();
        showToast('Đã bật kiểm âm tai nghe. Khuyến nghị đeo tai nghe để tránh hú tiếng!');
      } catch (e) {
        showToast('Vui lòng cho phép quyền microphone.');
      }
    } else {
      engine.stopMicMonitoring();
      showToast('Đã tắt kiểm âm trực tiếp.');
    }
  };

  // Upload Vocal File
  const handleUploadVocal = async (file: File) => {
    try {
      const engine = getOrCreateEngine();
      const buffer = await engine.decodeAudioFile(file);
      engine.setVocalBuffer(buffer);
      setHasVocal(true);
      setDuration(engine.getDuration());
      showToast(`Đã tải file giọng: ${file.name}`);
    } catch (e) {
      console.error(e);
      showToast('Không thể đọc file âm thanh. Vui lòng thử định dạng MP3 hoặc WAV.');
    }
  };

  // Load Demo Audition Vocal
  const handleLoadDemoVocal = async () => {
    const engine = getOrCreateEngine();
    await engine.init();
    const audioCtx = (engine as any).ctx;
    if (audioCtx) {
      const demoBuf = generateDemoVocal(audioCtx, 10);
      engine.setVocalBuffer(demoBuf);
      setHasVocal(true);
      setDuration(engine.getDuration());
      showToast('Đã nạp mẫu giọng ca sĩ thử nghiệm. Hãy bấm Phát để nghe thử bộ lọc & Auto-Tune!');
      handlePlay();
    }
  };

  // Backing Beats Handling
  const handleSelectBeat = async (beat: BeatPreset) => {
    setCurrentBeatId(beat.id);
    const engine = getOrCreateEngine();
    await engine.init();
    const audioCtx = (engine as any).ctx;
    if (audioCtx) {
      const beatBuf = generateProceduralBeat(audioCtx, beat.id, 28);
      engine.setBeatBuffer(beatBuf);
      setHasBeat(true);
      setDuration(engine.getDuration());
      // Snap Auto-Tune to beat's key
      handleUpdateSettings({ scale: beat.key });
      showToast(`Đã chọn nhạc nền: ${beat.vietnameseTitle} (Tone: ${beat.key})`);
    }
  };

  const handleUploadBeat = async (file: File) => {
    try {
      const engine = getOrCreateEngine();
      const buffer = await engine.decodeAudioFile(file);
      engine.setBeatBuffer(buffer);
      setHasBeat(true);
      setCurrentBeatId(null);
      setDuration(engine.getDuration());
      showToast(`Đã tải nhạc nền của bạn: ${file.name}`);
    } catch (e) {
      console.error(e);
      showToast('Lỗi đọc file beat. Hãy thử tệp MP3 hoặc WAV.');
    }
  };

  const handleToggleBeatMute = () => {
    const newMuted = !isBeatMuted;
    setIsBeatMuted(newMuted);
    handleUpdateSettings({ beatVolume: newMuted ? 0 : 0.75 });
  };

  // AI Master Preset Customizer
  const handleApplyCustomAIPreset = async (prompt: string) => {
    setIsLoadingCustomAI(true);
    try {
      const res = await fetch('/api/ai-preset-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data?.settings) {
        handleUpdateSettings(data.settings);
        showToast(`AI đã áp dụng phong cách: ${data.name || prompt}`);
      }
    } catch (err) {
      console.error('Custom AI preset error:', err);
      showToast('Lỗi khi kết nối AI Master. Vui lòng thử lại.');
    } finally {
      setIsLoadingCustomAI(false);
    }
  };

  // AI Vocal Coach Analysis
  const handleRunCoachAnalysis = async (genre: string, lyrics: string) => {
    setIsLoadingCoach(true);
    try {
      const res = await fetch('/api/vocal-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genre,
          vocalKey: settings.scale,
          lyrics,
          presetName: activePresetId,
          audioMetrics: {
            pitchStability: pitchData.cents < 10 ? '92% (High)' : '75% (Moderate)',
            dynamicRange: 'Wide Studio Vocal',
            spectralBalance: 'Rich Air & Mid-Presence',
          },
        }),
      });
      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      console.error('Vocal coach error:', err);
      showToast('Lỗi khi phân tích giọng hát. Vui lòng thử lại.');
    } finally {
      setIsLoadingCoach(false);
    }
  };

  const handleApplyRecommendedSettings = (rec: AIVocalAnalysis['recommendedSettings']) => {
    handleUpdateSettings({
      pitchCorrectionSpeed: rec.pitchSpeed ?? 25,
      noiseGateThreshold: rec.noiseGateThreshold ?? -45,
      lowCutFrequency: rec.eqLowCut ?? 90,
      eqWarmth: rec.eqWarmth ?? 2.0,
      eqAirSparkle: rec.eqAir ?? 4.0,
      deEsserAmount: rec.deEsser ?? 45,
      compressorRatio: rec.compressorRatio ?? 3.8,
      reverbDecay: rec.reverbDecay ?? 2.2,
      reverbWet: rec.reverbWet ?? 26,
      delayWet: rec.delayWet ?? 18,
      saturationDrive: rec.saturation ?? 20,
    });
    showToast('Đã áp dụng toàn bộ thông số đề xuất từ Bác Sĩ Giọng Hát AI!');
  };

  // Reset to default
  const handleResetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    setActivePresetId('pop-star');
    if (engineRef.current) {
      engineRef.current.applySettings(DEFAULT_SETTINGS);
    }
    showToast('Đã đặt lại thông số dàn máy về mặc định.');
  };

  // Export Master WAV
  const handleExportWAV = async (filename: string, includeBeat: boolean) => {
    if (!engineRef.current) return;
    setIsExporting(true);
    setExportProgress(10);

    try {
      // Temporarily store beat volume if excluded
      const originalBeatVol = settings.beatVolume;
      if (!includeBeat) {
        engineRef.current.applySettings({ ...settings, beatVolume: 0 });
      }

      setExportProgress(30);
      const wavBlob = await engineRef.current.exportMasterWAV((pct) => {
        setExportProgress(pct);
      });

      // Restore beat volume
      if (!includeBeat) {
        engineRef.current.applySettings({ ...settings, beatVolume: originalBeatVol });
      }

      // Trigger download
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename.replace(/\.wav$/i, '')}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('Đã xuất và tải về bản Master WAV thành công!');
      setIsExportOpen(false);
    } catch (e: any) {
      console.error('Export error:', e);
      showToast(`Lỗi xuất âm thanh: ${e.message || 'Chưa có dữ liệu âm thanh'}`);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border border-sky-500/50 text-sky-200 text-xs px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top duration-200">
          {toastMessage}
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-5 flex-1">
        {/* Header */}
        <Header
          onOpenCoach={() => setIsCoachOpen(true)}
          onOpenExport={() => setIsExportOpen(true)}
          onReset={handleResetSettings}
          hasAudio={hasVocal || hasBeat}
        />

        {/* Visualizer & Oscilloscope */}
        <Visualizer
          analyser={engineRef.current?.getMasterAnalyser() || null}
          isPlaying={isPlaying}
          isRecording={isRecording}
          detectedNote={pitchData.detectedNote}
          targetNote={pitchData.targetNote}
          cents={pitchData.cents}
          freq={pitchData.freq}
        />

        {/* Transport Bar */}
        <TransportBar
          isPlaying={isPlaying}
          isRecording={isRecording}
          currentTime={currentTime}
          duration={duration}
          masterVolume={settings.masterVolume}
          vocalVolume={settings.vocalVolume}
          monitorMic={settings.monitorMic}
          hasVocal={hasVocal}
          hasBeat={hasBeat}
          onPlay={handlePlay}
          onPause={handlePause}
          onStop={handleStop}
          onSeek={handleSeek}
          onStartRecord={handleStartRecord}
          onStopRecord={handleStopRecord}
          onUploadFile={handleUploadVocal}
          onLoadDemoVocal={handleLoadDemoVocal}
          onToggleMonitor={handleToggleMonitor}
          onChangeMasterVolume={(vol) => handleUpdateSettings({ masterVolume: vol })}
          onChangeVocalVolume={(vol) => handleUpdateSettings({ vocalVolume: vol })}
        />

        {/* Singer Vocal Presets */}
        <PresetBar
          presets={VOCAL_PRESETS}
          activePresetId={activePresetId}
          onSelectPreset={handleSelectPreset}
          onApplyCustomAIPreset={handleApplyCustomAIPreset}
          isLoadingAI={isLoadingCustomAI}
        />

        {/* Studio Audio DSP Rack */}
        <AudioRack
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
        />

        {/* Backing Beat Karaoke Accompaniment */}
        <BackingTrackPanel
          currentBeatId={currentBeatId}
          beatVolume={settings.beatVolume}
          isBeatMuted={isBeatMuted}
          onSelectBeat={handleSelectBeat}
          onUploadBeat={handleUploadBeat}
          onChangeBeatVolume={(vol) => handleUpdateSettings({ beatVolume: vol })}
          onToggleBeatMute={handleToggleBeatMute}
          onSyncScaleToBeat={(scale) => handleUpdateSettings({ scale })}
        />
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 py-3 text-center text-xs text-slate-500">
        <p>VocalStudio AI · Phòng thu âm giọng hát chuyên nghiệp · 48kHz 32-bit DSP Architecture</p>
      </footer>

      {/* Modals */}
      <AIVocalCoach
        isOpen={isCoachOpen}
        onClose={() => setIsCoachOpen(false)}
        analysis={analysis}
        isLoading={isLoadingCoach}
        onAnalyze={handleRunCoachAnalysis}
        onApplyRecommendedSettings={handleApplyRecommendedSettings}
        currentGenre="Pop Ballad"
        currentKey={settings.scale}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onExport={handleExportWAV}
        isExporting={isExporting}
        exportProgress={exportProgress}
      />
    </div>
  );
}
