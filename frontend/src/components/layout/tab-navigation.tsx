'use client';

import {
  LayoutDashboard,
  ShieldCheck,
  PhoneCall,
  Network,
  MapPin,
  GitMerge,
} from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'shield', label: 'Fraud Shield', icon: ShieldCheck },
  { id: 'sessions', label: 'Sessions', icon: PhoneCall },
  { id: 'graph', label: 'Graph Intel', icon: Network },
  { id: 'hotspots', label: 'Hotspots', icon: MapPin },
  { id: 'fusion', label: 'Fusion', icon: GitMerge },
] as const;

type TabId = (typeof tabs)[number]['id'];

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
      <ScrollArea className="w-full">
        <nav className="flex min-w-max px-4 md:px-6" role="tablist">
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
                  relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? 'text-emerald-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }
                `}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-400' : ''}`} />
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" />
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