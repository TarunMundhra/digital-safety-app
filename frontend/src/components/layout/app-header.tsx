'use client';

import { Shield, Activity, Clock, AlertTriangle, Wifi } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function AppHeader() {
  return (
    <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">PSCI</h1>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/50 text-emerald-400 font-normal">
                v2.0
              </Badge>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Digital Public Safety Intelligence Platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
            <Wifi className="h-3.5 w-3.5 text-emerald-400" />
            <span>System Online</span>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
            <Clock className="h-3.5 w-3.5" />
            <span>Live Monitoring Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">ACTIVE</span>
          </div>
          <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full px-2.5 py-1">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
            <span className="text-xs text-rose-400 font-semibold">3</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-400" />
            <div className="hidden sm:flex flex-col">
              <span className="text-[10px] text-slate-500 leading-none">UPTIME</span>
              <span className="text-xs text-slate-300 font-mono leading-tight">99.7%</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}