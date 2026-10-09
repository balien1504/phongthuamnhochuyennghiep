import { MusicalScale } from '../types/audio';

export interface BeatPreset {
  id: string;
  title: string;
  vietnameseTitle: string;
  genre: string;
  bpm: number;
  key: MusicalScale;
  description: string;
}

export const BUILT_IN_BEATS: BeatPreset[] = [
  {
    id: 'pop-ballad',
    title: 'Pop Ballad Piano & Strings',
    vietnameseTitle: 'Ballad Piano & Dàn Dây Truyền Cảm',
    genre: 'V-Pop Ballad',
    bpm: 78,
    key: 'C Major',
    description: 'Tiếng đàn Piano ấm áp, hợp âm nhẹ nhàng C - Am - F - G hòa quyện bè dây du dương.'
  },
  {
    id: 'rb-chill',
    title: 'R&B Neo-Soul Groove',
    vietnameseTitle: 'R&B / Soul Nhẹ Nhàng Bắt Tai',
    genre: 'R&B / Chill',
    bpm: 88,
    key: 'A Minor',
    description: 'Giai điệu Rhodes điện tử ấm nồng, bassline sâu lắng và nhịp gõ rimshot hiện đại.'
  },
  {
    id: 'trap-vibe',
    title: 'Trap Melodic 808',
    vietnameseTitle: 'Trap Melodic & Bass 808',
    genre: 'Hip-Hop / Trap',
    bpm: 130,
    key: 'D Minor',
    description: 'Nhịp trống trap giòn giã, bass 808 trầm sâu, lý tưởng để thử giọng Auto-Tune rap/hát melody.'
  },
  {
    id: 'acoustic-sunset',
    title: 'Acoustic Guitar Sunset',
    vietnameseTitle: 'Guitar Mộc Mạc Chiều Hoàng Hôn',
    genre: 'Acoustic Pop',
    bpm: 95,
    key: 'G Major',
    description: 'Tiếng rải guitar thùng mộc mạc G - Em - C - D, tôn vinh giọng ca chân thật và giàu cảm xúc.'
  }
];

/**
 * Procedurally generates a musical backing track AudioBuffer
 */
export function generateProceduralBeat(ctx: AudioContext, beatId: string, durationSeconds: number = 24): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const buffer = ctx.createBuffer(2, numSamples, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  const beatInfo = BUILT_IN_BEATS.find(b => b.id === beatId) || BUILT_IN_BEATS[0];
  const bpm = beatInfo.bpm;
  const beatInterval = 60 / bpm; // duration of one quarter note in seconds

  // Scale frequencies (Hz)
  const notes: Record<string, number> = {
    C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
    C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00,
  };

  // Chord progression definitions
  let chords: { root: number; notes: number[] }[] = [];
  if (beatId === 'pop-ballad') {
    chords = [
      { root: notes.C2, notes: [notes.C3, notes.E3, notes.G3, notes.C4] }, // C
      { root: notes.A2, notes: [notes.A2, notes.C3, notes.E3, notes.A3] }, // Am
      { root: notes.F2, notes: [notes.F2, notes.A2, notes.C3, notes.F3] }, // F
      { root: notes.G2, notes: [notes.G2, notes.B3, notes.D3, notes.G3] }, // G
    ];
  } else if (beatId === 'rb-chill') {
    chords = [
      { root: notes.A2, notes: [notes.A3, notes.C4, notes.E4, notes.G4] }, // Am7
      { root: notes.D2, notes: [notes.D3, notes.F3, notes.A3, notes.C4] }, // Dm7
      { root: notes.E2, notes: [notes.E3, notes.G3, notes.B3, notes.D4] }, // Em7
      { root: notes.A2, notes: [notes.A2, notes.E3, notes.G3, notes.C4] }, // Am9
    ];
  } else if (beatId === 'trap-vibe') {
    chords = [
      { root: notes.D2, notes: [notes.D3, notes.F3, notes.A3] }, // Dm
      { root: notes.F2, notes: [notes.F3, notes.A3, notes.C4] }, // F
      { root: notes.G2, notes: [notes.G2, notes.B3, notes.D3] }, // Gm
      { root: notes.A2, notes: [notes.A2, notes.C3, notes.E3] }, // Am
    ];
  } else {
    // Acoustic
    chords = [
      { root: notes.G2, notes: [notes.G3, notes.B3, notes.D4, notes.G4] }, // G
      { root: notes.E2, notes: [notes.E3, notes.G3, notes.B3, notes.E4] }, // Em
      { root: notes.C2, notes: [notes.C3, notes.E3, notes.G3, notes.C4] }, // C
      { root: notes.D2, notes: [notes.D3, notes.F3, notes.A3, notes.D4] }, // D
    ];
  }

  const chordDurationBeats = 4; // 1 measure per chord
  const measureDuration = chordDurationBeats * beatInterval;

  // Synthesize chord tones & drum grooves into the buffer
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const measureIndex = Math.floor(t / measureDuration);
    const chord = chords[measureIndex % chords.length];
    const timeInMeasure = t % measureDuration;
    const currentBeat = timeInMeasure / beatInterval;

    let sampleL = 0;
    let sampleR = 0;

    // 1. Bassline (smooth sub)
    const bassEnv = Math.exp(-((timeInMeasure % beatInterval) * 1.5));
    const bassVal = Math.sin(2 * Math.PI * chord.root * t) * 0.22 * bassEnv;
    sampleL += bassVal;
    sampleR += bassVal;

    // 2. Chords (Arpeggiated Piano/Keys)
    chord.notes.forEach((freq, idx) => {
      let noteTriggerTime = 0;
      if (beatId === 'acoustic-sunset') {
        noteTriggerTime = (idx * 0.25) * beatInterval;
      } else {
        noteTriggerTime = (idx % 2 === 0 ? 0 : 2) * beatInterval;
      }

      const noteAge = (timeInMeasure - noteTriggerTime);
      if (noteAge >= 0 && noteAge < beatInterval * 2) {
        const decay = Math.exp(-noteAge * 1.8);
        // Rich harmonics (fundamental + subtle 2nd harmonic)
        const tone = (
          Math.sin(2 * Math.PI * freq * t) * 0.7 +
          Math.sin(2 * Math.PI * freq * 2 * t) * 0.25 +
          Math.sin(2 * Math.PI * freq * 3 * t) * 0.1
        ) * decay * 0.12;

        const pan = (idx / (chord.notes.length - 1 || 1)) - 0.5; // -0.5 to +0.5
        sampleL += tone * (0.5 - pan * 0.3);
        sampleR += tone * (0.5 + pan * 0.3);
      }
    });

    // 3. Drums / Percussion
    // Kick on beat 0 and beat 2 (or 2.5)
    const kickBeat1 = currentBeat;
    const kickBeat2 = (currentBeat - 2 + 4) % 4;
    const kickDist = Math.min(kickBeat1, kickBeat2);
    if (kickDist < 0.25) {
      const kickT = kickDist * beatInterval;
      const kickFreq = Math.max(45, 120 * Math.exp(-kickT * 25));
      const kickAmp = Math.exp(-kickT * 12) * 0.28;
      const kickSample = Math.sin(2 * Math.PI * kickFreq * kickT) * kickAmp;
      sampleL += kickSample;
      sampleR += kickSample;
    }

    // Snare / Rimshot on beat 1 and beat 3 (in 0-indexed: beat 1 and 3)
    const snareDist1 = Math.abs(currentBeat - 1);
    const snareDist2 = Math.abs(currentBeat - 3);
    const snareDist = Math.min(snareDist1, snareDist2);
    if (snareDist < 0.2) {
      const snareT = snareDist * beatInterval;
      const noise = (Math.random() * 2 - 1) * Math.exp(-snareT * 22) * 0.14;
      const tone = Math.sin(2 * Math.PI * 185 * snareT) * Math.exp(-snareT * 18) * 0.1;
      sampleL += (noise + tone) * 0.85;
      sampleR += (noise + tone) * 0.95;
    }

    // Hi-hat every 0.5 beat (8th notes) or 16th for trap
    const hatDivision = beatId === 'trap-vibe' ? 0.25 : 0.5;
    const hatDist = (currentBeat % hatDivision);
    if (hatDist < 0.08) {
      const hatT = hatDist * beatInterval;
      const hatNoise = (Math.random() * 2 - 1) * Math.exp(-hatT * 45) * 0.06;
      sampleL += hatNoise * 0.7;
      sampleR += hatNoise * 0.9;
    }

    // Soft limiter / clamp
    left[i] = Math.max(-0.95, Math.min(0.95, sampleL));
    right[i] = Math.max(-0.95, Math.min(0.95, sampleR));
  }

  return buffer;
}
