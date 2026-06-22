'use client';

import { useEffect, useState } from 'react';
import { Activity, Database, Globe, Shield } from 'lucide-react';

export function StatBar() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('en-IN', { hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="border-b border-slate-800/50 bg-slate-950/50">
      <div className="px-4 md:px-6 py-1.5 flex items-center gap-6 text-[11px] text-slate-500 overflow-x-auto">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Activity className="h-3 w-3 text-emerald-500" />
          <span>Real-time Monitoring</span>
        </div>
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Database className="h-3 w-3" />
          <span>SQLite Connected</span>
        </div>
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Globe className="h-3 w-3" />
          <span>28 States Monitored</span>
        </div>
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Shield className="h-3 w-3 text-amber-500" />
          <span>Scam Detection Engine Active</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5 whitespace-nowrap font-mono">
          <span className="text-slate-600">IST</span>
          <span className="text-slate-400">{time}</span>
        </div>
      </div>
    </div>
  );
}