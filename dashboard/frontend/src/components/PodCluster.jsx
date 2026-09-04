import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box } from 'lucide-react';

export default function PodCluster({ actualPods, idealDemand, isSpiking }) {
  // Generate an array of pod indices [1, 2, ..., actualPods]
  const podCount = Math.max(1, actualPods || 1);
  const pods = Array.from({ length: podCount }, (_, i) => i + 1);

  return (
    <div className="bento-card rounded-xl p-3.5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-white">Live Pod Cluster (Kubernetes Workload State)</h3>
        </div>
        <div className="text-xs text-zinc-400 font-mono">
          Capacity: <span className="text-cyan-400 font-bold">{actualPods}</span> pods active | Demand: <span className="text-zinc-200 font-bold">{idealDemand}</span>
        </div>
      </div>

      {/* Pod Grid */}
      <div className="flex flex-wrap gap-2 min-h-[58px] p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80 items-center">
        <AnimatePresence mode="popLayout">
          {pods.map((podNum) => (
            <motion.div
              key={podNum}
              layout
              initial={{ scale: 0.5, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-mono font-medium shadow-sm ${
                isSpiking
                  ? 'bg-purple-950/40 border-purple-500/50 text-purple-200 shadow-purple-500/20'
                  : 'bg-zinc-900 border-cyan-500/30 text-cyan-300 shadow-cyan-500/10'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse"></span>
              <span>pod-{String(podNum).padStart(2, '0')}</span>
              <span className="text-[10px] text-zinc-400">READY</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

