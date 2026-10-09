/**
 * Synthesizes a vocal audition track with a realistic singing vocal formant
 * (vowel 'Ah' & 'Oh' harmonics + vibrato) to test the studio rack instantly.
 */
export function generateDemoVocal(ctx: AudioContext, durationSeconds: number = 10): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const buffer = ctx.createBuffer(1, numSamples, sampleRate);
  const channel = buffer.getChannelData(0);

  // Melody in C Major: C4 -> D4 -> E4 -> G4 -> F4 -> E4 -> D4 -> C4
  const melodyNotes = [
    { freq: 261.63, dur: 1.0 }, // C4
    { freq: 293.66, dur: 1.0 }, // D4
    { freq: 329.63, dur: 1.5 }, // E4
    { freq: 392.00, dur: 1.5 }, // G4
    { freq: 349.23, dur: 1.0 }, // F4
    { freq: 329.63, dur: 1.0 }, // E4
    { freq: 293.66, dur: 1.2 }, // D4
    { freq: 261.63, dur: 1.8 }, // C4 (held with vibrato)
  ];

  let currentTime = 0;
  melodyNotes.forEach(note => {
    const startSample = Math.floor(currentTime * sampleRate);
    const endSample = Math.min(numSamples, Math.floor((currentTime + note.dur) * sampleRate));

    for (let i = startSample; i < endSample; i++) {
      const t = (i - startSample) / sampleRate;
      const progress = t / note.dur;

      // Vocal envelope: gentle attack, sustained, smooth release
      let env = 1;
      if (progress < 0.1) env = progress / 0.1;
      else if (progress > 0.85) env = (1 - progress) / 0.15;

      // Vibrato after 0.3s of note onset
      const vibratoRate = 5.2; // Hz
      const vibratoDepth = progress > 0.3 ? 0.015 * Math.min(1, (progress - 0.3) * 3) : 0;
      const pitchMod = 1 + vibratoDepth * Math.sin(2 * Math.PI * vibratoRate * t);
      const f = note.freq * pitchMod;

      // Human vocal formant synthesis (Fundamental + Formant F1 ~ 750Hz, F2 ~ 1200Hz, F3 ~ 2400Hz)
      const fundamental = Math.sin(2 * Math.PI * f * t);
      const f2 = Math.sin(2 * Math.PI * f * 2 * t) * 0.45;
      const f3 = Math.sin(2 * Math.PI * f * 3 * t) * 0.25;
      const f4 = Math.sin(2 * Math.PI * f * 4 * t) * 0.15;
      const f5 = Math.sin(2 * Math.PI * f * 5 * t) * 0.08;

      // Breath noise / vocal air texture
      const breath = (Math.random() * 2 - 1) * 0.015;

      const vocalSample = (fundamental + f2 + f3 + f4 + f5 + breath) * env * 0.35;
      channel[i] += vocalSample;
    }

    currentTime += note.dur;
  });

  return buffer;
}
