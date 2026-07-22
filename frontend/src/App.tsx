import { useState, useEffect } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { TabNavigation } from '@/components/layout/tab-navigation';
import { StatBar } from '@/components/layout/stat-bar';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { ThreatLevelGauge } from '@/components/dashboard/threat-level-gauge';
import { RecentAlerts } from '@/components/dashboard/recent-alerts';
import { TrendChart } from '@/components/dashboard/trend-chart';
import { ShieldPanel } from '@/components/shield/shield-panel';
import { NoteVerifyPanel } from '@/components/note/note-verify-panel';
import { SessionTable } from '@/components/sessions/session-table';
import { NetworkGraph } from '@/components/graph/network-graph';
import { HotspotMap } from '@/components/geo/hotspot-map';
import { FusionPanel } from '@/components/fusion/fusion-panel';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [overallThreat, setOverallThreat] = useState<{ level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; score: number }>({ level: 'LOW', score: 0 });
  const [seeded, setSeeded] = useState(false);

  // Synchronize tab state with URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      const validTabs = ['dashboard', 'shield', 'note', 'sessions', 'graph', 'hotspots', 'fusion'];
      if (validTabs.includes(hash)) {
        setActiveTab(hash);
      } else {
        setActiveTab('dashboard');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    window.location.hash = `#/${tab}`;
  };

  // Seed the database on first load
  useEffect(() => {
    async function seed() {
      try {
        const res = await fetch('/api/seed', { method: 'POST' });
        if (res.ok) setSeeded(true);
      } catch {
        // Seed may have already run
        setSeeded(true);
      }
    }
    seed();
  }, []);

  // Fetch overall threat level
  useEffect(() => {
    if (!seeded) return;
    async function fetchThreat() {
      try {
        const res = await fetch('/api/scam/sessions?limit=100');
        const sessions = await res.json();
        if (sessions.length > 0) {
          const avgRisk = sessions.reduce((s: number, session: { riskScore: number }) => s + session.riskScore, 0) / sessions.length;
          const highRisk = sessions.filter((s: { riskScore: number }) => s.riskScore > 80).length;
          let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
          if (highRisk > 5) level = 'CRITICAL';
          else if (highRisk > 2) level = 'HIGH';
          else if (avgRisk > 40) level = 'MEDIUM';
          setOverallThreat({ level, score: Math.round(avgRisk) });
        }
      } catch { /* */ }
    }
    fetchThreat();
    const interval = setInterval(fetchThreat, 30000);
    return () => clearInterval(interval);
  }, [seeded]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <KpiCards />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="glass-panel border border-border/70 rounded-xl p-6 flex flex-col items-center justify-center h-full shadow-lg shadow-black/20">
                  <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-4">Overall Threat Level</h3>
                  <ThreatLevelGauge level={overallThreat.level} score={overallThreat.score} />
                </div>
              </div>
              <div className="lg:col-span-2 space-y-6">
                <TrendChart />
              </div>
            </div>
            <div>
              <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                Recent Alerts
              </h3>
              <RecentAlerts />
            </div>
          </div>
        );
      case 'shield':
        return <ShieldPanel />;
      case 'note':
        return <NoteVerifyPanel />;
      case 'sessions':
        return <SessionTable />;
      case 'graph':
        return <NetworkGraph />;
      case 'hotspots':
        return <HotspotMap />;
      case 'fusion':
        return <FusionPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen text-foreground flex flex-col">
      <AppHeader />
      <StatBar />
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        {renderTabContent()}
      </main>
      <footer className="border-t border-border/50 bg-background/40 py-3 px-4 md:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>PSCI Platform v2.0</span>
            <span className="text-border">|</span>
            <span>Digital Public Safety Intelligence</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Report Scams: <a href="tel:1930" className="text-foreground/80 hover:text-primary transition-colors">1930</a></span>
            <span className="text-border">|</span>
            <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" className="hover:text-primary underline decoration-border underline-offset-2 transition-colors">cybercrime.gov.in</a>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-india" />
              All systems operational
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}