import React from 'react';
import { Cpu, TrendingUp, Activity, BrainCircuit, Layers, ShieldCheck, Zap, TableProperties } from 'lucide-react';
import Term from './Term';
import MathFormula from './MathFormula';

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
          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-800 dark:text-zinc-200">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Mathematical Formulations &amp; Model Specifications</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Empirical algorithmic specifications, equation derivations, and systems complexity analysis
            </p>
          </div>
        </div>
      </div>

      {/* 1. Central Ensemble Arbiter Formulation */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 raised-card">
        <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Ensemble Policy: Asymmetric Upper-Bound Arbiter
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-[10px] font-mono font-medium">
            Zero-Deficit Enforcement
          </span>
        </div>

        <MathFormula
          tex="\text{TargetReplicas}(t) = \operatorname{clamp}\left( \max\left( R_{\text{HPA}}(t), \; \hat{y}_{\text{OLS}}(t), \; \hat{y}_{\text{HW}}(t), \; \hat{y}_{\text{LSTM}}(t) \right), \; \text{MinPods}, \; \text{MaxPods} \right)"
          fallback={
            <div className="flex items-center justify-center flex-wrap gap-1.5 text-xs sm:text-sm font-mono text-zinc-900 dark:text-zinc-100 py-1 tracking-tight">
              <span>TargetReplicas(t) = clamp( max( R_HPA(t), ŷ_OLS(t), ŷ_HW(t), ŷ_LSTM(t) ), MinPods, MaxPods )</span>
            </div>
          }
          className="mb-4"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          <div className="p-3.5 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs mb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              The Asymmetric Cloud Penalty Model
            </div>
            <p className="text-[11px] leading-relaxed">
              In mission-critical cloud infrastructure, the cost penalty for <strong className="text-zinc-900 dark:text-zinc-200 font-medium">under-provisioning</strong> (SLA violations, queue starvation, HTTP 504 timeouts) dwarfs the marginal cost of <strong className="text-zinc-900 dark:text-zinc-200 font-medium">transient over-provisioning</strong> ($0.040/pod-hr). PHPA enforces the mathematical upper bound (<code className="bg-zinc-200 dark:bg-zinc-800 px-1 py-0.2 rounded font-mono font-semibold text-zinc-900 dark:text-zinc-100">max(...)</code>) to strictly prevent starvation during traffic surges.
            </p>
          </div>

          <div className="p-3.5 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs mb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100"></span>
              Continuous Dynamic Re-arbitration
            </div>
            <p className="text-[11px] leading-relaxed">
              Every 15s evaluation cycle, each algorithm calculates its independent recommendation. If the Stacked LSTM identifies an inflection signature, its recommendation dominates immediately with 0s scale-up delay; during calm diurnal periods, Holt-Winters and HPA stabilize baseline compute spend without jitter.
            </p>
          </div>
        </div>
      </div>

      {/* 2. The 4 Model Formulations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Reactive HPA */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 raised-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">1. Vanilla Reactive HPA</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
              Native Baseline
            </span>
          </div>

          <MathFormula
            tex="R_{\text{target}}(t) = \left\lceil R_{\text{current}} \times \frac{\text{CurrentMetric}}{\text{TargetMetric (60\%)}} \right\rceil"
            fallback={
              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-mono text-zinc-900 dark:text-zinc-100 py-1">
                <span>R_target(t) = ⌈ R_current × (CurrentMetric / TargetMetric) ⌉</span>
              </div>
            }
            className="mb-3"
          />

          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            The standard Kubernetes Horizontal Pod Autoscaler algorithm. Evaluates moving-average resource consumption over Prometheus scrape windows and scales proportionally when the target threshold is exceeded.
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
              ✓ Deterministic baseline<br/>
              ✓ Zero training overhead
            </div>
            <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
              ✗ 45s+ Cold-start latency lag<br/>
              ✗ Susceptible to SLA starvation
            </div>
          </div>
        </div>

        {/* 2. Linear Regression */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 raised-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">2. Linear Regression (OLS)</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
              First-Order Trend
            </span>
          </div>

          <MathFormula
            tex="\hat{y}(t + \tau) = \beta_1 \cdot (t + \tau) + \beta_0, \quad \beta_1 = \frac{\sum (t_i - \bar{t})(y_i - \bar{y})}{\sum (t_i - \bar{t})^2}"
            fallback={
              <div className="flex flex-col items-center justify-center gap-1 text-xs sm:text-sm font-mono text-zinc-900 dark:text-zinc-100 py-1">
                <div>ŷ(t + τ) = β₁ · (t + τ) + β₀</div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">β₁ = ∑(tᵢ − t̄)(yᵢ − ȳ) / ∑(tᵢ − t̄)²</div>
              </div>
            }
            className="mb-3"
          />

          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            Ordinary Least Squares (OLS) closed-form regression over the sliding window. Calculates first-order velocity (slope β₁) to project steady monotonic traffic ramps into the immediate future.
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
              ✓ Extremely fast (~1.8ms)<br/>
              ✓ Ideal for constant ramps
            </div>
            <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
              ✗ Overshoots transient peaks<br/>
              ✗ High idle allocation overhead
            </div>
          </div>
        </div>

        {/* 3. Holt-Winters */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 raised-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">3. Holt-Winters Smoothing</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
              Triple Exponential
            </span>
          </div>

          <MathFormula
            tex="\begin{aligned} L_t &= \alpha (Y_t - S_{t-m}) + (1 - \alpha)(L_{t-1} + b_{t-1}) \\ b_t &= \beta (L_t - L_{t-1}) + (1 - \beta) b_{t-1} \\ S_t &= \gamma (Y_t - L_t) + (1 - \gamma) S_{t-m} \end{aligned}"
            fallback={
              <div className="w-full flex flex-col space-y-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100 py-1">
                <div>Level (L_t):  L_t = α · (Y_t − S_[t−m]) + (1 − α) · (L_[t−1] + b_[t−1])</div>
                <div>Trend (b_t):  b_t = β · (L_t − L_[t−1]) + (1 − β) · b_[t−1]</div>
                <div>Season (S_t): S_t = γ · (Y_t − L_t) + (1 − γ) · S_[t−m]</div>
              </div>
            }
            className="mb-3"
          />

          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            Triple exponential smoothing decomposing workload time-series into level (α), trend (β), and diurnal seasonality (γ) with period m = 24 hours. Highly accurate for predictable business-hour patterns.
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
              ✓ Optimal for 24h diurnal cycles<br/>
              ✓ Low steady-state compute cost
            </div>
            <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
              ✗ Rigid period parameter (m)<br/>
              ✗ Unresponsive to sudden spikes
            </div>
          </div>
        </div>

        {/* 4. Stacked LSTM */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 raised-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">4. Stacked LSTM Neural Network</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
              Recurrent Deep Net
            </span>
          </div>

          <MathFormula
            tex="\begin{aligned} f_t &= \sigma(W_f \cdot [h_{t-1}, x_t] + b_f) \\ i_t &= \sigma(W_i \cdot [h_{t-1}, x_t] + b_i) \\ \tilde{C}_t &= \tanh(W_c \cdot [h_{t-1}, x_t] + b_c) \\ C_t &= f_t \odot C_{t-1} + i_t \odot \tilde{C}_t \\ h_t &= \sigma(W_o \cdot [h_{t-1}, x_t] + b_o) \odot \tanh(C_t) \end{aligned}"
            fallback={
              <div className="w-full flex flex-col space-y-1 text-xs font-mono text-zinc-900 dark:text-zinc-100 py-1">
                <div>Forget Gate: f_t = σ(W_f · [h_[t−1], x_t] + b_f)</div>
                <div>Input Gate:  i_t = σ(W_i · [h_[t−1], x_t] + b_i)</div>
                <div>Candidate:   C̃_t = tanh(W_c · [h_[t−1], x_t] + b_c)</div>
                <div>Cell State:  C_t = f_t ⊙ C_[t−1] + i_t ⊙ C̃_t</div>
                <div>Hidden Out:  h_t = σ(W_o · [h_[t−1], x_t] + b_o) ⊙ tanh(C_t)</div>
              </div>
            }
            className="mb-3"
          />

          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            2-layer stacked PyTorch LSTM (64 hidden units per layer) with Constant Error Carousels. Retains multi-hour temporal context while detecting higher-order acceleration curvature to pre-warm pods before queue saturation.
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
              ✓ Captures non-linear surge curves<br/>
              ✓ Eliminates cold-start latency spikes
            </div>
            <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
              ⚠ Requires sequence window (T)<br/>
              ⚠ Offline training recommended
            </div>
          </div>
        </div>
      </div>

      {/* 3. Algorithmic Complexity & Systems Trade-off Matrix */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 raised-card">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <TableProperties className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">Algorithmic Complexity &amp; Systems Trade-off Matrix</h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
            Empirical Architecture Comparison
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-xs text-left">
            <thead className="text-[10px] uppercase bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800">
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
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono text-xs">
              {complexityData.map((row, idx) => {
                const Icon = row.icon;
                return (
                  <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="p-3 font-sans font-semibold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                      <Icon className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                      <div>
                        <div>{row.name}</div>
                        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-normal">{row.category}</div>
                      </div>
                    </td>
                    <td className="p-3 text-zinc-900 dark:text-zinc-100 font-bold tabular-nums">{row.infLatency}</td>
                    <td className="p-3 text-zinc-700 dark:text-zinc-300">{row.timeComplexity}</td>
                    <td className="p-3 text-zinc-700 dark:text-zinc-300">{row.memory}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-sans font-medium bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                        {row.coldStart}
                      </span>
                    </td>
                    <td className="p-3 font-sans text-zinc-700 dark:text-zinc-300">{row.seasonality}</td>
                    <td className="p-3 text-zinc-500 dark:text-zinc-400">{row.promqlWindow}</td>
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
