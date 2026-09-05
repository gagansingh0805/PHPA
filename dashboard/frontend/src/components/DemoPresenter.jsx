import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  X, 
  Sparkles, 
  Eye, 
  Clock, 
  Layers, 
  Zap, 
  CheckCircle2, 
  Activity,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function DemoPresenter({
  step = 0,
  totalSteps = 5,
  currentStage = {},
  isPaused = false,
  onTogglePause,
  onNext,
  onPrev,
  onExit,
  progress = 0,
  secondsRemaining = 10,
  latest = {}
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    title = 'Automated Showcase Demo',
    narrative = 'Evaluating autoscaler response...',
    tag = 'DEMO',
    target = 'Primary Telemetry View',
    whatToNotice = 'Observe the highlighted components on screen.'
  } = currentStage;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 60, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 60, opacity: 0, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="fixed bottom-2.5 left-2.5 right-2.5 sm:bottom-auto sm:top-16 sm:right-6 sm:left-auto sm:w-[380px] z-50 max-h-[calc(100vh-5rem)] flex flex-col rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden select-none"
      >
        {/* Animated Progress Bar along top border */}
        <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0">
          <motion.div
            className="h-full bg-zinc-900 dark:bg-zinc-100"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            transition={{ ease: 'linear' }}
          />
        </div>

        {/* Scrollable Body Content */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-2 sm:space-y-3 flex-1">
          {/* Top Header: Step Counter, Tag Badge, Timer, Exit Button */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Tour Step {step + 1}/{totalSteps}</span>
              </span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 truncate">
                {tag}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Mobile Details Toggle */}
              <button
                onClick={() => setIsExpanded((p) => !p)}
                className="sm:hidden flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                title={isExpanded ? 'Collapse Details' : 'Expand Details'}
              >
                <span>{isExpanded ? 'Less' : 'Details'}</span>
                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>

              <div className="flex items-center gap-1 font-mono text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                <Clock className="w-3 h-3 text-zinc-500" />
                <span className="tabular-nums font-semibold">{secondsRemaining}s</span>
              </div>
              <button
                onClick={onExit}
                className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Exit Showcase Tour"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Stage Title and Narrative Text */}
          <div className="space-y-0.5 sm:space-y-1">
            <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug">
              {title}
            </h3>
            <p className={`text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed ${isExpanded ? '' : 'line-clamp-2 sm:line-clamp-none'}`}>
              {narrative}
            </p>
          </div>

          {/* High-Contrast What to Notice Callout Box */}
          <div className={`${isExpanded ? 'block' : 'hidden sm:block'} rounded-lg p-2.5 sm:p-3 bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 space-y-1.5`}>
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              <Eye className="w-3.5 h-3.5 text-emerald-500" />
              <span>What to notice on screen:</span>
            </div>
            <p className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
              {whatToNotice}
            </p>
            <div className="pt-0.5 flex items-center gap-1 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">Target Area:</span>
              <span className="truncate">{target}</span>
            </div>
          </div>

          {/* Live Cluster Snapshot Telemetry Chips */}
          <div className={`${isExpanded ? 'grid' : 'hidden sm:grid'} grid-cols-3 gap-1.5 pt-0.5 text-center font-mono text-[10px]`}>
            <div className="p-1.5 rounded bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800">
              <span className="text-zinc-500 dark:text-zinc-400 block text-[9px]">TRAFFIC</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                {latest.rps ? `${Math.round(latest.rps)} RPS` : '125 RPS'}
              </span>
            </div>
            <div className="p-1.5 rounded bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800">
              <span className="text-zinc-500 dark:text-zinc-400 block text-[9px]">PODS</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                {latest.actual_pods ?? 6} Active
              </span>
            </div>
            <div className="p-1.5 rounded bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800">
              <span className="text-zinc-500 dark:text-zinc-400 block text-[9px]">DEFICITS</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {latest.sla_breaches ?? 0} Breach
              </span>
            </div>
          </div>
        </div>

        {/* Footer Navigation & Controls */}
        <div className="p-2.5 sm:p-3 bg-zinc-50/70 dark:bg-zinc-950/70 border-t border-zinc-200 dark:border-zinc-800 flex-shrink-0 space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between gap-2">
            {/* 5 Stage Step Dots */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step
                      ? 'w-4 sm:w-5 bg-zinc-900 dark:bg-zinc-100'
                      : i < step
                      ? 'w-1.5 sm:w-2 bg-zinc-400 dark:bg-zinc-500'
                      : 'w-1 sm:w-1.5 bg-zinc-200 dark:border dark:border-zinc-700 bg-transparent'
                  }`}
                />
              ))}
            </div>

            {/* Prev / Pause / Next Buttons */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                onClick={onPrev}
                disabled={step === 0}
                className={`px-2 sm:px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  step === 0
                    ? 'opacity-40 cursor-not-allowed border border-zinc-200 dark:border-zinc-800 text-zinc-400'
                    : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                }`}
                title="Previous Step"
              >
                <SkipBack className="w-3 h-3" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              <button
                onClick={onTogglePause}
                className="px-2.5 sm:px-3 py-1 rounded bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-semibold text-xs flex items-center gap-1 sm:gap-1.5 shadow-sm transition-all cursor-pointer"
                title={isPaused ? 'Resume Tour' : 'Pause Tour'}
              >
                {isPaused ? (
                  <>
                    <Play className="w-3 h-3 fill-current" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3 h-3 fill-current" />
                    <span>Pause</span>
                  </>
                )}
              </button>

              <button
                onClick={onNext}
                className="px-2 sm:px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title={step === totalSteps - 1 ? 'Finish Tour' : 'Next Step'}
              >
                <span>{step === totalSteps - 1 ? 'Finish' : 'Next'}</span>
                <SkipForward className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Helper Keyboard Shortcut Hint - Hidden on mobile */}
          <div className="hidden sm:flex text-[10px] font-mono text-zinc-400 dark:text-zinc-500 text-center items-center justify-center gap-2">
            <span><kbd className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">Space</kbd> Pause</span>
            <span>•</span>
            <span><kbd className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">→</kbd> Next</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

