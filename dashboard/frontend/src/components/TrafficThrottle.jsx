import React from 'react';
import { motion } from 'framer-motion';
import { Sliders, Moon, Sun, Flame, Zap, Compass } from 'lucide-react';
import Term from './Term';

export default function TrafficThrottle({
  trafficMode,
  setTrafficMode,
  manualRps,
  setManualRps,
  onRpsChange,
  onModeChange,
  currentRps,
}) {
  const presets = [
    { label: 'Night', rps: 25, icon: Moon, desc: '~2 pods' },
    { label: 'Normal', rps: 125, icon: Sun, desc: '~5 pods' },
    { label: 'Rush', rps: 280, icon: Flame, desc: '~12 pods' },
    { label: 'Crisis', rps: 550, icon: Zap, desc: '~22 pods' },
  ];

  const handleModeToggle = (mode) => {
    if (onModeChange) onModeChange(mode);
    else if (setTrafficMode) setTrafficMode(mode);
  };

  const handleRpsUpdate = (rps) => {
    if (onRpsChange) onRpsChange(rps);
    else if (setManualRps) setManualRps(rps);
  };

  const stressPercent = Math.min(100, Math.round((currentRps / 600.0) * 100));

  let stressColor = 'bg-emerald-500';
  let stressGlow = 'shadow-emerald-500/30';
  if (stressPercent > 45) {
    stressColor = 'bg-amber-500';
    stressGlow = 'shadow-amber-500/30';
  }
  return (
    <div className="raised-card rounded-lg p-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
          <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">Live Traffic Throttle</h3>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center p-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80">
          <button
            onClick={() => handleModeToggle('auto')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium flex items-center gap-1.5 transition-all ${
              trafficMode === 'auto'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm border border-zinc-200 dark:border-zinc-700'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Compass className="w-3 h-3 text-zinc-500" />
            Auto Trace
          </button>
          <button
            onClick={() => handleModeToggle('manual')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium flex items-center gap-1.5 transition-all ${
              trafficMode === 'manual'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm border border-zinc-200 dark:border-zinc-700'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Sliders className="w-3 h-3 text-zinc-500" />
            Manual
          </button>
        </div>
      </div>

      {/* Traffic Stress Meter */}
      <div className="mb-3.5">
        <div className="flex items-center justify-between text-[11px] mb-1.5 font-mono">
          <span className="text-zinc-500 dark:text-zinc-400">Cluster Workload Stress:</span>
          <span className="text-zinc-900 dark:text-zinc-100 font-medium tabular-nums">
            {currentRps} <Term id="rps">RPS</Term> <span className="text-zinc-500 font-normal">({stressPercent}%)</span>
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          <motion.div
            className={`h-full rounded-full transition-all duration-300 ${
              stressPercent > 75 ? 'bg-red-500' : stressPercent > 45 ? 'bg-amber-500' : 'bg-zinc-700 dark:bg-zinc-300'
            }`}
            style={{ width: `${stressPercent}%` }}
          />
        </div>
      </div>

      {/* Manual Slider & Quick Preset Buttons */}
      {trafficMode === 'manual' ? (
        <motion.div
          initial={{ opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80"
        >
          {/* Slider */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono min-w-[50px] sm:min-w-[55px]">Throttle:</span>
            <input
              type="range"
              min="15"
              max="600"
              step="5"
              value={manualRps}
              onChange={(e) => handleRpsUpdate(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="min-w-[65px] sm:min-w-[70px] text-right font-mono font-medium text-zinc-900 dark:text-zinc-100 text-xs tabular-nums">
              {manualRps} RPS
            </div>
          </div>

          {/* Presets Grid */}
          <div className="grid grid-cols-4 gap-2">
            {presets.map((p) => {
              const Icon = p.icon;
              const isSelected = manualRps === p.rps;
              return (
                <button
                  key={p.label}
                  onClick={() => handleRpsUpdate(p.rps)}
                  className={`p-2 rounded-md border text-center transition-all ${
                    isSelected
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-sm font-medium'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 text-xs font-medium">
                    <Icon className="w-3 h-3" />
                    <span>{p.label}</span>
                  </div>
                  <div className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500'}`}>
                    {p.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      ) : (
        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/80 font-mono">
          <span>Replaying 5-day diurnal trace.</span>
          <button
            onClick={() => handleModeToggle('manual')}
            className="text-zinc-900 dark:text-zinc-200 hover:underline font-medium"
          >
            Switch to Manual
          </button>
        </div>
      )}
    </div>
  );
}
