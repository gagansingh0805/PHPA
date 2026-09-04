import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [coords, setCoords] = useState({ top: 0, left: 0, placement: 'top', arrowLeft: 0 });
  const triggerRef = useRef(null);
  const hoverTimerRef = useRef(null);
  const closeTimerRef = useRef(null);
  const info = GLOSSARY[id?.toLowerCase()] || null;

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = Math.min(330, window.innerWidth - 24);
    const tooltipHeightEst = 160;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Center horizontally over trigger
    const triggerCenterX = rect.left + rect.width / 2;
    let left = triggerCenterX - tooltipWidth / 2;

    // Strict boundary clamp so tooltip never bleeds offscreen or goes outside
    const margin = 12;
    if (left < margin) {
      left = margin;
    } else if (left + tooltipWidth > viewportWidth - margin) {
      left = viewportWidth - tooltipWidth - margin;
    }

    // Relative arrow position pointing directly to trigger center
    const arrowLeft = Math.max(18, Math.min(tooltipWidth - 18, triggerCenterX - left));

    // Vertical placement: default 'top' unless space above is tight
    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom;
    let placement = 'top';
    let top = 0;

    if (spaceAbove >= tooltipHeightEst + 16) {
      placement = 'top';
      top = rect.top - 8;
    } else if (spaceBelow >= tooltipHeightEst + 16) {
      placement = 'bottom';
      top = rect.bottom + 8;
    } else {
      if (spaceAbove >= spaceBelow) {
        placement = 'top';
        top = Math.max(margin + tooltipHeightEst, rect.top - 8);
      } else {
        placement = 'bottom';
        top = Math.min(viewportHeight - margin - tooltipHeightEst, rect.bottom + 8);
      }
    }

    setCoords({ top, left, placement, arrowLeft });
  };

  // Hover delay (300ms) before opening to prevent annoying flashes on quick mouse passes
  const handleMouseEnter = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      updatePosition();
      setIsOpen(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleScrollOrResize = () => {
      updatePosition();
    };
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  if (!info) {
    return <span className={className}>{children}</span>;
  }

  return (
    <>
      <span
        ref={triggerRef}
        className={`relative inline-block cursor-help ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span className="border-b border-dotted border-zinc-400/70 hover:border-purple-400 hover:text-purple-200 transition-colors">
          {children}
        </span>
      </span>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <div
                style={{
                  position: 'fixed',
                  top: `${coords.top}px`,
                  left: `${coords.left}px`,
                  zIndex: 999999,
                  transform: coords.placement === 'top' ? 'translateY(-100%)' : 'none',
                  pointerEvents: 'auto',
                }}
                onMouseEnter={() => {
                  if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
                }}
                onMouseLeave={handleMouseLeave}
              >
                <motion.div
                  initial={{
                    opacity: 0,
                    y: coords.placement === 'top' ? 6 : -6,
                    scale: 0.95,
                  }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{
                    opacity: 0,
                    y: coords.placement === 'top' ? 4 : -4,
                    scale: 0.95,
                  }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="w-[330px] max-w-[calc(100vw-24px)] p-3 rounded-xl bg-zinc-900/98 backdrop-blur-xl border border-zinc-700/90 shadow-[0_16px_40px_rgba(0,0,0,0.85)] text-left text-xs relative overflow-hidden"
                >
                  {/* Header: Title + Category Badge with robust flex clamping */}
                  <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-zinc-800/80">
                    <div className="flex items-center gap-1.5 font-bold text-white text-[11.5px] min-w-0 flex-1">
                      <Info className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="truncate" title={info.term}>{info.term}</span>
                    </div>
                    <span className="text-[8.5px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase shrink-0 font-semibold tracking-wide whitespace-nowrap">
                      {info.category}
                    </span>
                  </div>

                  {/* Definition */}
                  <p className="text-zinc-300 text-[11px] leading-relaxed mb-2.5">
                    {info.definition}
                  </p>

                  {/* Significance in Autoscaling */}
                  <div className="p-2.5 rounded-lg bg-zinc-950/90 border border-zinc-800 text-[10px] text-zinc-400 leading-snug">
                    <strong className="text-zinc-200 font-semibold">Autoscaling Impact:</strong>{' '}
                    {info.significance}
                  </div>

                  {/* Pointer arrow with matching border and background */}
                  {coords.placement === 'top' ? (
                    <div
                      className="absolute top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-zinc-700/90"
                      style={{ left: `${coords.arrowLeft}px`, transform: 'translateX(-50%)' }}
                    />
                  ) : (
                    <div
                      className="absolute bottom-full w-0 h-0 border-x-4 border-x-transparent border-b-4 border-b-zinc-700/90"
                      style={{ left: `${coords.arrowLeft}px`, transform: 'translateX(-50%)' }}
                    />
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
