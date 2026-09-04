import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, ShieldAlert, Cpu, Sparkles, Server, CheckCircle2, TrendingUp } from 'lucide-react';

export default function HomeOverview({ onLaunchLab }) {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Section with Ambient Glow */}
      <section className="relative rounded-2xl p-8 md:p-12 overflow-hidden border border-zinc-800/80 bg-gradient-to-b from-zinc-900/90 via-zinc-900/50 to-zinc-950/80 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Cloud Computing Research Paper
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Eliminating Kubernetes Autoscaling Lag with <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">Proactive Deep Learning</span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-zinc-300 leading-relaxed">
            Standard Kubernetes HPAs only react <span className="text-white font-medium italic">after</span> performance degrades. 
            This research evaluates an ensemble architecture combining <strong className="text-blue-400">Linear Regression</strong>, <strong className="text-emerald-400">Holt-Winters</strong>, and a <strong className="text-purple-400">2-Layer LSTM</strong> to forecast traffic peaks ahead of demand.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onLaunchLab}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-600/25 border border-purple-400/30"
            >
              <span>Launch Live Telemetry Lab</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>

            <a
              href="#problem-comparison"
              className="px-5 py-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 font-semibold text-sm border border-zinc-700/60 transition-colors"
            >
              How It Works
            </a>
          </div>
        </div>
      </section>

      {/* The Core Problem: Reactive Lag vs. Proactive Scaling */}
      <section id="problem-comparison" className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: The Reactive Problem */}
        <div className="bento-card rounded-xl p-6 border-red-500/20 bg-gradient-to-b from-red-950/10 to-zinc-900/60 relative overflow-hidden">
          <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider mb-3">
            <ShieldAlert className="w-4 h-4" />
            The Standard HPA Problem (Reactive)
          </div>
          <h3 className="text-lg font-bold text-white mb-2">30-60s Cold Start Degradation</h3>
          <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
            When a burst of traffic hits, metric collection intervals + pod boot-up delays create a window of under-provisioning.
          </p>

          <div className="space-y-2.5 text-xs text-zinc-300 font-mono bg-zinc-950/60 p-3.5 rounded-lg border border-red-500/20">
            <div className="flex items-center justify-between text-red-400">
              <span>t = 0s</span>
              <span>Sudden Flash Crowd (+500% RPS)</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>t = 15s</span>
              <span>HPA detects CPU breach</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>t = 30s</span>
              <span>Pods scheduled on node</span>
            </div>
            <div className="flex items-center justify-between text-red-400 font-bold">
              <span>t = 50s</span>
              <span>Pods finally ready (Latency Spike: 1400ms!)</span>
            </div>
          </div>
        </div>

        {/* Card 2: The Proactive Solution */}
        <div className="bento-card rounded-xl p-6 border-emerald-500/20 bg-gradient-to-b from-emerald-950/10 to-zinc-900/60 relative overflow-hidden">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-3">
            <CheckCircle2 className="w-4 h-4" />
            The PHPA Solution (Proactive Forecasting)
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Preemptive Scale-Up Before Demand</h3>
          <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
            Time-series models extrapolate trajectory. Pods are ordered into existence minutes/seconds before traffic arrives.
          </p>

          <div className="space-y-2.5 text-xs text-zinc-300 font-mono bg-zinc-950/60 p-3.5 rounded-lg border border-emerald-500/20">
            <div className="flex items-center justify-between text-purple-400">
              <span>t = -20s</span>
              <span>LSTM detects upward curvature signature</span>
            </div>
            <div className="flex items-center justify-between text-cyan-400">
              <span>t = -15s</span>
              <span>PHPA preemptively scales to 15 pods</span>
            </div>
            <div className="flex items-center justify-between text-emerald-400 font-bold">
              <span>t = 0s</span>
              <span>Flash Crowd arrives — 15 pods READY!</span>
            </div>
            <div className="flex items-center justify-between text-emerald-300">
              <span>Result:</span>
              <span>Zero SLA breaches (P95 Latency &lt; 40ms)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Model Roster: 4 Models Compared */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-white">Autoscaling Model Roster</h2>
          <p className="text-xs text-zinc-400">The 4 paradigms evaluated in this research platform</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Model 1: Reactive */}
          <div className="bento-card rounded-xl p-5 border-zinc-800">
            <div className="w-2 h-2 rounded-full bg-amber-400 mb-2"></div>
            <h4 className="text-sm font-bold text-white">Reactive HPA</h4>
            <div className="text-[11px] font-mono text-zinc-400 mt-0.5">Vanilla Kubernetes</div>
            <p className="text-xs text-zinc-400 mt-2.5">
              Calculates <code className="text-zinc-300">Target = Current × (Ratio)</code>. Strong baseline floor, but strictly reactive with unavoidable startup delay.
            </p>
          </div>

          {/* Model 2: Linear */}
          <div className="bento-card rounded-xl p-5 border-blue-500/20">
            <div className="w-2 h-2 rounded-full bg-blue-400 mb-2"></div>
            <h4 className="text-sm font-bold text-blue-400">Linear Regression</h4>
            <div className="text-[11px] font-mono text-zinc-400 mt-0.5">Ordinary Least Squares</div>
            <p className="text-xs text-zinc-400 mt-2.5">
              Fits <code className="text-zinc-300">y = mx + b</code> on sliding window. Computes in ~2ms. Great for monotonic ramp-ups; overshoots on curvature.
            </p>
          </div>

          {/* Model 3: Holt-Winters */}
          <div className="bento-card rounded-xl p-5 border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 mb-2"></div>
            <h4 className="text-sm font-bold text-emerald-400">Holt-Winters</h4>
            <div className="text-[11px] font-mono text-zinc-400 mt-0.5">Triple Exp Smoothing</div>
            <p className="text-xs text-zinc-400 mt-2.5">
              Models Level (α), Trend (β), and Seasonality (γ). Learns daily 24h peaks, but rigid when unexpected non-seasonal spikes hit.
            </p>
          </div>

          {/* Model 4: LSTM */}
          <div className="bento-card rounded-xl p-5 border-purple-500/30 bg-purple-950/10">
            <div className="w-2 h-2 rounded-full bg-purple-400 mb-2 shadow-[0_0_8px_#a855f7]"></div>
            <h4 className="text-sm font-bold text-purple-400">LSTM Neural Net</h4>
            <div className="text-[11px] font-mono text-zinc-400 mt-0.5">Recurrent Memory</div>
            <p className="text-xs text-zinc-400 mt-2.5">
              2-layer LSTM with forget gates. Captures both periodic patterns and high-order surge acceleration signatures.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
