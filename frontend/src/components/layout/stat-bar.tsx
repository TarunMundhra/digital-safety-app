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
    <div className="border-b border-border/50 bg-background/30">
      <div className="px-4 md:px-6 py-1.5 flex items-center gap-6 text-[11px] text-muted-foreground overflow-x-auto">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Activity className="h-3 w-3 text-primary" />
          <span>Real-time monitoring</span>
        </div>
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Database className="h-3 w-3 text-india" />
          <span>PostgreSQL connected</span>
        </div>
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Globe className="h-3 w-3 text-saffron" />
          <span>28 states monitored</span>
        </div>
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Shield className="h-3 w-3 text-primary" />
          <span>Scam detection engine active</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5 whitespace-nowrap font-mono">
          <span className="text-muted-foreground/60">IST</span>
          <span className="text-foreground/70">{time}</span>
        </div>
      </div>
    </div>
  );
}
