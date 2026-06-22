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
    const cx = 150;
    const cy = 150;
    const radius = 90;

    return (
      <motion.div
        key={cluster.clusterId}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.1 }}
        className={`border rounded-xl p-4 cursor-pointer transition-all hover:border-slate-600/50 ${
          selectedCluster?.clusterId === cluster.clusterId
            ? 'border-emerald-500/50 bg-emerald-500/5'
            : 'border-slate-700/50 bg-slate-800/30'
        }`}
        onClick={() => setSelectedCluster(selectedCluster?.clusterId === cluster.clusterId ? null : cluster)}
      >
        <div className="flex items-center justify-between mb-3">
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

        {/* SVG Graph */}
        <div className="flex justify-center">
          <svg width="300" height="300" viewBox="0 0 300 300" className="max-w-full">
            {/* Connections */}
            {members.map((m, i) => {
              const angle = (2 * Math.PI * i) / members.length - Math.PI / 2;
              const nx = cx + radius * Math.cos(angle);
              const ny = cy + radius * Math.sin(angle);
              return (
                <motion.line
                  key={`line-${i}`}
                  x1={cx} y1={cy} x2={nx} y2={ny}
                  stroke="#334155" strokeWidth="1.5" strokeDasharray="4 2"
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
                  stroke="#1e293b" strokeWidth="1"
                />
              );
            })}
            {/* Center node */}
            <motion.circle
              cx={cx} cy={cy} r="18"
              fill="#0f172a" stroke={cluster.isCrossState ? '#f59e0b' : '#10b981'} strokeWidth="2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
            />
            <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central" fill="#94a3b8" fontSize="8" fontWeight="600">
              {cluster.memberCount}
            </text>
            {/* Member nodes */}
            {members.map((m, i) => {
              const angle = (2 * Math.PI * i) / members.length - Math.PI / 2;
              const nx = cx + radius * Math.cos(angle);
              const ny = cy + radius * Math.sin(angle);
              const nodeColor = NODE_COLORS[m.type] || NODE_COLORS.unknown;
              const nodeSize = Math.max(10, 8 + m.riskScore / 10);
              const isHovered = hoveredNode === m.id;

              return (
                <g key={m.id} onMouseEnter={() => setHoveredNode(m.id)} onMouseLeave={() => setHoveredNode(null)}>
                  {/* Pulse ring on hover */}
                  {isHovered && (
                    <circle cx={nx} cy={ny} r={nodeSize + 6} fill="none" stroke={nodeColor} strokeWidth="1" opacity="0.3">
                      <animate attributeName="r" from={nodeSize + 3} to={nodeSize + 10} dur="1s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.4" to="0" dur="1s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <motion.circle
                    cx={nx} cy={ny} r={nodeSize}
                    fill={`${nodeColor}20`} stroke={nodeColor} strokeWidth="2"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1 + i * 0.04 + 0.2 }}
                    style={{ cursor: 'pointer' }}
                  />
                  <text x={nx} y={ny - nodeSize - 4} textAnchor="middle" fill="#94a3b8" fontSize="7">
                    {TYPE_LABELS[m.type] || m.type}
                  </text>
                  {isHovered && (
                    <g>
                      <rect x={nx - 40} y={ny + nodeSize + 4} width="80" height="22" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                      <text x={nx} y={ny + nodeSize + 16} textAnchor="middle" fill="#e2e8f0" fontSize="7">
                        {m.value.length > 16 ? m.value.slice(0, 16) + '...' : m.value}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected cluster details */}
        {selectedCluster?.clusterId === cluster.clusterId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 pt-3 border-t border-slate-700/50"
          >
            {cluster.statesInvolved && cluster.statesInvolved.length > 1 && (
              <div className="mb-2">
                <span className="text-[10px] text-amber-400 font-medium">STATES INVOLVED: </span>
                <span className="text-[10px] text-slate-300">{cluster.statesInvolved.join(', ')}</span>
              </div>
            )}
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {members.map((m, i) => (
                <div key={m.id} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: NODE_COLORS[m.type] || NODE_COLORS.unknown }} />
                    <span className="text-slate-300">{TYPE_LABELS[m.type] || m.type}</span>
                    <span className="text-slate-500 font-mono">{m.value.length > 20 ? m.value.slice(0, 20) + '...' : m.value}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px] border-slate-600 text-slate-500 h-4 px-1">{m.stateCode}</Badge>
                    <span className={`tabular-nums font-medium ${m.riskScore > 50 ? 'text-rose-400' : 'text-slate-400'}`}>
                      {m.riskScore.toFixed(0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
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
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-80 bg-slate-800/30 rounded-xl animate-pulse" />
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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