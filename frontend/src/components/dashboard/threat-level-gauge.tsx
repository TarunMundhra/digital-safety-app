'use client';

import { motion } from 'framer-motion';

interface ThreatLevelGaugeProps {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number;
}

const levelConfig = {
  LOW: { color: '#10b981', bg: '#10b98120', label: 'LOW THREAT' },
  MEDIUM: { color: '#f59e0b', bg: '#f59e0b20', label: 'MEDIUM THREAT' },
  HIGH: { color: '#f97316', bg: '#f9731620', label: 'HIGH THREAT' },
  CRITICAL: { color: '#ef4444', bg: '#ef444420', label: 'CRITICAL THREAT' },
};

export function ThreatLevelGauge({ level, score }: ThreatLevelGaugeProps) {
  const config = levelConfig[level];
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, type: 'spring' }}
      className="flex flex-col items-center"
    >
      <div className="relative">
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-slate-800"
            strokeWidth="10"
          />
          <motion.circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke={config.color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            transform="rotate(-90 90 90)"
            style={{ filter: `drop-shadow(0 0 6px ${config.color}40)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-100 tabular-nums">{score}</span>
          <span className="text-xs text-slate-400 mt-0.5">/ 100</span>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-3 px-3 py-1 rounded-full text-xs font-semibold tracking-wider"
        style={{ backgroundColor: config.bg, color: config.color, border: `1px solid ${config.color}30` }}
      >
        {config.label}
      </motion.div>
    </motion.div>
  );
}