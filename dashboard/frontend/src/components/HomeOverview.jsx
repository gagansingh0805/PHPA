import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  ShieldAlert, 
  Cpu, 
  Sparkles, 
  Server, 
  CheckCircle2, 
  TrendingUp, 
  Layers, 
  ChevronDown, 
  GitBranch, 
  Play,
  BarChart2,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';

export default function HomeOverview({ onLaunchLab, onNavigateTab }) {
  const [highlightProblem, setHighlightProblem] = useState(false);

  const handleScrollToProblem = (e) => {
    if (e) e.preventDefault();
    setHighlightProblem(true);
    setTimeout(() => setHighlightProblem(false), 2400);

    const container = document.getElementById('main-scroll-container');
    const target = document.getElementById('problem-comparison');
    if (container && target) {
      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const scrollOffset = targetRect.top - containerRect.top + container.scrollTop - 70;
      container.scrollTo({ top: Math.max(0, scrollOffset), behavior: 'smooth' });
    } else if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleHowItWorksClick = () => {
    if (onNavigateTab) {
      onNavigateTab('pipeline');
    } else {
      handleScrollToProblem();
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Executive Research Brief Card */}
      <section className="bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/90 rounded-2xl p-6 sm:p-8 raised-card shadow-lg backdrop-blur-xl relative overflow-hidden">
        {/* Subtle top ambient glow */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-3xl space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800/80 text-cyan-700 dark:text-cyan-400 text-xs font-mono font-semibold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Core Architectural Thesis</span>
            </div>

            <h2 className="text-xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight leading-snug">
              Eliminating Kubernetes Autoscaling Lag with <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-500 dark:from-cyan-400 dark:via-teal-300 dark:to-emerald-400">Proactive Deep Learning</span>
            </h2>

            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
              Standard Kubernetes HPAs react strictly after performance degrades. 
              This research evaluates a multi-model predictive ensemble combining <strong className="text-zinc-900 dark:text-zinc-200 font-semibold font-mono">Linear Regression</strong>, <strong className="text-zinc-900 dark:text-zinc-200 font-semibold font-mono">Holt-Winters</strong>, and a <strong className="text-cyan-600 dark:text-cyan-400 font-semibold font-mono">2-Layer Stacked LSTM</strong> to forecast traffic peaks and pre-warm pods before demand reaches the cluster.
            </p>
          </div>

          <div className="flex flex-row md:flex-col gap-2.5 flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onLaunchLab}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-zinc-950 font-extrabold text-xs sm:text-sm transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 cursor-pointer font-mono tracking-tight"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch Live Simulation Lab</span>
            </motion.button>

            <button
              type="button"
              onClick={handleHowItWorksClick}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-cyan-500/40 bg-zinc-50/60 dark:bg-zinc-950/60 transition-all cursor-pointer font-mono shadow-xs"
            >
              <GitBranch className="w-3.5 h-3.5 text-cyan-500" />
              <span>3D Pipeline Architecture</span>
            </button>
          </div>
        </div>
      </section>

      {/* The Core Problem: Reactive Lag vs. Proactive Scaling */}
      <section
        id="problem-comparison"
        className={`scroll-mt-16 rounded-2xl transition-all duration-300 p-5 sm:p-6 border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40 ${
          highlightProblem
            ? 'ring-2 ring-emerald-500/80 shadow-xl shadow-emerald-500/10 bg-emerald-500/5'
            : ''
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-500" />
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                How It Works: Reactive Lag vs. Proactive Scaling
              </h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Comparing standard threshold-based horizontal autoscaling against predictive lookahead
            </p>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 self-start sm:self-auto">
            Workload Trace: 520 RPS Surge
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: The Reactive Problem */}
          <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800/90 rounded-xl p-5 raised-card relative overflow-hidden">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-xs uppercase tracking-wider font-mono">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <span>Standard Kubernetes HPA (Reactive)</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold">
                1400ms SLA SPIKE
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              45s-60s Cold Start Degradation Window
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
              When a traffic burst hits, metric scrape windows (15s) plus container image pull and runtime initialization create an inevitable window of under-provisioning.
            </p>

            <div className="space-y-2 text-xs text-zinc-700 dark:text-zinc-300 font-mono bg-zinc-50 dark:bg-zinc-950/80 p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between text-zinc-900 dark:text-zinc-100 font-semibold">
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />t = 0s</span>
                <span>Sudden Flash Crowd (+500% RPS)</span>
              </div>
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />t = 15s</span>
                <span>HPA detects CPU breach (&gt;60%)</span>
              </div>
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />t = 30s</span>
                <span>Container runtime schedules pods</span>
              </div>
              <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 font-bold border-t border-zinc-200 dark:border-zinc-800 pt-1.5">
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />t = 50s</span>
                <span>Pods ready (Severe 1400ms Queue Lag!)</span>
              </div>
            </div>
          </div>

          {/* Card 2: The Proactive Solution */}
          <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800/90 rounded-xl p-5 raised-card relative overflow-hidden">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs uppercase tracking-wider font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>PHPA Ensemble Solution (Proactive)</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                0 DEFICITS SUSTAINED
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              Preemptive Scale-Up Ahead of Demand
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
              Time-series neural models forecast trajectory curvature. Pods are actuated into existence 15-45s before traffic arrives at the cluster ingress.
            </p>

            <div className="space-y-2 text-xs text-zinc-700 dark:text-zinc-300 font-mono bg-zinc-50 dark:bg-zinc-950/80 p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-300">
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />t = -20s</span>
                <span>LSTM detects upward acceleration</span>
              </div>
              <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-300">
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />t = -15s</span>
                <span>PHPA preemptively scales to 15 pods</span>
              </div>
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />t = 0s</span>
                <span>Flash crowd arrives — 15 pods READY!</span>
              </div>
              <div className="flex items-center justify-between text-zinc-900 dark:text-zinc-100 font-bold border-t border-zinc-200 dark:border-zinc-800 pt-1.5">
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Result</span>
                <span className="text-emerald-500">Zero SLA breaches (P95 Latency &lt; 35ms)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Model Roster: 4 Models Compared */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Autoscaling Model Roster
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              The 4 mathematical paradigms evaluated concurrently every 15s scrape
            </p>
          </div>
          <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-medium">
            MAX(Models) Enforced
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Model 1: Reactive */}
          <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-4 raised-card relative">
            <div className="flex items-center justify-between mb-2">
              <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
              <span className="text-[10px] font-mono text-zinc-500 px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800">
                Baseline
              </span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">Reactive HPA</h4>
            <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">Vanilla Kubernetes</div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2.5 leading-relaxed">
              Calculates <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-zinc-800 dark:text-zinc-200 font-mono text-[11px]">Target = Current × Ratio</code>. Guaranteed baseline floor, but strictly reactive with inevitable startup delay.
            </p>
          </div>

          {/* Model 2: Linear */}
          <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-4 raised-card relative">
            <div className="flex items-center justify-between mb-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-[10px] font-mono text-blue-500 px-1.5 py-0.2 rounded bg-blue-500/10">
                Velocity
              </span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">Linear Regression</h4>
            <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">Ordinary Least Squares</div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2.5 leading-relaxed">
              Fits <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-zinc-800 dark:text-zinc-200 font-mono text-[11px]">y = mx + b</code> on sliding PromQL window in ~2ms. Tracks monotonic ramps; overshoots transient peaks.
            </p>
          </div>

          {/* Model 3: Holt-Winters */}
          <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-4 raised-card relative">
            <div className="flex items-center justify-between mb-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-[10px] font-mono text-amber-500 px-1.5 py-0.2 rounded bg-amber-500/10">
                Diurnal 24h
              </span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">Holt-Winters</h4>
            <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">Triple Exp Smoothing</div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2.5 leading-relaxed">
              Decomposes Level (α), Trend (β), and Seasonality (γ). Learns daily 24h cyclical patterns, but rigid during non-seasonal surges.
            </p>
          </div>

          {/* Model 4: LSTM */}
          <div className="bg-white dark:bg-zinc-900/90 border border-cyan-500/30 dark:border-cyan-500/40 rounded-xl p-4 raised-card relative shadow-md shadow-cyan-500/5">
            <div className="flex items-center justify-between mb-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="text-[10px] font-mono text-cyan-400 px-1.5 py-0.2 rounded bg-cyan-500/10 font-bold border border-cyan-500/30">
                PREDICTIVE CORE
              </span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-cyan-600 dark:text-cyan-400">Stacked LSTM</h4>
            <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">2-Layer Recurrent Network</div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2.5 leading-relaxed">
              2-layer LSTM with forget gates. Extrapolates high-order non-linear surge acceleration with up to 45s of preemptive lookahead lead.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Platform Exploration Deck */}
      {onNavigateTab && (
        <section className="bg-zinc-50/60 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Interactive Research &amp; Operations Modules
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Explore live metrics, 3D pipelines, multi-model benchmarks, and chaos injection guardrails
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1: Telemetry Lab */}
            <button
              onClick={() => onNavigateTab('lab')}
              className="group text-left p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 hover:border-cyan-500/50 transition-all duration-200 shadow-sm hover:shadow-cyan-500/10 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">Telemetry Lab</h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">Live real-time workload charts &amp; pod replicas</p>
            </button>

            {/* Card 2: 3D Pipeline */}
            <button
              onClick={() => onNavigateTab('pipeline')}
              className="group text-left p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 hover:border-cyan-500/50 transition-all duration-200 shadow-sm hover:shadow-cyan-500/10 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <GitBranch className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">3D Architecture</h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">Interactive 3D controller &amp; metrics pipeline</p>
            </button>

            {/* Card 3: Benchmarks */}
            <button
              onClick={() => onNavigateTab('benchmark')}
              className="group text-left p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 hover:border-cyan-500/50 transition-all duration-200 shadow-sm hover:shadow-cyan-500/10 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">Model Benchmarks</h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">Side-by-side cost &amp; accuracy ledger</p>
            </button>

            {/* Card 4: Guardrails */}
            <button
              onClick={() => onNavigateTab('guardrails')}
              className="group text-left p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 hover:border-cyan-500/50 transition-all duration-200 shadow-sm hover:shadow-cyan-500/10 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">Safety Guardrails</h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">Chaos sandbox, cooldowns &amp; bounds</p>
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

