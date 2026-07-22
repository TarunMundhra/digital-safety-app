'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScanLine,
  Upload,
  Loader2,
  BadgeCheck,
  ShieldAlert,
  HelpCircle,
  Banknote,
  Info,
  RotateCcw,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  analyzeImage,
  guessDenomination,
  scoreAuthenticity,
  SECURITY_FEATURES,
  type ImageStats,
  type DenomGuess,
} from '@/lib/note-analysis';

const NOTE_COLORS: Record<number, string> = {
  10: '#6b5b3e',
  20: '#c9b458',
  50: '#3f9fc4',
  100: '#8f84bd',
  200: '#e6b73a',
  500: '#8b909a',
  2000: '#c15a9a',
};

// Draw a stylised, clearly-synthetic banknote to a canvas for instant demos.
function drawMockNote(value: number, quality: 'clear' | 'photocopy'): HTMLCanvasElement {
  const w = 440;
  const h = 200;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const base = NOTE_COLORS[value] ?? '#8b909a';

  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  if (quality === 'photocopy') {
    // Washed-out, blurry, low-detail => low sharpness => flags as suspect.
    ctx.filter = 'blur(1.6px)';
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillRect(0, 0, w, h);
  } else {
    // Fine guilloche-style lines give genuine-like print detail (high edge density).
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 0.6;
    for (let i = -h; i < w; i += 4) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + h, h);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    for (let i = 0; i < w + h; i += 5) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i - h, h);
      ctx.stroke();
    }
  }

  ctx.filter = 'none';
  // Portrait placeholder
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(w - 78, h / 2 + 6, 36, 46, 0, 0, Math.PI * 2);
  ctx.fill();

  // Denomination
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = 'bold 46px Sora, sans-serif';
  ctx.fillText('₹' + value, 22, 70);

  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '600 12px Sora, sans-serif';
  ctx.fillText('RESERVE BANK OF INDIA', 22, 92);
  ctx.font = '11px Sora, sans-serif';
  ctx.fillText('I PROMISE TO PAY THE BEARER', 22, h - 40);

  // Honest label baked into the sample
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '600 10px JetBrains Mono, monospace';
  ctx.fillText('SYNTHETIC SAMPLE · NOT LEGAL TENDER', 22, h - 16);

  return canvas;
}

function canvasToStats(canvas: HTMLCanvasElement): ImageStats {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return analyzeImage(imageData);
}

// Downscale any source image onto a working canvas (keeps analysis fast).
function imageToWorkingCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const maxDim = 440;
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

const VERDICT_META = {
  GENUINE: { label: 'Likely genuine', color: '#1eb85f', Icon: BadgeCheck, tint: 'bg-india/10 border-india/30 text-india' },
  INCONCLUSIVE: { label: 'Inconclusive', color: '#ff9933', Icon: HelpCircle, tint: 'bg-saffron/10 border-saffron/30 text-saffron' },
  COUNTERFEIT: { label: 'Suspected counterfeit', color: '#f43f5e', Icon: ShieldAlert, tint: 'bg-destructive/10 border-destructive/30 text-destructive' },
} as const;

const SAMPLES: { label: string; value: number; quality: 'clear' | 'photocopy' }[] = [
  { label: '₹500 clear scan', value: 500, quality: 'clear' },
  { label: '₹2000 clear scan', value: 2000, quality: 'clear' },
  { label: '₹500 photocopy', value: 500, quality: 'photocopy' },
];

export function NoteVerifyPanel() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<ImageStats | null>(null);
  const [denom, setDenom] = useState<DenomGuess | null>(null);
  const [scanning, setScanning] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const result = useMemo(() => {
    if (!stats || !denom) return null;
    return scoreAuthenticity(stats, confirmed.size, SECURITY_FEATURES.length, denom);
  }, [stats, denom, confirmed]);

  const runAnalysis = useCallback((canvas: HTMLCanvasElement) => {
    setPreviewUrl(canvas.toDataURL('image/png'));
    setAnalyzed(false);
    setScanning(true);
    setConfirmed(new Set());
    // Let the scan animation play, then reveal results.
    window.setTimeout(() => {
      const s = canvasToStats(canvas);
      setStats(s);
      setDenom(guessDenomination(s));
      setScanning(false);
      setAnalyzed(true);
    }, 1500);
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        runAnalysis(imageToWorkingCanvas(img));
        URL.revokeObjectURL(url);
      };
      img.src = url;
    },
    [runAnalysis]
  );

  const loadSample = useCallback(
    (value: number, quality: 'clear' | 'photocopy') => {
      runAnalysis(drawMockNote(value, quality));
    },
    [runAnalysis]
  );

  const reset = () => {
    setPreviewUrl(null);
    setStats(null);
    setDenom(null);
    setAnalyzed(false);
    setConfirmed(new Set());
  };

  const toggleFeature = (id: string) => {
    setConfirmed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const meta = result ? VERDICT_META[result.verdict] : null;

  return (
    <div className="space-y-5">
      {/* Honest disclaimer */}
      <div className="flex items-start gap-2.5 rounded-xl border border-saffron/30 bg-saffron/10 px-4 py-2.5">
        <Info className="h-4 w-4 text-saffron mt-0.5 shrink-0" />
        <p className="text-xs text-saffron/90">
          <span className="font-semibold text-saffron">Assistive demo detector.</span> This tool
          estimates authenticity from a photo plus your visual checks. It helps you verify a note
          manually — it is not a substitute for a bank or RBI counting/UV machine.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: capture */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ScanLine className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Capture the note</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Upload a clear, flat photo of the front of the banknote, or try a synthetic sample.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dropzone / preview */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f && f.type.startsWith('image/')) handleFile(f);
                }}
                onClick={() => !previewUrl && fileRef.current?.click()}
                className={`relative overflow-hidden rounded-xl border border-dashed transition-colors ${
                  previewUrl
                    ? 'border-border'
                    : 'border-border/70 hover:border-primary/50 cursor-pointer'
                }`}
                style={{ aspectRatio: '2.15 / 1' }}
              >
                {previewUrl ? (
                  <>
                    <img src={previewUrl} alt="Note preview" className="h-full w-full object-cover" />
                    {scanning && (
                      <div className="absolute inset-0 bg-background/30">
                        <div className="absolute left-0 right-0 h-14 animate-scan bg-gradient-to-b from-transparent via-primary/40 to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="flex items-center gap-2 text-xs font-medium text-primary bg-background/70 px-3 py-1.5 rounded-full">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Scanning security features…
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Upload className="h-7 w-7" />
                    <span className="text-xs">Drop a note image or click to browse</span>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Upload photo
                </Button>
                {previewUrl && (
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={reset}>
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                    Reset
                  </Button>
                )}
              </div>

              <Separator />

              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">
                  Try a synthetic sample
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLES.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => loadSample(s.value, s.quality)}
                      className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-secondary border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                    >
                      <Banknote className="h-3 w-3" />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: results + checklist */}
        <div className="lg:col-span-3 space-y-5">
          <AnimatePresence mode="wait">
            {!analyzed ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="border-dashed">
                  <CardContent className="py-14 flex flex-col items-center justify-center text-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <ScanLine className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-foreground">No note scanned yet</p>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      Upload a photo or pick a sample. You'll get a denomination guess, an
                      authenticity estimate, and a security-feature checklist to confirm.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              result &&
              denom &&
              meta && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-5"
                >
                  {/* Verdict + gauge */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="relative shrink-0">
                          <svg width="120" height="120" viewBox="0 0 140 140">
                            <circle cx="70" cy="70" r="58" fill="none" stroke="hsl(var(--border))" strokeWidth="9" />
                            <motion.circle
                              cx="70"
                              cy="70"
                              r="58"
                              fill="none"
                              stroke={meta.color}
                              strokeWidth="9"
                              strokeLinecap="round"
                              strokeDasharray={2 * Math.PI * 58}
                              initial={{ strokeDashoffset: 2 * Math.PI * 58 }}
                              animate={{
                                strokeDashoffset: 2 * Math.PI * 58 - (result.score / 100) * 2 * Math.PI * 58,
                              }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                              transform="rotate(-90 70 70)"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold tabular-nums" style={{ color: meta.color }}>
                              {result.score}
                            </span>
                            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
                              Confidence
                            </span>
                          </div>
                        </div>

                        <div className="flex-1 text-center sm:text-left space-y-2">
                          <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${meta.tint}`}>
                            <meta.Icon className="h-4 w-4" />
                            {meta.label}
                          </div>
                          <div className="flex items-center gap-2 justify-center sm:justify-start">
                            <Banknote className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-foreground font-medium">{denom.name}</span>
                            <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                              {Math.round(denom.confidence * 100)}% colour match
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Confirm the security features below — each one you can verify raises the
                            confidence score.
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 space-y-1.5">
                        {result.reasons.map((r, i) => (
                          <div key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                            <span className="mt-1 h-1 w-1 rounded-full bg-muted-foreground/60 shrink-0" />
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Security-feature checklist */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Security-feature checklist</CardTitle>
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          {confirmed.size}/{SECURITY_FEATURES.length} confirmed
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {SECURITY_FEATURES.map((f) => {
                        const on = confirmed.has(f.id);
                        return (
                          <button
                            key={f.id}
                            onClick={() => toggleFeature(f.id)}
                            className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors ${
                              on
                                ? 'border-india/40 bg-india/10'
                                : 'border-border/60 bg-secondary/40 hover:border-border'
                            }`}
                          >
                            {on ? (
                              <CheckCircle2 className="h-4 w-4 text-india mt-0.5 shrink-0" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground/50 mt-0.5 shrink-0" />
                            )}
                            <div>
                              <p className={`text-xs font-medium ${on ? 'text-india' : 'text-foreground'}`}>
                                {f.label}
                              </p>
                              <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">{f.hint}</p>
                            </div>
                          </button>
                        );
                      })}
                    </CardContent>
                  </Card>

                  {/* Actions when suspect */}
                  {result.verdict !== 'GENUINE' && (
                    <div className="rounded-xl border border-destructive/25 bg-destructive/10 p-3.5">
                      <p className="text-xs font-semibold text-destructive mb-1.5">If you suspect a fake note</p>
                      <ul className="text-[11px] text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Do not spend or pass it on — circulating counterfeit currency is a criminal offence.</li>
                        <li>Note where you received it and take it to your bank branch for verification.</li>
                        <li>Report to your local police or the cyber-crime helpline <a href="tel:1930" className="text-primary underline">1930</a>.</li>
                      </ul>
                    </div>
                  )}
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
