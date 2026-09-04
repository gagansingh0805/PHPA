import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  X, 
  Sparkles, 
  Layers, 
  BrainCircuit, 
  Activity, 
  ShieldCheck, 
  Clock 
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
}) {
  const {
    title = 'Automated Showcase Demo',
    narrative = 'Evaluating autoscaler response...',
    tag = 'DEMO',
    tagColor = 'text-purple-300 bg-purple-500/20 border-purple-500/40',
  } = currentStage;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 80, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed bottom-2 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[96%] max-w-3xl shadow-2xl rounded-2xl bg-zinc-950/95 border border-purple-500/40 backdrop-blur-xl overflow-hidden select-none"
      >
        {/* Animated Progress Bar along the top border */}
        <div className="w-full h-1 sm:h-1.5 bg-zinc-900 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            transition={{ ease: 'linear' }}
          />
        </div>

        <div className="p-3 sm:p-5">
          {/* Header Row: Stage Indicator, Tag, Timer, and Close Button */}
          <div className="flex items-center justify-between gap-2 mb-2 sm:mb-2.5">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono font-bold text-purple-400 uppercase tracking-wider truncate">
                <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline">Showcase Step {step + 1} of {totalSteps}</span>
                <span className="sm:hidden">Step {step + 1}/{totalSteps}</span>
              </span>
              <span className={`text-[9px] sm:text-[10px] font-mono font-semibold px-1.5 sm:px-2 py-0.5 rounded-full border truncate ${tagColor}`}>
                {tag}
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <div className="flex items-center gap-1 font-mono text-[11px] sm:text-xs text-zinc-400 bg-zinc-900/90 px-1.5 sm:px-2 py-0.5 rounded border border-zinc-800">
                <Clock className="w-3 h-3 text-zinc-500" />
                <span>{secondsRemaining}s</span>
              </div>
              <button
                onClick={onExit}
                className="w-6 h-6 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                title="Exit Showcase Demo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Stage Title and Narrative Text */}
          <div className="mb-2.5 sm:mb-4">
            <h3 className="text-xs sm:text-base font-bold text-white tracking-wide flex items-center gap-2 truncate">
              {title}
            </h3>
            <p className="text-[11px] sm:text-[13px] text-zinc-300 mt-0.5 sm:mt-1 leading-snug sm:leading-relaxed line-clamp-2 sm:line-clamp-none">
              {narrative}
            </p>
          </div>

          {/* Controls Footer: Step Dots and Navigation Buttons */}
          <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-zinc-900/90 gap-2 sm:gap-4">
            {/* 5 Stage Step Indicator Dots */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 ${
                    i === step
                      ? 'w-4 sm:w-6 bg-purple-500 shadow-[0_0_8px_#a855f7]'
                      : i < step
                      ? 'w-2 sm:w-2.5 bg-emerald-500/80'
                      : 'w-1.5 sm:w-2 bg-zinc-800'
                  }`}
                />
              ))}
            </div>

            {/* Prev / Pause / Next Buttons */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                onClick={onPrev}
                disabled={step === 0}
                className={`px-2 py-1 sm:p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors min-h-[30px] sm:min-h-[34px] ${
                  step === 0
                    ? 'opacity-40 cursor-not-allowed border-zinc-800 text-zinc-600'
                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white'
                }`}
                title="Previous Demo Step"
              >
                <SkipBack className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              <button
                onClick={onTogglePause}
                className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 sm:gap-1.5 shadow-sm transition-all min-h-[30px] sm:min-h-[34px]"
                title={isPaused ? 'Resume Demo' : 'Pause Demo'}
              >
                {isPaused ? (
                  <>
                    <Play className="w-3 sm:w-3.5 h-3 sm:h-3.5 fill-current" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3 sm:w-3.5 h-3 sm:h-3.5 fill-current" />
                    <span>Pause</span>
                  </>
                )}
              </button>

              <button
                onClick={onNext}
                className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors min-h-[30px] sm:min-h-[34px]"
                title={step === totalSteps - 1 ? 'Finish Demo' : 'Next Demo Step'}
              >
                <span>{step === totalSteps - 1 ? 'Finish' : 'Next'}</span>
                <SkipForward className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
