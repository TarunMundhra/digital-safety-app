'use client';

import { ShieldHalf, Clock, AlertTriangle, Wifi } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      {/* India tricolor cue */}
      <div className="tricolor-strip h-[3px] w-full" />
      <div className="px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-india flex items-center justify-center shadow-lg shadow-primary/25 ring-1 ring-white/10">
              <ShieldHalf className="h-5 w-5 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-india border-2 border-background animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-foreground tracking-tight">PSCI</h1>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/40 text-primary font-medium bg-primary/5">
                v2.0
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Digital Public Safety Intelligence Platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <Wifi className="h-3.5 w-3.5 text-primary" />
            <span>System online</span>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-saffron" />
            <span>Live monitoring active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-india animate-pulse" />
            <span className="text-xs text-india font-semibold tracking-wide">ACTIVE</span>
          </div>
          <div className="flex items-center gap-1.5 bg-destructive/10 border border-destructive/25 rounded-full px-2.5 py-1">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            <span className="text-xs text-destructive font-semibold tabular-nums">3</span>
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-[10px] text-muted-foreground/70 leading-none uppercase tracking-wider">Uptime</span>
            <span className="text-xs text-foreground/80 font-mono leading-tight mt-0.5">99.7%</span>
          </div>
        </div>
      </div>
    </header>
  );
}
