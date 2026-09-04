import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Flame, FastForward } from 'lucide-react';

export default function ControlDock({ isPlaying, speedFactor, onTogglePlay, onSpeedChange, onInjectSpike, onReset }) {
  return (
    <div className="bento-card rounded-xl p-3.5 border border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
      {/* Playback Controls */}
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={onTogglePlay}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
            isPlaying
              ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
          }`}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {isPlaying ? 'Pause' : 'Resume'}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={onReset}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700/60"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </motion.button>

        {/* Speed Slider */}
        <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
          <FastForward className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs text-zinc-400 font-medium">Speed:</span>
          <input
            type="range"
            min="1"
            max="120"
            value={speedFactor}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="w-20 sm:w-28 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <span className="text-xs font-mono font-bold text-purple-400 min-w-[32px]">
            {speedFactor}x
          </span>
        </div>
      </div>

      {/* Chaos Injection: 5x Flash Crowd Button */}
      <div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          onClick={onInjectSpike}
          className="relative group overflow-hidden px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white font-bold text-xs tracking-wide shadow-lg shadow-red-600/25 border border-red-400/30 flex items-center gap-1.5"
        >
          <Flame className="w-3.5 h-3.5 text-amber-200 animate-bounce" />
          <span>💥 INJECT 5x SPIKE</span>
        </motion.button>
      </div>
    </div>
  );
}
