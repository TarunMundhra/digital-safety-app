'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitMerge, Play, CheckCircle2, XCircle, Link2, AlertTriangle, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SessionOption {
  id: string;
  callerNumber: string;
  riskScore: number;
  stateCode: string;
}

interface FusionResult {
  callSessionId: string;
  originalRiskScore: number;
  fusedRiskScore: number;
  networkCorroborated: boolean;
  clusterId: string | null;
  recommendation: string;
}

export function FusionPanel() {
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FusionResult | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/scam/sessions?limit=50')
      .then((r) => r.json())
      .then((data) => {
        setSessions(data.map((s: SessionOption) => ({ id: s.id, callerNumber: s.callerNumber, riskScore: s.riskScore, stateCode: s.stateCode })));
      })
      .catch(() => setSessions([]))
      .finally(() => setSessionsLoading(false));
  }, []);

  const runFusion = async (idToRun?: string) => {
    const targetId = idToRun || selectedId;
    if (!targetId) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/fusion/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callSessionId: targetId }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ callSessionId: targetId, originalRiskScore: 0, fusedRiskScore: 0, networkCorroborated: false, clusterId: null, recommendation: 'Analysis failed' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionsLoading) return; // Wait until sessions are loaded
    
    const target = localStorage.getItem('fusion_target_session');
    if (target) {
      setSelectedId(target);
      localStorage.removeItem('fusion_target_session');
      runFusion(target);
    }
  }, [sessionsLoading]); // Run when sessions finish loading

  const selectedSession = sessions.find((s) => s.id === selectedId);
  const scoreDiff = result ? result.fusedRiskScore - result.originalRiskScore : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <GitMerge className="h-4 w-4 text-cyan-400" />
            <CardTitle className="text-base text-slate-200">Agentic Fusion Center</CardTitle>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Cross-reference call sessions with known fraud networks to boost detection accuracy through multi-source intelligence fusion.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Session Selector */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="text-xs text-slate-400 mb-1.5 block">Select Call Session</label>
                <Select value={selectedId} onValueChange={setSelectedId} disabled={sessionsLoading}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-slate-200">
                    <SelectValue placeholder={sessionsLoading ? 'Loading sessions...' : 'Choose a session to analyze'} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                    {sessions.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs">
                        <span className="font-mono">{s.id.slice(0, 8)}...</span>
                        <span className="ml-2 text-slate-400">{s.callerNumber}</span>
                        <span className="ml-2">—</span>
                        <span className={`ml-2 ${s.riskScore > 50 ? 'text-rose-400' : 'text-slate-400'}`}>{s.riskScore.toFixed(0)}pts</span>
                        <Badge variant="outline" className="ml-2 text-[9px] border-slate-600 text-slate-500 h-4">{s.stateCode}</Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => runFusion()}
                  disabled={loading || !selectedId}
                  className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white shadow-lg shadow-cyan-500/20"
                >
                  {loading ? (
                    <><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Analyzing...</>
                  ) : (
                    <><Play className="h-4 w-4 mr-2" />Run Fusion Analysis</>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Results */}
          <AnimatePresence mode="wait">
            {result && !loading && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {/* Score Comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Original Score */}
                  <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 text-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Original Risk</p>
                    <div className="relative inline-block">
                      <svg width="100" height="100" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" className="text-slate-700" strokeWidth="6" />
                        <motion.circle
                          cx="50" cy="50" r="38" fill="none"
                          stroke={result.originalRiskScore > 70 ? '#f43f5e' : result.originalRiskScore > 40 ? '#f59e0b' : '#10b981'}
                          strokeWidth="6" strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 38}
                          initial={{ strokeDashoffset: 2 * Math.PI * 38 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 38 - (result.originalRiskScore / 100) * 2 * Math.PI * 38 }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-slate-200 tabular-nums">
                        {result.originalRiskScore.toFixed(0)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Rule-based only</p>
                  </div>

                  {/* Arrow / Diff */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1 mb-2">
                      <Zap className="h-4 w-4 text-cyan-400" />
                      <span className="text-xs text-cyan-400 font-medium">Fusion</span>
                    </div>
                    {scoreDiff > 0 ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.5 }}
                        className="h-12 w-12 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center"
                      >
                        <span className="text-lg font-bold text-rose-400">+{scoreDiff.toFixed(0)}</span>
                      </motion.div>
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                        <span className="text-lg font-bold text-slate-500">+0</span>
                      </div>
                    )}
                    <p className="text-[10px] text-slate-500 mt-2">Network boost</p>
                  </div>

                  {/* Fused Score */}
                  <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 text-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Fused Risk</p>
                    <div className="relative inline-block">
                      <svg width="100" height="100" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" className="text-slate-700" strokeWidth="6" />
                        <motion.circle
                          cx="50" cy="50" r="38" fill="none"
                          stroke={result.fusedRiskScore > 70 ? '#f43f5e' : result.fusedRiskScore > 40 ? '#f59e0b' : '#10b981'}
                          strokeWidth="6" strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 38}
                          initial={{ strokeDashoffset: 2 * Math.PI * 38 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 38 - (result.fusedRiskScore / 100) * 2 * Math.PI * 38 }}
                          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
                          transform="rotate(-90 50 50)"
                          style={{ filter: 'drop-shadow(0 0 4px rgba(244,63,94,0.3))' }}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-slate-200 tabular-nums">
                        {result.fusedRiskScore.toFixed(0)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">With network intel</p>
                  </div>
                </div>

                {/* Corroboration Status */}
                <div className={`p-4 rounded-xl border ${
                  result.networkCorroborated
                    ? 'bg-rose-500/10 border-rose-500/30'
                    : 'bg-slate-800/40 border-slate-700/50'
                }`}>
                  <div className="flex items-center gap-3">
                    {result.networkCorroborated ? (
                      <>
                        <div className="h-10 w-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                          <AlertTriangle className="h-5 w-5 text-rose-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-rose-400" />
                            <span className="text-sm font-semibold text-rose-400">Network Corroborated</span>
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5">
                            This caller is linked to a known fraud cluster. Risk score has been boosted based on network intelligence.
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center">
                          <XCircle className="h-5 w-5 text-slate-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-400">No Network Corroboration</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            The caller was not found in any known fraud cluster. Original risk score remains unchanged.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Recommendation */}
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Link2 className="h-4 w-4 text-cyan-400" />
                    <span className="text-xs font-medium text-slate-300">FUSION RECOMMENDATION</span>
                  </div>
                  <p className="text-sm text-slate-200">
                    {result.recommendation}
                  </p>
                </div>

                {/* Cluster Reference */}
                {result.clusterId && (
                  <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-3.5 w-3.5 text-cyan-400" />
                      <span className="text-[11px] text-cyan-400 font-medium">Linked to Cluster:</span>
                      <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400 font-mono">
                        {result.clusterId.slice(0, 16)}...
                      </Badge>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {!result && !loading && (
            <div className="flex flex-col items-center py-12 text-slate-500">
              <GitMerge className="h-14 w-14 mb-3 opacity-15" />
              <p className="text-sm">Select a session and run fusion analysis</p>
              <p className="text-xs mt-1">Cross-reference intelligence will boost detection accuracy</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}