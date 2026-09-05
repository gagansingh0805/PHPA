import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box } from 'lucide-react';

export default function PodCluster({ actualPods, idealDemand, isSpiking }) {
  const podCount = Math.max(1, actualPods || 1);
  const pods = Array.from({ length: podCount }, (_, i) => i + 1);
  const scrollContainerRef = useRef(null);
  const prevCountRef = useRef(podCount);

  // Auto-scroll down as pods increase so newly added pods are instantly visible
  useEffect(() => {
    if (scrollContainerRef.current) {
      if (podCount > prevCountRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
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
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 raised-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Box className="w-4 h-4 text-zinc-700 dark:text-zinc-300 flex-shrink-0" />
          <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight truncate">
            Live Pod Cluster (Kubernetes State)
          </h3>
        </div>
        <div className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-mono">
          Capacity: <span className="text-zinc-900 dark:text-zinc-100 font-bold tabular-nums">{actualPods}</span> pods active | Demand: <span className="text-zinc-700 dark:text-zinc-300 font-bold tabular-nums">{idealDemand}</span>
        </div>
      </div>

      {/* Pod Grid with concise max-height and auto-scroll */}
      <div
        ref={scrollContainerRef}
        className="flex flex-wrap gap-1.5 sm:gap-2 min-h-[58px] max-h-[160px] overflow-y-auto p-2.5 sm:p-3 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 items-start content-start scroll-smooth"
      >
        <AnimatePresence mode="popLayout">
          {pods.map((podNum) => (
            <motion.div
              key={podNum}
              layout
              initial={{ scale: 0.8, opacity: 0, y: 4 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-mono font-medium transition-colors ${
                isSpiking
                  ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-400 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100'
                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>pod-{String(podNum).padStart(2, '0')}</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium">
                READY
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
