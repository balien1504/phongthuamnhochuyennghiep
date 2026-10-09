import { MusicalScale, StudioSettings } from '../types/audio';

// Scale intervals in semitones from C
const SCALE_SEMITONES: Record<MusicalScale, number[]> = {
  'C Major': [0, 2, 4, 5, 7, 9, 11],
  'G Major': [7, 9, 11, 0, 2, 4, 6],
  'D Major': [2, 4, 6, 7, 9, 11, 1],
  'A Major': [9, 11, 1, 2, 4, 6, 8],
  'E Major': [4, 6, 8, 9, 11, 1, 3],
  'F Major': [5, 7, 9, 10, 0, 2, 4],
  'A Minor': [9, 11, 0, 2, 4, 5, 7],
  'E Minor': [4, 6, 7, 9, 11, 0, 2],
  'B Minor': [11, 1, 2, 4, 6, 7, 9],
  'D Minor': [2, 4, 5, 7, 9, 10, 0],
  'G Minor': [7, 9, 10, 0, 2, 3, 5],
  'C Minor': [0, 2, 3, 5, 7, 8, 10],
  'Chromatic': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  'Pentatonic C': [0, 2, 4, 7, 9],
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private vocalBuffer: AudioBuffer | null = null;
  private beatBuffer: AudioBuffer | null = null;

  // Active playing sources
  private vocalSource: AudioBufferSourceNode | null = null;
  private beatSource: AudioBufferSourceNode | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;

  // Playback tracking
  private isPlaying: boolean = false;
  private isRecording: boolean = false;
  private startTime: number = 0;
  private pauseOffset: number = 0;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  // Audio Nodes Rack
  private inputGain: GainNode | null = null;
  private noiseGateGain: GainNode | null = null;
  private lowCutFilter: BiquadFilterNode | null = null;
  private deEsserFilter: BiquadFilterNode | null = null;
  private eqWarmthFilter: BiquadFilterNode | null = null;
  private eqMidFilter: BiquadFilterNode | null = null;
  private eqAirFilter: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private saturator: WaveShaperNode | null = null;
  private vocalGain: GainNode | null = null;
  private beatGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  // Spatial & Reverb Nodes
  private reverbConvolver: ConvolverNode | null = null;
  private reverbWetGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedbackGain: GainNode | null = null;
  private delayFilter: BiquadFilterNode | null = null;
  private delayWetGain: GainNode | null = null;
  private doublerDelay: DelayNode | null = null;
  private doublerGain: GainNode | null = null;

  // Visualizer / Analysers
  private vocalAnalyser: AnalyserNode | null = null;
  private masterAnalyser: AnalyserNode | null = null;

  // Real-time Pitch Detection
  private currentDetectedPitch: number = 0;
  private currentNoteName: string = '--';
  private targetNoteName: string = '--';
  private pitchCorrectionCents: number = 0;

  // Current settings cache
  public settings: StudioSettings;

  // Listeners
  public onPlaybackEnd?: () => void;
  public onRecordingComplete?: (buffer: AudioBuffer) => void;
  public onPitchUpdate?: (info: { detectedNote: string; targetNote: string; cents: number; freq: number }) => void;

  constructor(initialSettings: StudioSettings) {
    this.settings = { ...initialSettings };
  }

  public async init(): Promise<void> {
    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.buildGraph();
    this.applySettings(this.settings);
    this.startPitchDetectionLoop();
  }

  private buildGraph(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;

    // Create Nodes
    this.inputGain = ctx.createGain();
    this.noiseGateGain = ctx.createGain();

    // 1. Rumble / Low-cut filter (HPF)
    this.lowCutFilter = ctx.createBiquadFilter();
    this.lowCutFilter.type = 'highpass';
    this.lowCutFilter.frequency.value = this.settings.lowCutFrequency;

    // 2. De-Esser (Notch / Peaking cut at 6200Hz)
    this.deEsserFilter = ctx.createBiquadFilter();
    this.deEsserFilter.type = 'peaking';
    this.deEsserFilter.frequency.value = 6200;
    this.deEsserFilter.Q.value = 2.5;

    // 3. EQ: Warmth (Low shelf at 250Hz)
    this.eqWarmthFilter = ctx.createBiquadFilter();
    this.eqWarmthFilter.type = 'lowshelf';
    this.eqWarmthFilter.frequency.value = 250;

    // 4. EQ: Mid Presence (Peaking at 3000Hz)
    this.eqMidFilter = ctx.createBiquadFilter();
    this.eqMidFilter.type = 'peaking';
    this.eqMidFilter.frequency.value = 3000;
    this.eqMidFilter.Q.value = 1.2;

    // 5. EQ: Air & Sparkle (High shelf at 9500Hz)
    this.eqAirFilter = ctx.createBiquadFilter();
    this.eqAirFilter.type = 'highshelf';
    this.eqAirFilter.frequency.value = 9500;

    // 6. Studio Optical Compressor
    this.compressor = ctx.createDynamicsCompressor();

    // 7. Analog Tube Saturator
    this.saturator = ctx.createWaveShaper();
    this.updateSaturationCurve();

    // 8. Reverb (Convolver)
    this.reverbConvolver = ctx.createConvolver();
    this.generateReverbImpulse(this.settings.reverbType, this.settings.reverbDecay);
    this.reverbWetGain = ctx.createGain();

    // 9. Stereo Delay / Echo
    this.delayNode = ctx.createDelay(2.0);
    this.delayFeedbackGain = ctx.createGain();
    this.delayFilter = ctx.createBiquadFilter();
    this.delayFilter.type = 'lowpass';
    this.delayFilter.frequency.value = 3800; // Warm analog tape roll-off
    this.delayWetGain = ctx.createGain();

    // 10. Vocal Doubler (15ms Haas micro-delay)
    this.doublerDelay = ctx.createDelay(0.05);
    this.doublerDelay.delayTime.value = 0.016;
    this.doublerGain = ctx.createGain();

    // 11. Vocal & Beat Sub-mix Gains
    this.vocalGain = ctx.createGain();
    this.beatGain = ctx.createGain();
    this.masterGain = ctx.createGain();

    // 12. Analysers for UI waveform and meters
    this.vocalAnalyser = ctx.createAnalyser();
    this.vocalAnalyser.fftSize = 1024;
    this.vocalAnalyser.smoothingTimeConstant = 0.82;

    this.masterAnalyser = ctx.createAnalyser();
    this.masterAnalyser.fftSize = 2048;
    this.masterAnalyser.smoothingTimeConstant = 0.85;

    // Connect the Chain
    // inputGain -> noiseGateGain -> lowCutFilter -> deEsserFilter -> eqWarmthFilter -> eqMidFilter -> eqAirFilter -> compressor -> saturator
    this.inputGain.connect(this.noiseGateGain);
    this.noiseGateGain.connect(this.lowCutFilter);
    this.lowCutFilter.connect(this.deEsserFilter);
    this.deEsserFilter.connect(this.eqWarmthFilter);
    this.eqWarmthFilter.connect(this.eqMidFilter);
    this.eqMidFilter.connect(this.eqAirFilter);
    this.eqAirFilter.connect(this.compressor);
    this.compressor.connect(this.saturator);

    // From Saturator (Dry Processed Vocal):
    // 1. Direct to vocalGain
    this.saturator.connect(this.vocalGain);

    // 2. To Reverb
    this.saturator.connect(this.reverbConvolver);
    this.reverbConvolver.connect(this.reverbWetGain);
    this.reverbWetGain.connect(this.vocalGain);

    // 3. To Delay
    this.saturator.connect(this.delayNode);
    this.delayNode.connect(this.delayFilter);
    this.delayFilter.connect(this.delayFeedbackGain);
    this.delayFeedbackGain.connect(this.delayNode);
    this.delayFilter.connect(this.delayWetGain);
    this.delayWetGain.connect(this.vocalGain);

    // 4. To Doubler
    this.saturator.connect(this.doublerDelay);
    this.doublerDelay.connect(this.doublerGain);
    this.doublerGain.connect(this.vocalGain);

    // Connect vocalGain to vocalAnalyser and masterGain
    this.vocalGain.connect(this.vocalAnalyser);
    this.vocalGain.connect(this.masterGain);

    // Beat Gain -> masterGain
    this.beatGain.connect(this.masterGain);

    // masterGain -> masterAnalyser -> destination
    this.masterGain.connect(this.masterAnalyser);
    this.masterAnalyser.connect(ctx.destination);
  }

  /**
   * Applies user tweaks to active Web Audio nodes immediately
   */
  public applySettings(settings: StudioSettings): void {
    this.settings = { ...settings };
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Master / Sub gains
    if (this.masterGain) this.masterGain.gain.setTargetAtTime(settings.masterVolume, now, 0.02);
    if (this.vocalGain) this.vocalGain.gain.setTargetAtTime(settings.vocalVolume, now, 0.02);
    if (this.beatGain) this.beatGain.gain.setTargetAtTime(settings.beatVolume, now, 0.02);

    // Low Cut Rumble
    if (this.lowCutFilter) {
      this.lowCutFilter.frequency.setTargetAtTime(
        settings.noiseGateEnabled ? Math.max(settings.lowCutFrequency, 80) : 40,
        now, 0.02
      );
    }

    // De-Esser
    if (this.deEsserFilter) {
      const deEssGain = settings.deEsserEnabled ? -(settings.deEsserAmount / 100) * 12 : 0;
      this.deEsserFilter.gain.setTargetAtTime(deEssGain, now, 0.02);
    }

    // 4-Band EQ
    if (this.eqWarmthFilter) {
      this.eqWarmthFilter.gain.setTargetAtTime(settings.eqEnabled ? settings.eqWarmth : 0, now, 0.02);
    }
    if (this.eqMidFilter) {
      this.eqMidFilter.gain.setTargetAtTime(settings.eqEnabled ? settings.eqMidPresence : 0, now, 0.02);
    }
    if (this.eqAirFilter) {
      this.eqAirFilter.gain.setTargetAtTime(settings.eqEnabled ? settings.eqAirSparkle : 0, now, 0.02);
    }

    // Compressor
    if (this.compressor) {
      if (settings.compressorEnabled) {
        this.compressor.threshold.setTargetAtTime(settings.compressorThreshold, now, 0.02);
        this.compressor.ratio.setTargetAtTime(settings.compressorRatio, now, 0.02);
        this.compressor.attack.setTargetAtTime(settings.compressorAttack, now, 0.02);
        this.compressor.release.setTargetAtTime(settings.compressorRelease, now, 0.02);
      } else {
        this.compressor.threshold.setTargetAtTime(0, now, 0.02);
        this.compressor.ratio.setTargetAtTime(1, now, 0.02);
      }
    }

    // Saturation
    this.updateSaturationCurve();

    // Reverb
    if (this.reverbWetGain) {
      const wet = settings.reverbEnabled ? (settings.reverbWet / 100) : 0;
      this.reverbWetGain.gain.setTargetAtTime(wet, now, 0.03);
    }

    // Delay
    if (this.delayNode && this.delayFeedbackGain && this.delayWetGain) {
      const wet = settings.delayEnabled ? (settings.delayWet / 100) : 0;
      const feedback = settings.delayEnabled ? (settings.delayFeedback / 100) : 0;
      this.delayNode.delayTime.setTargetAtTime(settings.delayTime / 1000, now, 0.02);
      this.delayFeedbackGain.gain.setTargetAtTime(feedback, now, 0.02);
      this.delayWetGain.gain.setTargetAtTime(wet, now, 0.03);
    }

    // Doubler
    if (this.doublerGain) {
      const doubler = settings.doublerEnabled ? (settings.doublerMix / 100) * 0.45 : 0;
      this.doublerGain.gain.setTargetAtTime(doubler, now, 0.02);
    }
  }

  /**
   * Generates synthetic impulse responses for studio room spaces
   */
  public generateReverbImpulse(type: 'Plate' | 'Chamber' | 'Room' | 'Cathedral', decaySeconds: number): void {
    if (!this.ctx || !this.reverbConvolver) return;
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * Math.max(0.4, decaySeconds));
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    const decayConstant = decaySeconds * 1.8;
    for (let i = 0; i < length; i++) {
      const t = i / rate;
      const envelope = Math.exp(-t * (4.5 / decayConstant));
      // Subtle pre-delay reflection
      const preDelayFactor = t < 0.02 ? 0.2 : 1.0;
      left[i] = (Math.random() * 2 - 1) * envelope * preDelayFactor;
      right[i] = (Math.random() * 2 - 1) * envelope * preDelayFactor;
    }

    this.reverbConvolver.buffer = impulse;
  }

  /**
   * Soft polynomial saturation curve for warm analog tube warmth
   */
  private updateSaturationCurve(): void {
    if (!this.saturator || !this.ctx) return;
    const drive = this.settings.saturationEnabled ? (this.settings.saturationDrive / 100) : 0;
    const nSamples = 2048;
    const curve = new Float32Array(nSamples);
    const k = drive * 8;

    for (let i = 0; i < nSamples; i++) {
      const x = (i * 2) / nSamples - 1;
      if (k === 0) {
        curve[i] = x;
      } else {
        // Soft-knee hyperbolic tangent saturation
        curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
      }
    }
    this.saturator.curve = curve;
  }

  /**
   * Real-time Pitch Estimation & Scale Snapping (Auto-Tune calculation)
   */
  private startPitchDetectionLoop(): void {
    const detect = () => {
      if (this.vocalAnalyser && (this.isPlaying || this.isRecording || this.settings.monitorMic)) {
        const buffer = new Float32Array(this.vocalAnalyser.fftSize);
        this.vocalAnalyser.getFloatTimeDomainData(buffer);

        // Calculate RMS (volume level) to check noise gate
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i] * buffer[i];
        }
        const rms = Math.sqrt(sum / buffer.length);
        const db = 20 * Math.log10(Math.max(1e-5, rms));

        // Noise gate gain ducking
        if (this.noiseGateGain && this.ctx && this.settings.noiseGateEnabled) {
          const isSilent = db < this.settings.noiseGateThreshold;
          const targetGain = isSilent ? 0.02 : 1.0;
          this.noiseGateGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, isSilent ? 0.08 : 0.01);
        } else if (this.noiseGateGain && this.ctx) {
          this.noiseGateGain.gain.setTargetAtTime(1.0, this.ctx.currentTime, 0.01);
        }

        // Only detect pitch if above threshold
        if (rms > 0.02) {
          const pitch = this.autoCorrelate(buffer, this.ctx?.sampleRate || 44100);
          if (pitch > 55 && pitch < 1200) {
            this.currentDetectedPitch = pitch;
            this.processPitchCorrection(pitch);
          }
        } else {
          this.currentNoteName = '--';
          this.targetNoteName = '--';
          this.pitchCorrectionCents = 0;
        }

        if (this.onPitchUpdate) {
          this.onPitchUpdate({
            detectedNote: this.currentNoteName,
            targetNote: this.targetNoteName,
            cents: this.pitchCorrectionCents,
            freq: this.currentDetectedPitch,
          });
        }
      }

      requestAnimationFrame(detect);
    };

    requestAnimationFrame(detect);
  }

  /**
   * Autocorrelation algorithm for pitch detection
   */
  private autoCorrelate(buffer: Float32Array, sampleRate: number): number {
    const SIZE = buffer.length;
    let r1 = 0, r2 = SIZE - 1;
    const thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buffer[i]) < thres) {
        r1 = i;
        break;
      }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buffer[SIZE - i]) < thres) {
        r2 = SIZE - i;
        break;
      }
    }

    const trimmed = buffer.slice(r1, r2);
    const c = new Float32Array(trimmed.length).fill(0);
    for (let i = 0; i < trimmed.length; i++) {
      for (let j = 0; j < trimmed.length - i; j++) {
        c[i] = c[i] + trimmed[j] * trimmed[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < trimmed.length; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }
    let T0 = maxpos;
    if (T0 <= 0) return -1;
    return sampleRate / T0;
  }

  /**
   * Snaps detected frequency to selected musical scale
   */
  private processPitchCorrection(freq: number): void {
    // MIDI note number: 69 is A4 (440Hz)
    const midiNumber = 69 + 12 * Math.log2(freq / 440);
    const roundedMidi = Math.round(midiNumber);
    const noteIndex = ((roundedMidi % 12) + 12) % 12;
    const octave = Math.floor(roundedMidi / 12) - 1;
    this.currentNoteName = `${NOTE_NAMES[noteIndex]}${octave}`;

    // Target scale semitones
    const validSemitones = SCALE_SEMITONES[this.settings.scale] || SCALE_SEMITONES['C Major'];

    // Find closest semitone in scale
    let bestSemitone = validSemitones[0];
    let minDistance = 999;
    for (const semitone of validSemitones) {
      let diff = Math.abs(noteIndex - semitone);
      if (diff > 6) diff = 12 - diff;
      if (diff < minDistance) {
        minDistance = diff;
        bestSemitone = semitone;
      }
    }

    const targetMidi = Math.floor(roundedMidi / 12) * 12 + bestSemitone;
    this.targetNoteName = `${NOTE_NAMES[bestSemitone]}${octave}`;
    this.pitchCorrectionCents = Math.round((targetMidi - midiNumber) * 100);

    // Apply pitch shift to active playing vocal if pitch shifted
    if (this.vocalSource && this.settings.autoTuneEnabled) {
      // Calculate detune in cents (speed controls snappiness)
      const speedWeight = 1 - (this.settings.pitchCorrectionSpeed / 100);
      const correctionAmount = this.pitchCorrectionCents * speedWeight;
      const totalDetune = (this.settings.pitchShiftSemitones * 100) + correctionAmount;
      this.vocalSource.detune.setTargetAtTime(totalDetune, this.ctx!.currentTime, 0.04);
    }
  }

  // --- Audio Loading & Sources ---

  public setVocalBuffer(buffer: AudioBuffer): void {
    this.vocalBuffer = buffer;
  }

  public setBeatBuffer(buffer: AudioBuffer): void {
    this.beatBuffer = buffer;
  }

  public getVocalBuffer(): AudioBuffer | null {
    return this.vocalBuffer;
  }

  public getBeatBuffer(): AudioBuffer | null {
    return this.beatBuffer;
  }

  public async decodeAudioFile(file: File): Promise<AudioBuffer> {
    await this.init();
    const arrayBuffer = await file.arrayBuffer();
    return await this.ctx!.decodeAudioData(arrayBuffer);
  }

  // --- Microphone Recording & Monitoring ---

  public async startMicMonitoring(): Promise<void> {
    await this.init();
    if (this.micStream) return;

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000,
        },
      });

      this.micSource = this.ctx!.createMediaStreamSource(this.micStream);
      if (this.inputGain) {
        this.micSource.connect(this.inputGain);
      }
    } catch (err) {
      console.error('Failed to get mic stream:', err);
      throw err;
    }
  }

  public stopMicMonitoring(): void {
    if (this.micSource && this.inputGain) {
      try { this.micSource.disconnect(); } catch (e) {}
      this.micSource = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }
  }

  public async startRecording(): Promise<void> {
    await this.init();
    if (this.isRecording) return;

    if (!this.micStream) {
      await this.startMicMonitoring();
    }

    if (!this.micStream) {
      throw new Error('Microphone stream unavailable');
    }

    this.recordedChunks = [];
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';

    this.mediaRecorder = new MediaRecorder(this.micStream, { mimeType });
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.recordedChunks.push(e.data);
      }
    };

    this.mediaRecorder.onstop = async () => {
      const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
      const arrayBuf = await blob.arrayBuffer();
      const decoded = await this.ctx!.decodeAudioData(arrayBuf);
      this.vocalBuffer = decoded;
      this.isRecording = false;
      if (this.onRecordingComplete) {
        this.onRecordingComplete(decoded);
      }
    };

    this.mediaRecorder.start(100);
    this.isRecording = true;

    // If there's a backing beat, play it concurrently for karaoke recording
    if (this.beatBuffer && !this.isPlaying) {
      this.playBeatOnly();
    }
  }

  public stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.stop();
    }
  }

  // --- Playback Controls ---

  public async play(): Promise<void> {
    await this.init();
    if (!this.vocalBuffer && !this.beatBuffer) return;
    if (this.isPlaying) return;

    const ctx = this.ctx!;
    const offset = this.pauseOffset;
    this.startTime = ctx.currentTime - offset;

    // Start Vocal
    if (this.vocalBuffer && this.inputGain) {
      this.vocalSource = ctx.createBufferSource();
      this.vocalSource.buffer = this.vocalBuffer;
      this.vocalSource.connect(this.inputGain);
      this.vocalSource.onended = () => {
        if (!this.beatSource && this.isPlaying) {
          this.handleEnded();
        }
      };
      this.vocalSource.start(0, offset);
    }

    // Start Beat
    if (this.beatBuffer && this.beatGain) {
      this.beatSource = ctx.createBufferSource();
      this.beatSource.buffer = this.beatBuffer;
      this.beatSource.connect(this.beatGain);
      this.beatSource.onended = () => {
        if (!this.vocalSource && this.isPlaying) {
          this.handleEnded();
        }
      };
      this.beatSource.start(0, offset);
    }

    this.isPlaying = true;
  }

  private playBeatOnly(): void {
    if (!this.ctx || !this.beatBuffer || !this.beatGain) return;
    this.beatSource = this.ctx.createBufferSource();
    this.beatSource.buffer = this.beatBuffer;
    this.beatSource.connect(this.beatGain);
    this.beatSource.start(0);
  }

  public pause(): void {
    if (!this.isPlaying || !this.ctx) return;
    this.pauseOffset = this.ctx.currentTime - this.startTime;
    this.stopSources();
    this.isPlaying = false;
  }

  public stop(): void {
    this.pauseOffset = 0;
    this.stopSources();
    this.isPlaying = false;
  }

  public seek(positionSeconds: number): void {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      this.stopSources();
    }
    this.pauseOffset = Math.max(0, positionSeconds);
    if (wasPlaying) {
      this.isPlaying = false;
      this.play();
    }
  }

  private stopSources(): void {
    if (this.vocalSource) {
      try { this.vocalSource.stop(); this.vocalSource.disconnect(); } catch (e) {}
      this.vocalSource = null;
    }
    if (this.beatSource) {
      try { this.beatSource.stop(); this.beatSource.disconnect(); } catch (e) {}
      this.beatSource = null;
    }
  }

  private handleEnded(): void {
    this.isPlaying = false;
    this.pauseOffset = 0;
    this.stopSources();
    if (this.onPlaybackEnd) this.onPlaybackEnd();
  }

  // --- Getters for Time & State ---

  public getCurrentTime(): number {
    if (!this.isPlaying || !this.ctx) return this.pauseOffset;
    return this.ctx.currentTime - this.startTime;
  }

  public getDuration(): number {
    const vocalDur = this.vocalBuffer ? this.vocalBuffer.duration : 0;
    const beatDur = this.beatBuffer ? this.beatBuffer.duration : 0;
    return Math.max(vocalDur, beatDur);
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }

  public getVocalAnalyser(): AnalyserNode | null {
    return this.vocalAnalyser;
  }

  public getMasterAnalyser(): AnalyserNode | null {
    return this.masterAnalyser;
  }

  // --- Studio WAV Export (Offline Audio Rendering) ---

  /**
   * Renders the processed vocal + backing track with all studio effects into a pristine WAV blob
   */
  public async exportMasterWAV(onProgress?: (percent: number) => void): Promise<Blob> {
    const totalDuration = this.getDuration();
    if (totalDuration <= 0) {
      throw new Error('Không có âm thanh để xuất.');
    }

    const sampleRate = 44100;
    const OfflineCtxClass = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
    const offlineCtx = new OfflineCtxClass(2, Math.ceil(totalDuration * sampleRate), sampleRate);

    // Build the identical DSP chain in offline context
    const offInput = offlineCtx.createGain();
    const offLowCut = offlineCtx.createBiquadFilter();
    offLowCut.type = 'highpass';
    offLowCut.frequency.value = this.settings.noiseGateEnabled ? Math.max(this.settings.lowCutFrequency, 80) : 40;

    const offDeEsser = offlineCtx.createBiquadFilter();
    offDeEsser.type = 'peaking';
    offDeEsser.frequency.value = 6200;
    offDeEsser.gain.value = this.settings.deEsserEnabled ? -(this.settings.deEsserAmount / 100) * 12 : 0;

    const offEQWarmth = offlineCtx.createBiquadFilter();
    offEQWarmth.type = 'lowshelf';
    offEQWarmth.frequency.value = 250;
    offEQWarmth.gain.value = this.settings.eqEnabled ? this.settings.eqWarmth : 0;

    const offEQMid = offlineCtx.createBiquadFilter();
    offEQMid.type = 'peaking';
    offEQMid.frequency.value = 3000;
    offEQMid.gain.value = this.settings.eqEnabled ? this.settings.eqMidPresence : 0;

    const offEQAir = offlineCtx.createBiquadFilter();
    offEQAir.type = 'highshelf';
    offEQAir.frequency.value = 9500;
    offEQAir.gain.value = this.settings.eqEnabled ? this.settings.eqAirSparkle : 0;

    const offComp = offlineCtx.createDynamicsCompressor();
    if (this.settings.compressorEnabled) {
      offComp.threshold.value = this.settings.compressorThreshold;
      offComp.ratio.value = this.settings.compressorRatio;
      offComp.attack.value = this.settings.compressorAttack;
      offComp.release.value = this.settings.compressorRelease;
    }

    const offSat = offlineCtx.createWaveShaper();
    if (this.saturator?.curve) {
      offSat.curve = this.saturator.curve;
    }

    const offVocalGain = offlineCtx.createGain();
    offVocalGain.gain.value = this.settings.vocalVolume;

    const offBeatGain = offlineCtx.createGain();
    offBeatGain.gain.value = this.settings.beatVolume;

    const offMasterGain = offlineCtx.createGain();
    offMasterGain.gain.value = this.settings.masterVolume;

    // Connect chain
    offInput.connect(offLowCut);
    offLowCut.connect(offDeEsser);
    offDeEsser.connect(offEQWarmth);
    offEQWarmth.connect(offEQMid);
    offEQMid.connect(offEQAir);
    offEQAir.connect(offComp);
    offComp.connect(offSat);
    offSat.connect(offVocalGain);

    // Reverb in offline
    if (this.settings.reverbEnabled && this.reverbConvolver?.buffer) {
      const offReverb = offlineCtx.createConvolver();
      offReverb.buffer = this.reverbConvolver.buffer;
      const offRevWet = offlineCtx.createGain();
      offRevWet.gain.value = this.settings.reverbWet / 100;
      offSat.connect(offReverb);
      offReverb.connect(offRevWet);
      offRevWet.connect(offVocalGain);
    }

    // Delay in offline
    if (this.settings.delayEnabled) {
      const offDelay = offlineCtx.createDelay();
      offDelay.delayTime.value = this.settings.delayTime / 1000;
      const offDelFeedback = offlineCtx.createGain();
      offDelFeedback.gain.value = this.settings.delayFeedback / 100;
      const offDelWet = offlineCtx.createGain();
      offDelWet.gain.value = this.settings.delayWet / 100;

      offSat.connect(offDelay);
      offDelay.connect(offDelFeedback);
      offDelFeedback.connect(offDelay);
      offDelay.connect(offDelWet);
      offDelWet.connect(offVocalGain);
    }

    offVocalGain.connect(offMasterGain);
    offBeatGain.connect(offMasterGain);
    offMasterGain.connect(offlineCtx.destination);

    // Load Vocal
    if (this.vocalBuffer) {
      const vSource = offlineCtx.createBufferSource();
      vSource.buffer = this.vocalBuffer;
      vSource.connect(offInput);
      vSource.start(0);
    }

    // Load Beat
    if (this.beatBuffer) {
      const bSource = offlineCtx.createBufferSource();
      bSource.buffer = this.beatBuffer;
      bSource.connect(offBeatGain);
      bSource.start(0);
    }

    if (onProgress) onProgress(45);
    const renderedBuffer = await offlineCtx.startRendering();
    if (onProgress) onProgress(85);

    const wavBlob = this.audioBufferToWav(renderedBuffer);
    if (onProgress) onProgress(100);
    return wavBlob;
  }

  /**
   * Encodes AudioBuffer into standard 16-bit PCM WAV Blob
   */
  private audioBufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const numSamples = buffer.length;
    const dataSize = numSamples * blockAlign;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;

    const arrayBuffer = new ArrayBuffer(totalSize);
    const view = new DataView(arrayBuffer);

    // RIFF identifier
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Interleave stereo audio
    let offset = 44;
    const channels: Float32Array[] = [];
    for (let c = 0; c < numChannels; c++) {
      channels.push(buffer.getChannelData(c));
    }

    for (let i = 0; i < numSamples; i++) {
      for (let c = 0; c < numChannels; c++) {
        let sample = channels[c][i];
        sample = Math.max(-1, Math.min(1, sample));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}
