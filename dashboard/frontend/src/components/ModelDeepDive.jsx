import React from 'react';
import { Cpu, TrendingUp, Activity, BrainCircuit, Layers, ShieldCheck, Zap, TableProperties } from 'lucide-react';
import Term from './Term';

export default function ModelDeepDive() {
  const complexityData = [
    {
      name: 'Reactive HPA',
      icon: Activity,
      iconColor: 'text-amber-400',
      category: 'Native K8s Baseline',
      infLatency: '< 0.5 ms',
      timeComplexity: 'O(1)',
      memory: '< 10 KB',
      coldStart: 'Susceptible (45s+ lag)',
      seasonality: 'None (Pure Reactive)',
      promqlWindow: '15s (Instant Avg)',
      training: 'None (Formulaic)',
    },
    {
      name: 'Linear Regression',
      icon: TrendingUp,
      iconColor: 'text-blue-400',
      category: 'Ordinary Least Squares',
      infLatency: '~1.8 ms',
      timeComplexity: 'O(N) window',
      memory: '~50 KB',
      coldStart: 'Partial (Linear Ramp)',
      seasonality: 'None (Slope only)',
      promqlWindow: '60s (4 samples)',
      training: 'Online (Continuous)',
    },
    {
      name: 'Holt-Winters',
      icon: Cpu,
      iconColor: 'text-emerald-400',
      category: 'Triple Exponential',
      infLatency: '~2.4 ms',
      timeComplexity: 'O(N) seasonal',
      memory: '~120 KB',
      coldStart: 'Seasonal Only (Fails on Bursts)',
      seasonality: 'Strong Diurnal (24h)',
      promqlWindow: '24h Seasonality Buffer',
      training: 'Batch (Periodic)',
    },
    {
      name: 'Stacked LSTM',
      icon: BrainCircuit,
      iconColor: 'text-purple-400',
      category: 'Recurrent Neural Net',
      infLatency: '~11.5 ms',
      timeComplexity: 'O(T · d²)',
      memory: '~4.2 MB (Weights)',
      coldStart: 'Zero (Proactive Preemption)',
      seasonality: 'Deep Multi-Scale Non-Linear',
      promqlWindow: '45s Lookahead (3 steps)',
      training: 'Offline / Warm Fine-tune',
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Title & Scope */}
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">Mathematical Formulations & Model Specifications</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Empirical algorithmic specifications, equation derivations, and systems complexity analysis
            </p>
          </div>
        </div>
      </div>

      {/* 1. Central Ensemble Arbiter Formulation */}
      <div className="bento-card rounded-xl p-5 border border-purple-500/30 bg-gradient-to-r from-purple-950/20 via-zinc-950/80 to-zinc-950/80 relative overflow-hidden">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-purple-500/20">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Ensemble Policy: Asymmetric Upper-Bound Arbiter
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-mono font-medium">
            Zero-Deficit Optimization
          </span>
        </div>

        <div className="p-3.5 rounded-lg bg-zinc-950 font-mono text-xs text-purple-300 mb-3 border border-purple-500/30 overflow-x-auto shadow-inner text-center">
          <code>TargetReplicas(t) = clamp( max( R_HPA(t), ŷ_OLS(t), ŷ_HW(t), ŷ_LSTM(t) ), MinPods, MaxPods )</code>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-300 leading-relaxed">
          <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
            <div className="font-bold text-white text-xs mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              The Asymmetric Cloud Penalty Model
            </div>
            <p className="text-zinc-400 text-[11px]">
              In mission-critical cloud infrastructure, the penalty for <strong className="text-rose-300 font-medium">under-provisioning</strong> (SLA violations, queue starvation, HTTP 504 gateway timeouts) dwarfs the marginal cost of <strong className="text-emerald-300 font-medium">transient over-provisioning</strong> ($0.040/pod-hr). PHPA enforces the mathematical upper bound (<code className="text-purple-300 font-mono font-bold">max(...)</code>) to strictly guarantee zero SLA violations during traffic surges.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
            <div className="font-bold text-white text-xs mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
              Continuous Dynamic Re-arbitration
            </div>
            <p className="text-zinc-400 text-[11px]">
              Every 15s Prometheus evaluation step, each model calculates its independent forward recommendation. If the 2-Layer LSTM identifies an inflection signature, its recommendation dominates immediately with 0s scale-up delay; during calm diurnal periods, Holt-Winters and HPA stabilize baseline compute spend without jitter.
            </p>
          </div>
        </div>
      </div>

      {/* 2. The 4 Model Formulations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Reactive HPA */}
        <div className="bento-card rounded-xl p-5 border border-amber-500/20 bg-zinc-950/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">1. Vanilla Reactive HPA</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
              Native Baseline
            </span>
          </div>

          <div className="p-3 rounded-lg bg-zinc-950 font-mono text-xs text-amber-300 mb-3 border border-amber-500/20 text-center overflow-x-auto">
            Target = ⌈ CurrentReplicas × ( CurrentMetric / TargetMetric ) ⌉
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed mb-4">
            The standard Kubernetes Horizontal Pod Autoscaler algorithm. Evaluates moving-average resource consumption over Prometheus scrape windows and scales proportionally when the target threshold is exceeded.
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded bg-emerald-950/20 border border-emerald-500/20 text-emerald-300">
              ✓ Deterministic baseline<br/>
              ✓ Zero training overhead
            </div>
            <div className="p-2 rounded bg-rose-950/20 border border-rose-500/20 text-rose-300">
              ✗ 45s+ Cold-start latency lag<br/>
              ✗ Susceptible to SLA starvation
            </div>
          </div>
        </div>

        {/* 2. Linear Regression */}
        <div className="bento-card rounded-xl p-5 border border-blue-500/20 bg-zinc-950/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-blue-400">2. Linear Regression (OLS)</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300">
              First-Order Trend
            </span>
          </div>

          <div className="p-3 rounded-lg bg-zinc-950 font-mono text-xs text-blue-300 mb-3 border border-blue-500/20 text-center overflow-x-auto">
            ŷ(t + lookahead) = β₁ · (t + lookahead) + β₀
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed mb-4">
            Ordinary Least Squares (OLS) closed-form regression over the sliding window. Calculates first-order velocity (slope β₁) to project steady monotonic traffic ramps into the immediate future.
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded bg-emerald-950/20 border border-emerald-500/20 text-emerald-300">
              ✓ Extremely fast (~1.8ms)<br/>
              ✓ Ideal for constant ramps
            </div>
            <div className="p-2 rounded bg-rose-950/20 border border-rose-500/20 text-rose-300">
              ✗ Overshoots transient peaks<br/>
              ✗ High idle allocation overhead
            </div>
          </div>
        </div>

        {/* 3. Holt-Winters */}
        <div className="bento-card rounded-xl p-5 border border-emerald-500/20 bg-zinc-950/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-emerald-400">3. Holt-Winters Smoothing</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              Triple Exponential
            </span>
          </div>

          <div className="p-3 rounded-lg bg-zinc-950 font-mono text-[11px] text-emerald-300 mb-3 border border-emerald-500/20 space-y-1 overflow-x-auto">
            <div>Level:   L_t = α · (Y_t - S_t-m) + (1 - α) · (L_t-1 + b_t-1)</div>
            <div>Trend:   b_t = β · (L_t - L_t-1) + (1 - β) · b_t-1</div>
            <div>Season:  S_t = γ · (Y_t - L_t) + (1 - γ) · S_t-m</div>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed mb-4">
            Triple exponential smoothing decomposing workload time-series into level (α), trend (β), and diurnal seasonality (γ) with period m = 24 hours. Highly accurate for predictable business-hour patterns.
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded bg-emerald-950/20 border border-emerald-500/20 text-emerald-300">
              ✓ Optimal for 24h diurnal cycles<br/>
              ✓ Low steady-state compute cost
            </div>
            <div className="p-2 rounded bg-rose-950/20 border border-rose-500/20 text-rose-300">
              ✗ Rigid period parameter (m)<br/>
              ✗ Unresponsive to sudden spikes
            </div>
          </div>
        </div>

        {/* 4. Stacked LSTM */}
        <div className="bento-card rounded-xl p-5 border border-purple-500/30 bg-purple-950/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-purple-400">4. Stacked LSTM Neural Network</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Recurrent Deep Net
            </span>
          </div>

          <div className="p-3 rounded-lg bg-zinc-950 font-mono text-[11px] text-purple-300 mb-3 border border-purple-500/20 space-y-1 overflow-x-auto">
            <div>f_t = σ( W_f · [h_t-1, x_t] + b_f )  (Forget Gate)</div>
            <div>i_t = σ( W_i · [h_t-1, x_t] + b_i )  (Input Gate)</div>
            <div>C_t = f_t ⊙ C_t-1 + i_t ⊙ tanh( W_c · [h_t-1, x_t] + b_c )</div>
            <div>h_t = σ( W_o · [h_t-1, x_t] + b_o ) ⊙ tanh( C_t )</div>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed mb-4">
            2-layer stacked PyTorch LSTM (64 hidden units per layer) with Constant Error Carousels. Retains multi-hour temporal context while detecting higher-order acceleration curvature to pre-warm pods before queue saturation.
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded bg-emerald-950/20 border border-emerald-500/20 text-emerald-300">
              ✓ Captures non-linear surge curves<br/>
              ✓ Eliminates cold-start latency spikes
            </div>
            <div className="p-2 rounded bg-amber-950/20 border border-amber-500/20 text-amber-300">
              ⚠ Requires sequence window (T)<br/>
              ⚠ Offline training recommended
            </div>
          </div>
        </div>
      </div>

      {/* 3. Algorithmic Complexity & Systems Trade-off Matrix */}
      <div className="bento-card rounded-xl p-5 border border-zinc-800/90 bg-zinc-950/90">
        <div className="flex items-center justify-between pb-2.5 mb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <TableProperties className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Algorithmic Complexity & Systems Trade-off Matrix</h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            Empirical Architecture Comparison
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-[11px] text-left">
            <thead className="text-[10px] uppercase bg-zinc-900 text-zinc-400 font-semibold border-b border-zinc-800">
              <tr>
                <th className="p-3">Model</th>
                <th className="p-3">Inference Latency</th>
                <th className="p-3">Time Complexity</th>
                <th className="p-3">Memory Footprint</th>
                <th className="p-3">Cold-Start Mitigation</th>
                <th className="p-3">Seasonality Tracking</th>
                <th className="p-3">Scrape Horizon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70 font-mono">
              {complexityData.map((row, idx) => {
                const Icon = row.icon;
                return (
                  <tr key={idx} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="p-3 font-sans font-bold flex items-center gap-2 text-white">
                      <Icon className={`w-3.5 h-3.5 ${row.iconColor}`} />
                      <div>
                        <div>{row.name}</div>
                        <div className="text-[9px] text-zinc-500 font-normal">{row.category}</div>
                      </div>
                    </td>
                    <td className="p-3 text-cyan-300 font-bold">{row.infLatency}</td>
                    <td className="p-3 text-zinc-300">{row.timeComplexity}</td>
                    <td className="p-3 text-zinc-300">{row.memory}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-medium ${
                        row.name === 'Stacked LSTM'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                          : row.name === 'Reactive HPA'
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                          : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                      }`}>
                        {row.coldStart}
                      </span>
                    </td>
                    <td className="p-3 font-sans text-zinc-300">{row.seasonality}</td>
                    <td className="p-3 text-zinc-400">{row.promqlWindow}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
