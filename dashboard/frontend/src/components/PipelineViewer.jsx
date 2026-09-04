import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Server,
  Layers,
  Cpu,
  CheckCircle2,
  Zap,
  RotateCcw,
  Network,
  Terminal,
  X,
  ChevronRight,
} from 'lucide-react';

export default function PipelineViewer({
  latest = {},
  isPlaying = true,
  speedFactor = 10,
  trafficMode = 'auto',
  manualRps = 125,
}) {
  // Camera view preset: 'isometric' | 'front' | 'top' | 'custom'
  const [viewPreset, setViewPreset] = useState('isometric');
  const [pitch, setPitch] = useState(48); // RotateX
  const [yaw, setYaw] = useState(-20); // RotateZ
  const [roll, setRoll] = useState(10); // RotateY
  const [zoom, setZoom] = useState(1);
  const [isOrbiting, setIsOrbiting] = useState(false);

  // Inspector & selection state
  const [selectedStage, setSelectedStage] = useState(2); // default to Pod Workload
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Interactive single packet trace probe
  const [isTracingProbe, setIsTracingProbe] = useState(false);
  const [probeHop, setProbeHop] = useState(0);
  const [probeLog, setProbeLog] = useState([]);

  // Dynamic values with fallbacks
  const rps = latest.rps || 125;
  const actualPods = Math.min(20, Math.max(2, latest.actual_pods || 4));
  const idealDemand = latest.ideal_demand || 4;
  const cpu = latest.cpu_utilization || 60;
  const p95 = latest.p95_latency_ms || 32.5;
  const slaBreaches = latest.sla_breaches || 0;
  const isSpiking = latest.is_spiking || false;

  const reactiveHpa = latest.reactive_hpa || actualPods;
  const linearPred = latest.linear_pred || actualPods;
  const hwPred = latest.holt_winters_pred || actualPods;
  const lstmPred = latest.lstm_pred || actualPods;

  // Determine winning model in MAX decision
  const maxVal = Math.max(reactiveHpa, linearPred, hwPred, lstmPred);
  let winningModel = 'LSTM';
  if (maxVal === lstmPred) winningModel = 'LSTM';
  else if (maxVal === hwPred) winningModel = 'Holt-Winters';
  else if (maxVal === linearPred) winningModel = 'Linear';
  else winningModel = 'Reactive HPA';

  const handlePresetChange = (preset) => {
    setViewPreset(preset);
    setIsOrbiting(false);
    if (preset === 'isometric') {
      setPitch(48);
      setYaw(-20);
      setRoll(10);
      setZoom(1);
    } else if (preset === 'front') {
      setPitch(12);
      setYaw(0);
      setRoll(0);
      setZoom(1.05);
    } else if (preset === 'top') {
      setPitch(68);
      setYaw(0);
      setRoll(0);
      setZoom(0.95);
    }
  };

  useEffect(() => {
    if (!isOrbiting) return;
    const orbitInterval = setInterval(() => {
      setYaw((prev) => (prev >= 40 ? -40 : prev + 0.3));
    }, 50);
    return () => clearInterval(orbitInterval);
  }, [isOrbiting]);

  const triggerProbeTrace = () => {
    if (isTracingProbe) return;
    setIsTracingProbe(true);
    setProbeHop(1);
    const traceId = Math.random().toString(36).substring(2, 8).toUpperCase();

    setProbeLog([
      { hop: 1, name: 'Client Ingress', detail: `HTTP GET /api/v1/workload (Trace: TRC-${traceId})`, time: '0.0ms' },
    ]);

    setTimeout(() => {
      setProbeHop(2);
      setProbeLog((prev) => [
        ...prev,
        { hop: 2, name: 'Envoy Ingress Proxy', detail: `TLS Decryption & Weighted Round-Robin (P95: ${p95}ms)`, time: '+3.8ms' },
      ]);
    }, 900);

    setTimeout(() => {
      setProbeHop(3);
      setProbeLog((prev) => [
        ...prev,
        { hop: 3, name: 'Target Pod Replica', detail: `Dispatched to pod-${Math.floor(Math.random() * actualPods) + 1} (CPU load: ${cpu}%)`, time: '+18.2ms' },
      ]);
    }, 1800);

    setTimeout(() => {
      setProbeHop(4);
      setProbeLog((prev) => [
        ...prev,
        { hop: 4, name: 'k8shorizmetrics Gatherer', detail: 'Telemetry vector harvested via cAdvisor scrape', time: '+32.4ms' },
      ]);
    }, 2700);

    setTimeout(() => {
      setProbeHop(5);
      setProbeLog((prev) => [
        ...prev,
        { hop: 5, name: 'PHPA Decision Engine', detail: `Evaluator chose MAX(Models) -> ${winningModel} (${maxVal} replicas)`, time: '+45.1ms' },
      ]);
    }, 3600);

    setTimeout(() => {
      setProbeHop(6);
      setProbeLog((prev) => [
        ...prev,
        { hop: 6, name: 'Kubernetes Scale Actuator', detail: 'PATCH /scale subresource verified (Loop Closed)', time: '+58.0ms' },
      ]);
    }, 4500);

    setTimeout(() => {
      setIsTracingProbe(false);
      setProbeHop(0);
    }, 6200);
  };

  const stages = [
    {
      id: 0,
      name: 'Client Edge Ingestion',
      subtitle: 'HTTP/gRPC Traffic Stream',
      icon: Activity,
      color: 'cyan',
      description: 'External client workloads generate fluctuating HTTP requests following diurnal cyclic patterns or abrupt surges.',
      yaml: `apiVersion: networking.k8s.io/v1\nkind: Ingress\nmetadata:\n  name: web-ingress\nspec:\n  rules:\n  - http:\n      paths:\n      - path: /\n        pathType: Prefix\n        backend:\n          service:\n            name: web-service\n            port:\n              number: 80`,
      formula: 'Traffic Rate \\, \\lambda(t) = \\bar{\\lambda} + A \\sin(\\omega t) + \\xi(t)',
      metrics: [
        { label: 'Current Request Rate', value: `${rps} RPS` },
        { label: 'Traffic Profile', value: isSpiking ? '5x Flash Crowd' : trafficMode === 'manual' ? 'Manual Override' : 'Diurnal Synthetic' },
        { label: 'Ingress Concurrency', value: `${Math.round(rps * 1.8)} Active Conn` },
      ],
    },
    {
      id: 1,
      name: 'Ingress & Service Mesh',
      subtitle: 'Envoy Reverse Proxy',
      icon: Network,
      color: 'blue',
      description: 'Terminates TLS, measures endpoint response latencies, and balances HTTP requests uniformly across available active pods.',
      yaml: `apiVersion: v1\nkind: Service\nmetadata:\n  name: web-service\nspec:\n  type: ClusterIP\n  selector:\n    app: web-workload\n  ports:\n  - port: 80\n    targetPort: 8080`,
      formula: 'P95 \\, Latency \\approx L_0 + \\beta \\left( \\frac{\\lambda(t)}{N_{actual}(t) \\cdot C_{pod}} \\right)',
      metrics: [
        { label: 'P95 Latency', value: `${p95} ms` },
        { label: 'SLA Target', value: '< 100 ms' },
        { label: 'SLA Violations', value: `${slaBreaches} Events` },
      ],
    },
    {
      id: 2,
      name: 'Kubernetes Workload',
      subtitle: 'Active Pod Cluster (3D Data Plane)',
      icon: Server,
      color: 'purple',
      description: 'Target deployment running the application workload. Pods process incoming requests and scale elastically based on PHPA decisions.',
      yaml: `apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: web-workload\nspec:\n  replicas: ${actualPods}\n  template:\n    spec:\n      containers:\n      - name: web\n        resources:\n          limits: { cpu: "500m" }\n          requests: { cpu: "250m" }`,
      formula: 'U_{cpu}(t) = \\min\\left(100\\%, \\; \\frac{\\lambda(t)}{N_{actual}(t) \\cdot 25} \\times 60\\%\\right)',
      metrics: [
        { label: 'Allocated Pods', value: `${actualPods} Replicas` },
        { label: 'Ideal Demand', value: `${idealDemand} Replicas` },
        { label: 'Average Pod CPU', value: `${cpu}%` },
      ],
    },
    {
      id: 3,
      name: 'Telemetry Gatherer',
      subtitle: 'k8shorizmetrics & cAdvisor',
      icon: Layers,
      color: 'emerald',
      description: 'Scrapes container CPU and memory usage from cAdvisor daemonsets, filters initializing pods, and computes the raw replica requirement.',
      yaml: `gatherer:\n  metrics:\n  - type: Resource\n    resource:\n      name: cpu\n      target:\n        type: Utilization\n        averageUtilization: 60\n  scrapeInterval: 15s`,
      formula: 'R_{raw} = \\left\\lceil N_{current} \\times \\frac{\\text{CurrentCPU}}{\\text{TargetCPU (60%)}} \\right\\rceil',
      metrics: [
        { label: 'Scrape Interval', value: '15 Seconds' },
        { label: 'Metric Source', value: 'cAdvisor / Kubelet' },
        { label: 'Buffer Window', value: '50 Timesteps' },
      ],
    },
    {
      id: 4,
      name: 'PHPA Brain & Dispatcher',
      subtitle: 'Parallel Multi-Model Ensemble',
      icon: Cpu,
      color: 'violet',
      description: 'Pipes historical metrics concurrently to Reactive HPA, Linear Regression, Holt-Winters, and 2-Layer LSTM models, synthesizing recommendations via DecisionType: Maximum.',
      yaml: `apiVersion: phpa.custom.k8s/v1alpha1\nkind: PredictiveHPA\nmetadata:\n  name: web-phpa\nspec:\n  decisionType: "Maximum"\n  models:\n  - type: "LSTM"\n    layers: 2\n    hiddenUnits: 64\n  - type: "HoltWinters"\n    seasonLength: 60\n  - type: "Linear"`,
      formula: 'N_{target} = \\max\\left( R_{hpa}, \\; \\hat{y}_{linear}, \\; \\hat{y}_{hw}, \\; \\hat{y}_{lstm} \\right)',
      metrics: [
        { label: 'Active Strategy', value: 'Decision: Maximum' },
        { label: 'Dominant Model', value: `${winningModel} (${maxVal} pods)` },
        { label: 'Pre-warm Lead', value: `+${Math.max(0, lstmPred - reactiveHpa)} pods` },
      ],
    },
    {
      id: 5,
      name: 'Scale Actuator',
      subtitle: 'Kubernetes API Subresource Client',
      icon: CheckCircle2,
      color: 'amber',
      description: 'Enforces cooldown stabilization windows, clamps replicas between min/max boundaries, and patches the deployment scale subresource.',
      yaml: `PATCH /apis/apps/v1/namespaces/default/deployments/web-workload/scale\nContent-Type: application/merge-patch+json\n\n{\n  "spec": {\n    "replicas": ${actualPods}\n  }\n}`,
      formula: 'N_{actuated} = \\text{clamp}\\left(\\min=2, \\; \\max=30, \\; N_{target}\\right)',
      metrics: [
        { label: 'Scale Status', value: 'Target Applied' },
        { label: 'Stabilization Window', value: '300s Downscale Cooldown' },
        { label: 'Min / Max Limits', value: '2 Min / 30 Max' },
      ],
    },
  ];

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* 1. Header & Camera HUD Toolbar */}
      <div className="bento-card rounded-2xl p-4 lg:p-5 border border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#06b6d4]"></span>
              <h2 className="text-base font-bold text-white tracking-wide">
                PHPA 3D Motion Architectural Pipeline
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                Control-Loop v1.2
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Real-time spatial visualization of HTTP request trajectories, 3D pod elastic scaling, continuous cAdvisor telemetry collection, parallel multi-model forecasting, and Kubernetes scale actuation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={triggerProbeTrace}
              disabled={isTracingProbe}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                isTracingProbe
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 hover:border-zinc-600'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${isTracingProbe ? 'text-amber-400 animate-bounce' : 'text-amber-400'}`} />
              {isTracingProbe ? `Tracing Hop ${probeHop}/6...` : 'Send Trace Probe'}
            </button>

            <div className="flex items-center bg-zinc-900/90 border border-zinc-800 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => handlePresetChange('isometric')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  viewPreset === 'isometric'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                3D Isometric
              </button>
              <button
                onClick={() => handlePresetChange('front')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  viewPreset === 'front'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                2.5D Front Flow
              </button>
              <button
                onClick={() => handlePresetChange('top')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  viewPreset === 'top'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Top-Down
              </button>
            </div>

            <button
              onClick={() => setIsOrbiting((prev) => !prev)}
              className={`p-1.5 rounded-lg border text-xs transition-all ${
                isOrbiting
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
              title="Toggle Slow 3D Auto-Orbit"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isOrbiting ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-zinc-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500">Pitch (X):</span>
              <input
                type="range"
                min="0"
                max="75"
                value={pitch}
                onChange={(e) => {
                  setPitch(Number(e.target.value));
                  setViewPreset('custom');
                }}
                className="w-16 accent-purple-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
              />
              <span className="text-zinc-300 w-6">{pitch}°</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500">Yaw (Z):</span>
              <input
                type="range"
                min="-60"
                max="60"
                value={yaw}
                onChange={(e) => {
                  setYaw(Number(e.target.value));
                  setViewPreset('custom');
                }}
                className="w-16 accent-cyan-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
              />
              <span className="text-zinc-300 w-6">{yaw}°</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500">Zoom:</span>
              <input
                type="range"
                min="0.75"
                max="1.3"
                step="0.05"
                value={zoom}
                onChange={(e) => {
                  setZoom(Number(e.target.value));
                  setViewPreset('custom');
                }}
                className="w-16 accent-emerald-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
              />
              <span className="text-zinc-300 w-8">{(zoom * 100).toFixed(0)}%</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span>
              Workload: <strong className="text-cyan-400">{rps} RPS</strong>
            </span>
            <span className="text-zinc-600">•</span>
            <span>
              Pods: <strong className="text-purple-300">{actualPods} Replicas</strong>
            </span>
            <span className="text-zinc-600">•</span>
            <span>
              Engine: <strong className="text-emerald-400">MAX({winningModel})</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Interactive 3D Spatial Canvas Viewport */}
      <div className="relative w-full rounded-2xl border border-zinc-800/80 bg-[#050508] overflow-hidden shadow-2xl min-h-[600px] flex items-center justify-center select-none">
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]" />
        </div>

        <AnimatePresence>
          {isTracingProbe && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-4 right-4 z-30 pointer-events-none flex justify-center"
            >
              <div className="bg-zinc-950/90 border border-amber-500/40 rounded-xl px-4 py-2.5 shadow-2xl backdrop-blur-md flex items-center gap-3 text-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="font-bold text-amber-300 font-mono">TRACE PROBE ACTIVE</span>
                <span className="text-zinc-400">|</span>
                <span className="text-zinc-200">
                  {probeLog[probeLog.length - 1]?.name}:{' '}
                  <span className="text-zinc-400 font-mono">{probeLog[probeLog.length - 1]?.detail}</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-500/30">
                  {probeLog[probeLog.length - 1]?.time}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className="w-full h-[620px] flex items-center justify-center transition-transform duration-300 ease-out"
          style={{
            perspective: '1300px',
            perspectiveOrigin: '50% 50%',
          }}
        >
          <div
            className="relative w-[1100px] h-[520px] transition-transform duration-500 ease-out"
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateX(${pitch}deg) rotateY(${roll}deg) rotateZ(${yaw}deg) scale(${zoom})`,
            }}
          >
            {/* 3D Depth Grid Floor */}
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none border border-zinc-800/40"
              style={{
                transform: 'translateZ(-40px)',
                backgroundImage: `
                  linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
                boxShadow: '0 30px 100px rgba(0,0,0,0.8) inset',
              }}
            >
              <div className="absolute inset-0 rounded-3xl border border-cyan-500/10 shadow-[0_0_30px_rgba(6,182,212,0.05)]" />
            </div>

            {/* SVG Circuit Highway */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
              style={{ transform: 'translateZ(5px)' }}
            >
              <defs>
                <linearGradient id="grad-req" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <path d="M 140 120 L 230 120" fill="none" stroke="rgba(6, 182, 212, 0.25)" strokeWidth="2" strokeDasharray="4 3" />
              <path d="M 330 120 L 440 120" fill="none" stroke="rgba(6, 182, 212, 0.4)" strokeWidth="2.5" />
              <path d="M 560 220 L 560 320" fill="none" stroke="rgba(16, 185, 129, 0.35)" strokeWidth="2" strokeDasharray="5 3" />
              <path d="M 660 360 L 760 360" fill="none" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="2.5" />
              <path d="M 950 310 L 950 180" fill="none" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="2" strokeDasharray="4 3" />
              <path d="M 900 120 L 710 120" fill="none" stroke="rgba(6, 182, 212, 0.5)" strokeWidth="2" strokeDasharray="3 3" />

              <circle r="4" fill="#06b6d4" filter="url(#glow)">
                <animate attributeName="cx" values="140; 230; 330; 440" dur={isSpiking ? '0.8s' : '1.8s'} repeatCount="indefinite" />
                <animate attributeName="cy" values="120; 120; 120; 120" dur={isSpiking ? '0.8s' : '1.8s'} repeatCount="indefinite" />
              </circle>

              <circle r="3.5" fill="#10b981" filter="url(#glow)">
                <animate attributeName="cx" values="560; 560" dur="2.2s" repeatCount="indefinite" />
                <animate attributeName="cy" values="220; 320" dur="2.2s" repeatCount="indefinite" />
              </circle>

              <circle r="3.5" fill="#a855f7" filter="url(#glow)">
                <animate attributeName="cx" values="660; 760" dur="1.6s" repeatCount="indefinite" />
                <animate attributeName="cy" values="360; 360" dur="1.6s" repeatCount="indefinite" />
              </circle>

              <circle r="3.5" fill="#f59e0b" filter="url(#glow)">
                <animate attributeName="cx" values="950; 950" dur="2.0s" repeatCount="indefinite" />
                <animate attributeName="cy" values="310; 180" dur="2.0s" repeatCount="indefinite" />
              </circle>

              <circle r="4" fill="#06b6d4" filter="url(#glow)">
                <animate attributeName="cx" values="900; 710" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="cy" values="120; 120" dur="1.5s" repeatCount="indefinite" />
              </circle>

              {isTracingProbe && (
                <circle r="7" fill="#fbbf24" filter="url(#glow)">
                  {probeHop === 1 && <animate attributeName="cx" values="60; 140" dur="0.8s" fill="freeze" />}
                  {probeHop === 1 && <animate attributeName="cy" values="120; 120" dur="0.8s" fill="freeze" />}
                  {probeHop === 2 && <animate attributeName="cx" values="140; 280" dur="0.8s" fill="freeze" />}
                  {probeHop === 2 && <animate attributeName="cy" values="120; 120" dur="0.8s" fill="freeze" />}
                  {probeHop === 3 && <animate attributeName="cx" values="280; 560" dur="0.8s" fill="freeze" />}
                  {probeHop === 3 && <animate attributeName="cy" values="120; 150" dur="0.8s" fill="freeze" />}
                  {probeHop === 4 && <animate attributeName="cx" values="560; 560" dur="0.8s" fill="freeze" />}
                  {probeHop === 4 && <animate attributeName="cy" values="150; 360" dur="0.8s" fill="freeze" />}
                  {probeHop === 5 && <animate attributeName="cx" values="560; 860" dur="0.8s" fill="freeze" />}
                  {probeHop === 5 && <animate attributeName="cy" values="360; 360" dur="0.8s" fill="freeze" />}
                  {probeHop === 6 && <animate attributeName="cx" values="860; 600" dur="0.8s" fill="freeze" />}
                  {probeHop === 6 && <animate attributeName="cy" values="150; 120" dur="0.8s" fill="freeze" />}
                </circle>
              )}
            </svg>

            {/* ZONE 1: TRAFFIC EDGE */}
            <div
              onClick={() => {
                setSelectedStage(0);
                setIsDrawerOpen(true);
              }}
              className="absolute left-6 top-10 w-36 cursor-pointer group"
              style={{ transform: 'translateZ(30px)' }}
            >
              <div className="bento-card rounded-xl p-3 border border-cyan-500/30 bg-zinc-900/90 hover:border-cyan-400 transition-all shadow-lg shadow-cyan-950/20 group-hover:scale-105">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  {isSpiking ? (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                      5X SURGE
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                      LIVE
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                  1. Traffic Ingestion
                </h4>
                <div className="mt-2 flex items-baseline justify-between text-xs">
                  <span className="text-zinc-400 text-[10px]">Volume:</span>
                  <span className="font-mono font-bold text-cyan-400">{rps} RPS</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1 mt-1 overflow-hidden">
                  <div
                    className={`h-1 rounded-full transition-all duration-300 ${
                      isSpiking ? 'bg-rose-500' : 'bg-cyan-400'
                    }`}
                    style={{ width: `${Math.min(100, (rps / 450) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* ZONE 2: INGRESS GATEWAY */}
            <div
              onClick={() => {
                setSelectedStage(1);
                setIsDrawerOpen(true);
              }}
              className="absolute left-52 top-10 w-36 cursor-pointer group"
              style={{ transform: 'translateZ(35px)' }}
            >
              <div className="bento-card rounded-xl p-3 border border-blue-500/30 bg-zinc-900/90 hover:border-blue-400 transition-all shadow-lg shadow-blue-950/20 group-hover:scale-105">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                    <Network className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                    Envoy Mesh
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                  2. Ingress Router
                </h4>
                <div className="mt-2 flex items-baseline justify-between text-xs">
                  <span className="text-zinc-400 text-[10px]">P95 Latency:</span>
                  <span className={`font-mono font-bold ${p95 > 100 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                    {p95}ms
                  </span>
                </div>
                <div className="text-[9px] text-zinc-500 mt-1">Weighted Round Robin</div>
              </div>
            </div>

            {/* ZONE 3: 3D POD CLUSTER */}
            <div
              onClick={() => {
                setSelectedStage(2);
                setIsDrawerOpen(true);
              }}
              className="absolute left-[390px] top-6 w-80 cursor-pointer group"
              style={{ transform: 'translateZ(45px)' }}
            >
              <div className="bento-card rounded-2xl p-4 border border-purple-500/40 bg-zinc-900/95 hover:border-purple-400 transition-all shadow-2xl shadow-purple-950/30">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                      <Server className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                        3. Target Pods Cluster
                      </h4>
                      <span className="text-[9px] font-mono text-zinc-400">
                        k8s: default/web-workload
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                      {actualPods} Active Replicas
                    </span>
                  </div>
                </div>

                <div className="bg-zinc-950/80 rounded-xl p-3 border border-zinc-800/80 min-h-[120px] flex items-center justify-center">
                  <div className="grid grid-cols-5 gap-2.5 w-full">
                    <AnimatePresence>
                      {Array.from({ length: actualPods }).map((_, idx) => {
                        const isPrewarmed = idx >= reactiveHpa && idx < actualPods;
                        const podCpu = Math.min(100, Math.round(cpu + (idx % 3) * 4 - 4));

                        return (
                          <motion.div
                            key={`pod-blade-${idx}`}
                            initial={{ scale: 0, y: -40, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0, y: 20, opacity: 0 }}
                            transition={{
                              type: 'spring',
                              stiffness: 400,
                              damping: 24,
                              delay: idx * 0.03,
                            }}
                            className="relative group/pod"
                            style={{
                              transformStyle: 'preserve-3d',
                              perspective: '400px',
                            }}
                          >
                            <div
                              className={`rounded-lg p-1.5 text-center border transition-all duration-300 ${
                                isPrewarmed
                                  ? 'bg-purple-950/60 border-purple-400/80 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                                  : isSpiking
                                  ? 'bg-amber-950/50 border-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                                  : 'bg-zinc-900 border-zinc-700/80 hover:border-cyan-400/80'
                              }`}
                              style={{ transform: 'translateZ(10px)' }}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isPrewarmed
                                      ? 'bg-purple-400 shadow-[0_0_5px_#a855f7] animate-pulse'
                                      : podCpu > 80
                                      ? 'bg-rose-500 shadow-[0_0_5px_#f43f5e]'
                                      : 'bg-emerald-400 shadow-[0_0_5px_#34d399]'
                                  }`}
                                />
                                <span className="text-[8px] font-mono text-zinc-400">
                                  #{idx + 1}
                                </span>
                              </div>

                              <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden my-0.5">
                                <div
                                  className={`h-full rounded-full ${
                                    podCpu > 80 ? 'bg-rose-500' : isPrewarmed ? 'bg-purple-400' : 'bg-cyan-400'
                                  }`}
                                  style={{ width: `${podCpu}%` }}
                                />
                              </div>
                              <span className="text-[7.5px] font-mono text-zinc-400 block truncate">
                                {podCpu}%
                              </span>
                            </div>

                            <div
                              className="absolute inset-0 bg-black/40 rounded-lg pointer-events-none -z-10"
                              style={{
                                transform: 'translateZ(-8px) translateY(4px)',
                              }}
                            />
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <span>
                    Avg Pod CPU: <strong className="text-white">{cpu}%</strong> (Target: 60%)
                  </span>
                  <span>
                    Ideal Demand: <strong className="text-cyan-300">{idealDemand}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* ZONE 4: TELEMETRY GATHERER */}
            <div
              onClick={() => {
                setSelectedStage(3);
                setIsDrawerOpen(true);
              }}
              className="absolute left-[450px] top-[320px] w-56 cursor-pointer group"
              style={{ transform: 'translateZ(30px)' }}
            >
              <div className="bento-card rounded-xl p-3 border border-emerald-500/30 bg-zinc-900/90 hover:border-emerald-400 transition-all shadow-lg shadow-emerald-950/20 group-hover:scale-105">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    15s Cadence
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                  4. k8shorizmetrics
                </h4>
                <p className="text-[10px] text-zinc-400 mt-1 line-clamp-1">
                  cAdvisor scrape & replica baseline buffer
                </p>
                <div className="mt-2 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-zinc-500">Unready pods:</span>
                  <span className="text-emerald-400">0 filtered</span>
                </div>
              </div>
            </div>

            {/* ZONE 5: PHPA MODEL DISPATCHER & MAX DECISION */}
            <div
              onClick={() => {
                setSelectedStage(4);
                setIsDrawerOpen(true);
              }}
              className="absolute left-[740px] top-[260px] w-80 cursor-pointer group"
              style={{ transform: 'translateZ(40px)' }}
            >
              <div className="bento-card rounded-2xl p-4 border border-purple-500/40 bg-zinc-900/95 hover:border-purple-400 transition-all shadow-2xl shadow-purple-950/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                      <Cpu className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                        5. Parallel Model Evaluator
                      </h4>
                      <span className="text-[9px] font-mono text-zinc-400">
                        Dispatching 4 Models Concurrently
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                    MAX Envelope
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div
                    className={`rounded-lg p-2 border text-[11px] transition-all ${
                      winningModel === 'Reactive HPA'
                        ? 'bg-zinc-800 border-cyan-400 text-white shadow-sm'
                        : 'bg-zinc-950/80 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] mb-1">
                      <span className="text-zinc-500">Reactive HPA</span>
                      {winningModel === 'Reactive HPA' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      )}
                    </div>
                    <div className="flex items-baseline justify-between font-mono font-bold text-white">
                      <span>{reactiveHpa}</span>
                      <span className="text-[9px] font-normal text-zinc-500">pods</span>
                    </div>
                  </div>

                  <div
                    className={`rounded-lg p-2 border text-[11px] transition-all ${
                      winningModel === 'Linear'
                        ? 'bg-blue-950/50 border-blue-400 text-white shadow-sm'
                        : 'bg-zinc-950/80 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] mb-1">
                      <span className="text-zinc-500">Linear OLS</span>
                      {winningModel === 'Linear' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      )}
                    </div>
                    <div className="flex items-baseline justify-between font-mono font-bold text-white">
                      <span>{linearPred}</span>
                      <span className="text-[9px] font-normal text-zinc-500">pods</span>
                    </div>
                  </div>

                  <div
                    className={`rounded-lg p-2 border text-[11px] transition-all ${
                      winningModel === 'Holt-Winters'
                        ? 'bg-emerald-950/50 border-emerald-400 text-white shadow-sm'
                        : 'bg-zinc-950/80 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] mb-1">
                      <span className="text-zinc-500">Holt-Winters</span>
                      {winningModel === 'Holt-Winters' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}
                    </div>
                    <div className="flex items-baseline justify-between font-mono font-bold text-white">
                      <span>{hwPred}</span>
                      <span className="text-[9px] font-normal text-zinc-500">pods</span>
                    </div>
                  </div>

                  <div
                    className={`rounded-lg p-2 border text-[11px] transition-all ${
                      winningModel === 'LSTM'
                        ? 'bg-purple-950/60 border-purple-400 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                        : 'bg-zinc-950/80 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] mb-1">
                      <span className="text-purple-300 font-semibold">2-Layer LSTM</span>
                      {winningModel === 'LSTM' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                      )}
                    </div>
                    <div className="flex items-baseline justify-between font-mono font-bold text-white">
                      <span className="text-purple-300">{lstmPred}</span>
                      <span className="text-[9px] font-normal text-zinc-500">pods</span>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-zinc-400">MAX Output:</span>
                  <span className="text-emerald-400 font-bold">
                    {maxVal} Replicas via {winningModel}
                  </span>
                </div>
              </div>
            </div>

            {/* ZONE 6: SCALE ACTUATOR */}
            <div
              onClick={() => {
                setSelectedStage(5);
                setIsDrawerOpen(true);
              }}
              className="absolute left-[880px] top-10 w-44 cursor-pointer group"
              style={{ transform: 'translateZ(35px)' }}
            >
              <div className="bento-card rounded-xl p-3 border border-amber-500/30 bg-zinc-900/90 hover:border-amber-400 transition-all shadow-lg shadow-amber-950/20 group-hover:scale-105">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                    ScaleClient
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                  6. Scale Actuator
                </h4>
                <div className="mt-2 flex items-baseline justify-between text-xs">
                  <span className="text-zinc-400 text-[10px]">Patched:</span>
                  <span className="font-mono font-bold text-cyan-400">{actualPods} pods</span>
                </div>
                <div className="text-[9px] text-zinc-500 mt-0.5 font-mono">Loop Closed ⚡</div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-3 right-4 z-20 pointer-events-none text-[10px] font-mono text-zinc-500 bg-zinc-950/80 px-2.5 py-1 rounded-md border border-zinc-800/80 backdrop-blur-md">
          Tip: Click on any stage component to inspect architecture & live telemetry
        </div>
      </div>

      {/* 3. Stage Selector Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {stages.map((stage) => {
          const Icon = stage.icon;
          const isSelected = selectedStage === stage.id;
          return (
            <button
              key={stage.id}
              onClick={() => {
                setSelectedStage(stage.id);
                setIsDrawerOpen(true);
              }}
              className={`bento-card rounded-xl p-3 text-left transition-all relative overflow-hidden ${
                isSelected
                  ? 'border-purple-500/60 bg-purple-950/20 shadow-md shadow-purple-500/10'
                  : 'hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-purple-500 text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                </div>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                )}
              </div>
              <h4 className="text-[11px] font-bold text-white truncate">{stage.name}</h4>
              <p className="text-[9.5px] text-zinc-400 truncate mt-0.5">{stage.subtitle}</p>
            </button>
          );
        })}
      </div>

      {/* 4. Slide-Out Glassmorphic Stage Inspection Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, x: 400 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 400 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="w-full max-w-lg bg-zinc-950 border-l border-zinc-800 p-6 flex flex-col h-full overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                    {React.createElement(stages[selectedStage].icon, { className: 'w-5 h-5' })}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider font-semibold">
                      Stage Inspection #{selectedStage + 1}
                    </span>
                    <h3 className="text-base font-bold text-white">
                      {stages[selectedStage].name}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-5 space-y-5 flex-1 text-xs">
                <div>
                  <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Architecture & Role
                  </h4>
                  <p className="text-zinc-300 leading-relaxed text-[12px]">
                    {stages[selectedStage].description}
                  </p>
                </div>

                <div>
                  <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Live Telemetry Metrics
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {stages[selectedStage].metrics.map((metric, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800/80 font-mono"
                      >
                        <span className="text-zinc-400 text-[11px]">{metric.label}</span>
                        <span className="text-white font-bold text-[12px]">{metric.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Autonomic Formulation
                  </h4>
                  <div className="p-3 rounded-lg bg-zinc-900 border border-purple-500/30 text-purple-300 font-mono text-[11px] overflow-x-auto">
                    <code>{stages[selectedStage].formula}</code>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Kubernetes Specification (YAML)</span>
                  </h4>
                  <pre className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 font-mono text-[10.5px] text-zinc-300 overflow-x-auto leading-relaxed">
                    {stages[selectedStage].yaml}
                  </pre>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                <button
                  onClick={() => {
                    const next = (selectedStage + 1) % stages.length;
                    setSelectedStage(next);
                  }}
                  className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold"
                >
                  <span>Next Pipeline Stage</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white text-xs font-semibold"
                >
                  Close Inspection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
