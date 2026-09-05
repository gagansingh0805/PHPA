import React from 'react';
import { motion } from 'framer-motion';
import { Server, Zap, AlertTriangle, DollarSign } from 'lucide-react';
import Term from './Term';

export default function MetricCards({ actualPods, idealDemand, p95Latency, slaBreaches, totalPodHours }) {
  const isSlaBreached = p95Latency > 100;

  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      {/* 1. Active Pod Replicas */}
        <div className="raised-card p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-medium">
              Active Replicas
            </span>
            <div className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
              <Server className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <motion.span
              key={actualPods}
              className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 font-mono tracking-tight tabular-nums"
            >
              {actualPods ?? '--'}
            </motion.span>
            <span className="text-xs font-mono text-zinc-500">pods</span>
          </div>
          <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between font-mono">
            <span><Term id="underprovision">Target Demand</Term>:</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-200">{idealDemand ?? '--'}</span>
          </div>
        </div>

      {/* 2. Response Latency (P95) */}
        <div className="raised-card p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-medium">
              <Term id="latency">P95 Latency</Term>
            </span>
            <div className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <motion.span
              key={p95Latency}
              className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight tabular-nums ${
                isSlaBreached ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-50'
              }`}
            >
              {p95Latency ?? '--'}
            </motion.span>
            <span className="text-xs font-mono text-zinc-500">ms</span>
          </div>
          <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between font-mono">
            <span><Term id="sla">SLO Target</Term>:</span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">&lt; 100 ms</span>
          </div>
        </div>

      {/* 3. SLA Breaches */}
        <div className="raised-card p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-medium">
              <Term id="sla">SLA Breaches</Term>
            </span>
            <div className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <motion.span
              key={slaBreaches}
              className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight tabular-nums ${
                (slaBreaches || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-50'
              }`}
            >
              {slaBreaches ?? 0}
            </motion.span>
            <span className="text-xs font-mono text-zinc-500">deficits</span>
          </div>
          <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between font-mono">
            <span>Cold-start lag:</span>
            <span className={`font-medium ${(slaBreaches || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {(slaBreaches || 0) > 0 ? 'Detected' : 'Zero Deficit'}
            </span>
          </div>
        </div>

      {/* 4. Cumulative Compute Cost */}
        <div className="raised-card p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-medium">
              <Term id="podhours">Compute Spend</Term>
            </span>
            <div className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <motion.span
              key={totalPodHours}
              className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 font-mono tracking-tight tabular-nums"
            >
              {totalPodHours?.toFixed(2) ?? '0.00'}
            </motion.span>
            <span className="text-xs font-mono text-zinc-500">pod-hrs</span>
          </div>
          <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between font-mono">
            <span>Spend ($0.04/hr):</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">${((totalPodHours || 0) * 0.04).toFixed(3)}</span>
          </div>
        </div>
    </section>
  );
}
