'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, GitMerge, Eye, Phone, Video, Clock, ArrowUpDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

interface SessionRow {
  id: string;
  callerNumber: string;
  stateCode: string;
  riskScore: number;
  durationSeconds: number;
  isVideo: boolean;
  createdAt: string;
  signals: { signalType: string; detail: string; weight: number }[];
  transcriptText?: string;
  _count?: { signals: number };
}

function maskNumber(num: string) {
  if (!num || num === 'ANONYMOUS_CITIZEN') return 'Anonymous';
  return num.replace(/(.{4}).+(.{3})/, '$1****$2');
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function riskBadge(score: number) {
  if (score > 80) return <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30 text-[11px]">CRITICAL</Badge>;
  if (score > 50) return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30 text-[11px]">HIGH</Badge>;
  if (score > 25) return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30 text-[11px]">MEDIUM</Badge>;
  return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30 text-[11px]">LOW</Badge>;
}

export function SessionTable() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [selectedSession, setSelectedSession] = useState<SessionRow | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/api/scam/sessions?limit=50';
      if (stateFilter !== 'all') url += `&stateCode=${stateFilter}`;
      if (riskFilter !== 'all') url += `&minRisk=${riskFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      setSessions(data);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [stateFilter, riskFilter]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const filtered = sessions.filter((s) => {
    if (search && !s.callerNumber.toLowerCase().includes(search.toLowerCase()) && !s.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleFusion = async (sessionId: string) => {
    try {
      await fetch('/api/fusion/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callSessionId: sessionId }),
      });
      fetchSessions();
    } catch { /* */ }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base text-slate-200 flex items-center gap-2">
              <Phone className="h-4 w-4 text-emerald-400" />
              Call Session Analysis
              {!loading && <span className="text-xs text-slate-500 font-normal">({sessions.length} sessions)</span>}
            </CardTitle>
          </div>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2 mt-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <Input
                placeholder="Search by session ID or number..."
                className="pl-8 h-8 text-xs bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="w-full sm:w-32 h-8 text-xs bg-slate-800/50 border-slate-700/50">
                <Filter className="h-3 w-3 mr-1 text-slate-500" />
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all" className="text-xs">All States</SelectItem>
                {['DL', 'MH', 'KA', 'TS', 'TN', 'WB', 'RJ', 'UP', 'GJ', 'MP'].map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-full sm:w-36 h-8 text-xs bg-slate-800/50 border-slate-700/50">
                <ArrowUpDown className="h-3 w-3 mr-1 text-slate-500" />
                <SelectValue placeholder="Min Risk" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all" className="text-xs">All Risk Levels</SelectItem>
                <SelectItem value="25" className="text-xs">Medium (25+)</SelectItem>
                <SelectItem value="50" className="text-xs">High (50+)</SelectItem>
                <SelectItem value="80" className="text-xs">Critical (80+)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[500px]">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 bg-slate-800/50 rounded" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-slate-500">
                <Phone className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm">No sessions found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-[11px] text-slate-400 font-medium">ID</TableHead>
                    <TableHead className="text-[11px] text-slate-400 font-medium">Caller</TableHead>
                    <TableHead className="text-[11px] text-slate-400 font-medium hidden md:table-cell">State</TableHead>
                    <TableHead className="text-[11px] text-slate-400 font-medium">Risk</TableHead>
                    <TableHead className="text-[11px] text-slate-400 font-medium hidden lg:table-cell">Type</TableHead>
                    <TableHead className="text-[11px] text-slate-400 font-medium hidden lg:table-cell">Duration</TableHead>
                    <TableHead className="text-[11px] text-slate-400 font-medium hidden sm:table-cell">Signals</TableHead>
                    <TableHead className="text-[11px] text-slate-400 font-medium hidden xl:table-cell">Date</TableHead>
                    <TableHead className="text-[11px] text-slate-400 font-medium text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((session, i) => (
                    <motion.tr
                      key={session.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className={`border-slate-800/50 hover:bg-slate-800/30 cursor-pointer transition-colors ${
                        selectedSession?.id === session.id ? 'bg-slate-800/60' : ''
                      }`}
                      onClick={() => setSelectedSession(selectedSession?.id === session.id ? null : session)}
                    >
                      <TableCell className="py-2.5 text-xs font-mono text-slate-400 max-w-[80px] truncate">
                        {session.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="py-2.5 text-xs font-mono text-slate-200">
                        {maskNumber(session.callerNumber)}
                      </TableCell>
                      <TableCell className="py-2.5 hidden md:table-cell">
                        <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">{session.stateCode}</Badge>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-2">
                          {riskBadge(session.riskScore)}
                          <span className="text-xs font-semibold text-slate-300 tabular-nums">{session.riskScore.toFixed(0)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5 hidden lg:table-cell">
                        {session.isVideo ? (
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Video className="h-3 w-3 text-rose-400" /> Video
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Phone className="h-3 w-3 text-slate-500" /> Voice
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-2.5 hidden lg:table-cell text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(session.durationSeconds)}
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5 hidden sm:table-cell">
                        <div className="flex gap-1 flex-wrap max-w-[140px]">
                          {session.signals?.slice(0, 2).map((sig, j) => (
                            <span key={j} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 whitespace-nowrap">
                              {sig.signalType}
                            </span>
                          ))}
                          {(session.signals?.length || 0) > 2 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">
                              +{session.signals.length - 2}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5 hidden xl:table-cell text-xs text-slate-500">
                        {new Date(session.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell className="py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[11px] text-slate-400 hover:text-emerald-400"
                            onClick={() => setSelectedSession(selectedSession?.id === session.id ? null : session)}
                          >
                            <Eye className="h-3 w-3 mr-1" /> Details
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[11px] text-slate-400 hover:text-amber-400"
                            onClick={() => handleFusion(session.id)}
                          >
                            <GitMerge className="h-3 w-3 mr-1" /> Fusion
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>

          {/* Detail Panel */}
          {selectedSession && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-slate-700/50 bg-slate-800/30 p-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-medium text-slate-400 mb-2">TRANSCRIPT</h4>
                  <p className="text-xs text-slate-300 bg-slate-900/50 rounded p-3 max-h-32 overflow-y-auto leading-relaxed">
                    {selectedSession.transcriptText || 'No transcript available'}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-slate-400 mb-2">DETECTED SIGNALS ({selectedSession.signals?.length || 0})</h4>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {selectedSession.signals?.map((sig, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-900/50 rounded px-2.5 py-1.5">
                        <span className="text-[11px] text-slate-300">{sig.signalType}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 max-w-[200px] truncate hidden sm:block">{sig.detail}</span>
                          <Badge variant="outline" className="text-[10px] border-rose-500/30 text-rose-400 h-4 px-1">{sig.weight.toFixed(0)}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}