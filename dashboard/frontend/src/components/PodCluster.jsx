import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box } from 'lucide-react';

export default function PodCluster({ actualPods, idealDemand, isSpiking }) {
  // Generate an array of pod indices [1, 2, ..., actualPods]
  const podCount = Math.max(1, actualPods || 1);
  const pods = Array.from({ length: podCount }, (_, i) => i + 1);
  const scrollContainerRef = useRef(null);
  const prevCountRef = useRef(podCount);

  // Auto-scroll down as pods increase so newly added pods are instantly visible
  useEffect(() => {
    if (scrollContainerRef.current) {
      if (podCount > prevCountRef.current) {
        // Immediate scroll to bottom
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
        // Follow-up scroll after layout animation settles
        const timer = setTimeout(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
              top: scrollContainerRef.current.scrollHeight,
              behavior: 'smooth',
            });
          }
        }, 150);
        return () => clearTimeout(timer);
      }
    }
    prevCountRef.current = podCount;
  }, [podCount]);

  return (
    <div className="bento-card rounded-xl p-3 sm:p-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Box className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <h3 className="text-xs sm:text-sm font-bold text-white truncate">Live Pod Cluster (Kubernetes State)</h3>
        </div>
        <div className="text-[11px] sm:text-xs text-zinc-400 font-mono">
          Capacity: <span className="text-cyan-400 font-bold">{actualPods}</span> pods active | Demand: <span className="text-zinc-200 font-bold">{idealDemand}</span>
        </div>
      </div>

      {/* Pod Grid with concise max-height and auto-scroll */}
      <div
        ref={scrollContainerRef}
        className="flex flex-wrap gap-1.5 sm:gap-2 min-h-[58px] max-h-[160px] overflow-y-auto p-2 sm:p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80 items-start content-start scroll-smooth"
      >
        <AnimatePresence mode="popLayout">
          {pods.map((podNum) => (
            <motion.div
              key={podNum}
              layout
              initial={{ scale: 0.5, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md border text-[11px] sm:text-xs font-mono font-medium shadow-sm ${
                isSpiking
                  ? 'bg-purple-950/40 border-purple-500/50 text-purple-200 shadow-purple-500/20'
                  : 'bg-zinc-900 border-cyan-500/30 text-cyan-300 shadow-cyan-500/10'
              }`}
            >
              <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse"></span>
              <span>pod-{String(podNum).padStart(2, '0')}</span>
              <span className="text-[9px] sm:text-[10px] text-zinc-400">READY</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
