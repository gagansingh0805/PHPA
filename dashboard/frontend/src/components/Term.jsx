import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';

const GLOSSARY = {
  rps: {
    term: 'RPS (Requests Per Second)',
    category: 'Workload Metric',
    definition: 'The rate of incoming HTTP request traffic reaching the cluster per second.',
    significance: 'Primary metric used to compute true ideal pod demand. In this testbed, 1 pod stably handles ~25 RPS at 60% target CPU.',
  },
  latency: {
    term: 'P95 Latency',
    category: 'SLA Health Indicator',
    definition: '95th Percentile Response Time: 95% of incoming user requests are processed faster than this duration.',
    significance: 'When pods are starved, latency spikes exponentially. P95 latency > 200ms violates the SLA threshold.',
  },
  sla: {
    term: 'SLA (Service Level Agreement)',
    category: 'Reliability Guarantee',
    definition: 'Contractual performance commitment guaranteeing latency remains under 200ms with zero request timeouts.',
    significance: 'Reactive HPA breaches SLA during sudden spikes because Kubernetes cold-starts take 30–60s.',
  },
  podhours: {
    term: 'Pod-Hours',
    category: 'Cloud Billing Unit',
    definition: 'Standard cloud infrastructure billing metric representing 1 container instance running for 1 full hour.',
    significance: 'Billed at $0.040/pod-hr (c5.large equivalent). Autoscaling efficiency is measured by minimizing idle pod-hours.',
  },
  coldstart: {
    term: 'Cold Start Lag',
    category: 'Container Lifecycle',
    definition: 'The 30–60 second latency window required for container image pulling, startup, and Kubernetes readiness checks.',
    significance: 'Why reactive autoscaling fails: reactive HPA only begins scaling after CPU spikes, leaving pods starved during cold start.',
  },
  mape: {
    term: 'MAPE (Mean Absolute Percentage Error)',
    category: 'Forecast Accuracy',
    definition: 'Statistical accuracy metric computing the average absolute percentage deviation between predicted pods and actual demand.',
    significance: 'Lower MAPE indicates a closer fit to workload demand. LSTM achieves < 3.5% MAPE vs 32% for reactive HPA.',
  },
  lstm: {
    term: '2-Layer LSTM (Long Short-Term Memory)',
    category: 'Neural Architecture',
    definition: 'A deep recurrent neural network with input, forget, and output gating mechanisms that captures non-linear temporal trends.',
    significance: 'Pre-warms pods 15–45 seconds ahead of demand surges, completely eliminating cold-start SLA violations.',
  },
  hpa: {
    term: 'Reactive HPA (Horizontal Pod Autoscaler)',
    category: 'Kubernetes Baseline',
    definition: 'Native Kubernetes autoscaling controller that adjusts replica counts strictly based on observed CPU threshold ratios.',
    significance: 'Operates reactively with moving-average delay. Prone to severe latency spikes on sudden traffic bursts.',
  },
  holtwinters: {
    term: 'Holt-Winters (Triple Exponential Smoothing)',
    category: 'Statistical Time-Series',
    definition: 'A classical forecasting algorithm that decomposes time-series into level, trend, and seasonal periodic components.',
    significance: 'Excellent for predictable 24-hour diurnal customer waves, but blind to unexpected flash crowd spikes.',
  },
  linear: {
    term: 'Linear Regression (OLS)',
    category: 'Statistical Extrapolation',
    definition: 'Ordinary Least Squares regression fitting a linear slope (β₁t + β₀) across the recent historical evaluation window.',
    significance: 'Fast to calculate, but tends to over-extrapolate steep transient spikes, causing expensive idle pod over-provisioning.',
  },
  overprovision: {
    term: 'Over-Provisioning (Idle Waste)',
    category: 'Cost Inefficiency',
    definition: 'Allocating more container replicas than required by the incoming workload demand.',
    significance: 'Wastes cloud budget on idle CPU cycles without providing any incremental latency benefit.',
  },
  underprovision: {
    term: 'Under-Provisioning (Starvation)',
    category: 'SLA Risk',
    definition: 'Allocating fewer container replicas than required to comfortably process incoming request volume.',
    significance: 'Leads to CPU saturation (>100%), queued connections, request timeouts, and SLA breach penalties.',
  },
  crd: {
    term: 'Kubernetes CRD (Custom Resource Definition)',
    category: 'Kubernetes Extension',
    definition: 'An extension of the Kubernetes API that registers the PredictiveHorizontalPodAutoscaler custom resource.',
    significance: 'Allows declarative YAML configuration of ML models, sync periods, and multi-model decision algorithms directly in clusters.',
  },
};

export default function Term({ id, children, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const info = GLOSSARY[id?.toLowerCase()] || null;
  const timeoutRef = useRef(null);

  if (!info) {
    return <span className={className}>{children}</span>;
  }

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  return (
    <span
      className={`relative inline-block cursor-help ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className="border-b border-dotted border-zinc-400/70 hover:border-purple-400 hover:text-purple-200 transition-colors">
        {children}
      </span>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-72 p-3 rounded-xl bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 shadow-2xl text-left text-xs pointer-events-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-1 pb-1.5 mb-1.5 border-b border-zinc-800">
              <div className="flex items-center gap-1.5 font-bold text-white text-[11px]">
                <Info className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                <span className="truncate">{info.term}</span>
              </div>
              <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase flex-shrink-0">
                {info.category}
              </span>
            </div>

            {/* Definition */}
            <p className="text-zinc-300 text-[10px] leading-relaxed mb-1.5">
              {info.definition}
            </p>

            {/* Significance in Autoscaling */}
            <div className="p-1.5 rounded-lg bg-zinc-950/80 border border-zinc-800 text-[9px] text-zinc-400 leading-snug">
              <strong className="text-zinc-200 font-semibold">Autoscaling Impact:</strong> {info.significance}
            </div>

            {/* Downward pointer triangle */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-zinc-800"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

