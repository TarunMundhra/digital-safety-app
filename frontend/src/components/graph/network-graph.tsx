'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Network, Users, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ClusterMember {
  id: string;
  type: string;
  value: string;
  riskScore: number;
  stateCode: string;
}

interface Cluster {
  clusterId: string;
  label: string;
  memberCount: number;
  confidence: number;
  members: ClusterMember[];
  isCrossState?: boolean;
  statesInvolved?: string[];
}

interface GraphData {
  clusters: Cluster[];
  crossStateClusters: Cluster[];
}

const NODE_COLORS: Record<string, string> = {
  phone_number: '#f43f5e',
  phone: '#f43f5e',
  upi_id: '#f59e0b',
  upi: '#f59e0b',
  bank_account: '#10b981',
  bank: '#10b981',
  aadhaar: '#8b5cf6',
  pan: '#06b6d4',
  unknown: '#64748b',
};

const TYPE_LABELS: Record<string, string> = {
  phone_number: 'Phone',
  phone: 'Phone',
  upi_id: 'UPI ID',
  upi: 'UPI ID',
  bank_account: 'Bank',
  bank: 'Bank',
  aadhaar: 'Aadhaar',
  pan: 'PAN',
};

export function NetworkGraph() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const fetchClusters = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/graph/clusters');
      const data = await res.json();
      setGraphData(data);
    } catch {
      setGraphData({ clusters: [], crossStateClusters: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClusters();
  }, []);

  const renderClusterGraph = (cluster: Cluster, index: number) => {
    const members = cluster.members || [];
    const cx = 250;
    const cy = 160;
    const radius = 110;

    return (
      <motion.div
        key={cluster.clusterId}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="border border-slate-700/50 bg-slate-800/30 rounded-xl p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-200">{cluster.label}</span>
            <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">
              {cluster.memberCount} members
            </Badge>
            {cluster.isCrossState && (
              <Badge className="text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/30">
                Cross-State
              </Badge>
            )}
          </div>
          <div className="text-xs text-slate-500">
            {(cluster.confidence * 100).toFixed(0)}% conf.
          </div>
        </div>

        {/* Graph and Details Container */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* SVG Graph (Left Side) */}
          <div className="flex-1 w-full min-w-0 flex justify-center">
            <svg width="100%" height="320" viewBox="0 0 500 320" className="max-w-full">
            {/* Connections */}
            {members.map((m, i) => {
              const angle = (2 * Math.PI * i) / members.length - Math.PI / 2;
              const nx = cx + radius * Math.cos(angle);
              const ny = cy + radius * Math.sin(angle);
              return (
                <motion.line
                  key={`line-${i}`}
                  x1={cx} y1={cy} x2={nx} y2={ny}
                  stroke="#475569" strokeWidth="2" strokeDasharray="6 3"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.6 }}
                  transition={{ delay: index * 0.1 + i * 0.05, duration: 0.4 }}
                />
              );
            })}
            {/* Inter-member connections */}
            {members.length > 2 && members.map((_, i) => {
              const nextI = (i + 1) % members.length;
              const a1 = (2 * Math.PI * i) / members.length - Math.PI / 2;
              const a2 = (2 * Math.PI * nextI) / members.length - Math.PI / 2;
              return (
                <line
                  key={`outer-${i}`}
                  x1={cx + radius * Math.cos(a1)} y1={cy + radius * Math.sin(a1)}
                  x2={cx + radius * Math.cos(a2)} y2={cy + radius * Math.sin(a2)}
                  stroke="#334155" strokeWidth="1.5"
                />
              );
            })}
            {/* Center node */}
            <motion.circle
              cx={cx} cy={cy} r="26"
              fill="#0f172a" stroke={cluster.isCrossState ? '#f59e0b' : '#10b981'} strokeWidth="3"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
            />
            <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central" fill="#f8fafc" fontSize="14" fontWeight="bold">
              {cluster.memberCount}
            </text>
            {/* Member nodes */}
            {members.map((m, i) => {
              const angle = (2 * Math.PI * i) / members.length - Math.PI / 2;
              const nx = cx + radius * Math.cos(angle);
              const ny = cy + radius * Math.sin(angle);
              const nodeColor = NODE_COLORS[m.type] || NODE_COLORS.unknown;
              const nodeSize = Math.max(16, 12 + m.riskScore / 5);
              const isHovered = hoveredNode === m.id;

              return (
                <g key={m.id} onMouseEnter={() => setHoveredNode(m.id)} onMouseLeave={() => setHoveredNode(null)}>
                  {/* Pulse ring on hover */}
                  {isHovered && (
                    <circle cx={nx} cy={ny} r={nodeSize + 8} fill="none" stroke={nodeColor} strokeWidth="2" opacity="0.4">
                      <animate attributeName="r" from={nodeSize + 4} to={nodeSize + 14} dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <motion.circle
                    cx={nx} cy={ny} r={nodeSize}
                    fill={`${nodeColor}20`} stroke={nodeColor} strokeWidth="3"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1 + i * 0.04 + 0.2 }}
                    style={{ cursor: 'pointer' }}
                  />
                  <text x={nx} y={ny - nodeSize - 8} textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="500">
                    {TYPE_LABELS[m.type] || m.type}
                  </text>
                  {isHovered && (
                    <g>
                      <rect x={nx - 75} y={ny + nodeSize + 8} width="150" height="42" rx="6" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
                      <text x={nx} y={ny + nodeSize + 22} textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="600">
                        {m.value.length > 20 ? m.value.slice(0, 20) + '...' : m.value}
                      </text>
                      <text x={nx} y={ny + nodeSize + 38} textAnchor="middle" fill={m.riskScore > 50 ? '#f43f5e' : '#10b981'} fontSize="10" fontWeight="600">
                        Risk: {m.riskScore.toFixed(0)} • {m.stateCode}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

          {/* Always Visible Details (Right Side) */}
          <div className="w-full lg:w-[420px] shrink-0 border-t lg:border-t-0 lg:border-l border-slate-700/50 pt-4 lg:pt-0 lg:pl-6">
            {cluster.statesInvolved && cluster.statesInvolved.length > 1 && (
              <div className="mb-3">
                <span className="text-[10px] text-amber-400 font-medium">STATES INVOLVED: </span>
                <span className="text-[10px] text-slate-300">{cluster.statesInvolved.join(', ')}</span>
              </div>
            )}
            <div className="space-y-1 overflow-y-auto pr-1" style={{ maxHeight: '320px' }}>
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold px-1 pb-1.5 border-b border-slate-700/50 mb-1.5 sticky top-0 bg-slate-800/90 z-10 backdrop-blur-sm">
                <span>ENTITY DETAILS</span>
                <div className="flex gap-4">
                  <span className="w-8 text-center" title="Jurisdiction/State">STATE</span>
                  <span className="w-16 text-right" title="Risk Score out of 100">RISK SCORE</span>
                </div>
              </div>
              {members.map((m, i) => (
                <div key={m.id} className="flex items-center justify-between text-[11px] px-1 py-1.5 hover:bg-slate-800/50 rounded transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: NODE_COLORS[m.type] || NODE_COLORS.unknown }} />
                    <span className="text-slate-300 w-16 shrink-0">{TYPE_LABELS[m.type] || m.type}</span>
                    <span className="text-slate-400 font-mono truncate max-w-[120px]" title={m.value}>{m.value}</span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <Badge variant="outline" className="w-8 justify-center text-[9px] border-slate-600 text-slate-500 h-4 px-0 bg-slate-800/50">{m.stateCode}</Badge>
                    <div className="w-16 text-right">
                      <span className={`tabular-nums font-medium ${m.riskScore > 75 ? 'text-rose-400' : m.riskScore > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {m.riskScore.toFixed(0)}
                      </span>
                      <span className="text-[9px] text-slate-600 ml-0.5">/100</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4 text-emerald-400" />
              <CardTitle className="text-base text-slate-200">Fraud Network Intelligence</CardTitle>
              {!loading && graphData && (
                <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">
                  {graphData.clusters.length} clusters
                </Badge>
              )}
              {!loading && graphData?.crossStateClusters && graphData.crossStateClusters.length > 0 && (
                <Badge className="text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/30">
                  {graphData.crossStateClusters.length} cross-state
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-slate-400 hover:text-emerald-400"
              onClick={fetchClusters}
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Visualizes interconnected scam entities (phone numbers, UPI IDs, Bank Accounts) to detect organized fraud rings and coordinated attacks across jurisdictions.
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 gap-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-[400px] bg-slate-800/30 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !graphData || graphData.clusters.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-slate-500">
              <Network className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm">No fraud clusters detected</p>
              <p className="text-xs mt-1">Clusters will appear as entities get linked</p>
            </div>
          ) : (
            <>
              {/* Legend */}
              <div className="flex flex-wrap items-center gap-3 mb-4 pb-3 border-b border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Entity Types:</span>
                {Object.entries(TYPE_LABELS).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: NODE_COLORS[key] }} />
                    <span className="text-[11px] text-slate-400">{label}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-8">
                {graphData.clusters.map((cluster, i) => renderClusterGraph(cluster, i))}
              </div>

              {/* Cross-state alert */}
              {graphData.crossStateClusters && graphData.crossStateClusters.length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-semibold text-amber-400">Cross-State Fraud Network Detected</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {graphData.crossStateClusters.length} cluster(s) span multiple states, indicating coordinated inter-state operations requiring federal-level investigation.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}