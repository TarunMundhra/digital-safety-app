'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Phone, AlertTriangle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AlertItem {
  id: string;
  callerNumber: string;
  riskScore: number;
  createdAt: string;
  signals: { signalType: string; detail: string; weight: number }[];
}

function getRiskBadge(score: number) {
  if (score > 80) return { label: 'CRITICAL', variant: 'destructive' as const, border: 'border-l-rose-500' };
  if (score > 50) return { label: 'HIGH', variant: 'destructive' as const, border: 'border-l-amber-500' };
  if (score > 25) return { label: 'MEDIUM', variant: 'secondary' as const, border: 'border-l-yellow-500' };
  return { label: 'LOW', variant: 'secondary' as const, border: 'border-l-emerald-500' };
}

function maskNumber(num: string) {
  if (!num || num === 'ANONYMOUS_CITIZEN') return 'Anonymous';
  return num.replace(/(.{4}).+(.{3})/, '$1****$2');
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function RecentAlerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/scam/sessions?limit=10')
      .then((r) => r.json())
      .then((data) => {
        setAlerts(
          data.map((s: AlertItem) => ({
            ...s,
            signals: s.signals || [],
          }))
        );
      })
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-slate-800/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <Shield className="h-12 w-12 mb-3 opacity-30" />
        <p className="text-sm">No alerts yet</p>
        <p className="text-xs mt-1">Analyzed sessions will appear here</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-96">
      <div className="space-y-2 pr-2">
        {alerts.map((alert, i) => {
          const badge = getRiskBadge(alert.riskScore);
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`border-l-2 ${badge.border} bg-slate-800/30 rounded-r-lg p-3 hover:bg-slate-800/60 transition-colors cursor-pointer`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-sm text-slate-200 font-mono">{maskNumber(alert.callerNumber)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={badge.variant} className="text-[10px] px-1.5 py-0 h-5">
                    {badge.label}
                  </Badge>
                  <span className="text-xs font-semibold text-slate-300 tabular-nums">
                    {alert.riskScore.toFixed(0)}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {alert.signals.slice(0, 3).map((sig, j) => (
                  <span
                    key={j}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400"
                  >
                    {sig.signalType}
                  </span>
                ))}
                {alert.signals.length > 3 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-500">
                    +{alert.signals.length - 3}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <Clock className="h-3 w-3" />
                <span>{timeAgo(alert.createdAt)}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </ScrollArea>
  );
}