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
  ChevronUp,
  ChevronDown,
  ChevronLeft,
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
  Maximize2,
  GitBranch,
  ShieldAlert,
  ArrowRight,
  BarChart3,
  TrendingUp,
  Clock,
  Radio,
} from 'lucide-react';

// Lazy-load the WebGL 3D Canvas so it only initializes when the user enters 3D mode
const Pipeline3DCanvas = React.lazy(() => import('./Pipeline3DCanvas'));

export default function PipelineViewer({
  theme = 'dark',
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
  // 1. View Mode: '2d' (Default Pristine Architectural Schematic) vs '3d' (Spatial 3D Canvas)
  const [viewMode, setViewMode] = useState('2d'); // '2d' | '3d'

  // Dynamic responsive auto-fit zoom calculation ensuring the entire architecture fits comfortably with generous margins
  const getResponsiveZoom = (base = 1, mode = viewMode) => {
    if (typeof window !== 'undefined') {
      const w = window.innerWidth;
      // The comprehensive expanded diagram board is 1240px wide and 660px high.
      const effectiveW = 1260;
      const gutter = w < 640 ? 32 : 120;
      const availableW = Math.max(260, w - gutter);
      const fitScale = availableW / effectiveW;

      if (w < 400) return parseFloat((Math.min(0.26, fitScale) * base).toFixed(3));
      if (w < 480) return parseFloat((Math.min(0.32, fitScale) * base).toFixed(3));
      if (w < 640) return parseFloat((Math.min(0.42, fitScale) * base).toFixed(3));
      if (w < 768) return parseFloat((Math.min(0.52, fitScale) * base).toFixed(3));
      if (w < 1024) return parseFloat((Math.min(0.62, fitScale) * base).toFixed(3));
      if (w < 1280) return parseFloat((Math.min(0.70, fitScale) * base).toFixed(3));
      // On desktop displays (>= 1280px), provide generous breathing room (74% scale) so all 10 components fit gracefully!
      return parseFloat((0.74 * base).toFixed(3));
    }
    return parseFloat((0.74 * base).toFixed(3));
  };

  // 2. Natural Mouse Drag-to-Orbit, Pan & Camera State
  const [pitch, setPitch] = useState(44); // RotateX: 12deg to 78deg
  const [yaw, setYaw] = useState(-18); // RotateZ: -80deg to 80deg
  const [roll, setRoll] = useState(8); // RotateY
  const [zoom, setZoom] = useState(() => getResponsiveZoom(1, '2d')); // 0.15 to 1.85
  const [pan, setPan] = useState({ x: 0, y: 0 }); // Free Pan translation (X, Y)
  const [viewPreset, setViewPreset] = useState('isometric');
  const [isOrbiting, setIsOrbiting] = useState(false);

  // Mouse Drag Tracking Refs
  const canvasRef = useRef(null);
  const isDraggingRef = useRef(false);
  const pitchRef = useRef(pitch);
  const yawRef = useRef(yaw);
  const panRef = useRef(pan);
  useEffect(() => { pitchRef.current = pitch; }, [pitch]);
  useEffect(() => { yawRef.current = yaw; }, [yaw]);
  useEffect(() => { panRef.current = pan; }, [pan]);

  // Window resize listener to auto-fit zoom on orientation change or screen resize
  useEffect(() => {
    const handleResize = () => {
      setZoom(getResponsiveZoom(1, viewMode));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  const [isCursorGrabbing, setIsCursorGrabbing] = useState(false);

  // 3. Stage Inspector State
  const [selectedStage, setSelectedStage] = useState(2); // default to Pod Workload
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('diagram'); // 'diagram' | 'overview' | 'internals' | 'pods' | 'yaml'

  // 4. Step-by-Step Controllable Probe Tracer State
  const [probeHop, setProbeHop] = useState(0); // 0=idle, 1=ingestion, 2=ingress, 3=pod, 4=gatherer, 5=models, 6=actuator
  const [probeProgress, setProbeProgress] = useState(0); // 0.0 to 1.0 within the active hop
  const [isProbePlaying, setIsProbePlaying] = useState(false);
  const [probeSpeed, setProbeSpeed] = useState(1); // 0.5, 1, 2, 4
  const [activePodTarget, setActivePodTarget] = useState(3);
  const probeTimerRef = useRef(null);

  // Dynamic simulation values with fallbacks
  const rps = latest.rps || 125;
  const actualPods = Math.min(30, Math.max(2, latest.actual_pods || 4));
  const idealDemand = latest.ideal_demand || 4;
  const cpu = latest.cpu_utilization || 60;
  const p95 = latest.p95_latency_ms || 32.5;
  const slaBreaches = latest.sla_breaches || 0;
  const isSpiking = latest.is_spiking || false;

  const reactiveHpa = latest.reactive_hpa || actualPods;
  const linearPred = latest.linear_pred || actualPods;

  // Dynamic photon pacing:
  // Scales directly with user-selected probeSpeed (0.5x, 1x, 2x, 4x) and live traffic workload (RPS)
  const speedMult = Math.max(0.2, (probeSpeed || 1) * (rps > 350 ? 1.6 : rps > 180 ? 1.25 : 1.0));
  const p1Dur = `${Math.max(0.18, 0.9 / speedMult).toFixed(2)}s`;
  const p2Dur = `${Math.max(0.18, 0.95 / speedMult).toFixed(2)}s`;
  const p3Dur = `${Math.max(0.25, 1.4 / speedMult).toFixed(2)}s`;
  const p4Dur = `${Math.max(0.22, 1.2 / speedMult).toFixed(2)}s`;
  const p5Dur = `${Math.max(0.28, 1.6 / speedMult).toFixed(2)}s`;
  const p6Dur = `${Math.max(0.18, 1.0 / speedMult).toFixed(2)}s`;
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
    setPan({ x: 0, y: 0 });
    const rZoom = getResponsiveZoom(1, '3d');
    if (preset === 'isometric') {
      setPitch(44);
      setYaw(-18);
      setRoll(8);
      setZoom(rZoom);
    } else if (preset === 'core') {
      setPitch(28);
      setYaw(-25);
      setRoll(4);
      setZoom(parseFloat((rZoom * 1.25).toFixed(3)));
    } else if (preset === 'front') {
      setPitch(12);
      setYaw(0);
      setRoll(0);
      setZoom(parseFloat((rZoom * 1.05).toFixed(3)));
    } else if (preset === 'top') {
      setPitch(68);
      setYaw(0);
      setRoll(0);
      setZoom(parseFloat((rZoom * 0.95).toFixed(3)));
    }
  };

  const handleResetCamera = () => {
    setPan({ x: 0, y: 0 });
    if (viewMode === '2d') {
      setZoom(getResponsiveZoom(1, '2d'));
    } else {
      handlePresetChange('isometric');
    }
  };

  // 2D Pan Pointer Handlers (Three.js OrbitControls handles 3D mode)
  const handlePointerDown = (e) => {
    if (viewMode === '3d') return; // Three.js handles 3D gestures
    if (e.target.closest('button, input, a, select, [role="button"]')) return;
    if (e.pointerType !== 'touch' && e.button !== 0 && e.button !== 1 && e.button !== 2) return;

    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startPan = panRef.current;

    isDraggingRef.current = true;
    setIsCursorGrabbing(true);

    const handlePointerMove = (moveEv) => {
      if (!isDraggingRef.current) return;
      const dx = moveEv.clientX - startX;
      const dy = moveEv.clientY - startY;

      setPan({
        x: Math.round(startPan.x + dx),
        y: Math.round(startPan.y + dy),
      });
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
      setIsCursorGrabbing(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  const handleCanvasClick = (e) => {
    // In 2D mode, allow clicking nodes without triggering accidental mode shifts
  };

  // Dedicated non-passive wheel listener attached to canvasRef
  // Only zooms when Ctrl or Cmd is held (or trackpad pinch-zoom),
  // otherwise lets the page scroll normally without any jumping or unwanted zooming!
  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const onWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomDelta = e.deltaY * -0.0015;
        setZoom((prev) => Math.max(0.65, Math.min(1.5, parseFloat((prev + zoomDelta).toFixed(2)))));
      }
      // If Ctrl/Cmd is not held, do NOT preventDefault and do NOT zoom!
      // This allows the user to freely scroll up and down the page without any conflict!
    };

    canvasEl.addEventListener('wheel', onWheel, { passive: false });
    return () => canvasEl.removeEventListener('wheel', onWheel);
  }, []);

  // Step-by-Step Controllable Probe Tracer Mechanics
  // Port coordinates are anchored strictly on outer boundary sockets (NEVER over card text)
  const waypoints = [
    {
      id: 1,
      title: '1. Ingestion',
      component: 'Client Edge Gateway',
      route: 'HTTP GET /api/v1/workload',
      delta: '0.0ms',
      total: '0.0ms',
      action: 'Client fires HTTP request; TLS handshake initiated at ingress perimeter.',
      cx: 210,
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
      cx: 415,
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
      cy: 245,
    },
    {
      id: 4,
      title: '4. Telemetry',
      component: 'k8shorizmetrics Harvester',
      route: 'cAdvisor Daemon Scrape',
      delta: '+14.2ms',
      total: '32.4ms',
      action: 'Pod CPU/Memory scraped; unready pods filtered; moving window buffer updated.',
      cx: 675,
      cy: 410,
    },
    {
      id: 5,
      title: '5. Models Brain',
      component: 'PHPA Parallel Evaluator & MAX Arbiter',
      route: 'Parallel Model Max Synthesis',
      delta: '+12.7ms',
      total: '45.1ms',
      action: `Dispatched across 4 individual forecasting models. MAX Arbiter selected ${winningModel} (${maxVal} replicas).`,
      cx: 1080,
      cy: 310,
    },
    {
      id: 6,
      title: '6. Scale API',
      component: 'Kubernetes ScaleClient',
      route: 'PATCH /scale Subresource',
      delta: '+12.9ms',
      total: '58.0ms',
      action: `Deployment scale subresource patched to ${actualPods} pods. Control loop closed!`,
      cx: 980,
      cy: 120,
    },
  ];

  // Auto-play probe stepping & continuous progress driven by requestAnimationFrame
  useEffect(() => {
    if (!isProbePlaying || probeHop === 0) return;

    let animId;
    let lastTime = performance.now();
    const hopDuration = Math.max(350, 1400 / probeSpeed);

    const stepFrame = (now) => {
      const delta = now - lastTime;
      lastTime = now;

      setProbeProgress((prev) => {
        const next = prev + delta / hopDuration;
        if (next >= 1) {
          if (probeHop >= 6) {
            setIsProbePlaying(false);
            return 1;
          } else {
            setProbeHop((h) => h + 1);
            return 0;
          }
        }
        return next;
      });

      animId = requestAnimationFrame(stepFrame);
    };

    animId = requestAnimationFrame(stepFrame);
    return () => cancelAnimationFrame(animId);
  }, [isProbePlaying, probeHop, probeSpeed]);

  const handleStartProbe = () => {
    setProbeHop(1);
    setProbeProgress(0);
    setIsProbePlaying(true);
    setActivePodTarget(Math.floor(Math.random() * Math.min(6, actualPods)) + 1);
  };

  const handlePauseProbe = () => {
    setIsProbePlaying(false);
  };

  const handleResumeProbe = () => {
    if (probeHop >= 6) {
      setProbeHop(1);
      setProbeProgress(0);
    }
    setIsProbePlaying(true);
  };

  const handleNextStep = () => {
    setIsProbePlaying(false);
    setProbeHop((prev) => Math.min(6, prev + 1));
    setProbeProgress(0.5);
  };

  const handlePrevStep = () => {
    setIsProbePlaying(false);
    setProbeHop((prev) => Math.max(1, prev - 1));
    setProbeProgress(0.5);
  };

  const handleResetProbe = () => {
    setIsProbePlaying(false);
    setProbeHop(0);
    setProbeProgress(0);
  };

  const currentWaypoint = waypoints.find((w) => w.id === probeHop);

  // Precise mathematical interpolation of the 2D probe packet position
  const probeCoord = useMemo(() => {
    const t = Math.max(0, Math.min(1, probeProgress));
    switch (probeHop) {
      case 1: // Ingestion: (210, 120) -> (240, 120)
        return { cx: 210 + 30 * t, cy: 120 };
      case 2: // Ingress: (415, 120) -> (445, 120)
        return { cx: 415 + 30 * t, cy: 120 };
      case 3: // Pod Workload: (560, 245) -> (560, 340)
        return { cx: 560, cy: 245 + 95 * t };
      case 4: // Telemetry -> Models
        if (t < 0.35) {
          const subT = t / 0.35;
          return { stage: 'trunk', cx: 675 + 35 * subT, cy: 410 };
        } else {
          const subT = (t - 0.35) / 0.65;
          return {
            stage: 'branches',
            cx: 710 + 35 * subT,
            ys: [292.5, 382.5, 472.5, 562.5],
          };
        }
      case 5: // Models -> MAX Arbiter -> Scale Actuator
        if (t < 0.35) {
          const subT = t / 0.35;
          return {
            stage: 'modelOutputs',
            cx: 915 + 30 * subT,
            ys: [292.5, 382.5, 472.5, 562.5],
          };
        } else if (t < 0.55) {
          const subT = (t - 0.35) / 0.2;
          return { stage: 'arbiterInfeed', cx: 945 + 30 * subT, cy: 427.5 };
        } else {
          const subT = (t - 0.55) / 0.45;
          return { stage: 'actuatorAscend', cx: 1080, cy: 310 - 120 * subT };
        }
      case 6: // Scale API: (980, 120) -> (825, 120)
        return { cx: 980 - 155 * t, cy: 120, atDestination: t > 0.85 };
      default:
        return null;
    }
  }, [probeHop, probeProgress]);

  // Mock Pods List for deep container diagnostics tab
  const containerPods = useMemo(() => {
    return Array.from({ length: actualPods }).map((_, i) => {
      const isPrewarmed = i >= reactiveHpa && i < actualPods;
      const isSpikeLoad = isSpiking && i < 8;
      const baseCpu = isSpikeLoad ? 88 + (i % 5) * 2 : 45 + (i % 7) * 3;
      const memMb = Math.round(180 + (i % 4) * 18 + (rps / 10));
      return {
        id: `pod-web-${String(i + 1).padStart(2, '0')}`,
        ip: `10.244.1.${10 + i}`,
        status: 'Running',
        restarts: i === 1 ? 1 : 0,
        age: `${Math.max(1, 14 - Math.floor(i / 2))}m`,
        cpu: Math.min(100, baseCpu),
        mem: memMb,
        isPrewarmed,
        isTargeted: probeHop === 3 && i === activePodTarget - 1,
      };
    });
  }, [actualPods, reactiveHpa, isSpiking, rps, probeHop, activePodTarget]);

  // Stages definition for cards and inspector
  const stages = [
    {
      id: 0,
      name: 'Client Edge Ingestion',
      subtitle: 'HTTP/gRPC Ingress Stream',
      icon: Activity,
      color: 'cyan',
      description:
        'External user workloads generate continuous HTTP requests following a diurnal cyclic curve combined with stochastic Poisson arrival bursts.',
      formula: '\\lambda(t) = \\bar{\\lambda} + A \\sin\\left(\\frac{2\\pi t}{T}\\right) + \\xi(t)',
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
      formula: 'P95 \\, \\text{Latency} \\approx L_0 + \\beta \\left( \\frac{\\lambda(t)}{N_{actual}(t) \\cdot C_{pod}} \\right)',
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
      formula: 'U_{cpu}(t) = \\min\\left(100\\%, \\; \\frac{\\lambda(t)}{N_{actual}(t) \\cdot 25} \\times 60\\%\\right)',
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
      formula: 'R_{raw} = \\left\\lceil N_{current} \\times \\frac{\\text{CurrentCPU}}{\\text{TargetCPU (60%)}} \\right\\rceil',
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
      formula: 'N_{target} = \\max\\left( R_{hpa}, \\; \\hat{y}_{linear}, \\; \\hat{y}_{hw}, \\; \\hat{y}_{lstm} \\right)',
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
      formula: 'N_{actuated} = \\text{clamp}\\left(\\min=2, \\; \\max=30, \\; N_{target}\\right)',
      internals: {
        'Target Replicas Applied': `${actualPods} Replicas`,
        'Downscale Stabilization': '300s Stabilization Window',
        'Min / Max Bounds': '2 Min / 30 Max Pods',
        'Scale Client API': 'PATCH /apis/apps/v1/namespaces/default/deployments/web-workload/scale',
      },
      yaml: `PATCH /apis/apps/v1/namespaces/default/deployments/web-workload/scale\nContent-Type: application/merge-patch+json\n\n{\n  "spec": {\n    "replicas": ${actualPods}\n  }\n}`,
    },
  ];

  // Helper renderer for each Stage's Real-Time Visual Architecture Diagram
  const renderStageDiagram = () => {
    switch (selectedStage) {
      case 0: // Client Edge Ingestion
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold font-mono text-xs">
                  <Activity className="w-4 h-4" />
                  <span>REAL-TIME TRAFFIC ARRIVAL & INGRESS WAVE DIAGRAM</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                  {rps} RPS Live
                </span>
              </div>

              {/* Animated Wave SVG */}
              <div className="relative h-28 w-full bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#71717a" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#71717a" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  {/* Diurnal Waveform Area */}
                  <path
                    d={`M 0 60 Q 125 ${isSpiking ? 10 : 30}, 250 55 T 500 ${isSpiking ? 15 : 60} L 500 100 L 0 100 Z`}
                    fill="url(#waveGrad)"
                  />
                  {/* Waveform Stroke */}
                  <path
                    d={`M 0 60 Q 125 ${isSpiking ? 10 : 30}, 250 55 T 500 ${isSpiking ? 15 : 60}`}
                    fill="none"
                    stroke="#52525b"
                    strokeWidth="2"
                  />
                  {/* Scanning Cursor */}
                  <line x1="250" y1="0" x2="250" y2="100" className="stroke-zinc-900 dark:stroke-zinc-100" strokeWidth="1.5" strokeDasharray="3 3" />
                  <circle cx="250" cy={isSpiking ? 32 : 55} r="4" className="fill-zinc-900 dark:fill-zinc-100" />
                  <circle cx="250" cy={isSpiking ? 32 : 55} r="4" fill="none" className="stroke-zinc-900 dark:stroke-zinc-100" strokeWidth="1.5">
                    <animate attributeName="r" values="4; 10" dur="1.2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8; 0" dur="1.2s" repeatCount="indefinite" />
                  </circle>
                </svg>
                <div className="absolute top-2 right-2 text-[10px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-100/90 dark:bg-zinc-800/90 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                  {isSpiking ? '💥 Poisson Flash Crowd Surge Active' : '🌊 Diurnal Base Sine Wave + Noise'}
                </div>
              </div>

              {/* Architectural Block Diagram */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-zinc-500 dark:text-zinc-400 text-[10px]">1. Client Pool</div>
                  <div className="text-zinc-900 dark:text-zinc-100 font-bold mt-1">Web & API Clients</div>
                  <div className="text-zinc-600 dark:text-zinc-400 text-[10px] mt-0.5">{Math.round(rps * 1.8)} Connections</div>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 shadow-xs">
                  <div className="text-zinc-700 dark:text-zinc-300 text-[10px] flex items-center justify-center gap-1">
                    <span>2. TLS Edge Gateway</span>
                  </div>
                  <div className="text-zinc-900 dark:text-zinc-100 font-bold mt-1">ALB / NodePort</div>
                  <div className="text-emerald-600 dark:text-emerald-400 text-[10px] mt-0.5">TLS 1.3 (~1.2ms)</div>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-zinc-500 dark:text-zinc-400 text-[10px]">3. Target Stream</div>
                  <div className="text-zinc-900 dark:text-zinc-100 font-bold mt-1">Envoy Reverse Proxy</div>
                  <div className="text-zinc-600 dark:text-zinc-400 text-[10px] mt-0.5">HTTP/2.0 Stream</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 1: // Ingress Router & Envoy
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold font-mono text-xs">
                  <Network className="w-4 h-4" />
                  <span>ENVOY REVERSE PROXY & WEIGHTED ROUTING DIAGRAM</span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${p95 > 100 ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'}`}>
                  P95: {p95}ms (SLA: 100ms)
                </span>
              </div>

              {/* Envoy Router Dispatch Topology */}
              <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-zinc-500 dark:text-zinc-400">Incoming Ingress Stream</span>
                  <span className="text-zinc-700 dark:text-zinc-300 font-medium">Weighted Round-Robin Multiplexing</span>
                </div>

                <div className="space-y-2">
                  {Array.from({ length: Math.min(4, actualPods) }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-mono">
                      <span className="w-16 text-zinc-500 dark:text-zinc-400 text-[10px]">Lane {i + 1}:</span>
                      <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full"
                          style={{ width: `${100 / Math.min(4, actualPods)}%` }}
                        />
                      </div>
                      <span className="text-zinc-600 dark:text-zinc-400 w-28 text-right text-[10px]">
                        pod-web-0{i + 1} ({Math.round(rps / actualPods)} req/s)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500 dark:text-zinc-400 text-[10px]">Circuit Breaker Status:</span>
                  <div className="text-emerald-600 dark:text-emerald-400 font-bold mt-1">Closed (Healthy Traffic)</div>
                  <span className="text-zinc-500 dark:text-zinc-400 text-[10px]">0 Pod Ejections</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500 dark:text-zinc-400 text-[10px]">Keep-Alive Pool:</span>
                  <div className="text-zinc-900 dark:text-zinc-100 font-bold mt-1">2,048 Max Sockets</div>
                  <span className="text-zinc-500 dark:text-zinc-400 text-[10px]">Zero Handshake Latency</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 2: // Kubernetes Workload Pods Cluster
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold font-mono text-xs">
                  <Server className="w-4 h-4" />
                  <span>KUBERNETES DATA PLANE POD REPLICA SET ARCHITECTURE</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                  {actualPods} Active Pods
                </span>
              </div>

              {/* Data Plane Rack View */}
              <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mb-2 flex items-center justify-between">
                  <span>Cluster Deployment: default/web-workload</span>
                  <span>Target CPU: 60% • Cluster Avg: {cpu}%</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {containerPods.slice(0, 8).map((p) => (
                    <div
                      key={p.id}
                      className={`p-2 rounded-lg border text-[10px] font-mono ${
                        p.isPrewarmed
                          ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-400 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100'
                          : p.cpu > 80
                          ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                          : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{p.id}</span>
                        {p.isPrewarmed && (
                          <span className="text-[8px] px-1 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium">
                            LSTM
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden my-1">
                        <div
                          className={`h-full ${p.cpu > 80 ? 'bg-rose-500' : 'bg-zinc-900 dark:bg-zinc-100'}`}
                          style={{ width: `${p.cpu}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-zinc-500 dark:text-zinc-400">
                        <span>CPU: {p.cpu}%</span>
                        <span>{p.mem}MB</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500 dark:text-zinc-400 text-[10px]">CPU Limit:</span>
                  <div className="text-zinc-900 dark:text-zinc-100 font-bold">500m</div>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500 dark:text-zinc-400 text-[10px]">CPU Request:</span>
                  <div className="text-zinc-900 dark:text-zinc-100 font-bold">250m</div>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500 dark:text-zinc-400 text-[10px]">Per-Pod Capacity:</span>
                  <div className="text-zinc-900 dark:text-zinc-100 font-bold">~25 RPS</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3: // Telemetry Harvester
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold font-mono text-xs">
                  <Layers className="w-4 h-4" />
                  <span>AUTONOMIC METRICS HARVESTING PIPELINE (cAdvisor & k8shorizmetrics)</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                  15s Scrape Cycle
                </span>
              </div>

              {/* 4-Step Scrape Flow Pipeline */}
              <div className="grid grid-cols-4 gap-2 text-xs font-mono text-center">
                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-zinc-900 dark:text-zinc-100 font-bold text-[11px]">Step 1: Scrape</div>
                  <div className="text-zinc-600 dark:text-zinc-300 mt-1">cAdvisor Daemon</div>
                  <div className="text-zinc-500 dark:text-zinc-400 text-[9px] mt-0.5">Kubelet /metrics</div>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-zinc-900 dark:text-zinc-100 font-bold text-[11px]">Step 2: Filter</div>
                  <div className="text-zinc-600 dark:text-zinc-300 mt-1">Unready Excluded</div>
                  <div className="text-zinc-500 dark:text-zinc-400 text-[9px] mt-0.5">0 Initializers filtered</div>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-zinc-900 dark:text-zinc-100 font-bold text-[11px]">Step 3: Buffer</div>
                  <div className="text-zinc-600 dark:text-zinc-300 mt-1">50-Step Window</div>
                  <div className="text-zinc-500 dark:text-zinc-400 text-[9px] mt-0.5">Sliding metric vector</div>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 shadow-xs">
                  <div className="text-zinc-900 dark:text-zinc-100 font-bold text-[11px]">Step 4: Dispatch</div>
                  <div className="text-zinc-800 dark:text-zinc-200 font-bold mt-1">Parallel Brain</div>
                  <div className="text-zinc-500 dark:text-zinc-400 text-[9px] mt-0.5">Piped to 4 Models</div>
                </div>
              </div>

              {/* Raw Replica Calculation Box */}
              <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400 text-[10px]">Calculated Raw Replica Demand:</span>
                  <div className="text-zinc-900 dark:text-zinc-100 font-bold mt-0.5">
                    ceil({actualPods} pods × {cpu}% / 60%) = <span className="text-emerald-600 dark:text-emerald-400">{reactiveHpa} pods</span>
                  </div>
                </div>
                <div className="text-right text-[10px] text-zinc-500 dark:text-zinc-400">
                  <span>Feed latency: <strong className="text-zinc-800 dark:text-zinc-200">12ms</strong></span>
                </div>
              </div>
            </div>
          </div>
        );

      case 4: // PHPA Parallel Models Brain (The Multi-Model Forecasting Matrix)
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold font-mono text-xs">
                  <Cpu className="w-4 h-4" />
                  <span>PARALLEL MULTI-MODEL FORECASTING MATRIX & DECISION CORE</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-semibold">
                  Strategy: DecisionType: Maximum
                </span>
              </div>

              {/* 4 Parallel Models Comparison Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {/* Model 1: Reactive HPA */}
                <div className={`p-3 rounded-lg border transition-all ${winningModel === 'Reactive HPA' ? 'bg-zinc-100 dark:bg-zinc-850 border-zinc-400 dark:border-zinc-600 shadow-sm' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">1. Reactive HPA</span>
                    {winningModel === 'Reactive HPA' && <span className="px-1.5 py-0.2 rounded text-[9px] bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold">WINNER</span>}
                  </div>
                  <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1 tabular-nums">
                    {reactiveHpa} <span className="text-xs font-normal text-zinc-400">replicas</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
                    Standard Kubernetes ratio rule. Evaluates lagging CPU load: ceil(N × CurrentCPU / TargetCPU).
                  </p>
                </div>

                {/* Model 2: Linear Regression */}
                <div className={`p-3 rounded-lg border transition-all ${winningModel === 'Linear' ? 'bg-zinc-100 dark:bg-zinc-850 border-zinc-400 dark:border-zinc-600 shadow-sm' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">2. Linear OLS</span>
                    {winningModel === 'Linear' && <span className="px-1.5 py-0.2 rounded text-[9px] bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold">WINNER</span>}
                  </div>
                  <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1 tabular-nums">
                    {linearPred} <span className="text-xs font-normal text-zinc-400">replicas</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
                    Ordinary Least Squares trend extrapolation on the 50-step metrics vector.
                  </p>
                </div>

                {/* Model 3: Holt-Winters */}
                <div className={`p-3 rounded-lg border transition-all ${winningModel === 'Holt-Winters' ? 'bg-zinc-100 dark:bg-zinc-850 border-zinc-400 dark:border-zinc-600 shadow-sm' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">3. Holt-Winters</span>
                    {winningModel === 'Holt-Winters' && <span className="px-1.5 py-0.2 rounded text-[9px] bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold">WINNER</span>}
                  </div>
                  <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1 tabular-nums">
                    {hwPred} <span className="text-xs font-normal text-zinc-400">replicas</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
                    Triple exponential smoothing capturing diurnal seasonal cycles and baseline drift.
                  </p>
                </div>

                {/* Model 4: 2-Layer LSTM */}
                <div className={`p-3 rounded-lg border transition-all ${winningModel === 'LSTM' ? 'bg-zinc-100 dark:bg-zinc-850 border-zinc-900 dark:border-zinc-100 shadow-sm' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                      <span>4. 2-Layer LSTM</span>
                    </span>
                    {winningModel === 'LSTM' && <span className="px-1.5 py-0.2 rounded text-[9px] bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold">WINNER</span>}
                  </div>
                  <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1 tabular-nums">
                    {lstmPred} <span className="text-xs font-normal text-zinc-400">replicas</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
                    Deep recurrent lookahead neural network with 64 hidden units. Predicts flash surges 45s ahead of CPU tripwires.
                  </p>
                </div>
              </div>

              {/* The MAX Decision Synthesizer Gate */}
              <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-zinc-100 font-bold">
                    MAX
                  </div>
                  <div>
                    <div className="text-zinc-500 dark:text-zinc-400 text-[10px]">DecisionType: Maximum Envelope:</div>
                    <div className="text-zinc-900 dark:text-zinc-100 font-bold text-sm">
                      Actuating <span className="text-emerald-600 dark:text-emerald-400">{maxVal} Replicas</span> via {winningModel}
                    </div>
                  </div>
                </div>
                <div className="text-right text-[10px] text-zinc-500 dark:text-zinc-400">
                  <span>Preemptive lead time: <strong className="text-zinc-800 dark:text-zinc-200">+45s</strong></span>
                </div>
              </div>
            </div>
          </div>
        );

      case 5: // Scale Actuator
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold font-mono text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>KUBERNETES SCALECLIENT ACTUATION & FEEDBACK LOOP</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                  Loop Closed
                </span>
              </div>

              {/* 3-Step Actuation Sequence */}
              <div className="grid grid-cols-3 gap-2 text-xs font-mono text-center">
                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-zinc-900 dark:text-zinc-100 font-bold text-[11px]">1. Stabilization</div>
                  <div className="text-zinc-600 dark:text-zinc-300 mt-1">300s Cooldown</div>
                  <div className="text-zinc-500 dark:text-zinc-400 text-[9px] mt-0.5">Prevents thrashing</div>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-zinc-900 dark:text-zinc-100 font-bold text-[11px]">2. Boundary Clamp</div>
                  <div className="text-zinc-900 dark:text-zinc-100 font-bold mt-1">[2, 30] Pods</div>
                  <div className="text-zinc-500 dark:text-zinc-400 text-[9px] mt-0.5">Min/Max limits</div>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 shadow-xs">
                  <div className="text-zinc-900 dark:text-zinc-100 font-bold text-[11px]">3. REST PATCH</div>
                  <div className="text-zinc-800 dark:text-zinc-200 font-bold mt-1">K8s API Server</div>
                  <div className="text-emerald-600 dark:text-emerald-400 text-[9px] mt-0.5">200 OK Applied</div>
                </div>
              </div>

              {/* Live JSON Merge Patch Payload */}
              <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 font-mono text-xs">
                <span className="text-zinc-500 dark:text-zinc-400 text-[10px] block mb-1">PATCH /apis/apps/v1/namespaces/default/deployments/web-workload/scale:</span>
                <pre className="text-zinc-800 dark:text-zinc-200 text-[11px]">
                  {`{ "spec": { "replicas": ${actualPods} } }`}
                </pre>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn select-none">
      {/* 1. TOP CONTROL DOCK: View Mode Toggle + Camera Angles + Real-Time Live Traffic Deck */}
      <div className="raised-card rounded-lg p-4 lg:p-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm relative overflow-hidden">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-wide">
                PHPA Architectural Pipeline Visualizer
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold">
                Live Interactive Lab
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Real-Time Autoscaling Architecture • All 4 Forecasting Models, MAX Arbiter & Cluster Actuation in Closed Loop.
            </p>
          </div>

          {/* Unified Perspective & Mode Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md p-1 text-xs font-mono shadow-sm max-w-full overflow-x-auto scrollbar-none">
              <button
                onClick={() => {
                  setViewMode('2d');
                  setZoom(getResponsiveZoom(1, '2d'));
                }}
                className={`px-3 py-1 rounded transition-all flex-shrink-0 cursor-pointer ${
                  viewMode === '2d'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-800 dark:text-zinc-100 font-semibold shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
                title="2D Crisp Architecture Schematic"
              >
                2D Architecture
              </button>

              <div className="w-[1px] h-4 bg-zinc-300 dark:bg-zinc-700 mx-1.5 flex-shrink-0"></div>

              <button
                onClick={() => {
                  setViewMode('3d');
                  handlePresetChange('isometric');
                }}
                className={`px-2.5 py-1 rounded transition-colors flex-shrink-0 cursor-pointer ${
                  viewMode === '3d' && viewPreset === 'isometric'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-800 dark:text-zinc-100 font-semibold shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
                title="3D Isometric View (44°)"
              >
                3D Isometric
              </button>
              <button
                onClick={() => {
                  setViewMode('3d');
                  handlePresetChange('core');
                }}
                className={`px-2.5 py-1 rounded transition-colors flex-shrink-0 cursor-pointer ${
                  viewMode === '3d' && viewPreset === 'core'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-800 dark:text-zinc-100 font-semibold shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
                title="PHPA Core Control Plane Focus"
              >
                PHPA Core
              </button>
              <button
                onClick={() => {
                  setViewMode('3d');
                  handlePresetChange('front');
                }}
                className={`px-2.5 py-1 rounded transition-colors flex-shrink-0 cursor-pointer ${
                  viewMode === '3d' && viewPreset === 'front'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-800 dark:text-zinc-100 font-semibold shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
                title="3D Front Flow View (12°)"
              >
                Front (12°)
              </button>
              <button
                onClick={() => {
                  setViewMode('3d');
                  handlePresetChange('top');
                }}
                className={`px-2.5 py-1 rounded transition-colors flex-shrink-0 cursor-pointer ${
                  viewMode === '3d' && viewPreset === 'top'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-800 dark:text-zinc-100 font-semibold shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
                title="3D Top-Down View (68°)"
              >
                Top-Down (68°)
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Prominent Zoom In / Out Controls */}
              <div className="flex items-center bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md p-1 text-xs font-mono shadow-sm">
                <button
                  onClick={() => setZoom((prev) => Math.max(0.15, parseFloat((prev - 0.05).toFixed(2))))}
                  className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                  title="Zoom Out (-5%)"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    setZoom(getResponsiveZoom(1.0, viewMode));
                    setPan({ x: 0, y: 0 });
                  }}
                  className="px-2 py-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-[11px] font-bold text-zinc-800 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white transition-colors min-w-[44px] text-center cursor-pointer"
                  title="Click to auto-fit diagram to screen"
                >
                  {Math.round(zoom * 100)}%
                </button>

                <button
                  onClick={() => setZoom((prev) => Math.min(1.85, parseFloat((prev + 0.05).toFixed(2))))}
                  className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                  title="Zoom In (+5%)"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => {
                  if (viewMode === '2d') {
                    setViewMode('3d');
                    setViewPreset('custom');
                    setPitch(44);
                    setYaw(-18);
                    setRoll(8);
                    setZoom(getResponsiveZoom(1, '3d'));
                  }
                  setIsOrbiting((prev) => !prev);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-mono font-medium transition-all cursor-pointer ${
                  viewMode === '3d' && isOrbiting
                    ? 'bg-zinc-900 text-white dark:bg-zinc-800 dark:text-zinc-100 border-zinc-900 dark:border-zinc-700 shadow-sm'
                    : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
                title={viewMode === '2d' ? 'Click to enter 3D Auto-Orbit' : 'Toggle slow 3D Auto-Orbit'}
              >
                <Compass className={`w-3.5 h-3.5 ${isOrbiting && viewMode === '3d' ? 'animate-spin' : ''}`} />
                <span>{isOrbiting && viewMode === '3d' ? 'Orbiting...' : 'Auto-Orbit'}</span>
              </button>

              <button
                onClick={handleResetCamera}
                className="p-1.5 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer"
                title="Fit to Screen & Reset View"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Embedded Live Traffic Deck */}
        <div className="mt-4 pt-3.5 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-4 flex items-center gap-3">
            <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 flex-shrink-0">
              <Sliders className="w-3.5 h-3.5" />
              <span>Live Traffic:</span>
            </span>
            <input
              type="range"
              min="50"
              max="500"
              step="10"
              value={rps}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (setManualRps) setManualRps(val);
                if (setTrafficMode) setTrafficMode('manual');
              }}
              className="w-full accent-zinc-900 dark:accent-zinc-100 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
            />
            <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 w-16 text-right">
              {rps} RPS
            </span>
          </div>

          <div className="md:col-span-5 flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => {
                if (setManualRps) setManualRps(90);
                if (setTrafficMode) setTrafficMode('manual');
              }}
              className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 text-[11px] font-mono text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Calm (90)
            </button>
            <button
              onClick={() => {
                if (setManualRps) setManualRps(280);
                if (setTrafficMode) setTrafficMode('manual');
              }}
              className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 text-[11px] font-mono text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Peak (280)
            </button>
            <button
              onClick={() => onInjectSpike && onInjectSpike(5.0)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 text-white dark:bg-zinc-800 dark:text-zinc-100 border border-zinc-900 dark:border-zinc-700 text-[11px] font-mono font-semibold transition-colors shadow-sm"
            >
              <Flame className="w-3 h-3 text-rose-500 animate-pulse" />
              <span>5x Surge</span>
            </button>
            <button
              onClick={() => {
                if (setTrafficMode) setTrafficMode('auto');
              }}
              className={`px-2 py-1 rounded border text-[11px] font-mono transition-colors ${
                trafficMode === 'auto'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-800 dark:text-zinc-100 border-zinc-900 dark:border-zinc-700 font-semibold'
                  : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Auto Diurnal
            </button>
          </div>

          <div className="md:col-span-3 flex items-center justify-end gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
            <span>
              Pods: <strong className="text-zinc-900 dark:text-zinc-100">{actualPods}</strong>
            </span>
            <span>•</span>
            <span>
              P95: <strong className={`tabular-nums ${p95 > 100 ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-900 dark:text-zinc-100'}`}>{p95}ms</strong>
            </span>
            <span>•</span>
            <span>
              Engine: <strong className="text-zinc-900 dark:text-zinc-100">MAX({winningModel})</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. STEP-BY-STEP CONTROLLABLE PROBE TRACER BAR */}
      <div className="raised-card rounded-lg p-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 max-w-full">
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1.5 flex-shrink-0">
            <Zap className="w-3 h-3 text-zinc-700 dark:text-zinc-300" />
            <span>STEP-BY-STEP PROBE</span>
          </span>

          {probeHop === 0 ? (
            <button
              onClick={handleStartProbe}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white dark:text-zinc-100 border border-zinc-900 dark:border-zinc-700 text-xs font-semibold font-mono transition-all shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Trace</span>
            </button>
          ) : isProbePlaying ? (
            <button
              onClick={handlePauseProbe}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-semibold font-mono transition-colors"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={handleResumeProbe}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white dark:text-zinc-100 border border-zinc-900 dark:border-zinc-700 text-xs font-semibold font-mono transition-colors shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume</span>
            </button>
          )}

          <button
            onClick={handlePrevStep}
            disabled={probeHop <= 1}
            className="p-1 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Previous Stage"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleNextStep}
            disabled={probeHop >= 6 || probeHop === 0}
            className="p-1 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Next Stage"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetProbe}
            className="p-1 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            title="Reset Probe"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md p-0.5 text-[10px] font-mono">
            {[0.5, 1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => setProbeSpeed(spd)}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  probeSpeed === spd ? 'bg-zinc-900 text-white dark:bg-zinc-800 dark:text-zinc-100 font-bold shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
                title={`Set visual propagation & probe velocity to ${spd}x`}
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
                  setProbeProgress(0.5);
                }}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 font-medium ${
                  isActive
                    ? wp.id >= 5
                      ? 'bg-emerald-600 text-white font-bold border border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                      : 'bg-amber-500 text-white font-bold border border-amber-600 shadow-md ring-2 ring-amber-500/30'
                    : isPassed
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700'
                    : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-500 border border-zinc-200 dark:border-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                }`}
              >
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                )}
                <span className={isActive ? 'font-bold' : ''}>{wp.id}.</span>
                <span>{wp.title.split('. ')[1]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. MAIN CANVAS VIEWPORT (3D Spatial OR 2D Crisp Flow Architecture) */}
      <div
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onClick={handleCanvasClick}
        onDoubleClick={handleResetCamera}
        className={`relative w-full rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-100 dark:bg-zinc-950 overflow-hidden shadow-sm raised-card min-h-[480px] sm:min-h-[580px] md:min-h-[700px] flex items-center justify-center touch-none select-none ${
          viewMode === '3d' ? (isCursorGrabbing ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-pointer'
        }`}
        style={{
          WebkitFontSmoothing: 'antialiased',
          textRendering: 'optimizeLegibility',
        }}
      >
        <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-30">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-zinc-300/30 dark:bg-zinc-700/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-zinc-400/20 dark:bg-zinc-800/10 rounded-full blur-[120px]" />
        </div>

        {/* Top-Left Instructions & Mode Status HUD */}
        {viewMode === '2d' ? (
          <button
            onClick={() => {
              setViewMode('3d');
              handlePresetChange('isometric');
            }}
            className="absolute top-2 left-2 sm:top-3 sm:left-4 z-30 pointer-events-auto flex items-center gap-1.5 bg-white/95 dark:bg-zinc-900/90 border border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-mono text-zinc-800 dark:text-zinc-200 shadow-md backdrop-blur-md cursor-pointer transition-all hover:scale-105"
            title="Click to enter 3D View"
          >
            <Compass className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">2D Schematic</span>
            <span className="text-zinc-400 dark:text-zinc-500">•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold underline decoration-emerald-500/50">
              Click for 3D View
            </span>
          </button>
        ) : (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-4 z-20 pointer-events-none flex items-center gap-1.5 sm:gap-2 bg-white/95 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-700/80 px-2 sm:px-2.5 py-1 rounded-md text-[9px] sm:text-[10px] font-mono text-zinc-600 dark:text-zinc-400 shadow-sm backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              3D {viewPreset === 'isometric' ? 'Isometric (44°)' : viewPreset === 'core' ? 'PHPA Core Focus' : viewPreset === 'front' ? 'Front (12°)' : viewPreset === 'top' ? 'Top-Down (68°)' : 'Interactive'}
            </span>
            <span className="hidden sm:inline text-zinc-400">•</span>
            <span className="hidden sm:inline">Drag to Orbit / Scroll to Zoom / Click Nodes to Inspect</span>
          </div>
        )}

        {/* Top-Center Active Stage Announcement Pill */}
        {probeHop > 0 && currentWaypoint && (
          <div className="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none hidden sm:flex items-center gap-2 bg-zinc-900/90 text-white dark:bg-zinc-900/95 dark:text-zinc-100 border border-amber-500/50 dark:border-amber-400/40 px-3 py-1 rounded-full text-[11px] font-mono shadow-lg backdrop-blur-md">
            <span className={`w-2 h-2 rounded-full ${probeHop >= 5 ? 'bg-emerald-400' : 'bg-amber-400'} animate-ping`} />
            <span className={`font-bold ${probeHop >= 5 ? 'text-emerald-400' : 'text-amber-400'}`}>
              HOP {probeHop}/6
            </span>
            <span className="text-zinc-500">•</span>
            <span className="font-semibold text-white tracking-wide">
              {currentWaypoint.title.split('. ')[1] || currentWaypoint.title}
            </span>
            <span className="hidden md:inline text-zinc-500">•</span>
            <span className="hidden md:inline text-zinc-300 text-[10px]">
              {currentWaypoint.component}
            </span>
          </div>
        )}

        {/* Dedicated Tactile Zoom & Tilt Controls (Top-Right) */}
        <div className="absolute top-2 right-2 sm:top-3 sm:right-4 z-30 pointer-events-auto flex items-center gap-1 sm:gap-1.5 bg-white/95 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-700/80 rounded-lg p-0.5 sm:p-1 shadow-md backdrop-blur-md text-xs font-mono text-zinc-700 dark:text-zinc-300">
          <span className="text-[9px] sm:text-[10px] text-zinc-500 dark:text-zinc-400 px-1 sm:px-1.5 py-0.5 font-bold">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((prev) => Math.max(0.15, parseFloat((prev - 0.05).toFixed(2))))}
            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            title="Zoom Out (-5%)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom((prev) => Math.min(1.85, parseFloat((prev + 0.05).toFixed(2))))}
            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            title="Zoom In (+5%)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setZoom(getResponsiveZoom(1.0, viewMode));
              setPan({ x: 0, y: 0 });
            }}
            className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[9px] sm:text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            title="Fit Diagram to Screen"
          >
            Fit
          </button>

          {viewMode === '3d' && (
            <div className="hidden sm:flex items-center gap-0.5">
              <div className="w-[1px] h-4 bg-zinc-200 dark:bg-zinc-700 mx-0.5" />
              <button
                onClick={() => setPitch((p) => Math.max(12, p - 6))}
                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Tilt Up"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPitch((p) => Math.min(78, p + 6))}
                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Tilt Down"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setYaw((y) => Math.max(-80, y - 10))}
                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Turn Left"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setYaw((y) => Math.min(80, y + 10))}
                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Turn Right"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Live Trace Packet Details Toast */}
        <AnimatePresence>
          {currentWaypoint && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-3 left-2 right-2 sm:left-4 sm:right-auto z-30 pointer-events-auto max-w-[calc(100%-16px)] sm:max-w-sm"
            >
              <div className="bg-white/95 dark:bg-zinc-900/95 border border-zinc-300 dark:border-zinc-700 rounded-xl p-3 shadow-xl text-xs space-y-1.5 backdrop-blur-md">
                <div className="flex items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-100 font-mono text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>HOP {currentWaypoint.id}/6: {currentWaypoint.component}</span>
                  </div>
                  <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-medium">
                    +{currentWaypoint.delta}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
                  Route: <span className="text-zinc-800 dark:text-zinc-200">{currentWaypoint.route}</span>
                </div>
                <p className="text-[10.5px] text-zinc-600 dark:text-zinc-300 leading-snug">
                  {currentWaypoint.action}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Viewport: Real WebGL 3D Canvas OR 2D Crisp Schematic */}
        {viewMode === '3d' ? (
          <div className="relative w-full h-[480px] sm:h-[580px] md:h-[700px] rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-950 transition-colors duration-200">
            <React.Suspense
              fallback={
                <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 font-mono text-xs gap-3">
                  <div className="w-6 h-6 border-2 border-zinc-400 dark:border-zinc-700 border-t-zinc-900 dark:border-t-zinc-200 rounded-full animate-spin" />
                  <span>Loading WebGL 3D Pipeline Scene...</span>
                </div>
              }
            >
              <Pipeline3DCanvas
                theme={theme}
                viewPreset={viewPreset}
                isOrbiting={isOrbiting}
                isProbePlaying={isProbePlaying}
                probeHop={probeHop}
                probeSpeed={probeSpeed}
                onProbeHopChange={setProbeHop}
                selectedStage={selectedStage}
                onSelectStage={(id) => {
                  setSelectedStage(id);
                  setIsDrawerOpen(true);
                }}
                latest={latest}
                isSpiking={isSpiking}
              />
            </React.Suspense>
          </div>
        ) : (
          <div
            className="relative w-full h-[480px] sm:h-[580px] md:h-[700px] flex items-center justify-center overflow-hidden transition-transform duration-100 ease-out"
          >
            <div
              className="absolute transition-transform duration-150 ease-out flex-shrink-0"
              style={{
                width: '1240px',
                minWidth: '1240px',
                maxWidth: '1240px',
                height: '650px',
                minHeight: '650px',
                maxHeight: '650px',
                left: '50%',
                top: '50%',
                marginLeft: '-620px',
                marginTop: '-325px',
                transformOrigin: '50% 50%',
                transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${zoom})`,
              }}
            >
            {/* Grid Floor */}
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none border border-zinc-300 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-950/60"
              style={{
                transform: viewMode === '3d' ? 'translateZ(-35px)' : 'none',
                backgroundImage: `
                  linear-gradient(to right, currentColor 1px, transparent 1px),
                  linear-gradient(to bottom, currentColor 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
                color: 'rgba(120, 120, 128, 0.1)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.05) inset',
              }}
            >
              <div className="absolute inset-0 rounded-3xl border border-zinc-200 dark:border-zinc-800 pointer-events-none" />
            </div>

            {/* SVG Circuit Highway */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
              style={{ transform: viewMode === '3d' ? 'translateZ(5px)' : 'none' }}
            >
              <defs>
                <filter id="glow-subtle" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="probe-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Highway Paths (Baseline Wires) */}
              {/* Wire 1: Edge to Ingress (210, 120) to (240, 120) */}
              <path d="M 210 120 L 240 120" fill="none" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="2" strokeDasharray="4 3" />
              
              {/* Wire 2: Ingress to Pod Cluster (415, 120) to (445, 120) */}
              <path d="M 415 120 L 445 120" fill="none" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="2" />
              
              {/* Wire 3: Pod Cluster bottom (560, 245) down to Telemetry top (560, 340) */}
              <path d="M 560 245 L 560 340" fill="none" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="2" strokeDasharray="5 3" />
              
              {/* Wire 4: Telemetry (675, 410) into Parallel Model Infeed Bus */}
              <path d="M 675 410 L 710 410" fill="none" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="2" />
              {/* Vertical Distribution Trunk */}
              <path d="M 710 292.5 L 710 562.5" fill="none" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="2" />
              {/* Model Infeed Branches */}
              <path d="M 710 292.5 L 745 292.5" fill="none" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="2" />
              <path d="M 710 382.5 L 745 382.5" fill="none" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="2" />
              <path d="M 710 472.5 L 745 472.5" fill="none" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="2" />
              <path d="M 710 562.5 L 745 562.5" fill="none" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="2" />

              {/* Wire 5: Model Prediction Outfeed Branches into MAX Envelope Collector Bus */}
              <path d="M 915 292.5 L 945 292.5" fill="none" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="2" />
              <path d="M 915 382.5 L 945 382.5" fill="none" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="2" />
              <path d="M 915 472.5 L 945 472.5" fill="none" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="2" />
              <path d="M 915 562.5 L 945 562.5" fill="none" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="2" />
              {/* Vertical Convergence Trunk */}
              <path d="M 945 292.5 L 945 562.5" fill="none" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="2" />
              {/* Feeder into MAX Arbiter */}
              <path d="M 945 427.5 L 975 427.5" fill="none" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="2" />

              {/* Wire 6: MAX Arbiter recommendation straight UP into Scale Actuator (1080, 310) to (1080, 190) */}
              <path d="M 1080 310 L 1080 190" fill="none" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="2" strokeDasharray="5 3" />

              {/* Wire 7: Scale Actuator scale patch closing loop into Pod Cluster (980, 120) to (825, 120) */}
              <path d="M 980 120 L 825 120" fill="none" className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="2" strokeDasharray="4 3" />

              {/* Active Conduit Illumination when Probe is Active */}
              {probeHop === 1 && (
                <path d="M 210 120 L 240 120" fill="none" className="stroke-amber-500 dark:stroke-amber-400" strokeWidth="4" filter="url(#probe-glow)" />
              )}
              {probeHop === 2 && (
                <path d="M 415 120 L 445 120" fill="none" className="stroke-amber-500 dark:stroke-amber-400" strokeWidth="4" filter="url(#probe-glow)" />
              )}
              {probeHop === 3 && (
                <path d="M 560 245 L 560 340" fill="none" className="stroke-amber-500 dark:stroke-amber-400" strokeWidth="4" filter="url(#probe-glow)" />
              )}
              {probeHop === 4 && (
                <g filter="url(#probe-glow)">
                  <path d="M 675 410 L 710 410" fill="none" className="stroke-amber-500 dark:stroke-amber-400" strokeWidth="3.5" />
                  <path d="M 710 292.5 L 710 562.5" fill="none" className="stroke-amber-500 dark:stroke-amber-400" strokeWidth="3.5" />
                  <path d="M 710 292.5 L 745 292.5" fill="none" className="stroke-amber-500 dark:stroke-amber-400" strokeWidth="3" />
                  <path d="M 710 382.5 L 745 382.5" fill="none" className="stroke-amber-500 dark:stroke-amber-400" strokeWidth="3" />
                  <path d="M 710 472.5 L 745 472.5" fill="none" className="stroke-amber-500 dark:stroke-amber-400" strokeWidth="3" />
                  <path d="M 710 562.5 L 745 562.5" fill="none" className="stroke-amber-500 dark:stroke-amber-400" strokeWidth="3" />
                </g>
              )}
              {probeHop === 5 && (
                <g filter="url(#probe-glow)">
                  <path d="M 915 292.5 L 945 292.5" fill="none" className="stroke-emerald-500 dark:stroke-emerald-400" strokeWidth="3" />
                  <path d="M 915 382.5 L 945 382.5" fill="none" className="stroke-emerald-500 dark:stroke-emerald-400" strokeWidth="3" />
                  <path d="M 915 472.5 L 945 472.5" fill="none" className="stroke-emerald-500 dark:stroke-emerald-400" strokeWidth="3" />
                  <path d="M 915 562.5 L 945 562.5" fill="none" className="stroke-emerald-500 dark:stroke-emerald-400" strokeWidth="3" />
                  <path d="M 945 292.5 L 945 562.5" fill="none" className="stroke-emerald-500 dark:stroke-emerald-400" strokeWidth="3.5" />
                  <path d="M 945 427.5 L 975 427.5" fill="none" className="stroke-emerald-500 dark:stroke-emerald-400" strokeWidth="3.5" />
                  <path d="M 1080 310 L 1080 190" fill="none" className="stroke-emerald-500 dark:stroke-emerald-400" strokeWidth="4" />
                </g>
              )}
              {probeHop === 6 && (
                <path d="M 980 120 L 825 120" fill="none" className="stroke-emerald-500 dark:stroke-emerald-400" strokeWidth="4.5" filter="url(#probe-glow)" />
              )}

              {/* Animated Continuous Photons (Displayed ONLY when probe is idle, so probe trace is crisp and unobstructed) */}
              {probeHop === 0 && (
                <g>
                  {/* Photon 1: Edge to Ingress */}
                  <circle key={`p1-${p1Dur}`} r="3" className="fill-zinc-700 dark:fill-zinc-300">
                    <animate attributeName="cx" values="210; 240" dur={p1Dur} repeatCount="indefinite" />
                    <animate attributeName="cy" values="120; 120" dur={p1Dur} repeatCount="indefinite" />
                  </circle>
                  {rps > 200 && (
                    <circle key={`p1b-${p1Dur}`} r="2.5" className="fill-zinc-500 dark:fill-zinc-400" opacity="0.8">
                      <animate attributeName="cx" values="210; 240" dur={p1Dur} begin={`${(parseFloat(p1Dur) * 0.45).toFixed(2)}s`} repeatCount="indefinite" />
                      <animate attributeName="cy" values="120; 120" dur={p1Dur} begin={`${(parseFloat(p1Dur) * 0.45).toFixed(2)}s`} repeatCount="indefinite" />
                    </circle>
                  )}

                  {/* Photon 2: Ingress to Pods Cluster */}
                  <circle key={`p2-${p2Dur}`} r="3" className="fill-zinc-700 dark:fill-zinc-300">
                    <animate attributeName="cx" values="415; 445" dur={p2Dur} repeatCount="indefinite" />
                    <animate attributeName="cy" values="120; 120" dur={p2Dur} repeatCount="indefinite" />
                  </circle>
                  {rps > 200 && (
                    <circle key={`p2b-${p2Dur}`} r="2.5" className="fill-zinc-500 dark:fill-zinc-400" opacity="0.8">
                      <animate attributeName="cx" values="415; 445" dur={p2Dur} begin={`${(parseFloat(p2Dur) * 0.45).toFixed(2)}s`} repeatCount="indefinite" />
                      <animate attributeName="cy" values="120; 120" dur={p2Dur} begin={`${(parseFloat(p2Dur) * 0.45).toFixed(2)}s`} repeatCount="indefinite" />
                    </circle>
                  )}

                  {/* Photon 3: Pods Cluster down to k8shorizmetrics */}
                  <circle key={`p3-${p3Dur}`} r="3" className="fill-zinc-700 dark:fill-zinc-300">
                    <animate attributeName="cx" values="560; 560" dur={p3Dur} repeatCount="indefinite" />
                    <animate attributeName="cy" values="245; 340" dur={p3Dur} repeatCount="indefinite" />
                  </circle>

                  {/* Photon 4 Trunk: k8shorizmetrics to Parallel Bus */}
                  <circle key={`p4t-${p4Dur}`} r="3" className="fill-zinc-700 dark:fill-zinc-300">
                    <animate attributeName="cx" values="675; 710" dur={p4Dur} repeatCount="indefinite" />
                    <animate attributeName="cy" values="410; 410" dur={p4Dur} repeatCount="indefinite" />
                  </circle>

                  {/* Photons 4A-4D: Streaming in parallel into ALL 4 Models! */}
                  <circle key={`p4a-${p4Dur}`} r="2.5" className="fill-zinc-700 dark:fill-zinc-300">
                    <animate attributeName="cx" values="710; 745" dur={p4Dur} repeatCount="indefinite" />
                    <animate attributeName="cy" values="292.5; 292.5" dur={p4Dur} repeatCount="indefinite" />
                  </circle>
                  <circle key={`p4b-${p4Dur}`} r="2.5" className="fill-zinc-700 dark:fill-zinc-300">
                    <animate attributeName="cx" values="710; 745" dur={p4Dur} repeatCount="indefinite" />
                    <animate attributeName="cy" values="382.5; 382.5" dur={p4Dur} repeatCount="indefinite" />
                  </circle>
                  <circle key={`p4c-${p4Dur}`} r="2.5" className="fill-zinc-700 dark:fill-zinc-300">
                    <animate attributeName="cx" values="710; 745" dur={p4Dur} repeatCount="indefinite" />
                    <animate attributeName="cy" values="472.5; 472.5" dur={p4Dur} repeatCount="indefinite" />
                  </circle>
                  <circle key={`p4d-${p4Dur}`} r="2.5" className="fill-zinc-700 dark:fill-zinc-300">
                    <animate attributeName="cx" values="710; 745" dur={p4Dur} repeatCount="indefinite" />
                    <animate attributeName="cy" values="562.5; 562.5" dur={p4Dur} repeatCount="indefinite" />
                  </circle>

                  {/* Photons 5A-5D: Streaming from each Model into MAX Arbiter! */}
                  <circle key={`p5a-${p5Dur}`} r="2.5" className={winningModel === 'Reactive HPA' ? 'fill-emerald-500' : 'fill-zinc-500 dark:fill-zinc-400'}>
                    <animate attributeName="cx" values="915; 945" dur={p5Dur} repeatCount="indefinite" />
                    <animate attributeName="cy" values="292.5; 292.5" dur={p5Dur} repeatCount="indefinite" />
                  </circle>
                  <circle key={`p5b-${p5Dur}`} r="2.5" className={winningModel === 'Linear' || winningModel === 'Linear OLS' ? 'fill-emerald-500' : 'fill-zinc-500 dark:fill-zinc-400'}>
                    <animate attributeName="cx" values="915; 945" dur={p5Dur} repeatCount="indefinite" />
                    <animate attributeName="cy" values="382.5; 382.5" dur={p5Dur} repeatCount="indefinite" />
                  </circle>
                  <circle key={`p5c-${p5Dur}`} r="2.5" className={winningModel === 'Holt-Winters' ? 'fill-emerald-500' : 'fill-zinc-500 dark:fill-zinc-400'}>
                    <animate attributeName="cx" values="915; 945" dur={p5Dur} repeatCount="indefinite" />
                    <animate attributeName="cy" values="472.5; 472.5" dur={p5Dur} repeatCount="indefinite" />
                  </circle>
                  <circle key={`p5d-${p5Dur}`} r="2.5" className={winningModel === 'LSTM' ? 'fill-emerald-500' : 'fill-zinc-500 dark:fill-zinc-400'}>
                    <animate attributeName="cx" values="915; 945" dur={p5Dur} repeatCount="indefinite" />
                    <animate attributeName="cy" values="562.5; 562.5" dur={p5Dur} repeatCount="indefinite" />
                  </circle>
                  <circle key={`p5in-${p5Dur}`} r="3" className="fill-emerald-500">
                    <animate attributeName="cx" values="945; 975" dur={p5Dur} repeatCount="indefinite" />
                    <animate attributeName="cy" values="427.5; 427.5" dur={p5Dur} repeatCount="indefinite" />
                  </circle>

                  {/* Photon 6: MAX Arbiter Decision up into Scale Actuator */}
                  <circle key={`p6-${p5Dur}`} r="3" className="fill-emerald-500">
                    <animate attributeName="cx" values="1080; 1080" dur={p5Dur} repeatCount="indefinite" />
                    <animate attributeName="cy" values="310; 190" dur={p5Dur} repeatCount="indefinite" />
                  </circle>

                  {/* Photon 7: Scale Actuator scale patch closing loop into Pod Cluster */}
                  <circle key={`p7-${p6Dur}`} r="3.5" className="fill-zinc-900 dark:fill-zinc-100">
                    <animate attributeName="cx" values="980; 825" dur={p6Dur} repeatCount="indefinite" />
                    <animate attributeName="cy" values="120; 120" dur={p6Dur} repeatCount="indefinite" />
                  </circle>
                </g>
              )}

              {/* Interactive Step-by-Step Trace Probe (Progress-Driven with Native SVG Radial Rings) */}
              {probeHop > 0 && probeCoord && (
                <g>
                  {/* Hop 1, 2, 3: Single Amber Packet */}
                  {(probeHop === 1 || probeHop === 2 || probeHop === 3) && (
                    <g>
                      <circle cx={probeCoord.cx} cy={probeCoord.cy} r="6" fill="none" className="stroke-amber-400" strokeWidth="1.5">
                        <animate attributeName="r" values="6; 15" dur="1s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8; 0" dur="1s" repeatCount="indefinite" />
                      </circle>
                      <circle cx={probeCoord.cx} cy={probeCoord.cy} r="5" className="fill-amber-400 stroke-2 stroke-white dark:stroke-zinc-900 shadow-md" filter="url(#probe-glow)" />
                      <circle cx={probeCoord.cx} cy={probeCoord.cy} r="2" className="fill-white" />
                    </g>
                  )}

                  {/* Hop 4: Trunk -> 4 Model Infeed Branches */}
                  {probeHop === 4 && (
                    <g>
                      {probeCoord.stage === 'trunk' ? (
                        <g>
                          <circle cx={probeCoord.cx} cy={probeCoord.cy} r="6" fill="none" className="stroke-amber-400" strokeWidth="1.5">
                            <animate attributeName="r" values="6; 15" dur="1s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.8; 0" dur="1s" repeatCount="indefinite" />
                          </circle>
                          <circle cx={probeCoord.cx} cy={probeCoord.cy} r="5" className="fill-amber-400 stroke-2 stroke-white dark:stroke-zinc-900 shadow-md" filter="url(#probe-glow)" />
                          <circle cx={probeCoord.cx} cy={probeCoord.cy} r="2" className="fill-white" />
                        </g>
                      ) : (
                        probeCoord.ys.map((y, idx) => (
                          <g key={`hop4-br-${idx}`}>
                            <circle cx={probeCoord.cx} cy={y} r="4.5" className="fill-amber-400 stroke-1.5 stroke-white" filter="url(#probe-glow)" />
                            <circle cx={probeCoord.cx} cy={y} r="1.5" className="fill-white" />
                          </g>
                        ))
                      )}
                    </g>
                  )}

                  {/* Hop 5: 4 Model Outfeeds -> Arbiter -> Actuator */}
                  {probeHop === 5 && (
                    <g>
                      {probeCoord.stage === 'modelOutputs' ? (
                        probeCoord.ys.map((y, idx) => {
                          const isWinner =
                            (idx === 0 && winningModel === 'Reactive HPA') ||
                            (idx === 1 && (winningModel === 'Linear' || winningModel === 'Linear OLS')) ||
                            (idx === 2 && winningModel === 'Holt-Winters') ||
                            (idx === 3 && winningModel === 'LSTM');
                          return (
                            <g key={`hop5-out-${idx}`}>
                              <circle cx={probeCoord.cx} cy={y} r={isWinner ? 5 : 3.5} className={isWinner ? 'fill-emerald-400 stroke-1.5 stroke-white' : 'fill-amber-400'} filter="url(#probe-glow)" />
                            </g>
                          );
                        })
                      ) : probeCoord.stage === 'arbiterInfeed' ? (
                        <g>
                          <circle cx={probeCoord.cx} cy={probeCoord.cy} r="5" className="fill-emerald-400 stroke-2 stroke-white dark:stroke-zinc-900 shadow-md" filter="url(#probe-glow)" />
                          <circle cx={probeCoord.cx} cy={probeCoord.cy} r="2" className="fill-white" />
                        </g>
                      ) : (
                        <g>
                          <circle cx={probeCoord.cx} cy={probeCoord.cy} r="6" fill="none" className="stroke-emerald-400" strokeWidth="1.5">
                            <animate attributeName="r" values="6; 16" dur="1s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.8; 0" dur="1s" repeatCount="indefinite" />
                          </circle>
                          <circle cx={probeCoord.cx} cy={probeCoord.cy} r="5.5" className="fill-emerald-400 stroke-2 stroke-white dark:stroke-zinc-900 shadow-md" filter="url(#probe-glow)" />
                          <circle cx={probeCoord.cx} cy={probeCoord.cy} r="2" className="fill-white" />
                        </g>
                      )}
                    </g>
                  )}

                  {/* Hop 6: Scale API Loop Closed */}
                  {probeHop === 6 && (
                    <g>
                      <circle cx={probeCoord.cx} cy={probeCoord.cy} r="6" fill="none" className="stroke-emerald-400" strokeWidth="1.5">
                        <animate attributeName="r" values="6; 16" dur="1s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8; 0" dur="1s" repeatCount="indefinite" />
                      </circle>
                      <circle cx={probeCoord.cx} cy={probeCoord.cy} r="5.5" className="fill-emerald-400 stroke-2 stroke-white dark:stroke-zinc-900 shadow-lg" filter="url(#probe-glow)" />
                      <circle cx={probeCoord.cx} cy={probeCoord.cy} r="2" className="fill-white" />

                      {/* Landing loop closed ripple socket at (825, 120) */}
                      {probeCoord.atDestination && (
                        <g>
                          <circle cx="825" cy="120" r="8" fill="none" className="stroke-emerald-400" strokeWidth="2">
                            <animate attributeName="r" values="8; 20" dur="1s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.9; 0" dur="1s" repeatCount="indefinite" />
                          </circle>
                          <circle cx="825" cy="120" r="4" className="fill-emerald-400" />
                        </g>
                      )}
                    </g>
                  )}

                  {/* Docking Beacon Socket */}
                  {currentWaypoint && (
                    <g>
                      <circle
                        cx={currentWaypoint.cx}
                        cy={currentWaypoint.cy}
                        r="6"
                        className={probeHop >= 5 ? 'fill-emerald-400 stroke-2 stroke-white dark:stroke-zinc-900' : 'fill-amber-400 stroke-2 stroke-white dark:stroke-zinc-900'}
                        filter="url(#probe-glow)"
                      />
                      <circle
                        cx={currentWaypoint.cx}
                        cy={currentWaypoint.cy}
                        r="6"
                        fill="none"
                        className={probeHop >= 5 ? 'stroke-emerald-400' : 'stroke-amber-400'}
                        strokeWidth="2"
                      >
                        <animate attributeName="r" values="6; 16" dur="1.2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.85; 0" dur="1.2s" repeatCount="indefinite" />
                      </circle>
                    </g>
                  )}
                </g>
              )}
            </svg>

            {/* ZONE 1: TRAFFIC EDGE INGESTION */}
            <div
              onClick={() => {
                setSelectedStage(0);
                setActiveTab('diagram');
                setIsDrawerOpen(true);
              }}
              className="absolute left-[30px] top-[50px] w-[180px] cursor-pointer group"
              style={{ transform: viewMode === '3d' ? 'translateZ(30px)' : 'none' }}
            >
              <div
                className={`rounded-xl p-3 border transition-all duration-300 raised-card ${
                  probeHop === 1
                    ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-500 dark:border-amber-400 ring-4 ring-amber-500/25 dark:ring-amber-400/30 shadow-xl shadow-amber-500/10 scale-105 z-30'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:scale-102'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                    probeHop === 1
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200'
                  }`}>
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  {probeHop === 1 ? (
                    <span className="flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-white shadow-xs animate-pulse">
                      <Zap className="w-2.5 h-2.5 fill-current" />
                      <span>STEP 1 ACTIVE</span>
                    </span>
                  ) : isSpiking ? (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 animate-pulse">
                      5X SURGE
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold border border-zinc-200 dark:border-zinc-700">
                      LIVE
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                  1. Traffic Ingestion
                </h4>
                <div className="mt-2 flex items-baseline justify-between text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">Volume:</span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{rps} RPS</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1 mt-1 overflow-hidden">
                  <div
                    className="h-1 rounded-full transition-all duration-300 bg-zinc-900 dark:bg-zinc-100"
                    style={{ width: `${Math.min(100, (rps / 450) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* ZONE 2: INGRESS & ENVOY MESH */}
            <div
              onClick={() => {
                setSelectedStage(1);
                setActiveTab('diagram');
                setIsDrawerOpen(true);
              }}
              className="absolute left-[240px] top-[50px] w-[175px] cursor-pointer group"
              style={{ transform: viewMode === '3d' ? 'translateZ(35px)' : 'none' }}
            >
              <div
                className={`rounded-xl p-3 border transition-all duration-300 raised-card ${
                  probeHop === 2
                    ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-500 dark:border-amber-400 ring-4 ring-amber-500/25 dark:ring-amber-400/30 shadow-xl shadow-amber-500/10 scale-105 z-30'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:scale-102'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                    probeHop === 2
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200'
                  }`}>
                    <Network className="w-3.5 h-3.5" />
                  </div>
                  {probeHop === 2 ? (
                    <span className="flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-white shadow-xs animate-pulse">
                      <Zap className="w-2.5 h-2.5 fill-current" />
                      <span>STEP 2 ACTIVE</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold border border-zinc-200 dark:border-zinc-700">
                      Envoy Mesh
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                  2. Ingress Router
                </h4>
                <div className="mt-2 flex items-baseline justify-between text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">P95 Latency:</span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {p95}ms
                  </span>
                </div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">Weighted Round Robin</div>
              </div>
            </div>

            {/* ZONE 3: 3D POD CLUSTER WORKLOAD */}
            <div
              onClick={() => {
                setSelectedStage(2);
                setActiveTab('diagram');
                setIsDrawerOpen(true);
              }}
              className="absolute left-[445px] top-[25px] w-[380px] h-[220px] cursor-pointer group z-20"
              style={{ transform: viewMode === '3d' ? 'translateZ(45px)' : 'none' }}
            >
              <div
                className={`rounded-2xl p-3.5 border transition-all duration-300 raised-card h-full flex flex-col justify-between ${
                  probeHop === 3
                    ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-500 dark:border-amber-400 ring-4 ring-amber-500/25 dark:ring-amber-400/30 shadow-xl shadow-amber-500/10 z-30'
                    : probeHop === 6
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-500 dark:border-emerald-400 ring-4 ring-emerald-500/25 dark:ring-emerald-400/30 shadow-xl shadow-emerald-500/10 z-30'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                      probeHop === 3
                        ? 'bg-amber-500 text-white shadow-xs'
                        : probeHop === 6
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200'
                    }`}>
                      <Server className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                        3. Target Pods Cluster
                      </h4>
                      <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                        k8s: default/web-workload
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-1.5">
                    {probeHop === 3 ? (
                      <span className="flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-xs animate-pulse">
                        <Zap className="w-2.5 h-2.5 fill-current" />
                        <span>STEP 3 ACTIVE</span>
                      </span>
                    ) : probeHop === 6 ? (
                      <span className="flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-xs animate-pulse">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>LOOP CLOSED</span>
                      </span>
                    ) : null}
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 font-bold">
                      {actualPods} Active Replicas
                    </span>
                  </div>
                </div>

                {/* Compact Pod Rack Grid */}
                <div className="bg-zinc-50 dark:bg-zinc-950 rounded-xl p-2 border border-zinc-200 dark:border-zinc-800/90 flex-1 my-1 overflow-y-auto flex items-center justify-center">
                  <div className="grid grid-cols-4 gap-1.5 w-full">
                    <AnimatePresence>
                      {Array.from({ length: Math.min(12, actualPods) }).map((_, idx) => {
                        const isPrewarmed = idx >= reactiveHpa && idx < actualPods;
                        const isTargetedByProbe = probeHop === 3 && idx === activePodTarget - 1;
                        const podCpu = Math.min(100, Math.max(10, Math.round(cpu + (idx % 3) * 4 - 4)));

                        return (
                          <motion.div
                            key={`pod-blade-${idx}`}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{
                              type: 'spring',
                              stiffness: 400,
                              damping: 24,
                              delay: idx * 0.015,
                            }}
                            className="relative group/pod"
                          >
                            <div
                              className={`rounded-md p-1 text-center border transition-all duration-300 ${
                                isTargetedByProbe
                                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 scale-110 shadow-sm'
                                  : isPrewarmed
                                  ? 'bg-zinc-100 dark:bg-zinc-800/80 border-zinc-400 dark:border-zinc-600'
                                  : isSpiking
                                  ? 'bg-zinc-200 dark:bg-zinc-800 border-zinc-500'
                                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-0.5">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isTargetedByProbe
                                      ? 'bg-zinc-100 dark:bg-zinc-900 animate-ping'
                                      : isPrewarmed
                                      ? 'bg-zinc-500 dark:bg-zinc-400 animate-pulse'
                                      : 'bg-zinc-700 dark:bg-zinc-300'
                                  }`}
                                />
                                <span className={`text-[8px] font-mono ${isTargetedByProbe ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                  #{idx + 1}
                                </span>
                              </div>

                              <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1 overflow-hidden my-0.5">
                                <div
                                  className={`h-full ${
                                    isTargetedByProbe
                                      ? 'bg-white dark:bg-zinc-900'
                                      : 'bg-zinc-900 dark:bg-zinc-100'
                                  }`}
                                  style={{ width: `${podCpu}%` }}
                                />
                              </div>
                              <span className={`text-[7.5px] font-mono block truncate ${isTargetedByProbe ? 'text-zinc-200 dark:text-zinc-800 font-bold' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                {podCpu}%
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="mt-1 pt-1 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                  <span>
                    Avg Pod CPU: <strong className="text-zinc-900 dark:text-zinc-100">{cpu}%</strong> (Target: 60%)
                  </span>
                  <span>
                    Ideal Demand: <strong className="text-zinc-900 dark:text-zinc-100">{idealDemand}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* ZONE 4: TELEMETRY GATHERER */}
            <div
              onClick={() => {
                setSelectedStage(3);
                setActiveTab('diagram');
                setIsDrawerOpen(true);
              }}
              className="absolute left-[445px] top-[340px] w-[230px] cursor-pointer group"
              style={{ transform: viewMode === '3d' ? 'translateZ(35px)' : 'none' }}
            >
              <div
                className={`rounded-xl p-3 border transition-all duration-300 raised-card ${
                  probeHop === 4
                    ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-500 dark:border-amber-400 ring-4 ring-amber-500/25 dark:ring-amber-400/30 shadow-xl shadow-amber-500/10 scale-105 z-30'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:scale-102'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                    probeHop === 4
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200'
                  }`}>
                    <Layers className={`w-3.5 h-3.5 ${probeHop === 4 ? 'text-white' : 'text-emerald-500'}`} />
                  </div>
                  {probeHop === 4 ? (
                    <span className="flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-white shadow-xs animate-pulse">
                      <Zap className="w-2.5 h-2.5 fill-current" />
                      <span>STEP 4 ACTIVE</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold border border-zinc-200 dark:border-zinc-700">
                      15s Cadence
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                  4. k8shorizmetrics
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1">
                  cAdvisor scrape & metric buffer
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zinc-500">Unready pods:</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-semibold">0 filtered</span>
                </div>
              </div>
            </div>

            {/* ZONE 5: ALL 4 INDIVIDUAL MODEL NODES (Concurrently Evaluated!) */}
            {/* Model 1: Reactive HPA Baseline */}
            <div
              onClick={() => {
                setSelectedStage(4);
                setActiveTab('diagram');
                setIsDrawerOpen(true);
              }}
              className="absolute left-[745px] top-[255px] w-[170px] cursor-pointer group"
              style={{ transform: viewMode === '3d' ? 'translateZ(40px)' : 'none' }}
            >
              <div
                className={`rounded-xl p-2.5 border transition-all duration-300 raised-card ${
                  probeHop === 4
                    ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-500 dark:border-amber-400 ring-2 ring-amber-500/30 shadow-md scale-102 z-25'
                    : probeHop === 5 && winningModel === 'Reactive HPA'
                    ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-400 ring-4 ring-emerald-500/35 dark:ring-emerald-400/35 shadow-xl shadow-emerald-500/15 scale-105 z-30'
                    : probeHop === 5
                    ? 'bg-white/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 opacity-50'
                    : winningModel === 'Reactive HPA'
                    ? 'bg-white dark:bg-zinc-800 border-zinc-900 dark:border-zinc-100 shadow-md ring-2 ring-zinc-900/10 dark:ring-zinc-100/20'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className="font-bold text-zinc-700 dark:text-zinc-300">Reactive HPA</span>
                  {probeHop === 5 && winningModel === 'Reactive HPA' ? (
                    <span className="flex items-center gap-1 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-emerald-500 text-white shadow-xs animate-pulse">
                      ★ WINNER
                    </span>
                  ) : winningModel === 'Reactive HPA' ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  ) : probeHop === 4 ? (
                    <span className="flex items-center gap-1 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white shadow-xs animate-pulse">
                      <Zap className="w-2 h-2 fill-current" /> Ingesting
                    </span>
                  ) : (
                    <span className="text-[8px] text-zinc-400">Baseline</span>
                  )}
                </div>
                <div className="flex items-baseline justify-between font-mono font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                  <span>{reactiveHpa}</span>
                  <span className="text-[9px] font-normal text-zinc-500">pods</span>
                </div>
                <span className="text-[8px] font-mono text-zinc-400 block mt-0.5">
                  ⌈Current × (CPU / 60%)⌉
                </span>
              </div>
            </div>

            {/* Model 2: Linear OLS Regressor */}
            <div
              onClick={() => {
                setSelectedStage(4);
                setActiveTab('diagram');
                setIsDrawerOpen(true);
              }}
              className="absolute left-[745px] top-[345px] w-[170px] cursor-pointer group"
              style={{ transform: viewMode === '3d' ? 'translateZ(40px)' : 'none' }}
            >
              <div
                className={`rounded-xl p-2.5 border transition-all duration-300 raised-card ${
                  probeHop === 4
                    ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-500 dark:border-amber-400 ring-2 ring-amber-500/30 shadow-md scale-102 z-25'
                    : probeHop === 5 && (winningModel === 'Linear' || winningModel === 'Linear OLS')
                    ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-400 ring-4 ring-emerald-500/35 dark:ring-emerald-400/35 shadow-xl shadow-emerald-500/15 scale-105 z-30'
                    : probeHop === 5
                    ? 'bg-white/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 opacity-50'
                    : (winningModel === 'Linear' || winningModel === 'Linear OLS')
                    ? 'bg-white dark:bg-zinc-800 border-zinc-900 dark:border-zinc-100 shadow-md ring-2 ring-zinc-900/10 dark:ring-zinc-100/20'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className="font-bold text-zinc-700 dark:text-zinc-300">Linear OLS</span>
                  {probeHop === 5 && (winningModel === 'Linear' || winningModel === 'Linear OLS') ? (
                    <span className="flex items-center gap-1 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-emerald-500 text-white shadow-xs animate-pulse">
                      ★ WINNER
                    </span>
                  ) : (winningModel === 'Linear' || winningModel === 'Linear OLS') ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  ) : probeHop === 4 ? (
                    <span className="flex items-center gap-1 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white shadow-xs animate-pulse">
                      <Zap className="w-2 h-2 fill-current" /> Ingesting
                    </span>
                  ) : (
                    <span className="text-[8px] text-zinc-400">Trend</span>
                  )}
                </div>
                <div className="flex items-baseline justify-between font-mono font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                  <span>{linearPred}</span>
                  <span className="text-[9px] font-normal text-zinc-500">pods</span>
                </div>
                <span className="text-[8px] font-mono text-zinc-400 block mt-0.5">
                  1st-Order Gradient dy/dt
                </span>
              </div>
            </div>

            {/* Model 3: Holt-Winters (Triple Exp) */}
            <div
              onClick={() => {
                setSelectedStage(4);
                setActiveTab('diagram');
                setIsDrawerOpen(true);
              }}
              className="absolute left-[745px] top-[435px] w-[170px] cursor-pointer group"
              style={{ transform: viewMode === '3d' ? 'translateZ(40px)' : 'none' }}
            >
              <div
                className={`rounded-xl p-2.5 border transition-all duration-300 raised-card ${
                  probeHop === 4
                    ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-500 dark:border-amber-400 ring-2 ring-amber-500/30 shadow-md scale-102 z-25'
                    : probeHop === 5 && winningModel === 'Holt-Winters'
                    ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-400 ring-4 ring-emerald-500/35 dark:ring-emerald-400/35 shadow-xl shadow-emerald-500/15 scale-105 z-30'
                    : probeHop === 5
                    ? 'bg-white/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 opacity-50'
                    : winningModel === 'Holt-Winters'
                    ? 'bg-white dark:bg-zinc-800 border-zinc-900 dark:border-zinc-100 shadow-md ring-2 ring-zinc-900/10 dark:ring-zinc-100/20'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className="font-bold text-zinc-700 dark:text-zinc-300">Holt-Winters</span>
                  {probeHop === 5 && winningModel === 'Holt-Winters' ? (
                    <span className="flex items-center gap-1 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-emerald-500 text-white shadow-xs animate-pulse">
                      ★ WINNER
                    </span>
                  ) : winningModel === 'Holt-Winters' ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  ) : probeHop === 4 ? (
                    <span className="flex items-center gap-1 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white shadow-xs animate-pulse">
                      <Zap className="w-2 h-2 fill-current" /> Ingesting
                    </span>
                  ) : (
                    <span className="text-[8px] text-zinc-400">Seasonal</span>
                  )}
                </div>
                <div className="flex items-baseline justify-between font-mono font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                  <span>{hwPred}</span>
                  <span className="text-[9px] font-normal text-zinc-500">pods</span>
                </div>
                <span className="text-[8px] font-mono text-zinc-400 block mt-0.5">
                  Level + Trend + Seasonality
                </span>
              </div>
            </div>

            {/* Model 4: 2-Layer Stacked LSTM */}
            <div
              onClick={() => {
                setSelectedStage(4);
                setActiveTab('diagram');
                setIsDrawerOpen(true);
              }}
              className="absolute left-[745px] top-[525px] w-[170px] cursor-pointer group"
              style={{ transform: viewMode === '3d' ? 'translateZ(40px)' : 'none' }}
            >
              <div
                className={`rounded-xl p-2.5 border transition-all duration-300 raised-card ${
                  probeHop === 4
                    ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-500 dark:border-amber-400 ring-2 ring-amber-500/30 shadow-md scale-102 z-25'
                    : probeHop === 5 && winningModel === 'LSTM'
                    ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-400 ring-4 ring-emerald-500/35 dark:ring-emerald-400/35 shadow-xl shadow-emerald-500/15 scale-105 z-30'
                    : probeHop === 5
                    ? 'bg-white/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 opacity-50'
                    : winningModel === 'LSTM'
                    ? 'bg-white dark:bg-zinc-800 border-zinc-900 dark:border-zinc-100 shadow-md ring-2 ring-zinc-900/10 dark:ring-zinc-100/20'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">2-Layer LSTM</span>
                  {probeHop === 5 && winningModel === 'LSTM' ? (
                    <span className="flex items-center gap-1 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-emerald-500 text-white shadow-xs animate-pulse">
                      ★ WINNER
                    </span>
                  ) : winningModel === 'LSTM' ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  ) : probeHop === 4 ? (
                    <span className="flex items-center gap-1 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white shadow-xs animate-pulse">
                      <Zap className="w-2 h-2 fill-current" /> Ingesting
                    </span>
                  ) : (
                    <span className="text-[8px] text-indigo-500">Deep Net</span>
                  )}
                </div>
                <div className="flex items-baseline justify-between font-mono font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                  <span>{lstmPred}</span>
                  <span className="text-[9px] font-normal text-zinc-500">pods</span>
                </div>
                <span className="text-[8px] font-mono text-zinc-400 block mt-0.5">
                  Recurrent Hidden Cell Memory
                </span>
              </div>
            </div>

            {/* ZONE 5B: MAX ENVELOPE DECISION ARBITER (Individual Component!) */}
            <div
              onClick={() => {
                setSelectedStage(4);
                setActiveTab('diagram');
                setIsDrawerOpen(true);
              }}
              className="absolute left-[975px] top-[310px] w-[215px] h-[250px] cursor-pointer group z-20"
              style={{ transform: viewMode === '3d' ? 'translateZ(45px)' : 'none' }}
            >
              <div
                className={`rounded-2xl p-3.5 border transition-all duration-300 raised-card h-full flex flex-col justify-between ${
                  probeHop === 5
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-500 dark:border-emerald-400 ring-4 ring-emerald-500/30 dark:ring-emerald-400/30 shadow-xl shadow-emerald-500/15 scale-105 z-30'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                        probeHop === 5
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-400'
                      }`}>
                        <Cpu className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          MAX Arbiter
                        </h4>
                        <span className="text-[9px] font-mono text-zinc-500 block">
                          Decision Engine
                        </span>
                      </div>
                    </div>
                    {probeHop === 5 ? (
                      <span className="flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-xs animate-pulse">
                        <Zap className="w-2.5 h-2.5 fill-current" />
                        <span>STEP 5 ACTIVE</span>
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30">
                        MAX
                      </span>
                    )}
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-950 rounded-lg p-2 border border-zinc-200 dark:border-zinc-800 text-[10px] font-mono space-y-1 my-1">
                    <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-400">
                      <span>Reactive HPA:</span>
                      <strong className={winningModel === 'Reactive HPA' ? 'text-emerald-600 dark:text-emerald-400' : ''}>{reactiveHpa}</strong>
                    </div>
                    <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-400">
                      <span>Linear OLS:</span>
                      <strong className={winningModel === 'Linear' || winningModel === 'Linear OLS' ? 'text-emerald-600 dark:text-emerald-400' : ''}>{linearPred}</strong>
                    </div>
                    <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-400">
                      <span>Holt-Winters:</span>
                      <strong className={winningModel === 'Holt-Winters' ? 'text-emerald-600 dark:text-emerald-400' : ''}>{hwPred}</strong>
                    </div>
                    <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-400">
                      <span>2-Layer LSTM:</span>
                      <strong className={winningModel === 'LSTM' ? 'text-emerald-600 dark:text-emerald-400' : ''}>{lstmPred}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/80">
                  <div className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5">
                    Winning Recommendation:
                  </div>
                  <div className="flex items-center gap-1 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{maxVal} Replicas via {winningModel}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ZONE 6: SCALE ACTUATOR */}
            <div
              onClick={() => {
                setSelectedStage(5);
                setActiveTab('diagram');
                setIsDrawerOpen(true);
              }}
              className="absolute left-[980px] top-[50px] w-[205px] cursor-pointer group"
              style={{ transform: viewMode === '3d' ? 'translateZ(35px)' : 'none' }}
            >
              <div
                className={`rounded-xl p-3 border transition-all duration-300 raised-card ${
                  probeHop === 6
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-500 dark:border-emerald-400 ring-4 ring-emerald-500/30 dark:ring-emerald-400/30 shadow-xl shadow-emerald-500/15 scale-105 z-30'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:scale-102'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                    probeHop === 6
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200'
                  }`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${probeHop === 6 ? 'text-white' : 'text-amber-500'}`} />
                  </div>
                  {probeHop === 6 ? (
                    <span className="flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-xs animate-pulse">
                      <Zap className="w-2.5 h-2.5 fill-current" />
                      <span>STEP 6 ACTIVE</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold border border-zinc-200 dark:border-zinc-700">
                      ScaleClient
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                  6. Scale Actuator
                </h4>
                <div className="mt-2 flex items-baseline justify-between text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">Patched:</span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{actualPods} pods</span>
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">Loop Closed ✓ Kube-API</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

      {/* 4. LIVE PACKET PAYLOAD INSPECTOR CARD */}
      {currentWaypoint && (
        <div className="rounded-xl p-3.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 raised-card text-xs font-mono space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold">
              <Terminal className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              <span>LIVE PACKET PAYLOAD INSPECTOR (HOP {currentWaypoint.id}/6)</span>
            </div>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
              Total Incurred Latency: <strong className="text-zinc-900 dark:text-zinc-100">+{currentWaypoint.total}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] bg-zinc-50 dark:bg-zinc-950/70 rounded-lg p-2.5 border border-zinc-200 dark:border-zinc-800">
            <div>
              <span className="text-zinc-500 dark:text-zinc-400 block">HTTP Request Context:</span>
              <span className="text-zinc-900 dark:text-zinc-100 font-medium">GET /api/v1/workload HTTP/2.0</span>
              <span className="text-zinc-500 dark:text-zinc-400 block text-[10px]">Host: phpa-cluster.local</span>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400 block">Target Routing Destination:</span>
              <span className="text-zinc-900 dark:text-zinc-100 font-bold">pod-0{activePodTarget} (10.244.1.{10 + activePodTarget})</span>
              <span className="text-zinc-500 dark:text-zinc-400 block text-[10px]">Weight: 100 • Health: Passing</span>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400 block">Actuation Status:</span>
              <span className="text-zinc-900 dark:text-zinc-100 font-bold">Closed-Loop Stable</span>
              <span className="text-zinc-500 dark:text-zinc-400 block text-[10px]">{actualPods} replicas active</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. STAGE SELECTOR RIBBON */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {stages.map((stage) => {
          const Icon = stage.icon;
          const isSelected = selectedStage === stage.id;
          return (
            <button
              key={stage.id}
              onClick={() => {
                setSelectedStage(stage.id);
                setActiveTab('diagram');
                setIsDrawerOpen(true);
              }}
              className={`text-left p-2.5 rounded-lg border transition-all flex items-start gap-2.5 focus:outline-none focus:ring-0 ${
                isSelected
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-sm'
                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
              }`}
            >
              <div
                className={`p-1.5 rounded-md flex-shrink-0 ${
                  isSelected
                    ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className={`text-[11px] font-semibold truncate ${
                    isSelected ? 'text-white dark:text-zinc-900' : 'text-zinc-900 dark:text-zinc-100'
                  }`}
                >
                  {stage.name}
                </div>
                <div
                  className={`text-[9.5px] truncate mt-0.5 ${
                    isSelected ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {stage.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 6. DEEP STAGE DIAGNOSTICS & ARCHITECTURE DIAGRAM MODAL */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-950/80">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200">
                    {React.createElement(stages[selectedStage].icon, { className: 'w-5 h-5' })}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <span>{stages[selectedStage].name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-normal">
                        Internal Mechanics
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {stages[selectedStage].subtitle}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-700 transition-colors focus:outline-none focus:ring-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Sub-Tabs: Diagrams First! */}
              <div className="flex items-center gap-2 px-4 pt-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono">
                <button
                  onClick={() => setActiveTab('diagram')}
                  className={`pb-2 px-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === 'diagram'
                      ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-bold'
                      : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <GitBranch className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                  <span>Real-Time Flow Diagram</span>
                </button>
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`pb-2 px-2.5 border-b-2 transition-colors ${
                    activeTab === 'overview'
                      ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-bold'
                      : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  Overview & Telemetry
                </button>
                <button
                  onClick={() => setActiveTab('internals')}
                  className={`pb-2 px-2.5 border-b-2 transition-colors ${
                    activeTab === 'internals'
                      ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-bold'
                      : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  Math Formulation
                </button>
                {selectedStage === 2 && (
                  <button
                    onClick={() => setActiveTab('pods')}
                    className={`pb-2 px-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
                      activeTab === 'pods'
                        ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-bold'
                        : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    <Server className="w-3 h-3" />
                    <span>Container Pods ({actualPods})</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('yaml')}
                  className={`pb-2 px-2.5 border-b-2 transition-colors ${
                    activeTab === 'yaml'
                      ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-bold'
                      : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  Kubernetes YAML
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 overflow-y-auto flex-1 space-y-4">
                {activeTab === 'diagram' && renderStageDiagram()}

                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      {stages[selectedStage].description}
                    </p>

                    <div className="rounded-xl bg-zinc-50 dark:bg-zinc-950 p-3.5 border border-zinc-200 dark:border-zinc-800">
                      <h5 className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider font-semibold">
                        Live Operational Metrics
                      </h5>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(stages[selectedStage].internals).map(([k, v]) => (
                          <div key={k} className="p-2.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                            <span className="text-zinc-500 dark:text-zinc-400 text-[10px] block">{k}</span>
                            <span className="font-mono text-zinc-900 dark:text-zinc-100 font-semibold mt-0.5 block truncate">
                              {v}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'internals' && (
                  <div className="space-y-4">
                    {/* Visual Academic Mathematical Formulation */}
                    <div className="rounded-xl bg-zinc-50 dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                        <span className="text-[10px] text-zinc-900 dark:text-zinc-100 uppercase font-bold tracking-wider font-mono flex items-center gap-1.5">
                          <span>AUTONOMIC MATHEMATICAL FORMULATION</span>
                        </span>
                        <span className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                          Stage {selectedStage + 1} Formal Specification
                        </span>
                      </div>

                      {/* Visual Math Expression */}
                      <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-center min-h-[70px] shadow-sm">
                        {selectedStage === 0 && (
                          <div className="flex items-center gap-2 text-base font-serif text-zinc-900 dark:text-zinc-100 flex-wrap justify-center">
                            <span className="italic font-bold text-zinc-900 dark:text-white text-lg">λ(t)</span>
                            <span>=</span>
                            <span className="italic font-semibold text-zinc-600 dark:text-zinc-300">λ̄</span>
                            <span>+</span>
                            <span className="italic">A</span>
                            <span>·</span>
                            <span className="font-sans text-xs uppercase font-semibold">sin</span>
                            <span className="text-zinc-400 text-2xl">(</span>
                            <span className="inline-flex flex-col items-center justify-center text-xs mx-1">
                              <span className="border-b border-zinc-300 dark:border-zinc-700 pb-0.5 px-2 font-mono">2π · t</span>
                              <span className="pt-0.5 font-mono">T</span>
                            </span>
                            <span className="text-zinc-400 text-2xl">)</span>
                            <span>+</span>
                            <span className="italic font-semibold text-zinc-600 dark:text-zinc-300">ξ(t)</span>
                          </div>
                        )}

                        {selectedStage === 1 && (
                          <div className="flex items-center gap-2 text-base font-serif text-zinc-900 dark:text-zinc-100 flex-wrap justify-center">
                            <span className="font-sans font-bold text-zinc-900 dark:text-white text-sm">P95 Latency</span>
                            <span>≈</span>
                            <span className="italic font-semibold text-zinc-600 dark:text-zinc-300">L<sub>0</sub></span>
                            <span>+</span>
                            <span className="italic">β</span>
                            <span>·</span>
                            <span className="text-zinc-400 text-2xl">[</span>
                            <span className="inline-flex flex-col items-center justify-center text-xs mx-1">
                              <span className="border-b border-zinc-300 dark:border-zinc-700 pb-0.5 px-2 italic font-semibold text-zinc-800 dark:text-zinc-200">λ(t)</span>
                              <span className="pt-0.5 italic font-semibold text-zinc-600 dark:text-zinc-400">N<sub>actual</sub>(t) · C<sub>pod</sub></span>
                            </span>
                            <span className="text-zinc-400 text-2xl">]</span>
                            <span className="text-xs text-zinc-500 -mt-2">α</span>
                          </div>
                        )}

                        {selectedStage === 2 && (
                          <div className="flex items-center gap-2 text-base font-serif text-zinc-900 dark:text-zinc-100 flex-wrap justify-center">
                            <span className="font-sans font-bold text-zinc-900 dark:text-white text-sm">U<sub>cpu</sub>(t)</span>
                            <span>=</span>
                            <span className="font-sans font-bold text-zinc-700 dark:text-zinc-300 text-xs uppercase">min</span>
                            <span className="text-zinc-400 text-2xl">(</span>
                            <span className="font-mono text-zinc-700 dark:text-zinc-300 text-sm">100%</span>
                            <span className="text-zinc-400">,</span>
                            <span className="inline-flex flex-col items-center justify-center text-xs mx-1">
                              <span className="border-b border-zinc-300 dark:border-zinc-700 pb-0.5 px-2 italic font-semibold text-zinc-800 dark:text-zinc-200">λ(t)</span>
                              <span className="pt-0.5 italic font-semibold text-zinc-600 dark:text-zinc-400">N<sub>actual</sub>(t) · 25 RPS</span>
                            </span>
                            <span className="text-zinc-400">×</span>
                            <span className="font-mono text-zinc-900 dark:text-white text-sm font-semibold">60%</span>
                            <span className="text-zinc-400 text-2xl">)</span>
                          </div>
                        )}

                        {selectedStage === 3 && (
                          <div className="flex items-center gap-2 text-base font-serif text-zinc-900 dark:text-zinc-100 flex-wrap justify-center">
                            <span className="font-sans font-bold text-zinc-900 dark:text-white text-sm">R<sub>raw</sub></span>
                            <span>=</span>
                            <span className="text-3xl font-sans text-zinc-400 font-light leading-none">⌈</span>
                            <span className="italic font-bold text-zinc-800 dark:text-zinc-200 mx-1">N<sub>current</sub></span>
                            <span className="text-zinc-400">×</span>
                            <span className="inline-flex flex-col items-center justify-center text-xs mx-2">
                              <span className="border-b border-zinc-300 dark:border-zinc-700 pb-0.5 px-2 font-mono text-zinc-800 dark:text-zinc-200">Current CPU</span>
                              <span className="pt-0.5 font-mono text-zinc-600 dark:text-zinc-400 font-semibold">Target CPU (60%)</span>
                            </span>
                            <span className="text-3xl font-sans text-zinc-400 font-light leading-none">⌉</span>
                          </div>
                        )}

                        {selectedStage === 4 && (
                          <div className="flex items-center gap-2 text-base font-serif text-zinc-900 dark:text-zinc-100 flex-wrap justify-center">
                            <span className="font-sans font-bold text-zinc-900 dark:text-white text-sm">N<sub>target</sub></span>
                            <span>=</span>
                            <span className="font-sans font-bold text-zinc-700 dark:text-zinc-300 text-xs uppercase">max</span>
                            <span className="text-zinc-400 text-2xl">(</span>
                            <span className="font-mono text-zinc-700 dark:text-zinc-300 text-xs">R<sub>hpa</sub></span>
                            <span className="text-zinc-400">,</span>
                            <span className="font-mono text-zinc-700 dark:text-zinc-300 text-xs">ŷ<sub>linear</sub></span>
                            <span className="text-zinc-400">,</span>
                            <span className="font-mono text-zinc-700 dark:text-zinc-300 text-xs">ŷ<sub>hw</sub></span>
                            <span className="text-zinc-400">,</span>
                            <span className="font-mono text-zinc-900 dark:text-white text-xs font-bold">ŷ<sub>lstm</sub></span>
                            <span className="text-zinc-400 text-2xl">)</span>
                          </div>
                        )}

                        {selectedStage === 5 && (
                          <div className="flex items-center gap-2 text-base font-serif text-zinc-900 dark:text-zinc-100 flex-wrap justify-center">
                            <span className="font-sans font-bold text-zinc-900 dark:text-white text-sm">N<sub>actuated</sub></span>
                            <span>=</span>
                            <span className="font-sans font-bold text-zinc-700 dark:text-zinc-300 text-xs uppercase">clamp</span>
                            <span className="text-zinc-400 text-xl">(</span>
                            <span className="font-mono text-zinc-700 dark:text-zinc-300 text-xs">min = 2</span>
                            <span className="text-zinc-400">,</span>
                            <span className="font-mono text-zinc-700 dark:text-zinc-300 text-xs">max = 30</span>
                            <span className="text-zinc-400">,</span>
                            <span className="italic font-bold text-zinc-900 dark:text-white text-sm">N<sub>target</sub></span>
                            <span className="text-zinc-400 text-xl">)</span>
                          </div>
                        )}
                      </div>

                      {/* Live Value Substitution Box */}
                      <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono">
                        <span className="text-zinc-500 text-[10px] uppercase font-bold block mb-1">
                          Live Numerical Substitution:
                        </span>
                        {selectedStage === 0 && (
                          <div className="text-zinc-700 dark:text-zinc-300">
                            λ(t) = <strong className="text-zinc-900 dark:text-zinc-100">{rps} RPS</strong> (Base: 100 RPS, Diurnal Delta: {(rps - 100).toFixed(0)} RPS {isSpiking ? ', Flash Crowd: 5.0x Burst' : ''})
                          </div>
                        )}
                        {selectedStage === 1 && (
                          <div className="text-zinc-700 dark:text-zinc-300">
                            P95 = <strong className={p95 > 100 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>{p95} ms</strong> ≈ 3.8ms (Base) + 12 · ({rps} / ({actualPods} × 25)) ms
                          </div>
                        )}
                        {selectedStage === 2 && (
                          <div className="text-zinc-700 dark:text-zinc-300">
                            U<sub>cpu</sub> = <strong className="text-zinc-900 dark:text-zinc-100">{cpu}%</strong> = min(100%, ({rps} / ({actualPods} × 25)) × 60%)
                          </div>
                        )}
                        {selectedStage === 3 && (
                          <div className="text-zinc-700 dark:text-zinc-300">
                            R<sub>raw</sub> = ⌈ {actualPods} pods × ({cpu}% / 60%) ⌉ = <strong className="text-emerald-600 dark:text-emerald-400">{reactiveHpa} replicas</strong>
                          </div>
                        )}
                        {selectedStage === 4 && (
                          <div className="text-zinc-700 dark:text-zinc-300">
                            N<sub>target</sub> = max( {reactiveHpa}, {linearPred}, {hwPred}, {lstmPred} ) = <strong className="text-zinc-900 dark:text-zinc-100">{maxVal} replicas via {winningModel}</strong>
                          </div>
                        )}
                        {selectedStage === 5 && (
                          <div className="text-zinc-700 dark:text-zinc-300">
                            N<sub>actuated</sub> = clamp(2, 30, {maxVal}) = <strong className="text-zinc-900 dark:text-zinc-100">{actualPods} replicas applied</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl bg-zinc-50 dark:bg-zinc-950 p-3 border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
                      <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase font-semibold tracking-wider block">
                        Subsystem Specifications
                      </span>
                      <div className="space-y-1.5 text-zinc-700 dark:text-zinc-300">
                        <div className="flex justify-between py-1 border-b border-zinc-200 dark:border-zinc-800">
                          <span className="text-zinc-500 dark:text-zinc-400">Component Scope:</span>
                          <span className="font-mono text-zinc-900 dark:text-zinc-100">Kubernetes Core Data/Control Plane</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-zinc-200 dark:border-zinc-800">
                          <span className="text-zinc-500 dark:text-zinc-400">Execution Frequency:</span>
                          <span className="font-mono text-zinc-900 dark:text-zinc-100">Continuous Event Loop (15s Cadence)</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-zinc-500 dark:text-zinc-400">Fault Tolerance:</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">Active HA with Fallback to Reactive HPA</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'pods' && selectedStage === 2 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-500 dark:text-zinc-400">
                      <span>Workload: <strong className="text-zinc-900 dark:text-zinc-100">web-workload</strong></span>
                      <span>{actualPods} pods in replica set</span>
                    </div>

                    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950 text-xs font-mono">
                      <table className="w-full text-left">
                        <thead className="bg-zinc-50 dark:bg-zinc-900 text-[10px] text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                          <tr>
                            <th className="p-2">Pod Name</th>
                            <th className="p-2">IP Address</th>
                            <th className="p-2">CPU%</th>
                            <th className="p-2">Memory</th>
                            <th className="p-2">Uptime</th>
                            <th className="p-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                          {containerPods.map((p) => (
                            <tr
                              key={p.id}
                              className={`hover:bg-zinc-50 dark:hover:bg-zinc-900/60 ${
                                p.isTargeted
                                  ? 'bg-amber-50 dark:bg-amber-950/20'
                                  : p.isPrewarmed
                                  ? 'bg-zinc-100/70 dark:bg-zinc-800/40'
                                  : ''
                              }`}
                            >
                              <td className="p-2 flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    p.isTargeted
                                      ? 'bg-amber-500 animate-ping'
                                      : p.isPrewarmed
                                      ? 'bg-zinc-900 dark:bg-zinc-100'
                                      : 'bg-emerald-500'
                                  }`}
                                />
                                <span>{p.id}</span>
                              </td>
                              <td className="p-2 text-zinc-500 dark:text-zinc-400">{p.ip}</td>
                              <td className="p-2">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-12 bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className={`h-full ${p.cpu > 80 ? 'bg-rose-500' : 'bg-zinc-900 dark:bg-zinc-100'}`}
                                      style={{ width: `${p.cpu}%` }}
                                    />
                                  </div>
                                  <span className={p.cpu > 80 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-zinc-700 dark:text-zinc-300'}>
                                    {p.cpu}%
                                  </span>
                                </div>
                              </td>
                              <td className="p-2 text-zinc-500 dark:text-zinc-400">{p.mem} MB</td>
                              <td className="p-2 text-zinc-500 dark:text-zinc-400">{p.age}</td>
                              <td className="p-2">
                                {p.isPrewarmed ? (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium">
                                    Pre-warmed
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                                    Ready
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

                {activeTab === 'yaml' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                      <span>Production Deployment Manifest</span>
                      <span className="text-[10px] text-zinc-400">YAML Format</span>
                    </div>
                    <pre className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-800 dark:text-zinc-200 overflow-x-auto leading-relaxed">
                      {stages[selectedStage].yaml}
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
