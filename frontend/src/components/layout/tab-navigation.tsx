'use client';

import {
  LayoutDashboard,
  ShieldCheck,
  ScanLine,
  PhoneCall,
  Network,
  MapPin,
  GitMerge,
} from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'shield', label: 'Fraud Shield', icon: ShieldCheck },
  { id: 'note', label: 'Note Verify', icon: ScanLine },
  { id: 'sessions', label: 'Sessions', icon: PhoneCall },
  { id: 'graph', label: 'Graph Intel', icon: Network },
  { id: 'hotspots', label: 'Hotspots', icon: MapPin },
  { id: 'fusion', label: 'Fusion', icon: GitMerge },
] as const;

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="border-b border-border/60 bg-background/40 backdrop-blur-sm">
      <ScrollArea className="w-full">
        <nav className="flex min-w-max px-4 md:px-6 gap-1" role="tablist">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative flex items-center gap-2 px-3.5 py-3 text-sm font-medium transition-colors duration-200 rounded-t-md
                  ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {isActive && (
                  <span className="tricolor-strip absolute bottom-0 left-2 right-2 h-0.5 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </div>
  );
}
