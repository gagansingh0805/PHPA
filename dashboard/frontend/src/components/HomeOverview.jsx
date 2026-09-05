import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldAlert, Cpu, Sparkles, Server, CheckCircle2, TrendingUp, Layers, ChevronDown, GitBranch } from 'lucide-react';

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
      {/* Hero Section */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 sm:p-8 md:p-10 raised-card shadow-sm">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-mono font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Cloud Systems Research</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-snug">
            Eliminating Kubernetes Autoscaling Lag with <span className="text-zinc-500 dark:text-zinc-400">Proactive Deep Learning</span>
          </h1>

          <p className="mt-3 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Standard Kubernetes HPAs react strictly after performance degrades. 
            This research evaluates a multi-model predictive ensemble combining <strong className="text-zinc-900 dark:text-zinc-200 font-semibold">Linear Regression</strong>, <strong className="text-zinc-900 dark:text-zinc-200 font-semibold">Holt-Winters</strong>, and a <strong className="text-zinc-900 dark:text-zinc-200 font-semibold">2-Layer Stacked LSTM</strong> to forecast traffic peaks and pre-warm pods before demand reaches the cluster.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={onLaunchLab}
              className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 font-semibold text-xs transition-all shadow-sm cursor-pointer"
            >
              <span>Launch Live Simulation Lab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleHowItWorksClick}
              className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs border border-zinc-200 dark:border-zinc-700 transition-colors shadow-sm cursor-pointer"
              title="Inspect the 3D Autoscaler Architecture Pipeline"
            >
              <GitBranch className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>How It Works (3D Pipeline)</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
            </motion.button>

            <button
              type="button"
              onClick={handleScrollToProblem}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer"
            >
              <span>Compare Reactive vs Proactive</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
            </button>
          </div>
        </div>
      </section>

      {/* The Core Problem: Reactive Lag vs. Proactive Scaling */}
      <section
        id="problem-comparison"
        className={`scroll-mt-16 rounded-xl transition-all duration-300 p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 ${
          highlightProblem
            ? 'ring-2 ring-emerald-500/80 shadow-lg shadow-emerald-500/10 bg-emerald-500/5'
            : ''
        }`}
      >
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">How It Works: Reactive Lag vs. Proactive Scaling</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Comparing standard threshold-based horizontal autoscaling against predictive lookahead</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: The Reactive Problem */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 raised-card">
          <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-semibold text-xs uppercase tracking-wider mb-2">
            <ShieldAlert className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            <span>Standard Kubernetes HPA (Reactive)</span>
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">30-60s Cold Start Degradation</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 leading-relaxed">
            When a traffic burst hits, metric scrape windows plus pod container initialization create an inevitable window of under-provisioning.
          </p>

          <div className="space-y-2 text-xs text-zinc-700 dark:text-zinc-300 font-mono bg-zinc-50 dark:bg-zinc-950 p-3 rounded-md border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between text-zinc-900 dark:text-zinc-100 font-semibold">
              <span>t = 0s</span>
              <span>Sudden Flash Crowd (+500% RPS)</span>
            </div>
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
              <span>t = 15s</span>
              <span>HPA detects CPU breach</span>
            </div>
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
              <span>t = 30s</span>
              <span>Pods scheduled on node</span>
            </div>
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 font-semibold">
              <span>t = 50s</span>
              <span>Pods finally ready (Latency: 1400ms!)</span>
            </div>
          </div>
        </div>

        {/* Card 2: The Proactive Solution */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 raised-card">
          <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-semibold text-xs uppercase tracking-wider mb-2">
            <CheckCircle2 className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            <span>PHPA Ensemble Solution (Proactive)</span>
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Preemptive Scale-Up Ahead of Demand</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 leading-relaxed">
            Time-series neural models forecast trajectory curvature. Pods are actuated into existence 15-45s before traffic arrives.
          </p>

          <div className="space-y-2 text-xs text-zinc-700 dark:text-zinc-300 font-mono bg-zinc-50 dark:bg-zinc-950 p-3 rounded-md border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between text-zinc-800 dark:text-zinc-200">
              <span>t = -20s</span>
              <span>LSTM detects upward acceleration signature</span>
            </div>
            <div className="flex items-center justify-between text-zinc-800 dark:text-zinc-200">
              <span>t = -15s</span>
              <span>PHPA preemptively scales to 15 pods</span>
            </div>
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>t = 0s</span>
              <span>Flash crowd arrives — 15 pods READY!</span>
            </div>
            <div className="flex items-center justify-between text-zinc-900 dark:text-zinc-100 font-semibold">
              <span>Result:</span>
              <span>Zero SLA breaches (P95 Latency &lt; 40ms)</span>
            </div>
          </div>
        </div>
      </div>
    </section>

      {/* Model Roster: 4 Models Compared */}
      <section>
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">Autoscaling Model Roster</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">The 4 paradigms evaluated in this research platform</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Model 1: Reactive */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 raised-card">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 dark:bg-zinc-400 mb-2"></div>
            <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Reactive HPA</h4>
            <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">Vanilla Kubernetes</div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
              Calculates <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-zinc-800 dark:text-zinc-200">Target = Current × Ratio</code>. Guaranteed baseline floor, but strictly reactive with inevitable startup delay.
            </p>
          </div>

          {/* Model 2: Linear */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 raised-card">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 dark:bg-zinc-400 mb-2"></div>
            <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Linear Regression</h4>
            <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">Ordinary Least Squares</div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
              Fits <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-zinc-800 dark:text-zinc-200">y = mx + b</code> on sliding PromQL window in ~2ms. Tracks monotonic ramps; overshoots transient peaks.
            </p>
          </div>

          {/* Model 3: Holt-Winters */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 raised-card">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 dark:bg-zinc-400 mb-2"></div>
            <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Holt-Winters</h4>
            <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">Triple Exp Smoothing</div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
              Decomposes Level (α), Trend (β), and Seasonality (γ). Learns daily 24h cyclical patterns, but rigid during non-seasonal surges.
            </p>
          </div>

          {/* Model 4: LSTM */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 raised-card">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100 mb-2"></div>
            <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Stacked LSTM</h4>
            <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">Recurrent Memory Network</div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
              2-layer LSTM with forget gates. Extrapolates high-order non-linear surge acceleration with up to 45s of lookahead lead.
            </p>
          </div>
        </div>

        {/* Quick jump to Pipeline and Models */}
        {onNavigateTab && (
          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <div>
              <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Explore the Full Autoscaler Architecture</h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Inspect the 3D isometric pipeline canvas or dive into mathematical derivations.</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => onNavigateTab('pipeline')}
                className="px-3 py-1.5 rounded-md text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity shadow-sm"
              >
                3D Pipeline Architecture
              </button>
              <button
                onClick={() => onNavigateTab('models')}
                className="px-3 py-1.5 rounded-md text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border border-zinc-200 dark:border-zinc-700"
              >
                Mathematical Theory
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
