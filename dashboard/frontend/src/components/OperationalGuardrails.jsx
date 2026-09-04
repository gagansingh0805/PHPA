import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Sliders, 
  Zap, 
  Cpu, 
  Clock, 
  Layers, 
  RotateCcw, 
  BrainCircuit, 
  ArrowUpRight, 
  ArrowDownRight, 
  Copy, 
  Check, 
  CheckCircle2, 
  AlertTriangle,
  Server
} from 'lucide-react';
import Term from './Term';

export default function OperationalGuardrails({
  guardrails,
  onUpdateGuardrail,
  latest,
  onInjectSpike,
  onTriggerLstmEvent,
  onAdjustRps,
  onReset,
  buttonFeedback,
}) {
  const [copied, setCopied] = useState(false);

  const { minPods, maxPods, targetCpu, cooldownSec } = guardrails;
  const actualPods = latest.actual_pods || 4;
  const cpu = latest.cpu_utilization || 60;
  const rps = latest.rps || 125;

  const yamlManifest = `apiVersion: autoscaling.research/v1alpha1
kind: PredictiveHorizontalPodAutoscaler
metadata:
  name: phpa-workload-controller
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: inference-gateway
  minReplicas: ${minPods}
  maxReplicas: ${maxPods}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: ${targetCpu}
  behavior:
    scaleDown:
      stabilizationWindowSeconds: ${cooldownSec}
      policies:
        - type: Percent
          value: 20
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0 # Immediate Proactive Preemption
  predictive:
    lookaheadSeconds: 45
    ensemblePolicy: MAX_UPPER_BOUND
    models:
      - name: stacked-lstm
        architecture: 2x64
      - name: holt-winters
        period: 24h
      - name: linear-ols
        window: 60s
      - name: reactive-hpa
        weight: baseline_floor`;

  const handleCopyYaml = () => {
    navigator.clipboard.writeText(yamlManifest).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* 1. Top Bento KPI Cards for Operational Guardrails */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Replica Range Boundary */}
        <div className="bento-card rounded-xl p-3.5 relative overflow-hidden bg-zinc-900/60 border border-zinc-800 group">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Replica Boundaries</span>
            <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Server className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white font-mono">{minPods} → {maxPods}</span>
            <span className="text-[11px] text-zinc-400">pods range</span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-400 flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            Current: <span className="text-purple-300 font-bold">{actualPods} pods active</span>
          </div>
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
        </div>

        {/* Card 2: Target CPU Threshold */}
        <div className="bento-card rounded-xl p-3.5 relative overflow-hidden bg-zinc-900/60 border border-zinc-800 group">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Target CPU Load</span>
            <div className="w-6 h-6 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Cpu className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-cyan-400 font-mono">{targetCpu}%</span>
            <span className="text-[11px] text-zinc-400">utilization</span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-400 flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            Observed: <span className="text-zinc-200 font-semibold">{cpu}% average</span>
          </div>
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
        </div>

        {/* Card 3: Downscale Stabilization Cooldown */}
        <div className="bento-card rounded-xl p-3.5 relative overflow-hidden bg-zinc-900/60 border border-zinc-800 group">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Downscale Cooldown</span>
            <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-400 font-mono">{cooldownSec}s</span>
            <span className="text-[11px] text-zinc-400">stabilization</span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-400 flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Policy: <span className="text-zinc-200 font-semibold">Anti-flapping dampener</span>
          </div>
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
        </div>

        {/* Card 4: Enforced Boundary Status */}
        <div className="bento-card rounded-xl p-3.5 relative overflow-hidden bg-zinc-900/60 border border-zinc-800 group">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Policy Enforcement</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-400 font-mono">ACTIVE</span>
            <span className="text-[11px] text-zinc-400">invariants safe</span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-400 flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]"></span>
            Status: <span className="text-emerald-300 font-semibold">Zero budget overrun risk</span>
          </div>
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
        </div>
      </div>

      {/* 2. Main Deck: Left Column (Policy Controls & YAML) + Right Column (Chaos Sandbox & Invariants) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT COLUMN: 7 Columns (Guardrail Steppers & Kubernetes CRD Manifest) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Card A: Interactive Operational Guardrails */}
          <div className="bento-card rounded-xl p-5 border border-zinc-800/90 bg-zinc-950/90 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-2.5 mb-4 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Cluster Operational Boundaries</h3>
                  <p className="text-[10px] text-zinc-400">Real-time parameters governing the autoscaler's actuation limits</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-medium">
                Live Clamping Enforced
              </span>
            </div>

            <div className="space-y-4 text-xs font-mono">
              {/* 1. Min Replicas */}
              <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-zinc-200 font-sans flex items-center gap-1.5">
                    <span>Minimum Replica Floor</span>
                    <span className="text-[10px] font-mono text-zinc-500">(minReplicas)</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 font-sans mt-0.5">
                    Guarantees warm baseline pods to prevent scale-to-zero cold-start queue delay.
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                  <button
                    onClick={() => onUpdateGuardrail('minPods', -1)}
                    className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center text-zinc-200 hover:text-white font-bold transition-colors"
                    title="Decrease minimum pods"
                  >
                    -
                  </button>
                  <span className="text-white font-bold text-sm min-w-[60px] text-center px-2 py-1 rounded bg-zinc-950 border border-zinc-800">
                    {minPods} pods
                  </span>
                  <button
                    onClick={() => onUpdateGuardrail('minPods', 1)}
                    className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center text-zinc-200 hover:text-white font-bold transition-colors"
                    title="Increase minimum pods"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 2. Max Replicas */}
              <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-zinc-200 font-sans flex items-center gap-1.5">
                    <span>Maximum Replica Ceiling</span>
                    <span className="text-[10px] font-mono text-zinc-500">(maxReplicas)</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 font-sans mt-0.5">
                    Hard safety ceiling protecting Kubernetes nodes against runaway cloud billing.
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                  <button
                    onClick={() => onUpdateGuardrail('maxPods', -5)}
                    className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center text-zinc-200 hover:text-white font-bold transition-colors"
                    title="Decrease maximum pods"
                  >
                    -
                  </button>
                  <span className="text-white font-bold text-sm min-w-[60px] text-center px-2 py-1 rounded bg-zinc-950 border border-zinc-800">
                    {maxPods} pods
                  </span>
                  <button
                    onClick={() => onUpdateGuardrail('maxPods', 5)}
                    className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center text-zinc-200 hover:text-white font-bold transition-colors"
                    title="Increase maximum pods"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 3. Target Pod CPU */}
              <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-zinc-200 font-sans flex items-center gap-1.5">
                    <span>Target Pod CPU Load</span>
                    <span className="text-[10px] font-mono text-zinc-500">(targetCPUUtilization)</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 font-sans mt-0.5">
                    Nominal operating load. Lower targets leave more headroom for flash traffic bursts.
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                  <button
                    onClick={() => onUpdateGuardrail('targetCpu', -5)}
                    className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center text-zinc-200 hover:text-white font-bold transition-colors"
                    title="Decrease target CPU"
                  >
                    -
                  </button>
                  <span className="text-cyan-300 font-bold text-sm min-w-[60px] text-center px-2 py-1 rounded bg-zinc-950 border border-zinc-800">
                    {targetCpu}%
                  </span>
                  <button
                    onClick={() => onUpdateGuardrail('targetCpu', 5)}
                    className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center text-zinc-200 hover:text-white font-bold transition-colors"
                    title="Increase target CPU"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 4. Scale-Down Stabilization Cooldown */}
              <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-zinc-200 font-sans flex items-center gap-1.5">
                    <span>Scale-Down Stabilization Window</span>
                    <span className="text-[10px] font-mono text-zinc-500">(cooldownWindowSeconds)</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 font-sans mt-0.5">
                    Cool-off period before decommissioning idle pods, preventing rapid pod thrashing (flapping).
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                  <button
                    onClick={() => onUpdateGuardrail('cooldownSec', -15)}
                    className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center text-zinc-200 hover:text-white font-bold transition-colors"
                    title="Decrease cooldown window"
                  >
                    -
                  </button>
                  <span className="text-amber-400 font-bold text-sm min-w-[60px] text-center px-2 py-1 rounded bg-zinc-950 border border-zinc-800">
                    {cooldownSec}s
                  </span>
                  <button
                    onClick={() => onUpdateGuardrail('cooldownSec', 15)}
                    className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center text-zinc-200 hover:text-white font-bold transition-colors"
                    title="Increase cooldown window"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card B: Live Generated Kubernetes CRD Manifest */}
          <div className="bento-card rounded-xl p-5 border border-zinc-800/90 bg-zinc-950/90 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Generated Kubernetes Manifest (CRD)</h3>
                  <p className="text-[10px] text-zinc-400">Declarative resource definition dynamically synchronized with guardrail values</p>
                </div>
              </div>
              <button
                onClick={handleCopyYaml}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs transition-colors font-mono"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Copy YAML</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3.5 rounded-lg bg-zinc-900/70 border border-zinc-800 font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-[260px] leading-relaxed shadow-inner">
              <pre className="text-purple-300">{yamlManifest}</pre>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 5 Columns (Chaos Sandbox & Invariant Safety Verification) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card C: Chaos & Boundary Stress Testing Sandbox */}
          <div className="bento-card rounded-xl p-5 border border-zinc-800/90 bg-zinc-950/90 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Boundary Stress Testing</h3>
                  <p className="text-[10px] text-zinc-400">Inject synthetic anomalies to verify that boundaries hold</p>
                </div>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">Chaos Suite</span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed mb-3">
              Trigger traffic surges or manual load deltas to observe the autoscaler clamping safely against your configured boundaries:
            </p>

            <div className="grid grid-cols-2 gap-2.5 mb-3">
              <button
                onClick={onInjectSpike}
                className={`p-3 rounded-lg border transition-all flex flex-col items-center text-center group ${
                  buttonFeedback === 'spike'
                    ? 'bg-rose-500/30 border-rose-400 text-white shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                    : 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 hover:border-rose-500/50 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-rose-200">
                  <Zap className="w-4 h-4 group-hover:scale-110 transition-transform text-rose-400" />
                  <span>{buttonFeedback === 'spike' ? 'Surge Injected!' : '5x Flash Surge'}</span>
                </div>
                <span className="text-[10px] text-rose-400/80 mt-1 font-mono">Test max ceiling ({maxPods} pods)</span>
              </button>

              <button
                onClick={onTriggerLstmEvent}
                className={`p-3 rounded-lg border transition-all flex flex-col items-center text-center group ${
                  buttonFeedback === 'lstm'
                    ? 'bg-purple-500/30 border-purple-400 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                    : 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 hover:border-purple-500/50 text-purple-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-purple-200">
                  <BrainCircuit className="w-4 h-4 group-hover:scale-110 transition-transform text-purple-400" />
                  <span>{buttonFeedback === 'lstm' ? 'Preemption Active!' : 'Trigger LSTM'}</span>
                </div>
                <span className="text-[10px] text-purple-400/80 mt-1 font-mono">Test proactive pre-warm</span>
              </button>

              <button
                onClick={() => onAdjustRps(50)}
                className={`p-3 rounded-lg border transition-all flex flex-col items-center text-center group ${
                  buttonFeedback === 'plus'
                    ? 'bg-cyan-500/30 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30 hover:border-cyan-500/50 text-cyan-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-cyan-200">
                  <ArrowUpRight className="w-4 h-4 group-hover:scale-110 transition-transform text-cyan-400" />
                  <span>{buttonFeedback === 'plus' ? '+50 Applied!' : '+50 RPS Load'}</span>
                </div>
                <span className="text-[10px] text-cyan-400/80 mt-1 font-mono">Ramp load upward</span>
              </button>

              <button
                onClick={() => onAdjustRps(-50)}
                className={`p-3 rounded-lg border transition-all flex flex-col items-center text-center group ${
                  buttonFeedback === 'minus'
                    ? 'bg-emerald-500/30 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 hover:border-emerald-500/50 text-emerald-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-emerald-200">
                  <ArrowDownRight className="w-4 h-4 group-hover:scale-110 transition-transform text-emerald-400" />
                  <span>{buttonFeedback === 'minus' ? '-50 Applied!' : '-50 RPS Load'}</span>
                </div>
                <span className="text-[10px] text-emerald-400/80 mt-1 font-mono">Test cooldown downscale</span>
              </button>
            </div>

            <button
              onClick={onReset}
              className={`w-full py-2 rounded-lg border flex items-center justify-center gap-2 text-xs transition-colors font-mono ${
                buttonFeedback === 'reset'
                  ? 'bg-zinc-800 border-zinc-600 text-white shadow-sm'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{buttonFeedback === 'reset' ? 'Baseline Reset Complete!' : 'Reset Cluster to 4 Pod Baseline'}</span>
            </button>
          </div>

          {/* Card D: Active Invariant Verification Deck */}
          <div className="bento-card rounded-xl p-5 border border-zinc-800/90 bg-zinc-950/90 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Live Invariant Verification</h3>
                  <p className="text-[10px] text-zinc-400">Runtime mathematical assertions continuously validated</p>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse"></span>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400 text-[11px]">Floor Invariant (Min Boundary):</span>
                <span className="text-emerald-400 font-bold">
                  {actualPods} ≥ {minPods} pods (PASS)
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400 text-[11px]">Ceiling Invariant (Max Boundary):</span>
                <span className="text-emerald-400 font-bold">
                  {actualPods} ≤ {maxPods} pods (PASS)
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400 text-[11px]">Preemptive Scale-Up Delay:</span>
                <span className="text-cyan-400 font-bold">
                  0s (Immediate)
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400 text-[11px]">Downscale Cooldown Dampener:</span>
                <span className="text-amber-400 font-bold">
                  {cooldownSec}s Active
                </span>
              </div>
            </div>

            <div className="mt-3 p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-emerald-200 leading-relaxed">
                All 4 operational invariants are currently satisfied. Cluster pods and resource allocations remain strictly clamped within your declared safety boundaries.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
