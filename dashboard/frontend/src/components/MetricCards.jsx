import React from 'react';
import { motion } from 'framer-motion';
import { Server, Zap, AlertTriangle, DollarSign } from 'lucide-react';
import Term from './Term';

export default function MetricCards({ actualPods, idealDemand, p95Latency, slaBreaches, totalPodHours }) {
  const isSlaBreached = p95Latency > 200;

  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      {/* 1. Active Pod Replicas */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bento-card rounded-xl p-3.5 relative overflow-hidden group"
      >
        <div className="flex items-center justify-between text-zinc-400 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Active Replicas</span>
          <div className="w-6 h-6 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
            <Server className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <motion.span
            key={actualPods}
            initial={{ scale: 0.9, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-extrabold text-white font-mono"
          >
            {actualPods ?? '--'}
          </motion.span>
          <span className="text-[11px] text-zinc-400">pods running</span>
        </div>
        <div className="mt-1 text-[11px] text-zinc-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          <Term id="underprovision">Demand</Term>: <span className="text-zinc-200 font-semibold">{idealDemand ?? '--'}</span> pods
        </div>
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
      </motion.div>

      {/* 2. Response Latency (P95) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className={`bento-card rounded-xl p-3.5 relative overflow-hidden transition-all duration-300 ${
          isSlaBreached ? 'border-red-500/40 bg-red-950/10' : ''
        }`}
      >
        <div className="flex items-center justify-between text-zinc-400 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            <Term id="latency">P95 Latency</Term>
          </span>
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
            isSlaBreached ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
          }`}>
            <Zap className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <motion.span
            key={p95Latency}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            className={`text-2xl font-extrabold font-mono ${
              isSlaBreached ? 'text-red-400' : 'text-white'
            }`}
          >
            {p95Latency ?? '--'}
          </motion.span>
          <span className="text-[11px] text-zinc-400">ms</span>
        </div>
        <div className="mt-1 text-[11px] text-zinc-400 flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isSlaBreached ? 'bg-red-400 animate-ping' : 'bg-emerald-400'}`}></span>
          <span><Term id="sla">SLA Target</Term>: &lt; 200 ms</span>
        </div>
        <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent ${
          isSlaBreached ? 'via-red-500' : 'via-amber-500/50'
        } to-transparent`}></div>
      </motion.div>

      {/* 3. SLA Breaches */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bento-card rounded-xl p-3.5 relative overflow-hidden"
      >
        <div className="flex items-center justify-between text-zinc-400 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            <Term id="sla">SLA Breaches</Term>
          </span>
          <div className="w-6 h-6 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <motion.span
            key={slaBreaches}
            className="text-2xl font-extrabold text-white font-mono"
          >
            {slaBreaches ?? 0}
          </motion.span>
          <span className="text-[11px] text-zinc-400">violations</span>
        </div>
        <div className="mt-1 text-[11px] text-zinc-400">
          Due to reactive <Term id="coldstart">cold start lag</Term>
        </div>
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500/50 to-transparent"></div>
      </motion.div>

      {/* 4. Cumulative Compute Cost */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bento-card rounded-xl p-3.5 relative overflow-hidden"
      >
        <div className="flex items-center justify-between text-zinc-400 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            <Term id="podhours">Compute Spend</Term>
          </span>
          <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <motion.span
            key={totalPodHours}
            className="text-2xl font-extrabold text-white font-mono"
          >
            {totalPodHours?.toFixed(2) ?? '0.00'}
          </motion.span>
          <span className="text-[11px] text-zinc-400">pod-hrs</span>
        </div>
        <div className="mt-1 text-[11px] text-zinc-400">
          ~${((totalPodHours || 0) * 0.04).toFixed(3)} cost consumed
        </div>
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
      </motion.div>
    </section>
  );
}
