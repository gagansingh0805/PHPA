import React from 'react';
import { Cpu, TrendingUp, Activity, BrainCircuit } from 'lucide-react';

export default function ModelDeepDive() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-bold text-white">Mathematical Model Deep Dive</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Detailed formulation, equations, and trade-off analysis of the autoscaling algorithms
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Reactive HPA */}
        <div className="bento-card rounded-xl p-6 border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-bold text-white">1. Vanilla Reactive HPA</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300">Baseline</span>
          </div>

          <div className="p-3 rounded-lg bg-zinc-950 font-mono text-xs text-amber-300 mb-4 border border-zinc-800/80">
            Target = ⌈ CurrentReplicas × (CurrentMetric / TargetMetric) ⌉
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed mb-4">
            The native Kubernetes algorithm. It computes desired pods solely based on the ratio between current observed utilization and target utilization.
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded bg-emerald-950/20 border border-emerald-500/20 text-emerald-300">
              ✓ Ground truth stability<br/>
              ✓ Zero training required
            </div>
            <div className="p-2 rounded bg-red-950/20 border border-red-500/20 text-red-300">
              ✗ 45s+ Cold start lag<br/>
              ✗ Severe SLA violation spikes
            </div>
          </div>
        </div>

        {/* 2. Linear Regression */}
        <div className="bento-card rounded-xl p-6 border-blue-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <h3 className="text-base font-bold text-blue-400">2. Linear Regression (OLS)</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300">Fast OLS</span>
          </div>

          <div className="p-3 rounded-lg bg-zinc-950 font-mono text-xs text-blue-300 mb-4 border border-blue-500/20">
            ŷ(t + lookAhead) = β₁ × (t + lookAhead) + β₀
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed mb-4">
            Ordinary Least Squares regression across recent sample window. Projects constant-velocity trends into the future.
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded bg-emerald-950/20 border border-emerald-500/20 text-emerald-300">
              ✓ Extremely fast (~2ms)<br/>
              ✓ Ideal for constant ramps
            </div>
            <div className="p-2 rounded bg-red-950/20 border border-red-500/20 text-red-300">
              ✗ Overshoots at peaks<br/>
              ✗ Poor on oscillating traffic
            </div>
          </div>
        </div>

        {/* 3. Holt-Winters */}
        <div className="bento-card rounded-xl p-6 border-emerald-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <h3 className="text-base font-bold text-emerald-400">3. Holt-Winters Smoothing</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300">Triple Exponential</span>
          </div>

          <div className="p-3 rounded-lg bg-zinc-950 font-mono text-xs text-emerald-300 mb-4 border border-emerald-500/20 space-y-1">
            <div>Level: Lₜ = α(Yₜ - Sₜ₋ₘ) + (1-α)(Lₜ₋₁ + bₜ₋₁)</div>
            <div>Trend: bₜ = β(Lₜ - Lₜ₋₁) + (1-β)bₜ₋₁</div>
            <div>Seasonal: Sₜ = γ(Yₜ - Lₜ) + (1-γ)Sₜ₋ₘ</div>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed mb-4">
            Triple exponential smoothing decomposing time-series into level (α), trend (β), and seasonality (γ) with period length m.
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded bg-emerald-950/20 border border-emerald-500/20 text-emerald-300">
              ✓ Perfect for diurnal 24h cycles<br/>
              ✓ Minimal steady-state cost
            </div>
            <div className="p-2 rounded bg-red-950/20 border border-red-500/20 text-red-300">
              ✗ Rigid period length m<br/>
              ✗ Lags on non-seasonal bursts
            </div>
          </div>
        </div>

        {/* 4. LSTM */}
        <div className="bento-card rounded-xl p-6 border-purple-500/30 bg-purple-950/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-purple-400" />
              <h3 className="text-base font-bold text-purple-400">4. Long Short-Term Memory (LSTM)</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">Recurrent Deep Net</span>
          </div>

          <div className="p-3 rounded-lg bg-zinc-950 font-mono text-xs text-purple-300 mb-4 border border-purple-500/20 space-y-1">
            <div>fₜ = σ(W_f · [hₜ₋₁, xₜ] + b_f)  (Forget Gate)</div>
            <div>iₜ = σ(W_i · [hₜ₋₁, xₜ] + b_i)  (Input Gate)</div>
            <div>Cₜ = fₜ * Cₜ₋₁ + iₜ * tanh(W_c · [hₜ₋₁, xₜ] + b_c)</div>
            <div>hₜ = σ(W_o · [hₜ₋₁, xₜ] + b_o) * tanh(Cₜ)</div>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed mb-4">
            Recurrent neural network with constant error carousels. Remembers long-range weekly dependencies while rapidly detecting pre-surge acceleration signatures.
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded bg-emerald-950/20 border border-emerald-500/20 text-emerald-300">
              ✓ Captures non-linear surges<br/>
              ✓ Resilient to sudden flash crowds
            </div>
            <div className="p-2 rounded bg-amber-950/20 border border-amber-500/20 text-amber-300">
              ⚠ Requires sequence window (T)<br/>
              ⚠ Offline training recommended
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
