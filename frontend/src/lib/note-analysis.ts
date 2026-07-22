// Client-side, dependency-free heuristics for the "Note Verify" demo.
// This is an ASSISTIVE detector — it estimates likelihood from an image plus a
// human-confirmed security-feature checklist. It is NOT an authoritative test.
//
// Self-check: NOTE_ANALYSIS_SELFCHECK=1 node --input-type=module \
//   <(node_modules/.bin/esbuild src/lib/note-analysis.ts --bundle --format=esm)

export interface ImageLike {
  data: Uint8ClampedArray | number[];
  width: number;
  height: number;
}

export interface ImageStats {
  width: number;
  height: number;
  aspectRatio: number;
  meanLuma: number;      // 0..255
  dominantHue: number;   // 0..360
  saturation: number;    // 0..1
  edgeDensity: number;   // 0..1 (proxy for print sharpness / detail)
}

export interface DenomGuess {
  value: number | null;
  name: string;
  confidence: number;    // 0..1
}

export type Verdict = 'GENUINE' | 'INCONCLUSIVE' | 'COUNTERFEIT';

export interface AuthResult {
  verdict: Verdict;
  score: number;         // 0..100
  reasons: string[];
}

// RBI Mahatma Gandhi (New) Series dominant colours.
const DENOMS = [
  { value: 10, name: '₹10 · chocolate brown', hue: 28, grey: false },
  { value: 20, name: '₹20 · greenish yellow', hue: 66, grey: false },
  { value: 50, name: '₹50 · fluorescent blue', hue: 190, grey: false },
  { value: 100, name: '₹100 · lavender', hue: 270, grey: false },
  { value: 200, name: '₹200 · bright yellow', hue: 45, grey: false },
  { value: 500, name: '₹500 · stone grey', hue: null as number | null, grey: true },
  { value: 2000, name: '₹2000 · magenta', hue: 320, grey: false },
];

// Security features a citizen can visually verify on a genuine note.
export interface SecurityFeature {
  id: string;
  label: string;
  hint: string;
}

export const SECURITY_FEATURES: SecurityFeature[] = [
  { id: 'watermark', label: 'Watermark', hint: 'Mahatma Gandhi portrait + electrotype denomination, visible against light.' },
  { id: 'thread', label: 'Security thread', hint: 'Colour-shifting "भारत / RBI" thread; shifts green→blue when tilted.' },
  { id: 'latent', label: 'Latent image', hint: 'Vertical band shows the denomination when held at eye level.' },
  { id: 'microtext', label: 'Micro-lettering', hint: '"RBI" and denomination in tiny text between portrait and vertical band.' },
  { id: 'register', label: 'See-through register', hint: 'Floral design forms the denomination when held to light.' },
  { id: 'intaglio', label: 'Intaglio print', hint: 'Raised print you can feel on the portrait, RBI seal and guarantee text.' },
  { id: 'bleedlines', label: 'Bleed lines', hint: 'Raised angular lines on the edges (count differs per denomination).' },
  { id: 'idmark', label: 'Identification mark', hint: 'Raised geometric shape for the visually impaired (unique per denomination).' },
];

function clamp(x: number, lo = 0, hi = 1): number {
  return Math.max(lo, Math.min(hi, x));
}

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b);
  return Math.min(d, 360 - d);
}

export function analyzeImage(img: ImageLike): ImageStats {
  const { data, width, height } = img;
  let sumLuma = 0;
  let sumSat = 0;
  let sumSin = 0;
  let sumCos = 0;
  let hueWeight = 0;
  let n = 0;

  const luma: number[] = new Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const l = 0.299 * r + 0.587 * g + 0.114 * b;
      luma[y * width + x] = l;
      const { h, s, v } = rgbToHsv(r, g, b);
      sumLuma += l;
      sumSat += s;
      // Weight hue by colourfulness so grey pixels don't skew the estimate.
      const w = s * v;
      sumSin += Math.sin((h * Math.PI) / 180) * w;
      sumCos += Math.cos((h * Math.PI) / 180) * w;
      hueWeight += w;
      n++;
    }
  }

  // Edge density: mean absolute luma gradient vs the left neighbour.
  let gradSum = 0;
  let gradN = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 1; x < width; x++) {
      gradSum += Math.abs(luma[y * width + x] - luma[y * width + x - 1]);
      gradN++;
    }
  }
  const avgGrad = gradN ? gradSum / gradN : 0; // 0..255 scale
  const edgeDensity = clamp(avgGrad / 12);

  let dominantHue = 0;
  if (hueWeight > 0) {
    dominantHue = (Math.atan2(sumSin, sumCos) * 180) / Math.PI;
    if (dominantHue < 0) dominantHue += 360;
  }

  return {
    width,
    height,
    aspectRatio: height ? width / height : 0,
    meanLuma: n ? sumLuma / n : 0,
    dominantHue,
    saturation: n ? sumSat / n : 0,
    edgeDensity,
  };
}

export function guessDenomination(stats: ImageStats): DenomGuess {
  // Low saturation → stone-grey ₹500.
  if (stats.saturation < 0.18) {
    const grey = DENOMS.find((d) => d.grey)!;
    return { value: grey.value, name: grey.name, confidence: clamp(1 - stats.saturation / 0.18) * 0.9 + 0.1 };
  }
  let best = DENOMS[0];
  let bestDist = Infinity;
  for (const d of DENOMS) {
    if (d.grey || d.hue === null) continue;
    const dist = hueDistance(stats.dominantHue, d.hue);
    if (dist < bestDist) {
      bestDist = dist;
      best = d;
    }
  }
  // Within 90° = some confidence; scaled by how saturated (colourful) the note is.
  const hueConf = clamp(1 - bestDist / 90);
  const confidence = clamp(hueConf * clamp(stats.saturation / 0.35));
  return { value: best.value, name: best.name, confidence };
}

export function scoreAuthenticity(
  stats: ImageStats,
  confirmedCount: number,
  totalFeatures: number,
  denom: DenomGuess
): AuthResult {
  const reasons: string[] = [];

  const sharpness = clamp(stats.edgeDensity);
  const resolution = clamp(Math.min(stats.width, stats.height) / 300);
  const aspect = clamp(1 - Math.abs(stats.aspectRatio - 2.15) / 1.0);
  const colorMatch = clamp(denom.confidence);
  const checklist = totalFeatures ? clamp(confirmedCount / totalFeatures) : 0;

  const weights = {
    sharpness: 0.3,
    resolution: 0.15,
    aspect: 0.15,
    colorMatch: 0.15,
    checklist: 0.25,
  };

  let score =
    100 *
    (weights.sharpness * sharpness +
      weights.resolution * resolution +
      weights.aspect * aspect +
      weights.colorMatch * colorMatch +
      weights.checklist * checklist);

  if (sharpness < 0.35) reasons.push('Low print sharpness — possible photocopy or screenshot.');
  else reasons.push('Fine print detail detected (consistent with intaglio printing).');

  if (resolution < 0.5) reasons.push('Image resolution is low — capture a closer, sharper photo.');
  if (aspect < 0.5) reasons.push('Aspect ratio is off for a banknote — the whole note may not be in frame.');

  if (colorMatch < 0.35) {
    reasons.push('Dominant colour did not clearly match a known denomination.');
    // Honesty guard: never claim GENUINE when we can't even place the denomination.
    score = Math.min(score, 69);
  } else {
    reasons.push(`Colour profile matches ${denom.name}.`);
  }

  reasons.push(`${confirmedCount} of ${totalFeatures} security features confirmed by you.`);

  score = Math.round(clamp(score, 0, 100));

  let verdict: Verdict;
  if (score >= 70) verdict = 'GENUINE';
  else if (score >= 45) verdict = 'INCONCLUSIVE';
  else verdict = 'COUNTERFEIT';

  return { verdict, score, reasons };
}

// --- self-check -----------------------------------------------------------
export function demo(): void {
  const assert = (cond: boolean, msg: string) => {
    if (!cond) throw new Error('note-analysis self-check failed: ' + msg);
  };

  // Build a synthetic solid-colour image of a given hue.
  const makeImg = (hue: number, sat: number, val: number, w = 320, h = 150, noise = 0): ImageLike => {
    const c = hsvToRgb(hue, sat, val);
    const data = new Uint8ClampedArray(w * h * 4);
    for (let p = 0; p < w * h; p++) {
      const jitter = noise ? (Math.floor((p * 2654435761) % 255) - 128) * noise : 0;
      data[p * 4] = c.r + jitter;
      data[p * 4 + 1] = c.g + jitter;
      data[p * 4 + 2] = c.b + jitter;
      data[p * 4 + 3] = 255;
    }
    return { data, width: w, height: h };
  };

  // Denomination mapping: magenta → ₹2000, blue → ₹50, grey → ₹500.
  assert(guessDenomination(analyzeImage(makeImg(320, 0.6, 0.7))).value === 2000, 'magenta→2000');
  assert(guessDenomination(analyzeImage(makeImg(190, 0.6, 0.7))).value === 50, 'blue→50');
  assert(guessDenomination(analyzeImage(makeImg(0, 0.02, 0.5))).value === 500, 'grey→500');

  // Sharpness: a detailed (noisy) note scores higher than a flat one, same checklist.
  const flat = analyzeImage(makeImg(320, 0.6, 0.7, 320, 150, 0));
  const sharp = analyzeImage(makeImg(320, 0.6, 0.7, 320, 150, 0.9));
  const dFlat = guessDenomination(flat);
  const dSharp = guessDenomination(sharp);
  const sFlat = scoreAuthenticity(flat, 4, 8, dFlat).score;
  const sSharp = scoreAuthenticity(sharp, 4, 8, dSharp).score;
  assert(sSharp > sFlat, 'sharper image scores higher');

  // Checklist monotonicity: more confirmed features never lowers the score.
  let prev = -1;
  for (let k = 0; k <= 8; k++) {
    const s = scoreAuthenticity(sharp, k, 8, dSharp).score;
    assert(s >= prev, `checklist monotonic at ${k}`);
    prev = s;
  }

  console.log('note-analysis self-check passed ✓');
}

function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}

const __proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
if (__proc?.env?.NOTE_ANALYSIS_SELFCHECK === '1') {
  demo();
}
