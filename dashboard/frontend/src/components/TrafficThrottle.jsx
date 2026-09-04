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
  if (stressPercent > 75) {
    stressColor = 'bg-red-500';
    stressGlow = 'shadow-red-500/50';
  }

  return (
    <div className="bento-card rounded-xl p-3.5 border border-zinc-800/90">
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <h3 className="text-xs font-bold text-white">Live Traffic Throttle</h3>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center p-0.5 rounded-lg bg-zinc-900 border border-zinc-800">
          <button
            onClick={() => handleModeToggle('auto')}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
              trafficMode === 'auto'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Compass className="w-3 h-3" />
            Auto Trace
          </button>
          <button
            onClick={() => handleModeToggle('manual')}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
              trafficMode === 'manual'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sliders className="w-3 h-3" />
            Manual
          </button>
        </div>
      </div>

      {/* Traffic Stress Meter */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
          <span className="text-zinc-400">Cluster Workload Stress:</span>
          <span className="text-white font-bold">
            {currentRps} <Term id="rps">RPS</Term> ({stressPercent}%)
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
          <motion.div
            className={`h-full ${stressColor} ${stressGlow} transition-all duration-300 shadow-md`}
            style={{ width: `${stressPercent}%` }}
          />
        </div>
      </div>

      {/* Manual Slider & Quick Preset Buttons */}
      {trafficMode === 'manual' ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2.5 pt-2 border-t border-zinc-800/60"
        >
          {/* Slider */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-zinc-400 font-semibold min-w-[55px]">Throttle:</span>
            <input
              type="range"
              min="15"
              max="600"
              step="5"
              value={manualRps}
              onChange={(e) => handleRpsUpdate(parseInt(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="min-w-[65px] text-right font-mono font-bold text-amber-400 text-xs">
              {manualRps} RPS
            </div>
          </div>

          {/* Quick Presets */}
          <div className="grid grid-cols-4 gap-1.5">
            {presets.map((p) => {
              const Icon = p.icon;
              const isSelected = manualRps === p.rps;
              return (
                <button
                  key={p.label}
                  onClick={() => handleRpsUpdate(p.rps)}
                  className={`p-1.5 rounded-md border text-center transition-all ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 font-bold text-[11px]">
                    <Icon className="w-3 h-3" />
                    <span>{p.label}</span>
                  </div>
                  <div className="text-[9px] font-mono text-zinc-500">{p.desc}</div>
                </button>
              );
            })}
          </div>
        </motion.div>
      ) : (
        <div className="text-[11px] text-zinc-400 flex items-center justify-between pt-1 border-t border-zinc-800/60">
          <span>Replaying autonomous 5-day diurnal trace.</span>
          <button
            onClick={() => handleModeToggle('manual')}
            className="text-purple-400 hover:text-purple-300 underline text-[11px] font-semibold"
          >
            Switch to 'Manual' to drag RPS yourself
          </button>
        </div>
      )}
    </div>
  );
}
