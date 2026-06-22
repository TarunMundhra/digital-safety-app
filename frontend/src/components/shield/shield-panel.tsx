'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Loader2, Phone, Video, AlertTriangle, CheckCircle2, Info, ChevronRight, AlertOctagon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

interface AnalysisResult {
  verdict: string;
  nextSteps: string;
  riskScore: number;
  matchedSignals: { signalType: string; detail: string; weight: number }[];
  threatLevel: string;
}

const SAMPLE_TRANSCRIPTS = [
  {
    label: 'Digital Arrest Scam',
    text: 'Hello, I am Officer Sharma from CBI headquarters. We have detected illegal transactions linked to your Aadhaar number. An FIR has been filed against you and there is an arrest warrant issued by the court. You need to stay on this video call and not disconnect until we verify your identity. Please share your bank account details and UPI PIN for verification. This is urgent, do it immediately.',
  },
  {
    label: 'OTP / UPI Fraud',
    text: 'Sir, your account has been compromised. We need to verify your identity urgently. Please tell me the OTP that was just sent to your phone. This is from RBI security department. If you do not share the OTP within 5 minutes, your account will be permanently blocked.',
  },
  {
    label: 'Legitimate Call',
    text: 'Hello, this is Priya from your bank customer service. We are calling to inform you about our new fixed deposit scheme offering 7.5% interest. Would you like to know more details about this? There is no urgency, you can call us back at our toll-free number anytime.',
  },
  {
    label: 'KYC Scam',
    text: 'Your KYC has expired and your bank account will be suspended in 24 hours. Click the link I am sending to update your PAN and Aadhaar details immediately. This is from the verification department. Do not tell anyone about this call.',
  },
];

function getThreatColor(level: string) {
  switch (level) {
    case 'CRITICAL': return { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', glow: 'shadow-rose-500/20' };
    case 'HIGH': return { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', glow: 'shadow-orange-500/20' };
    case 'MEDIUM': return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', glow: 'shadow-amber-500/20' };
    default: return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', glow: 'shadow-emerald-500/20' };
  }
}

export function ShieldPanel() {
  const [transcript, setTranscript] = useState('');
  const [callerNumber, setCallerNumber] = useState('');
  const [isVideo, setIsVideo] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showHighRiskAlert, setShowHighRiskAlert] = useState(false);
  const [hotspots, setHotspots] = useState<any[]>([]);

  // Fetch hotspots to display on the threat map
  useEffect(() => {
    async function loadHotspots() {
      try {
        const res = await fetch('/api/geo/hotspots?days=30');
        const data = await res.json();
        setHotspots(data.hotspots || []);
      } catch {
        setHotspots([]);
      }
    }
    loadHotspots();
  }, []);

  const analyze = async (transcriptToAnalyze?: string) => {
    const text = transcriptToAnalyze || transcript;
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/shield/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: text }),
      });
      const data = await res.json();
      setResult(data);
      if (data.riskScore > 70) {
        setShowHighRiskAlert(true);
      }
    } catch {
      setResult({ verdict: 'Analysis failed. Please try again.', nextSteps: '', riskScore: 0, matchedSignals: [], threatLevel: 'LOW' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const targetTranscript = localStorage.getItem('shield_target_transcript');
    const targetCaller = localStorage.getItem('shield_target_caller');
    const targetVideo = localStorage.getItem('shield_target_video');

    if (targetTranscript) {
      setTranscript(targetTranscript);
      if (targetCaller) setCallerNumber(targetCaller);
      if (targetVideo) setIsVideo(targetVideo === 'true');
      
      localStorage.removeItem('shield_target_transcript');
      localStorage.removeItem('shield_target_caller');
      localStorage.removeItem('shield_target_video');
      
      analyze(targetTranscript);
    }
  }, []);

  const loadSample = (text: string) => {
    setTranscript(text);
    setResult(null);
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-[600px] lg:h-[620px]">
        {/* Left Column: Input + Results (40% width / 2 cols) */}
        <div className="lg:col-span-2 h-full">
          <ScrollArea className="h-full pr-2 lg:h-[620px]">
            <div className="space-y-6 pb-6">
              {/* Input Panel */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <Card className="bg-slate-900/50 border-slate-700/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-emerald-400" />
                      <CardTitle className="text-base text-slate-200">Citizen Fraud Shield</CardTitle>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Enter the call transcript you received. Our AI engine will analyze it for known scam patterns.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="Paste the suspicious call transcript here... e.g., 'This is CBI calling, there is a warrant for your arrest...'"
                      className="min-h-[160px] bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-500 resize-none focus-visible:ring-emerald-500/30 text-xs"
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                    />

                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label className="text-xs text-slate-400">Caller Number (optional)</Label>
                        <Input
                          placeholder="+91 XXXXX XXXXX"
                          className="mt-1 h-8 bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-500 focus-visible:ring-emerald-500/30 text-xs"
                          value={callerNumber}
                          onChange={(e) => setCallerNumber(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-5">
                        <Label className="text-xs text-slate-400">
                          <Video className="h-3.5 w-3.5 inline mr-1" />
                          Video
                        </Label>
                        <Switch checked={isVideo} onCheckedChange={setIsVideo} />
                      </div>
                    </div>

                    <Button
                      onClick={() => analyze()}
                      disabled={loading || !transcript.trim()}
                      className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-medium text-xs py-1.5 h-8 shadow-lg shadow-emerald-500/20"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="h-4 w-4 mr-2" />
                          Analyze Threat
                        </>
                      )}
                    </Button>

                    <Separator className="bg-slate-800" />

                    <div>
                      <p className="text-[10px] text-slate-500 mb-1.5">Quick-load sample transcripts:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {SAMPLE_TRANSCRIPTS.map((sample) => (
                          <button
                            key={sample.label}
                            onClick={() => loadSample(sample.text)}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/70 border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600/50 transition-colors"
                          >
                            {sample.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Results Panel */}
              <AnimatePresence mode="wait">
                {result && !loading && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Card className="bg-slate-900/50 border-slate-700/50">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          {result.riskScore > 70 ? (
                            <AlertOctagon className="h-5 w-5 text-rose-400" />
                          ) : result.riskScore > 40 ? (
                            <AlertTriangle className="h-5 w-5 text-amber-400" />
                          ) : (
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          )}
                          <CardTitle className="text-base text-slate-200">Analysis Results</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Score Circle */}
                        <div className="flex justify-center">
                          <div className="relative">
                            <svg width="110" height="110" viewBox="0 0 140 140">
                              <circle cx="70" cy="70" r="58" fill="none" stroke="currentColor" className="text-slate-800" strokeWidth="8" />
                              <motion.circle
                                cx="70" cy="70" r="58" fill="none"
                                stroke={result.riskScore > 70 ? '#f43f5e' : result.riskScore > 40 ? '#f59e0b' : '#10b981'}
                                strokeWidth="8" strokeLinecap="round"
                                strokeDasharray={2 * Math.PI * 58}
                                initial={{ strokeDashoffset: 2 * Math.PI * 58 }}
                                animate={{ strokeDashoffset: 2 * Math.PI * 58 - (result.riskScore / 100) * 2 * Math.PI * 58 }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                transform="rotate(-90 70 70)"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-2xl font-bold text-slate-100 tabular-nums">{result.riskScore.toFixed(0)}</span>
                              <span className="text-[9px] text-slate-400 uppercase tracking-wider">Risk Score</span>
                            </div>
                          </div>
                        </div>

                        {/* Verdict */}
                        <div className={`text-center p-2.5 rounded-lg border text-xs ${getThreatColor(result.threatLevel).bg} ${getThreatColor(result.threatLevel).border}`}>
                          <p className={`font-semibold ${getThreatColor(result.threatLevel).text}`}>
                            {result.verdict}
                          </p>
                        </div>

                        {/* Signal Badges */}
                        {result.matchedSignals && result.matchedSignals.length > 0 && (
                          <div>
                            <p className="text-[10px] text-slate-400 font-medium mb-1.5">DETECTED SIGNALS</p>
                            <div className="flex flex-wrap gap-1.5">
                              {result.matchedSignals.map((sig, i) => (
                                <Badge key={sig.signalType} variant="outline" className="text-[9px] border-rose-500/30 text-rose-400 bg-rose-500/5 px-2 py-0.5">
                                  {sig.signalType} ({sig.weight.toFixed(0)})
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Severity Bar */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-slate-400">Severity</span>
                            <span className={`text-[10px] font-semibold ${getThreatColor(result.threatLevel).text}`}>
                              {result.threatLevel}
                            </span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${result.riskScore}%` }}
                              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                              className="h-full rounded-full"
                              style={{
                                background: result.riskScore > 70
                                  ? 'linear-gradient(90deg, #f59e0b, #f43f5e)'
                                  : result.riskScore > 40
                                  ? 'linear-gradient(90deg, #f59e0b, #f97316)'
                                  : 'linear-gradient(90deg, #10b981, #34d399)',
                              }}
                            />
                          </div>
                        </div>

                        {/* Next Steps */}
                        {result.nextSteps && (
                          <div>
                            <p className="text-[10px] text-slate-400 font-medium mb-1.5">RECOMMENDED ACTIONS</p>
                            <div className="bg-slate-800/40 rounded-lg p-2.5 space-y-1.5">
                              {result.nextSteps.split('\n').filter(Boolean).map((step, i) => (
                                <div key={i} className="flex items-start gap-1.5">
                                  <ChevronRight className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                                  <span className="text-[11px] text-slate-300">{step.replace(/^\d+\.\s*/, '')}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>

        {/* Right Column: Interactive Map Area (60% width / 3 cols) */}
        <div className="lg:col-span-3 h-full">
          <Card className="bg-slate-900/50 border-slate-700/50 overflow-hidden h-full flex flex-col lg:h-[620px]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                <h3 className="text-sm font-semibold text-slate-200">Threat Geospatial Distribution</h3>
              </div>
              <span className="text-[10px] text-slate-400">
                {hotspots.length} Active Hotspot Areas
              </span>
            </div>
            <div className="w-full relative z-10 flex-1 min-h-[450px] lg:h-[540px]">
              <MapContainer center={[22.9734, 78.6569]} zoom={5} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                />
                {hotspots.map((hotspot: any, idx: number) => {
                  const lat = hotspot.latitude;
                  const lng = hotspot.longitude;
                  if (!lat || !lng) return null;
                  
                  return (
                    <CircleMarker 
                      key={idx} 
                      center={[lat, lng]} 
                      radius={Math.max(6, Math.min(22, hotspot.reportCount * 3.5))}
                      color="#f43f5e"
                      fillColor="#f43f5e"
                      fillOpacity={0.4}
                      weight={2}
                    >
                      <Popup>
                        <div className="p-1 text-slate-900">
                          <h4 className="font-bold text-xs">{hotspot.city}, {hotspot.state}</h4>
                          <p className="text-[10px] mt-1">Total Reports: {hotspot.reportCount}</p>
                          <p className="text-[10px]">Severity Level: {hotspot.severity}/5</p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* High Risk Alert Dialog */}
      <AlertDialog open={showHighRiskAlert} onOpenChange={setShowHighRiskAlert}>
        <AlertDialogContent className="bg-slate-900 border-rose-500/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-400 flex items-center gap-2">
              <AlertOctagon className="h-5 w-5" />
              High Risk Alert
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              This transcript shows strong indicators of a digital arrest scam. The caller may be impersonating a law enforcement officer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 my-2">
            <p className="text-xs text-rose-300 font-medium mb-1">Immediate actions:</p>
            <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
              <li>Do NOT share any OTP, UPI PIN, or bank details</li>
              <li>Disconnect the call immediately</li>
              <li>Report to 1930 or cybercrime.gov.in</li>
              <li>Block the caller number</li>
            </ul>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
              Dismiss
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={() => setShowHighRiskAlert(false)}
            >
              I Understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}