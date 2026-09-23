/**
 * WebAudio siren — no audio files needed.
 * Two-tone pulse, 3 cycles per call. The dashboard re-triggers it on an
 * interval while unacknowledged alerts exist (caller owns the loop).
 */
let ctx: AudioContext | null = null;

export function ensureAudio(): boolean {
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return true;
  } catch {
    return false;
  }
}

export function playSiren(): void {
  if (!ensureAudio() || !ctx) return;
  const t0 = ctx.currentTime;
  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const start = t0 + i * 0.5;
    osc.frequency.setValueAtTime(660, start);
    osc.frequency.setValueAtTime(880, start + 0.22);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);
    osc.start(start);
    osc.stop(start + 0.5);
  }
}
