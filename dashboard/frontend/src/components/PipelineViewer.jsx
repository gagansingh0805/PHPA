import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Sliders,
  Sparkles,
  Flame,
  Compass,
  RefreshCw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

export default function PipelineViewer({
  latest = {},
  isPlaying = true,
  speedFactor = 10,
  trafficMode = 'auto',
  manualRps = 125,
  setManualRps,
  setTrafficMode,
  onInjectSpike,
  onTogglePlay,
  onSpeedChange,
  onReset,
}) {
  // 1. Natural Mouse Drag-to-Orbit & Camera State
  const [pitch, setPitch] = useState(44); // RotateX: 10deg to 75deg
  const [yaw, setYaw] = useState(-18); // RotateZ: -65deg to 65deg
  const [roll, setRoll] = useState(8); // RotateY
  const [zoom, setZoom] = useState(1); // 0.75 to 1.45
  const [viewPreset, setViewPreset] = useState('isometric');
  const [isOrbiting, setIsOrbiting] = useState(false);

  // Mouse Drag Tracking Refs
  const canvasRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, pitch: 44, yaw: -18 });
  const [isCursorGrabbing, setIsCursorGrabbing] = useState(false);

  // 2. Stage Inspector State
  const [selectedStage, setSelectedStage] = useState(2); // default to Pod Workload
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'internals' | 'pods' | 'yaml'

  // 3. Step-by-Step Controllable Probe Tracer State
  const [probeHop, setProbeHop] = useState(0); // 0=idle, 1=ingestion, 2=ingress, 3=pod, 4=gatherer, 5=models, 6=actuator
  const [isProbePlaying, setIsProbePlaying] = useState(false);
  const [probeSpeed, setProbeSpeed] = useState(1); // 0.5, 1, 2
  const [activePodTarget, setActivePodTarget] = useState(3);
  const probeTimerRef = useRef(null);

  // Dynamic simulation values with fallbacks
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

  // Winning Model in MAX Envelope Decision
  const maxVal = Math.max(reactiveHpa, linearPred, hwPred, lstmPred);
  let winningModel = 'LSTM';
  if (maxVal === lstmPred) winningModel = 'LSTM';
  else if (maxVal === hwPred) winningModel = 'Holt-Winters';
  else if (maxVal === linearPred) winningModel = 'Linear';
  else winningModel = 'Reactive HPA';

  // Camera Presets & Reset
  const handlePresetChange = (preset) => {
    setViewPreset(preset);
    setIsOrbiting(false);
    if (preset === 'isometric') {
      setPitch(44);
      setYaw(-18);
      setRoll(8);
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

  const handleResetCamera = () => {
    handlePresetChange('isometric');
  };

  // Subtle auto-orbit
  useEffect(() => {
    if (!isOrbiting) return;
    const orbitInterval = setInterval(() => {
      setYaw((prev) => (prev >= 40 ? -40 : prev + 0.25));
    }, 50);
    return () => clearInterval(orbitInterval);
  }, [isOrbiting]);

  // Mouse Drag-to-Orbit & Wheel Handlers
  const handleMouseDown = (e) => {
    if (e.target.closest('button, input, a, select')) return;
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      pitch,
      yaw,
    };
    setIsCursorGrabbing(true);
    setIsOrbiting(false);
    setViewPreset('custom');
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    const newYaw = Math.max(-65, Math.min(65, dragStartRef.current.yaw + dx * 0.25));
    const newPitch = Math.max(10, Math.min(75, dragStartRef.current.pitch - dy * 0.25));

    setYaw(Math.round(newYaw));
    setPitch(Math.round(newPitch));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsCursorGrabbing(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * -0.001;
    setZoom((prev) => Math.max(0.75, Math.min(1.45, parseFloat((prev + zoomDelta).toFixed(2)))));
  };

  // Step-by-Step Controllable Probe Tracer Mechanics
  const waypoints = [
    {
      id: 1,
      title: '1. Ingestion',
      component: 'Client Edge Gateway',
      route: 'HTTP GET /api/v1/workload',
      delta: '0.0ms',
      total: '0.0ms',
      action: 'Client fires HTTP request; TLS handshake initiated at ingress perimeter.',
      cx: 140,
      cy: 120,
    },
    {
      id: 2,
      title: '2. Ingress',
      component: 'Envoy Service Mesh Proxy',
      route: 'Weighted Round-Robin Route',
      delta: '+3.8ms',
      total: '3.8ms',
      action: 'TLS decrypted; Ingress selects least-loaded pod target via active health probes.',
      cx: 280,
      cy: 120,
    },
    {
      id: 3,
      title: '3. Pod Workload',
      component: `Target Pod Replica (pod-0${activePodTarget})`,
      route: 'Container Ingestion & CPU Delta',
      delta: '+14.4ms',
      total: '18.2ms',
      action: `Dispatched to pod-0${activePodTarget}; container CPU increments (+1.2%). HTTP 200 OK returned.`,
      cx: 560,
      cy: 140,
    },
    {
      id: 4,
      title: '4. Telemetry',
      component: 'k8shorizmetrics Harvester',
      route: 'cAdvisor Daemon Scrape',
      delta: '+14.2ms',
      total: '32.4ms',
      action: 'Pod CPU/Memory scraped; unready pods filtered; moving window buffer updated.',
      cx: 560,
      cy: 350,
    },
    {
      id: 5,
      title: '5. Models Brain',
      component: 'PHPA Parallel Evaluator',
      route: 'Parallel Model Max Synthesis',
      delta: '+12.7ms',
      total: '45.1ms',
      action: `Executed 4 models in parallel. Decision: Maximum picked ${winningModel} (${maxVal} replicas).`,
      cx: 860,
      cy: 350,
    },
    {
      id: 6,
      title: '6. Scale API',
      component: 'Kubernetes ScaleClient',
      route: 'PATCH /scale Subresource',
      delta: '+12.9ms',
      total: '58.0ms',
      action: `Deployment scale subresource patched to ${actualPods} pods. Control loop closed!`,
      cx: 890,
      cy: 120,
    },
  ];

  // Auto-play probe stepping
  useEffect(() => {
    if (!isProbePlaying) return;
    const intervalTime = (1200 / probeSpeed);
    probeTimerRef.current = setTimeout(() => {
      setProbeHop((prev) => {
        if (prev >= 6) {
          setIsProbePlaying(false);
          return 6;
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearTimeout(probeTimerRef.current);
  }, [isProbePlaying, probeHop, probeSpeed]);

  const handleStartProbe = () => {
    setProbeHop(1);
    setIsProbePlaying(true);
    setActivePodTarget(Math.floor(Math.random() * actualPods) + 1);
  };

  const handlePauseProbe = () => {
    setIsProbePlaying(false);
  };

  const handleResumeProbe = () => {
    if (probeHop === 0 || probeHop === 6) {
      setProbeHop(1);
    }
    setIsProbePlaying(true);
  };

  const handleNextStep = () => {
    setIsProbePlaying(false);
    setProbeHop((prev) => Math.min(6, prev + 1));
  };

  const handlePrevStep = () => {
    setIsProbePlaying(false);
    setProbeHop((prev) => Math.max(1, prev - 1));
  };

  const handleResetProbe = () => {
    setIsProbePlaying(false);
    setProbeHop(0);
  };

  const currentWaypoint = waypoints.find((w) => w.id === probeHop) || null;

  // Mock Pods List for Deep Container Inspector
  const mockPodList = useMemo(() => {
    return Array.from({ length: actualPods }).map((_, idx) => {
      const isLstmPrewarmed = idx >= reactiveHpa && idx < actualPods;
      const podCpu = Math.min(100, Math.max(25, Math.round(cpu + (idx % 3) * 5 - 5)));
      const memoryMb = 140 + (idx * 12);
      return {
        id: idx + 1,
        name: `web-workload-7b4f8-${String.fromCharCode(97 + idx)}${idx + 1}k`,
        ip: `10.244.1.${14 + idx}`,
        node: `node-pool-compute-${(idx % 2) + 1}`,
        status: 'Running',
        restarts: 0,
        age: `${idx * 4 + 12}m`,
        cpu: podCpu,
        memory: `${memoryMb}Mi / 500Mi`,
        isLstmPrewarmed,
      };
    });
  }, [actualPods, cpu, reactiveHpa]);

  // Technical Metadata for All 6 Stages
  const stages = [
    {
      id: 0,
      name: 'Client Edge Ingestion',
      subtitle: 'HTTP/gRPC Ingress Stream',
      icon: Activity,
      color: 'cyan',
      description:
        'External user workloads generate continuous HTTP requests following a diurnal cyclic curve combined with stochastic Poisson arrival bursts.',
      formula: '\\\\lambda(t) = \\\\bar{\\\\lambda} + A \\\\sin\\\\left(\\\\frac{2\\\\pi t}{T}\\\\right) + \\\\xi(t)',
      internals: {
        'Arrival Process': 'Poisson Process with Diurnal Base Rate',
        'Current Concurrency': `${Math.round(rps * 1.8)} TCP Connections`,
        'Burst Factor': isSpiking ? '5.0x Flash Crowd Active' : '1.0x Baseline Nominal',
        'Protocol': 'HTTP/2.0 TLS 1.3 via ALB / NodePort',
      },
      yaml: `apiVersion: networking.k8s.io/v1\nkind: Ingress\nmetadata:\n  name: web-ingress\nspec:\n  rules:\n  - http:\n      paths:\n      - path: /\n        pathType: Prefix\n        backend:\n          service:\n            name: web-service\n            port:\n              number: 80`,
    },
    {
      id: 1,
      name: 'Ingress Router & Service Mesh',
      subtitle: 'Envoy Reverse Proxy',
      icon: Network,
      color: 'blue',
      description:
        'Terminates TLS, measures endpoint response latencies, and balances HTTP requests uniformly across available active pods using weighted round-robin.',
      formula: 'P95 \\\\, \\\\text{Latency} \\\\approx L_0 + \\\\beta \\\\left( \\\\frac{\\\\lambda(t)}{N_{actual}(t) \\\\cdot C_{pod}} \\\\right)',
      internals: {
        'Routing Algorithm': 'Weighted Least-Request / Round-Robin',
        'Active P95 Latency': `${p95} ms (SLA Target: < 100ms)`,
        'Connection Pooling': 'HTTP Keep-Alive (Max 2048)',
        'SLA Violations': `${slaBreaches} Breaches`,
      },
      yaml: `apiVersion: v1\nkind: Service\nmetadata:\n  name: web-service\nspec:\n  type: ClusterIP\n  selector:\n    app: web-workload\n  ports:\n  - port: 80\n    targetPort: 8080`,
    },
    {
      id: 2,
      name: 'Kubernetes Workload',
      subtitle: 'Active Pod Cluster (Data Plane)',
      icon: Server,
      color: 'purple',
      description:
        'Target deployment running the application workload. Pods process incoming requests and scale elastically based on PHPA decisions.',
      formula: 'U_{cpu}(t) = \\\\min\\\\left(100\\\\%, \\\\; \\\\frac{\\\\lambda(t)}{N_{actual}(t) \\\\cdot 25} \\\\times 60\\\\%\\\\right)',
      internals: {
        'Allocated Replicas': `${actualPods} Pods Running`,
        'Ideal Demand': `${idealDemand} Pods (Based on ~25 RPS/pod)`,
        'Target CPU Utilization': '60% Average across Pods',
        'Current Cluster CPU': `${cpu}% Utilization`,
      },
      yaml: `apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: web-workload\nspec:\n  replicas: ${actualPods}\n  template:\n    spec:\n      containers:\n      - name: web\n        resources:\n          limits: { cpu: "500m" }\n          requests: { cpu: "250m" }`,
    },
    {
      id: 3,
      name: 'Telemetry Harvester',
      subtitle: 'k8shorizmetrics & cAdvisor',
      icon: Layers,
      color: 'emerald',
      description:
        'Scrapes container CPU and memory usage from cAdvisor daemonsets, filters initializing pods, and computes the raw replica requirement.',
      formula: 'R_{raw} = \\\\left\\\\lceil N_{current} \\\\times \\\\frac{\\\\text{CurrentCPU}}{\\\\text{TargetCPU (60%)}} \\\\right\\\\rceil',
      internals: {
        'Scrape Interval': '15 Seconds Cadence',
        'Metric Source': 'cAdvisor DaemonSet via Kubelet /metrics/cadvisor',
        'History Buffer': '50 Time-Steps Window',
        'Unready Pod Filter': 'Active (Initializers Excluded)',
      },
      yaml: `gatherer:\n  metrics:\n  - type: Resource\n    resource:\n      name: cpu\n      target:\n        type: Utilization\n        averageUtilization: 60\n  scrapeInterval: 15s`,
    },
    {
      id: 4,
      name: 'PHPA Parallel Models Brain',
      subtitle: 'Multi-Model Forecasting Core',
      icon: Cpu,
      color: 'violet',
      description:
        'Pipes historical metrics concurrently to Reactive HPA, Linear Regression, Holt-Winters, and 2-Layer LSTM models, synthesizing recommendations via DecisionType: Maximum.',
      formula: 'N_{target} = \\\\max\\\\left( R_{hpa}, \\\\; \\\\hat{y}_{linear}, \\\\; \\\\hat{y}_{hw}, \\\\; \\\\hat{y}_{lstm} \\\\right)',
      internals: {
        'Reactive HPA': `${reactiveHpa} Pods (Lagging CPU ratio)`,
        'Linear Regression': `${linearPred} Pods (OLS trend slope)`,
        'Holt-Winters': `${hwPred} Pods (Diurnal seasonal smoothing)`,
        '2-Layer LSTM': `${lstmPred} Pods (Non-linear lookahead preemption)`,
        'Synthesis Strategy': `MAX -> ${winningModel} (${maxVal} pods)`,
      },
      yaml: `apiVersion: phpa.custom.k8s/v1alpha1\nkind: PredictiveHPA\nmetadata:\n  name: web-phpa\nspec:\n  decisionType: "Maximum"\n  models:\n  - type: "LSTM"\n    layers: 2\n    hiddenUnits: 64\n  - type: "HoltWinters"\n    seasonLength: 60\n  - type: "Linear"`,
    },
    {
      id: 5,
      name: 'Scale Actuator',
      subtitle: 'Kubernetes Scale Subresource Client',
      icon: CheckCircle2,
      color: 'amber',
      description:
        'Enforces cooldown stabilization windows, clamps replicas between min/max boundaries, and patches the deployment scale subresource.',
      formula: 'N_{actuated} = \\\\text{clamp}\\\\left(\\\\min=2, \\\\; \\\\max=30, \\\\; N_{target}\\\\right)',
      internals: {
        'Target Replicas Applied': `${actualPods} Replicas`,
        'Downscale Stabilization': '300s Stabilization Window',
        'Min / Max Bounds': '2 Min / 30 Max Pods',
        'Scale Client API': 'PATCH /apis/apps/v1/namespaces/default/deployments/web-workload/scale',
      },
      yaml: `PATCH /apis/apps/v1/namespaces/default/deployments/web-workload/scale\nContent-Type: application/merge-patch+json\n\n{\n  "spec": {\n    "replicas": ${actualPods}\n  }\n}`,
    },
  ];

  return (
    <div className="space-y-4 animate-fadeIn select-none">
      {/* 1. TOP CONTROL DOCK: Camera Angles + Real-Time Live Traffic Deck */}
      <div className="rounded-2xl p-4 lg:p-5 border border-zinc-700/80 bg-[#0d0d14] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#06b6d4]"></span>
              <h2 className="text-base font-bold text-white tracking-wide">
                PHPA 3D Motion Architectural Pipeline
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">
                Live Interactive Lab
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Drag anywhere to orbit in 3D • Scroll to zoom • Adjust live traffic below to watch the 3D pod blades scale elastically in real time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-zinc-900 border border-zinc-700/80 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => handlePresetChange('isometric')}
                className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                  viewPreset === 'isometric'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                3D Isometric
              </button>
              <button
                onClick={() => handlePresetChange('front')}
                className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                  viewPreset === 'front'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                2.5D Front Flow
              </button>
              <button
                onClick={() => handlePresetChange('top')}
                className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
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
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                isOrbiting
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
              }`}
              title="Toggle slow 3D Auto-Orbit"
            >
              <Compass className={`w-3.5 h-3.5 ${isOrbiting ? 'animate-spin' : ''}`} />
              <span>Orbit</span>
            </button>

            <button
              onClick={handleResetCamera}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white transition-colors"
              title="Reset Camera to Default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Integrated Live Traffic Control Deck */}
        <div className="mt-3.5 pt-3.5 border-t border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <span className="text-[11px] font-mono font-bold text-cyan-400 flex-shrink-0 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>TRAFFIC:</span>
            </span>
            <input
              type="range"
              min="50"
              max="500"
              step="10"
              value={rps}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (setTrafficMode) setTrafficMode('manual');
                if (setManualRps) setManualRps(val);
              }}
              className="flex-1 accent-cyan-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <span className="font-mono font-bold text-white text-xs w-16 text-right">
              {rps} <span className="text-[10px] text-zinc-400 font-normal">RPS</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (setTrafficMode) setTrafficMode('manual');
                if (setManualRps) setManualRps(80);
              }}
              className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] font-mono transition-colors"
            >
              Calm (80)
            </button>
            <button
              onClick={() => {
                if (setTrafficMode) setTrafficMode('manual');
                if (setManualRps) setManualRps(220);
              }}
              className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] font-mono transition-colors"
            >
              Peak (220)
            </button>
            <button
              onClick={() => {
                if (onInjectSpike) onInjectSpike();
              }}
              className="flex items-center gap-1 px-3 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 text-[11px] font-mono font-bold transition-all shadow-[0_0_8px_rgba(244,63,94,0.2)]"
            >
              <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>5x Surge</span>
            </button>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-400">
            <span>
              Pods: <strong className="text-purple-300 font-bold">{actualPods}</strong>
            </span>
            <span className="text-zinc-600">•</span>
            <span>
              P95: <strong className={p95 > 100 ? 'text-rose-400' : 'text-emerald-400'}>{p95}ms</strong>
            </span>
            <span className="text-zinc-600">•</span>
            <span>
              Engine: <strong className="text-purple-400">MAX({winningModel})</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. STEP-BY-STEP CONTROLLABLE PROBE TRACER BAR */}
      <div className="rounded-xl p-3 border border-amber-500/30 bg-[#100e0a] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 flex-shrink-0">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>STEP-BY-STEP TRACE PROBE</span>
          </span>

          {probeHop === 0 ? (
            <button
              onClick={handleStartProbe}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold font-mono transition-all shadow-md shadow-amber-500/20"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Trace</span>
            </button>
          ) : isProbePlaying ? (
            <button
              onClick={handlePauseProbe}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500 text-amber-300 text-xs font-bold font-mono transition-colors"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={handleResumeProbe}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold font-mono transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume</span>
            </button>
          )}

          <button
            onClick={handlePrevStep}
            disabled={probeHop <= 1}
            className="p-1 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Previous Stage"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleNextStep}
            disabled={probeHop >= 6 || probeHop === 0}
            className="p-1 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Next Stage"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetProbe}
            className="p-1 rounded bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white transition-colors"
            title="Reset Probe"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded p-0.5 text-[10px] font-mono">
            {[0.5, 1, 2].map((spd) => (
              <button
                key={spd}
                onClick={() => setProbeSpeed(spd)}
                className={`px-1.5 py-0.5 rounded ${
                  probeSpeed === spd ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono">
          {waypoints.map((wp) => {
            const isActive = probeHop === wp.id;
            const isPassed = probeHop > wp.id;
            return (
              <button
                key={wp.id}
                onClick={() => {
                  setIsProbePlaying(false);
                  setProbeHop(wp.id);
                }}
                className={`px-2 py-1 rounded transition-all flex items-center gap-1 ${
                  isActive
                    ? 'bg-amber-400 text-zinc-950 font-bold shadow-md shadow-amber-400/30'
                    : isPassed
                    ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                    : 'bg-zinc-950 text-zinc-500 border border-zinc-800 hover:text-zinc-300'
                }`}
              >
                <span>{wp.id}.</span>
                <span>{wp.title.split('. ')[1]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. RAZOR-SHARP 3D SPATIAL CANVAS VIEWPORT */}
      <div
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={handleResetCamera}
        className={`relative w-full rounded-2xl border border-zinc-700/80 bg-[#07070b] overflow-hidden shadow-2xl min-h-[640px] flex items-center justify-center ${
          isCursorGrabbing ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{
          WebkitFontSmoothing: 'antialiased',
          textRendering: 'optimizeLegibility',
        }}
      >
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]" />
        </div>

        <div className="absolute top-3 left-4 z-20 pointer-events-none flex items-center gap-2 bg-zinc-900/90 border border-zinc-700/80 px-2.5 py-1 rounded-md text-[10px] font-mono text-zinc-400 shadow-md">
          <span>🖱️ Click & Drag to Orbit</span>
          <span className="text-zinc-600">•</span>
          <span>Scroll to Zoom</span>
          <span className="text-zinc-600">•</span>
          <span>Double-click to Reset</span>
        </div>

        <AnimatePresence>
          {currentWaypoint && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-3 right-4 z-30 pointer-events-auto max-w-sm"
            >
              <div className="bg-[#12100d] border border-amber-500/60 rounded-xl p-3 shadow-2xl text-xs space-y-1.5">
                <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300 font-mono text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>HOP {currentWaypoint.id}/6: {currentWaypoint.component}</span>
                  </div>
                  <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    +{currentWaypoint.delta}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-zinc-400 truncate">
                  Route: <span className="text-zinc-200">{currentWaypoint.route}</span>
                </div>
                <p className="text-[10.5px] text-zinc-300 leading-snug">
                  {currentWaypoint.action}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className="w-full h-[620px] flex items-center justify-center transition-transform duration-100 ease-out"
          style={{
            perspective: '1400px',
            perspectiveOrigin: '50% 50%',
          }}
        >
          <div
            className="relative w-[1100px] h-[520px] transition-transform duration-150 ease-out"
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateX(${pitch}deg) rotateY(${roll}deg) rotateZ(${yaw}deg) scale(${zoom})`,
            }}
          >
            {/* 3D Grid Floor */}
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none border border-zinc-800/80"
              style={{
                transform: 'translateZ(-35px)',
                backgroundImage: `
                  linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
                boxShadow: '0 30px 100px rgba(0,0,0,0.85) inset',
              }}
            >
              <div className="absolute inset-0 rounded-3xl border border-cyan-500/20 shadow-[0_0_40px_rgba(6,182,212,0.06)]" />
            </div>

            {/* SVG Circuit Highway */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
              style={{ transform: 'translateZ(5px)' }}
            >
              <defs>
                <linearGradient id="grad-req" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
                <filter id="glow-strong" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <path d="M 140 120 L 230 120" fill="none" stroke="rgba(6, 182, 212, 0.4)" strokeWidth="2.5" strokeDasharray="4 3" />
              <path d="M 330 120 L 440 120" fill="none" stroke="rgba(6, 182, 212, 0.5)" strokeWidth="2.5" />
              <path d="M 560 220 L 560 320" fill="none" stroke="rgba(16, 185, 129, 0.5)" strokeWidth="2.5" strokeDasharray="5 3" />
              <path d="M 660 360 L 760 360" fill="none" stroke="rgba(168, 85, 247, 0.5)" strokeWidth="2.5" />
              <path d="M 950 310 L 950 180" fill="none" stroke="rgba(245, 158, 11, 0.5)" strokeWidth="2.5" strokeDasharray="4 3" />
              <path d="M 900 120 L 710 120" fill="none" stroke="rgba(6, 182, 212, 0.6)" strokeWidth="2.5" strokeDasharray="4 3" />

              <circle r="4" fill="#06b6d4" filter="url(#glow-strong)">
                <animate attributeName="cx" values="140; 230; 330; 440" dur={rps > 300 ? '0.6s' : rps > 180 ? '1.1s' : '1.8s'} repeatCount="indefinite" />
                <animate attributeName="cy" values="120; 120; 120; 120" dur={rps > 300 ? '0.6s' : rps > 180 ? '1.1s' : '1.8s'} repeatCount="indefinite" />
              </circle>

              <circle r="3.5" fill="#10b981" filter="url(#glow-strong)">
                <animate attributeName="cx" values="560; 560" dur="2.0s" repeatCount="indefinite" />
                <animate attributeName="cy" values="220; 320" dur="2.0s" repeatCount="indefinite" />
              </circle>

              <circle r="3.5" fill="#a855f7" filter="url(#glow-strong)">
                <animate attributeName="cx" values="660; 760" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="cy" values="360; 360" dur="1.5s" repeatCount="indefinite" />
              </circle>

              <circle r="3.5" fill="#f59e0b" filter="url(#glow-strong)">
                <animate attributeName="cx" values="950; 950" dur="1.8s" repeatCount="indefinite" />
                <animate attributeName="cy" values="310; 180" dur="1.8s" repeatCount="indefinite" />
              </circle>

              <circle r="4" fill="#06b6d4" filter="url(#glow-strong)">
                <animate attributeName="cx" values="900; 710" dur="1.4s" repeatCount="indefinite" />
                <animate attributeName="cy" values="120; 120" dur="1.4s" repeatCount="indefinite" />
              </circle>

              {probeHop > 0 && currentWaypoint && (
                <circle
                  cx={currentWaypoint.cx}
                  cy={currentWaypoint.cy}
                  r="8"
                  fill="#fbbf24"
                  filter="url(#glow-strong)"
                  className="animate-pulse"
                />
              )}
            </svg>

            {/* ZONE 1: TRAFFIC EDGE INGESTION */}
            <div
              onClick={() => {
                setSelectedStage(0);
                setIsDrawerOpen(true);
              }}
              className="absolute left-6 top-10 w-36 cursor-pointer group"
              style={{ transform: 'translateZ(30px)' }}
            >
              <div
                className={`rounded-xl p-3 border transition-all shadow-xl ${
                  probeHop === 1
                    ? 'bg-[#181812] border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)] scale-105'
                    : 'bg-[#0f0f15] border-cyan-500/40 hover:border-cyan-400 hover:scale-105'
                }`}
              >
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

            {/* ZONE 2: INGRESS & ENVOY MESH */}
            <div
              onClick={() => {
                setSelectedStage(1);
                setIsDrawerOpen(true);
              }}
              className="absolute left-52 top-10 w-36 cursor-pointer group"
              style={{ transform: 'translateZ(35px)' }}
            >
              <div
                className={`rounded-xl p-3 border transition-all shadow-xl ${
                  probeHop === 2
                    ? 'bg-[#181812] border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)] scale-105'
                    : 'bg-[#0f0f15] border-blue-500/40 hover:border-blue-400 hover:scale-105'
                }`}
              >
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

            {/* ZONE 3: 3D POD CLUSTER WORKLOAD */}
            <div
              onClick={() => {
                setSelectedStage(2);
                setIsDrawerOpen(true);
              }}
              className="absolute left-[390px] top-6 w-80 cursor-pointer group"
              style={{ transform: 'translateZ(45px)' }}
            >
              <div
                className={`rounded-2xl p-4 border transition-all shadow-2xl ${
                  probeHop === 3
                    ? 'bg-[#14121a] border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.35)]'
                    : 'bg-[#0e0e16] border-purple-500/40 hover:border-purple-400'
                }`}
              >
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

                <div className="bg-[#08080c] rounded-xl p-3 border border-zinc-800 min-h-[120px] flex items-center justify-center">
                  <div className="grid grid-cols-5 gap-2.5 w-full">
                    <AnimatePresence>
                      {Array.from({ length: actualPods }).map((_, idx) => {
                        const isPrewarmed = idx >= reactiveHpa && idx < actualPods;
                        const isTargetedByProbe = probeHop === 3 && idx === (activePodTarget - 1);
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
                              delay: idx * 0.02,
                            }}
                            className="relative group/pod"
                            style={{
                              transformStyle: 'preserve-3d',
                              perspective: '400px',
                            }}
                          >
                            <div
                              className={`rounded-lg p-1.5 text-center border transition-all duration-300 ${
                                isTargetedByProbe
                                  ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_12px_#f59e0b] scale-110'
                                  : isPrewarmed
                                  ? 'bg-purple-950/60 border-purple-400/80 shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                                  : isSpiking
                                  ? 'bg-rose-950/40 border-rose-500/60 shadow-[0_0_8px_rgba(244,63,94,0.2)]'
                                  : 'bg-[#14141d] border-zinc-700/80 hover:border-cyan-400/80'
                              }`}
                              style={{ transform: 'translateZ(10px)' }}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isTargetedByProbe
                                      ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24] animate-ping'
                                      : isPrewarmed
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
                                    isTargetedByProbe
                                      ? 'bg-amber-400'
                                      : podCpu > 80
                                      ? 'bg-rose-500'
                                      : isPrewarmed
                                      ? 'bg-purple-400'
                                      : 'bg-cyan-400'
                                  }`}
                                  style={{ width: `${podCpu}%` }}
                                />
                              </div>
                              <span className="text-[7.5px] font-mono text-zinc-400 block truncate">
                                {podCpu}%
                              </span>
                            </div>

                            <div
                              className="absolute inset-0 bg-black/50 rounded-lg pointer-events-none -z-10"
                              style={{ transform: 'translateZ(-8px) translateY(4px)' }}
                            />
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-zinc-800 flex items-center justify-between text-[10px] font-mono text-zinc-400">
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
              <div
                className={`rounded-xl p-3 border transition-all shadow-xl ${
                  probeHop === 4
                    ? 'bg-[#181812] border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)] scale-105'
                    : 'bg-[#0f0f15] border-emerald-500/40 hover:border-emerald-400 hover:scale-105'
                }`}
              >
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
                  <span className="text-emerald-400 font-semibold">0 filtered</span>
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
              <div
                className={`rounded-2xl p-4 border transition-all shadow-2xl ${
                  probeHop === 5
                    ? 'bg-[#14121a] border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.35)]'
                    : 'bg-[#0e0e16] border-purple-500/40 hover:border-purple-400'
                }`}
              >
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
                        : 'bg-[#09090e] border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] mb-1">
                      <span className="text-zinc-500">Reactive HPA</span>
                      {winningModel === 'Reactive HPA' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
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
                        : 'bg-[#09090e] border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] mb-1">
                      <span className="text-zinc-500">Linear OLS</span>
                      {winningModel === 'Linear' && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
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
                        : 'bg-[#09090e] border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] mb-1">
                      <span className="text-zinc-500">Holt-Winters</span>
                      {winningModel === 'Holt-Winters' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
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
                        : 'bg-[#09090e] border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] mb-1">
                      <span className="text-purple-300 font-semibold">2-Layer LSTM</span>
                      {winningModel === 'LSTM' && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />}
                    </div>
                    <div className="flex items-baseline justify-between font-mono font-bold text-white">
                      <span className="text-purple-300">{lstmPred}</span>
                      <span className="text-[9px] font-normal text-zinc-500">pods</span>
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-zinc-800 flex items-center justify-between text-[10px] font-mono">
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
              <div
                className={`rounded-xl p-3 border transition-all shadow-xl ${
                  probeHop === 6
                    ? 'bg-[#181812] border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)] scale-105'
                    : 'bg-[#0f0f15] border-amber-500/40 hover:border-amber-400 hover:scale-105'
                }`}
              >
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
      </div>

      {/* 4. STAGE SELECTOR RIBBON */}
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
              className={`rounded-xl p-3 text-left transition-all relative overflow-hidden border ${
                isSelected
                  ? 'border-purple-500 bg-[#161424] shadow-md shadow-purple-500/10'
                  : 'bg-[#0d0d14] border-zinc-800 hover:border-zinc-700'
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
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />}
              </div>
              <h4 className="text-[11px] font-bold text-white truncate">{stage.name}</h4>
              <p className="text-[9.5px] text-zinc-400 truncate mt-0.5">{stage.subtitle}</p>
            </button>
          );
        })}
      </div>

      {/* 5. DEEP INTERNAL STAGE INSPECTION MODAL */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl bg-[#0e0e14] border border-zinc-700 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-[#09090e]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
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

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sub-Tabs Navigation */}
              <div className="flex items-center gap-2 px-5 pt-3 border-b border-zinc-800 text-xs font-mono">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`pb-2.5 px-2 border-b-2 font-semibold transition-colors ${
                    activeTab === 'overview'
                      ? 'border-purple-500 text-purple-400'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Architecture & Role
                </button>
                <button
                  onClick={() => setActiveTab('internals')}
                  className={`pb-2.5 px-2 border-b-2 font-semibold transition-colors ${
                    activeTab === 'internals'
                      ? 'border-purple-500 text-purple-400'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Internal Mechanics
                </button>
                {selectedStage === 2 && (
                  <button
                    onClick={() => setActiveTab('pods')}
                    className={`pb-2.5 px-2 border-b-2 font-semibold transition-colors ${
                      activeTab === 'pods'
                        ? 'border-purple-500 text-purple-400'
                        : 'border-transparent text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Container Pods ({actualPods})
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('yaml')}
                  className={`pb-2.5 px-2 border-b-2 font-semibold transition-colors ${
                    activeTab === 'yaml'
                      ? 'border-purple-500 text-purple-400'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Kubernetes Spec (YAML)
                </button>
              </div>

              {/* Modal Body Content */}
              <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
                {/* SUB-TAB 1: OVERVIEW */}
                {activeTab === 'overview' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div>
                      <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                        Operational Function
                      </h4>
                      <p className="text-zinc-300 leading-relaxed text-[12px]">
                        {stages[selectedStage].description}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                        Mathematical Formulation
                      </h4>
                      <div className="p-3 rounded-lg bg-[#07070b] border border-purple-500/30 text-purple-300 font-mono text-[11px] overflow-x-auto">
                        <code>{stages[selectedStage].formula}</code>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUB-TAB 2: INTERNALS */}
                {activeTab === 'internals' && (
                  <div className="space-y-3 animate-fadeIn">
                    <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      Component Internal Telemetry
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(stages[selectedStage].internals).map(([key, val]) => (
                        <div
                          key={key}
                          className="p-3 rounded-xl bg-[#07070b] border border-zinc-800 flex flex-col justify-between"
                        >
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">{key}</span>
                          <span className="text-white font-mono font-bold text-xs mt-1">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SUB-TAB 3: CONTAINER PODS BREAKDOWN (Only for Stage 3) */}
                {activeTab === 'pods' && selectedStage === 2 && (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                        Running Pods Breakdown
                      </h4>
                      <span className="text-[10px] font-mono text-zinc-400">
                        Target CPU: 60% • Max Limit: 500m
                      </span>
                    </div>

                    <div className="border border-zinc-800 rounded-xl overflow-hidden bg-[#07070b]">
                      <table className="w-full text-[10.5px] font-mono text-left">
                        <thead className="bg-[#12121c] text-zinc-400 border-b border-zinc-800">
                          <tr>
                            <th className="p-2">Pod Name</th>
                            <th className="p-2">IP Address</th>
                            <th className="p-2">CPU</th>
                            <th className="p-2">Memory</th>
                            <th className="p-2">Allocated By</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                          {mockPodList.map((pod) => (
                            <tr key={pod.id} className="hover:bg-zinc-900/50 transition-colors">
                              <td className="p-2 text-white font-medium truncate max-w-[140px]">{pod.name}</td>
                              <td className="p-2 text-cyan-400">{pod.ip}</td>
                              <td className="p-2">
                                <span className={pod.cpu > 80 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                                  {pod.cpu}%
                                </span>
                              </td>
                              <td className="p-2 text-zinc-400">{pod.memory}</td>
                              <td className="p-2">
                                {pod.isLstmPrewarmed ? (
                                  <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9px] font-bold">
                                    LSTM Pre-warm
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[9px]">
                                    Reactive HPA
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SUB-TAB 4: YAML SPEC */}
                {activeTab === 'yaml' && (
                  <div className="space-y-2 animate-fadeIn">
                    <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Kubernetes Resource Manifest</span>
                    </h4>
                    <pre className="p-3.5 rounded-xl bg-[#07070b] border border-zinc-800 font-mono text-[11px] text-zinc-300 overflow-x-auto leading-relaxed">
                      {stages[selectedStage].yaml}
                    </pre>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 border-t border-zinc-800 bg-[#09090e] flex items-center justify-between">
                <button
                  onClick={() => {
                    const next = (selectedStage + 1) % stages.length;
                    setSelectedStage(next);
                    setActiveTab('overview');
                  }}
                  className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold"
                >
                  <span>Next Stage ({((selectedStage + 1) % stages.length) + 1})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white text-xs font-semibold"
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
