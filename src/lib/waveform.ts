// Deterministic pseudo-waveform from a seed (no Math.random, so SSR/CSR match).
export function waveBars(seed: string, count = 56): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return Array.from({ length: count }, (_, i) => {
    h = (h * 1103515245 + 12345) >>> 0;
    const v = (h % 1000) / 1000;
    const env = 0.4 + 0.6 * Math.sin((i / count) * Math.PI); // gentle envelope
    return 0.18 + v * 0.82 * env;
  });
}
