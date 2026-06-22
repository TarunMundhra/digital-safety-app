'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, RefreshCw, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Hotspot {
  state: string;
  city: string;
  latitude: number;
  longitude: number;
  reportCount: number;
  severity: number;
}

const STATE_NAMES: Record<string, string> = {
  DL: 'Delhi', MH: 'Maharashtra', KA: 'Karnataka', TS: 'Telangana',
  TN: 'Tamil Nadu', WB: 'West Bengal', RJ: 'Rajasthan', UP: 'Uttar Pradesh',
  GJ: 'Gujarat', MP: 'Madhya Pradesh', HR: 'Haryana', PB: 'Punjab',
  KL: 'Kerala', AP: 'Andhra Pradesh', OR: 'Odisha', BR: 'Bihar',
};

function severityColor(severity: number) {
  if (severity >= 4) return { fill: '#f43f5e', stroke: '#f43f5e', label: 'Critical', bg: 'bg-rose-500' };
  if (severity >= 3) return { fill: '#f97316', stroke: '#f97316', label: 'High', bg: 'bg-orange-500' };
  if (severity >= 2) return { fill: '#f59e0b', stroke: '#f59e0b', label: 'Medium', bg: 'bg-amber-500' };
  return { fill: '#10b981', stroke: '#10b981', label: 'Low', bg: 'bg-emerald-500' };
}

// Simplified India map outline as SVG path points (normalized to 600x600 viewBox)
const INDIA_OUTLINE = [
  [285,40],[310,35],[335,45],[355,55],[370,80],[380,100],[395,115],[405,130],
  [415,150],[425,165],[435,175],[445,195],[455,215],[465,230],[470,250],
  [475,275],[470,295],[460,310],[445,325],[430,340],[415,355],[400,370],
  [385,380],[370,395],[355,410],[340,425],[325,440],[310,455],[295,460],
  [280,455],[265,440],[250,430],[240,415],[230,400],[220,385],[210,370],
  [200,350],[190,335],[180,320],[175,300],[170,280],[168,260],[172,240],
  [180,220],[190,200],[200,185],[210,170],[220,155],[230,140],[240,125],
  [250,110],[260,95],[270,80],[280,60],[285,40]
];

export function HotspotMap() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null);

  const fetchHotspots = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/geo/hotspots?days=30');
      const data = await res.json();
      setHotspots(data.hotspots || []);
    } catch {
      setHotspots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotspots();
  }, []);

  // Convert lat/lng to SVG coordinates (simplified projection for India)
  const projectToSvg = (lat: number, lng: number) => {
    const x = (lng - 68) / (97 - 68) * 500 + 50;
    const y = (35 - lat) / (35 - 8) * 450 + 30;
    return { x, y };
  };

  const totalReports = hotspots.reduce((s, h) => s + h.reportCount, 0);
  const maxSeverity = Math.max(...hotspots.map((h) => h.severity), 1);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-rose-400" />
              <CardTitle className="text-base text-slate-200">Fraud Hotspot Map</CardTitle>
              <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">
                {hotspots.length} locations
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3 text-rose-400" />
                <span className="text-xs text-slate-400">{totalReports} total reports</span>
              </div>
              <Button
                variant="ghost" size="sm"
                className="h-7 px-2 text-xs text-slate-400 hover:text-emerald-400"
                onClick={fetchHotspots} disabled={loading}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[400px] md:h-[500px] bg-slate-800/30 rounded-xl animate-pulse" />
          ) : (
            <div className="relative">
              <svg viewBox="0 0 600 500" className="w-full h-auto max-h-[400px] md:max-h-[500px]">
                <defs>
                  <radialGradient id="hotspotGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                  </radialGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>

                {/* Background grid */}
                {[...Array(12)].map((_, i) => (
                  <line key={`vg-${i}`} x1={i * 50 + 25} y1="0" x2={i * 50 + 25} y2="500" stroke="#1e293b" strokeWidth="0.5" />
                ))}
                {[...Array(10)].map((_, i) => (
                  <line key={`hg-${i}`} x1="0" y1={i * 50 + 25} x2="600" y2={i * 50 + 25} stroke="#1e293b" strokeWidth="0.5" />
                ))}

                {/* India outline */}
                <polygon
                  points={INDIA_OUTLINE.map(p => p.join(',')).join(' ')}
                  fill="#0f172a" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.5"
                />

                {/* Hotspot markers */}
                {hotspots.map((hotspot, i) => {
                  const { x, y } = projectToSvg(hotspot.latitude, hotspot.longitude);
                  const sev = severityColor(hotspot.severity);
                  const baseRadius = Math.max(8, Math.min(25, hotspot.reportCount * 3));
                  const isHovered = hoveredHotspot === hotspot.city;

                  return (
                    <g key={hotspot.city} onMouseEnter={() => setHoveredHotspot(hotspot.city)} onMouseLeave={() => setHoveredHotspot(null)}>
                      {/* Pulse ring */}
                      <circle cx={x} cy={y} r={baseRadius + 8} fill="none" stroke={sev.fill} strokeWidth="1" opacity="0.2">
                        <animate attributeName="r" from={baseRadius + 4} to={baseRadius + 16} dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.3" to="0" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
                      </circle>

                      {/* Glow */}
                      <circle cx={x} cy={y} r={baseRadius + 4} fill={`${sev.fill}15`} />

                      {/* Main marker */}
                      <motion.circle
                        cx={x} cy={y} r={baseRadius}
                        fill={`${sev.fill}30`} stroke={sev.fill}
                        strokeWidth={isHovered ? 3 : 2}
                        filter={isHovered ? 'url(#glow)' : undefined}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.08, type: 'spring' }}
                        style={{ cursor: 'pointer' }}
                      />

                      {/* Inner dot */}
                      <circle cx={x} cy={y} r="3" fill={sev.fill} opacity="0.8" />

                      {/* Label */}
                      <text x={x} y={y - baseRadius - 6} textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="500">
                        {hotspot.city}
                      </text>
                      <text x={x} y={y - baseRadius - 16} textAnchor="middle" fill="#64748b" fontSize="7">
                        {STATE_NAMES[hotspot.state] || hotspot.state}
                      </text>

                      {/* Count badge */}
                      <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 + i * 0.08 }}
                      >
                        <rect x={x + baseRadius - 4} y={y - 8} width="24" height="14" rx="7" fill={sev.fill} opacity="0.9" />
                        <text x={x + baseRadius + 8} y={y + 1} textAnchor="middle" fill="white" fontSize="8" fontWeight="700">
                          {hotspot.reportCount}
                        </text>
                      </motion.g>

                      {/* Hover tooltip */}
                      {isHovered && (
                        <g>
                          <rect x={x - 60} y={y + baseRadius + 8} width="120" height="42" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                          <text x={x} y={y + baseRadius + 22} textAnchor="middle" fill="#e2e8f0" fontSize="8" fontWeight="600">
                            {hotspot.city}, {STATE_NAMES[hotspot.state] || hotspot.state}
                          </text>
                          <text x={x} y={y + baseRadius + 34} textAnchor="middle" fill="#94a3b8" fontSize="7">
                            {hotspot.reportCount} reports • Severity: {sev.label}
                          </text>
                          <text x={x} y={y + baseRadius + 44} textAnchor="middle" fill={sev.fill} fontSize="7" fontWeight="500">
                            ● {hotspot.severity}/5
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Severity legend */}
              <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-700/50 rounded-lg p-2.5">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Severity</p>
                <div className="flex items-center gap-3">
                  {[4, 3, 2, 1].map((level) => {
                    const s = severityColor(level);
                    return (
                      <div key={level} className="flex items-center gap-1">
                        <div className={`h-2.5 w-2.5 rounded-full ${s.bg}`} />
                        <span className="text-[10px] text-slate-400">{s.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stats summary */}
              <div className="absolute top-3 right-3 bg-slate-900/90 border border-slate-700/50 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="h-3 w-3 text-amber-400" />
                  <span className="text-[10px] text-slate-400 font-medium">Top Hotspot</span>
                </div>
                {hotspots.length > 0 && (
                  <>
                    <p className="text-xs text-slate-200 font-semibold">
                      {hotspots.sort((a, b) => b.reportCount - a.reportCount)[0].city}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {hotspots[0].reportCount} reports
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}