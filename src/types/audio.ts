export type MusicalScale = 
  | 'C Major' | 'G Major' | 'D Major' | 'A Major' | 'E Major' | 'F Major' 
  | 'A Minor' | 'E Minor' | 'B Minor' | 'D Minor' | 'G Minor' | 'C Minor'
  | 'Chromatic' | 'Pentatonic C';

export interface StudioSettings {
  // Master
  masterVolume: number; // 0 to 1.5
  vocalVolume: number; // 0 to 1.5
  beatVolume: number; // 0 to 1.5
  monitorMic: boolean; // headphone monitoring

  // Noise Filter & Gate (Lọc tạp âm)
  noiseGateEnabled: boolean;
  noiseGateThreshold: number; // -60 to -15 dB
  lowCutFrequency: number; // 40 to 180 Hz (cuts rumble/air pops)
  noiseReductionLevel: number; // 0 to 100%

  // Auto-Tune & Pitch Correction (Chỉnh cao độ như ca sĩ)
  autoTuneEnabled: boolean;
  scale: MusicalScale;
  pitchCorrectionSpeed: number; // 0 (Hard snap robot) to 80 (Gentle natural)
  pitchShiftSemitones: number; // -12 to +12 semitones
  humanize: number; // 0 to 100%

  // Studio Dynamics (Nén & Cắt xì)
  compressorEnabled: boolean;
  compressorThreshold: number; // -45 to -5 dB
  compressorRatio: number; // 1.5 to 12
  compressorAttack: number; // 0.005 to 0.1 s
  compressorRelease: number; // 0.05 to 0.5 s
  deEsserEnabled: boolean;
  deEsserAmount: number; // 0 to 100%

  // 4-Band Studio EQ
  eqEnabled: boolean;
  eqWarmth: number; // -8 to +8 dB (low 250Hz)
  eqMidPresence: number; // -8 to +8 dB (3kHz vocal clarity)
  eqAirSparkle: number; // -6 to +10 dB (10kHz sheen)

  // Saturation & Doubler
  saturationEnabled: boolean;
  saturationDrive: number; // 0 to 100%
  doublerEnabled: boolean;
  doublerMix: number; // 0 to 100%

  // Studio Space (Reverb & Delay)
  reverbEnabled: boolean;
  reverbType: 'Plate' | 'Chamber' | 'Room' | 'Cathedral';
  reverbDecay: number; // 0.5 to 5.5 s
  reverbWet: number; // 0 to 80%
  reverbDampening: number; // 1000 to 12000 Hz

  delayEnabled: boolean;
  delayTime: number; // 80 to 750 ms
  delayFeedback: number; // 0 to 75%
  delayWet: number; // 0 to 60%
}

export interface VocalPreset {
  id: string;
  name: string;
  vietnameseName: string;
  tagline: string;
  icon: string;
  category: 'singer' | 'studio' | 'creative';
  settings: Partial<StudioSettings>;
}

export interface BackingBeat {
  id: string;
  title: string;
  genre: string;
  bpm: number;
  key: MusicalScale;
  description: string;
}

export interface AIVocalAnalysis {
  vocalAssessment: string;
  pitchGuidance: string;
  singLikeStarTips: string[];
  recommendedSettings: {
    autoTuneStrength: number;
    pitchSpeed: number;
    noiseGateThreshold: number;
    eqLowCut: number;
    eqWarmth: number;
    eqAir: number;
    deEsser: number;
    compressorRatio: number;
    reverbDecay: number;
    reverbWet: number;
    delayWet: number;
    saturation: number;
  };
  coachQuote: string;
}
