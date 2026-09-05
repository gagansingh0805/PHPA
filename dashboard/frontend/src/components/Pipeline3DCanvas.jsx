import React, { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, RoundedBox, Edges, Line, Html } from '@react-three/drei';
import gsap from 'gsap';
import {
  Globe,
  Smartphone,
  Terminal,
  Shield,
  Activity,
  Network,
  Box,
  Server,
  Layers,
  Cpu,
  Zap,
  Sparkles,
  Database,
  HardDrive,
  RotateCcw,
} from 'lucide-react';

/* =========================================================================
   1. Theme Detection Hook
   ========================================================================= */
function useAppTheme(propTheme) {
  const [isDark, setIsDark] = useState(() => {
    if (propTheme) return propTheme === 'dark';
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

  useEffect(() => {
    if (propTheme) {
      setIsDark(propTheme === 'dark');
      return;
    }
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, [propTheme]);

  return isDark;
}

/* =========================================================================
   2. Left-to-Right Campus Architecture Coordinates & Slabs
   ========================================================================= */
const ARCH_LAYERS = {
  1: { name: 'Client Frontend', color: '#38bdf8', badge: 'Tier 1' },
  2: { name: 'Edge & Ingress Mesh', color: '#3b82f6', badge: 'Tier 2' },
  3: { name: 'Target Workload Service', color: '#8b5cf6', badge: 'Tier 3' },
  4: { name: 'PHPA Autoscaling Core', color: '#10b981', badge: 'Centerpiece' },
  5: { name: 'State & TSDB Persistence', color: '#f43f5e', badge: 'Tier 5' },
};

/* Architectural Grounding Slabs for each tier */
const TIER_PLATFORMS = [
  // Tier 1: Client Skydeck (Far Left Wing, Elevated)
  {
    id: 'plat-1',
    layer: 1,
    position: [-11.0, 3.2, 3.5],
    size: [9.5, 0.2, 6.0],
    color: '#38bdf8',
    label: 'TIER 1 • CLIENT SKYDECK',
  },
  // Tier 2: Ingress & Edge Deck (Far Left Wing, Lowered)
  {
    id: 'plat-2',
    layer: 2,
    position: [-11.0, 0.8, -3.5],
    size: [9.5, 0.2, 6.0],
    color: '#3b82f6',
    label: 'TIER 2 • EDGE & INGRESS MESH',
  },
  // Tier 3: Workload Bridge (Center Bridge)
  {
    id: 'plat-3',
    layer: 3,
    position: [0.0, 0.4, 0.0],
    size: [7.2, 0.2, 5.5],
    color: '#8b5cf6',
    label: 'TIER 3 • TARGET WORKLOAD SERVICE',
  },
  // Tier 4: PHPA Autoscaling Grand Stage (Right Wing Centerpiece)
  {
    id: 'plat-4',
    layer: 4,
    position: [12.0, -0.4, 0.0],
    size: [16.5, 0.25, 14.5],
    color: '#10b981',
    label: 'TIER 4 • PHPA PREDICTIVE AUTOSCALING CORE',
  },
  // Tier 5: Foundation Persistence Sub-Level (Bottom Terrace)
  {
    id: 'plat-5',
    layer: 5,
    position: [0.0, -4.2, 0.0],
    size: [16.5, 0.2, 5.2],
    color: '#f43f5e',
    label: 'TIER 5 • STATE & METRICS TSDB PERSISTENCE',
  },
];

/* 3D Hardware Nodes with Left-to-Right Flow Coordinates */
const ARCH_NODES = [
  // --- ZONE 1: TIER 1 CLIENTS (Skydeck: Y=+4.0) ---
  {
    id: 'web-app',
    stageId: 0,
    layer: 1,
    title: 'Web App Client',
    subtitle: 'React / Next.js SPA',
    position: [-13.5, 4.0, 4.5],
    size: [2.5, 1.15, 0.35],
    htmlWidth: 175,
    icon: Globe,
    color: '#38bdf8',
  },
  {
    id: 'mobile-app',
    stageId: 0,
    layer: 1,
    title: 'Mobile App Client',
    subtitle: 'iOS & Android Native',
    position: [-11.0, 4.0, 2.0],
    size: [2.5, 1.15, 0.35],
    htmlWidth: 175,
    icon: Smartphone,
    color: '#38bdf8',
  },
  {
    id: 'api-consumer',
    stageId: 0,
    layer: 1,
    title: 'API Consumer',
    subtitle: 'Partner SDK / Webhook',
    position: [-8.5, 4.0, 4.5],
    size: [2.5, 1.15, 0.35],
    htmlWidth: 175,
    icon: Terminal,
    color: '#38bdf8',
  },

  // --- ZONE 1: TIER 2 EDGE / INGRESS (Terrace: Y=+1.6) ---
  {
    id: 'cdn-waf',
    stageId: 1,
    layer: 2,
    title: 'CDN / Cloud WAF',
    subtitle: 'Edge Shield & Caching',
    position: [-13.5, 1.6, -4.5],
    size: [2.5, 1.2, 0.35],
    htmlWidth: 175,
    icon: Shield,
    color: '#3b82f6',
  },
  {
    id: 'traffic-ingestion',
    stageId: 0,
    layer: 2,
    title: 'Traffic Ingestion',
    subtitle: 'HTTP/gRPC Stream',
    position: [-11.0, 1.6, -2.0],
    size: [2.7, 1.3, 0.35],
    htmlWidth: 185,
    icon: Activity,
    color: '#38bdf8',
    isPrimary: true,
  },
  {
    id: 'ingress-router',
    stageId: 1,
    layer: 2,
    title: 'Ingress Router',
    subtitle: 'Envoy Service Mesh',
    position: [-8.5, 1.6, -4.5],
    size: [2.7, 1.3, 0.35],
    htmlWidth: 185,
    icon: Network,
    color: '#3b82f6',
    isPrimary: true,
  },

  // --- ZONE 2: TIER 3 WORKLOAD (Center Bridge: Y=+1.2) ---
  {
    id: 'backend-workload',
    stageId: 2,
    layer: 3,
    title: 'Sample Web Workload',
    subtitle: 'Target Application Service',
    position: [0.0, 1.2, 0.0],
    size: [4.8, 1.3, 2.0],
    htmlWidth: 245,
    icon: Box,
    color: '#8b5cf6',
  },

  // --- ZONE 3: TIER 4 PHPA AUTOSCALING CORE (Right Stage: Y=+0.6 to +2.6) ---
  // k8s Horizon Metrics Collector Scraper
  {
    id: 'k8s-metrics',
    stageId: 3,
    layer: 4,
    title: 'k8shorizmetrics',
    subtitle: 'cAdvisor Scraper',
    position: [7.0, 0.6, 3.2],
    size: [2.6, 1.35, 0.35],
    htmlWidth: 185,
    icon: Layers,
    color: '#10b981',
    isCollector: true,
  },

  // 4 Parallel Forecasting Models (2x2 Model Lab)
  {
    id: 'model-hpa',
    stageId: 4,
    layer: 4,
    modelKey: 'hpa',
    title: 'Reactive HPA',
    subtitle: '⌈Cur × (CPU/60%)⌉',
    position: [11.5, 0.6, 3.2],
    size: [2.5, 1.05, 0.3],
    htmlWidth: 175,
    icon: Zap,
    color: '#10b981',
    isModel: true,
  },
  {
    id: 'model-ols',
    stageId: 4,
    layer: 4,
    modelKey: 'ols',
    title: 'Linear OLS Trend',
    subtitle: 'dy/dt Regression Slope',
    position: [11.5, 0.6, -0.5],
    size: [2.5, 1.05, 0.3],
    htmlWidth: 175,
    icon: Cpu,
    color: '#10b981',
    isModel: true,
  },
  {
    id: 'model-hw',
    stageId: 4,
    layer: 4,
    modelKey: 'hw',
    title: 'Holt-Winters',
    subtitle: 'Triple Exp. Smoothing',
    position: [14.0, 0.6, 3.2],
    size: [2.5, 1.05, 0.3],
    htmlWidth: 175,
    icon: Sparkles,
    color: '#10b981',
    isModel: true,
  },
  {
    id: 'model-lstm',
    stageId: 4,
    layer: 4,
    modelKey: 'lstm',
    title: '2-Layer LSTM',
    subtitle: 'Deep Sequence Model',
    position: [14.0, 0.6, -0.5],
    size: [2.5, 1.05, 0.3],
    htmlWidth: 175,
    icon: Cpu,
    color: '#10b981',
    isModel: true,
  },

  // Arbiter & Scale Actuator
  {
    id: 'max-arbiter',
    stageId: 4,
    layer: 4,
    title: 'MAX Arbiter',
    subtitle: 'Envelope Selector',
    position: [17.0, 0.6, 1.2],
    size: [2.6, 1.7, 0.35],
    htmlWidth: 190,
    icon: Shield,
    color: '#10b981',
    isArbiter: true,
  },
  {
    id: 'scale-actuator',
    stageId: 5,
    layer: 4,
    title: 'Scale Actuator',
    subtitle: 'Kube-API /scale PATCH',
    position: [17.0, 2.6, -2.5],
    size: [2.6, 1.3, 0.35],
    htmlWidth: 190,
    icon: RotateCcw,
    color: '#10b981',
    isActuator: true,
  },

  // --- ZONE 4: TIER 5 PERSISTENCE SUB-LEVEL (Foundation: Y=-3.4) ---
  {
    id: 'tsdb-store',
    stageId: 3,
    layer: 5,
    title: 'Metrics TSDB Store',
    subtitle: 'Prometheus Time-Series',
    position: [-4.5, -3.4, 0.0],
    size: [3.0, 1.3, 0.35],
    htmlWidth: 200,
    icon: Database,
    color: '#f43f5e',
  },
  {
    id: 'etcd-store',
    stageId: 5,
    layer: 5,
    title: 'Config & etcd State',
    subtitle: 'Cluster Desired State',
    position: [4.5, -3.4, 0.0],
    size: [3.0, 1.3, 0.35],
    htmlWidth: 200,
    icon: HardDrive,
    color: '#f43f5e',
  },
];

/* Clean Left-to-Right directional conduits with zero crisscross */
const ARCH_PIPES = [
  // Zone 1: Tier 1 Skydeck -> Tier 2 Ingress Deck
  { id: 'p-web-traffic', start: [-13.5, 3.4, 4.5], end: [-11.0, 2.3, -2.0], color: '#38bdf8' },
  { id: 'p-mob-traffic', start: [-11.0, 3.4, 2.0], end: [-11.0, 2.3, -2.0], color: '#38bdf8' },
  { id: 'p-api-waf', start: [-8.5, 3.4, 4.5], end: [-13.5, 2.2, -4.5], color: '#38bdf8' },
  { id: 'p-waf-traffic', start: [-12.2, 1.6, -4.5], end: [-11.0, 1.6, -2.7], color: '#3b82f6' },

  // Tier 2 Ingress Router -> Zone 2 Workload Bridge
  { id: 'p-traffic-router', start: [-9.7, 1.6, -2.0], end: [-8.5, 1.6, -3.8], color: '#3b82f6' },
  { id: 'p-router-workload', start: [-7.2, 1.6, -4.5], end: [-2.4, 1.2, 0.0], color: '#8b5cf6' },

  // Zone 2 Workload Bridge -> Zone 3 PHPA Core (Pods Cluster & Scraper)
  { id: 'p-workload-pods', start: [2.4, 1.2, 0.0], end: [4.6, 0.6, -3.5], color: '#a855f7' },
  { id: 'p-workload-metrics', start: [2.4, 1.2, 0.0], end: [5.7, 0.6, 3.2], color: '#10b981' },
  { id: 'p-pods-metrics', start: [7.0, 0.6, -1.1], end: [7.0, 0.6, 2.5], color: '#10b981' },

  // Scraper -> 4 Models (2x2 Lab)
  { id: 'p-met-hpa', start: [8.3, 0.6, 3.2], end: [10.2, 0.6, 3.2], color: '#10b981' },
  { id: 'p-met-ols', start: [8.3, 0.6, 2.8], end: [10.2, 0.6, -0.5], color: '#10b981' },
  { id: 'p-met-hw', start: [8.3, 0.6, 3.2], end: [12.7, 0.6, 3.2], color: '#10b981' },
  { id: 'p-met-lstm', start: [8.3, 0.6, 2.8], end: [12.7, 0.6, -0.5], color: '#10b981' },

  // 4 Models -> MAX Arbiter
  { id: 'p-hpa-arb', start: [12.8, 0.6, 3.2], end: [15.7, 0.6, 1.5], color: '#10b981' },
  { id: 'p-ols-arb', start: [12.8, 0.6, -0.5], end: [15.7, 0.6, 1.0], color: '#10b981' },
  { id: 'p-hw-arb', start: [15.3, 0.6, 3.2], end: [15.7, 0.6, 1.5], color: '#10b981' },
  { id: 'p-lstm-arb', start: [15.3, 0.6, -0.5], end: [15.7, 0.6, 1.0], color: '#10b981' },

  // Arbiter -> Actuator
  { id: 'p-arb-act', start: [17.0, 1.5, 1.2], end: [17.0, 2.0, -2.5], color: '#10b981' },

  // Downward Conduits into Persistence Foundation
  { id: 'p-scrape-tsdb', start: [7.0, 0.0, 3.2], end: [-4.5, -2.7, 0.0], color: '#f43f5e' },
  { id: 'p-act-etcd', start: [17.0, 2.0, -2.5], end: [4.5, -2.7, 0.0], color: '#f43f5e' },
];

/* =========================================================================
   3. Platform Slab Component
   ========================================================================= */
function PlatformSlab({ platform, isDark }) {
  return (
    <group position={platform.position}>
      <RoundedBox args={platform.size} radius={0.08} smoothness={4}>
        <meshStandardMaterial
          color={isDark ? '#080c16' : '#f8fafc'}
          roughness={0.4}
          metalness={0.15}
          transparent
          opacity={isDark ? 0.8 : 0.92}
        />
        <Edges
          color={platform.color}
          lineWidth={1.2}
          transparent
          opacity={isDark ? 0.35 : 0.55}
        />
      </RoundedBox>

      {/* Subtle tier perimeter accent stripe */}
      <mesh
        position={[-platform.size[0] / 2 + 1.8, platform.size[1] / 2 + 0.01, platform.size[2] / 2 - 0.35]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[3.4, 0.3]} />
        <meshBasicMaterial color={platform.color} transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

/* =========================================================================
   4. Circular Target Pods Cluster (Spacious 3D radial arrangement)
   ========================================================================= */
function CircularTargetPodsCluster({
  center = [7.0, 0.6, -3.5],
  actualPods = 4,
  idealDemand = 5,
  cpu = 72,
  isSelected = false,
  isDark = true,
  onSelect,
}) {
  const [hoveredPod, setHoveredPod] = useState(null);
  const ringRadius = 2.4;
  const totalPodsCount = Math.max(actualPods, 6);

  // Generate pod positions in a 3D circle around center
  const podNodes = useMemo(() => {
    const list = [];
    for (let i = 0; i < totalPodsCount; i++) {
      const angle = (i / totalPodsCount) * Math.PI * 2;
      const x = center[0] + Math.cos(angle) * ringRadius;
      const z = center[2] + Math.sin(angle) * ringRadius;
      const y = center[1] + Math.sin(angle * 2) * 0.14;
      const podCpu = Math.max(12, Math.round(cpu + Math.sin(i * 1.8) * 14));
      list.push({
        id: `pod-${i}`,
        index: i,
        position: [x, y, z],
        cpu: podCpu,
        isActive: i < actualPods,
      });
    }
    return list;
  }, [center, totalPodsCount, actualPods, cpu]);

  return (
    <group>
      {/* Radial Base Orbit Ring */}
      <mesh position={[center[0], center[1] - 0.32, center[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[ringRadius - 0.06, ringRadius + 0.06, 64]} />
        <meshBasicMaterial
          color={isSelected ? '#10b981' : isDark ? '#334155' : '#94a3b8'}
          transparent
          opacity={isDark ? 0.55 : 0.75}
        />
      </mesh>

      {/* Central Interactive Console Pedestal */}
      <group
        position={center}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(2);
        }}
        className="cursor-pointer"
      >
        <RoundedBox args={[2.1, 1.15, 0.35]} radius={0.06} smoothness={4}>
          <meshStandardMaterial
            color={isSelected ? (isDark ? '#064e3b' : '#d1fae5') : isDark ? '#0f172a' : '#ffffff'}
            metalness={0.2}
            roughness={0.25}
          />
          <Edges
            color={isSelected ? '#10b981' : isDark ? '#3b82f6' : '#94a3b8'}
            lineWidth={isSelected ? 3 : 1.5}
          />
        </RoundedBox>

        <Html
          position={[0, 0, 0.2]}
          center
          distanceFactor={18.0}
          transform
          style={{ width: '155px', pointerEvents: 'none' }}
        >
          <div
            className={`p-2 rounded border text-center font-mono select-none ${
              isDark
                ? 'bg-zinc-950/80 border-emerald-500/40 text-zinc-200'
                : 'bg-white/90 border-emerald-500/50 text-zinc-800'
            } shadow-md backdrop-blur-md`}
          >
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-500">
              <Server className="w-3.5 h-3.5" />
              <span>Target Cluster</span>
            </div>
            <div className="mt-1 flex items-center justify-center gap-2.5 text-[11px]">
              <div>
                <span className="text-[9px] block text-zinc-400">Avg CPU</span>
                <span className="font-bold text-amber-500">{cpu}%</span>
              </div>
              <div className="w-[1px] h-5 bg-zinc-300 dark:bg-zinc-700" />
              <div>
                <span className="text-[9px] block text-zinc-400">Pods</span>
                <span className="font-bold text-emerald-500">{actualPods}</span>
              </div>
            </div>
            <div className="text-[8px] text-zinc-400 mt-1">Target: 60% • Ideal: {idealDemand}</div>
          </div>
        </Html>
      </group>

      {/* Individual Radial Pod Blades */}
      {podNodes.map((pod) => (
        <group
          key={pod.id}
          position={pod.position}
          onPointerOver={() => setHoveredPod(pod.id)}
          onPointerOut={() => setHoveredPod(null)}
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(2);
          }}
        >
          {/* Miniature pod pedestal base */}
          <mesh position={[0, -0.38, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.32, 24]} />
            <meshBasicMaterial
              color={pod.isActive ? (pod.cpu > 70 ? '#f59e0b' : '#10b981') : '#71717a'}
              transparent
              opacity={0.3}
            />
          </mesh>

          <RoundedBox args={[0.6, 0.7, 0.28]} radius={0.05} smoothness={4}>
            <meshStandardMaterial
              color={
                pod.isActive
                  ? isDark
                    ? '#022c22'
                    : '#ecfdf5'
                  : isDark
                  ? '#18181b'
                  : '#f4f4f5'
              }
              roughness={0.3}
            />
            <Edges
              color={
                pod.isActive
                  ? pod.cpu > 70
                    ? '#f59e0b'
                    : '#10b981'
                  : isDark
                  ? '#3f3f46'
                  : '#cbd5e1'
              }
              lineWidth={pod.isActive ? 2 : 1}
            />
          </RoundedBox>

          <Html
            position={[0, 0, 0.16]}
            center
            distanceFactor={18.0}
            transform
            style={{ width: '65px', pointerEvents: 'none' }}
          >
            <div
              className={`p-1 rounded text-center font-mono select-none text-[8px] ${
                pod.isActive
                  ? isDark
                    ? 'bg-zinc-900/85 text-zinc-200 border border-emerald-500/40'
                    : 'bg-white/95 text-zinc-800 border border-emerald-500/50'
                  : isDark
                  ? 'bg-zinc-900/60 text-zinc-500 border border-zinc-700/30'
                  : 'bg-zinc-100 text-zinc-400 border border-zinc-300'
              } backdrop-blur-sm`}
            >
              <div className="flex items-center justify-center gap-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    pod.isActive
                      ? pod.cpu > 70
                        ? 'bg-amber-400 animate-ping'
                        : 'bg-emerald-400'
                      : 'bg-zinc-400'
                  }`}
                />
                <span className="font-bold">pod-{pod.index}</span>
              </div>
              <div
                className={`font-semibold ${
                  pod.cpu > 70 ? 'text-amber-500' : 'text-emerald-500'
                }`}
              >
                {pod.cpu}%
              </div>
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

/* =========================================================================
   5. Architecture Node Component
   ========================================================================= */
function ArchitectureNode({ node, isSelected, isDark, latest, onSelect }) {
  const Icon = node.icon;
  const [hovered, setHovered] = useState(false);

  // Dynamic telemetry values
  const rps = latest?.rps ?? 1840;
  const p95 = latest?.p95 ?? 44;
  const cpu = latest?.cpu ?? 68;
  const actualPods = latest?.actualPods ?? 4;
  const linearPred = latest?.linearPred ?? 5;
  const hwPred = latest?.hwPred ?? 6;
  const lstmPred = latest?.lstmPred ?? 7;
  const hpaPred = latest?.hpaPred ?? Math.ceil(actualPods * (cpu / 60));
  const maxVal = Math.max(hpaPred, linearPred, hwPred, lstmPred);

  // Determine model status
  let modelVal = null;
  let isWinning = false;
  if (node.isModel) {
    if (node.modelKey === 'hpa') {
      modelVal = hpaPred;
      isWinning = maxVal === hpaPred;
    } else if (node.modelKey === 'ols') {
      modelVal = linearPred;
      isWinning = maxVal === linearPred;
    } else if (node.modelKey === 'hw') {
      modelVal = hwPred;
      isWinning = maxVal === hwPred;
    } else if (node.modelKey === 'lstm') {
      modelVal = lstmPred;
      isWinning = maxVal === lstmPred;
    }
  }

  // Node background styling
  const nodeBgColor = isSelected
    ? isDark
      ? '#064e3b'
      : '#ecfdf5'
    : hovered
    ? isDark
      ? '#1e293b'
      : '#f1f5f9'
    : isDark
    ? '#0f172a'
    : '#ffffff';

  const borderColor = isSelected
    ? '#10b981'
    : isWinning
    ? '#10b981'
    : hovered
    ? node.color
    : isDark
    ? '#334155'
    : '#cbd5e1';

  return (
    <group
      position={node.position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(node.stageId);
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      className="cursor-pointer"
    >
      {/* 3D Box Chassis */}
      <RoundedBox args={node.size} radius={0.06} smoothness={4}>
        <meshStandardMaterial color={nodeBgColor} metalness={0.15} roughness={0.3} />
        <Edges color={borderColor} lineWidth={isSelected || isWinning ? 3 : hovered ? 2 : 1.2} />
      </RoundedBox>

      {/* Winning Model Halo Ring */}
      {isWinning && (
        <mesh position={[0, 0, -0.05]} rotation={[0, 0, 0]}>
          <ringGeometry args={[node.size[0] * 0.52, node.size[0] * 0.55, 32]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.7} />
        </mesh>
      )}

      {/* Compact Micro-HUD Tag */}
      <Html
        position={[0, 0, node.size[2] * 0.5 + 0.02]}
        center
        distanceFactor={18.0}
        transform
        style={{ width: `${node.htmlWidth}px`, pointerEvents: 'none' }}
      >
        <div
          className={`p-1.5 rounded font-mono select-none transition-all duration-150 ${
            isDark
              ? 'bg-zinc-950/80 text-zinc-100 border border-zinc-800/80 shadow-md'
              : 'bg-white/90 text-zinc-900 border border-zinc-200/90 shadow-sm'
          } backdrop-blur-md`}
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span style={{ color: node.color }} className="flex-shrink-0">
                <Icon className="w-3.5 h-3.5" />
              </span>
              <span className="text-[10px] font-bold truncate">{node.title}</span>
            </div>
            {isWinning && (
              <span className="text-[7px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-500 font-bold border border-emerald-500/40 animate-pulse">
                WINNER
              </span>
            )}
          </div>

          <div className="text-[8px] text-zinc-400 dark:text-zinc-500 truncate mb-1">
            {node.subtitle}
          </div>

          {/* Node-specific dynamic telemetry widgets */}
          {node.id === 'traffic-ingestion' && (
            <div className="flex items-center justify-between text-[9px] bg-zinc-100 dark:bg-zinc-900/80 px-1.5 py-0.5 rounded">
              <span className="text-zinc-500">Rate:</span>
              <span className="font-bold text-sky-500">{rps} RPS</span>
            </div>
          )}

          {node.id === 'ingress-router' && (
            <div className="flex items-center justify-between text-[9px] bg-zinc-100 dark:bg-zinc-900/80 px-1.5 py-0.5 rounded">
              <span className="text-zinc-500">P95 Lat:</span>
              <span className="font-bold text-blue-500">{p95}ms</span>
            </div>
          )}

          {node.id === 'backend-workload' && (
            <div className="flex items-center justify-between text-[9px] bg-zinc-100 dark:bg-zinc-900/80 px-1.5 py-0.5 rounded">
              <span className="text-zinc-500">Replica Target:</span>
              <span className="font-bold text-purple-500">{actualPods} active pods</span>
            </div>
          )}

          {node.id === 'k8s-metrics' && (
            <div className="flex items-center justify-between text-[9px] bg-zinc-100 dark:bg-zinc-900/80 px-1.5 py-0.5 rounded">
              <span className="text-zinc-500">Cadence:</span>
              <span className="font-bold text-emerald-500">15s cAdvisor</span>
            </div>
          )}

          {node.isModel && (
            <div className="flex items-center justify-between text-[9px] bg-zinc-100 dark:bg-zinc-900/80 px-1.5 py-0.5 rounded">
              <span className="text-zinc-500">Pred:</span>
              <span
                className={`font-bold ${
                  isWinning ? 'text-emerald-500 underline' : 'text-zinc-300 dark:text-zinc-400'
                }`}
              >
                {modelVal} pods
              </span>
            </div>
          )}

          {node.isArbiter && (
            <div className="flex items-center justify-between text-[9px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Winning MAX:</span>
              <span className="font-extrabold text-emerald-500 text-[10px]">{maxVal} pods</span>
            </div>
          )}

          {node.isActuator && (
            <div className="flex items-center justify-between text-[9px] bg-zinc-100 dark:bg-zinc-900/80 px-1.5 py-0.5 rounded">
              <span className="text-zinc-500">Actuating:</span>
              <span className="font-bold text-emerald-500">PATCH → {maxVal}</span>
            </div>
          )}

          {(node.id === 'tsdb-store' || node.id === 'etcd-store') && (
            <div className="flex items-center justify-between text-[8px] bg-zinc-100 dark:bg-zinc-900/80 px-1.5 py-0.5 rounded text-rose-500">
              <span>Status:</span>
              <span className="font-bold">SYNCED</span>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

/* =========================================================================
   6. Closed Feedback Loop Conduit with Traveling Photons
   ========================================================================= */
function ClosedFeedbackLoopPipe({ isDark }) {
  const curve = useMemo(() => {
    // Arching 3D bezier from Scale Actuator [17.0, 2.6, -2.5] back to Pod Cluster [7.0, 1.2, -3.5]
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(17.0, 2.6, -2.5),
      new THREE.Vector3(12.0, 5.8, -3.5),
      new THREE.Vector3(7.0, 1.2, -3.5)
    );
  }, []);

  const points = useMemo(() => curve.getPoints(60), [curve]);
  const photonRef = useRef();

  useFrame(({ clock }) => {
    if (!photonRef.current) return;
    const t = (clock.getElapsedTime() * 0.45) % 1;
    const pos = curve.getPoint(t);
    photonRef.current.position.set(pos.x, pos.y, pos.z);
  });

  return (
    <group>
      <Line
        points={points}
        color="#10b981"
        lineWidth={3.5}
        dashed
        dashScale={2.5}
        dashSize={0.4}
        gapSize={0.25}
        transparent
        opacity={isDark ? 0.95 : 0.85}
      />

      {/* Traveling Feedback Actuation Photon */}
      <mesh ref={photonRef}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#34d399" />
      </mesh>
    </group>
  );
}

/* =========================================================================
   7. Continuous Animated Traveling Photons Across All Inter-Layer Pipes
   ========================================================================= */
function ArchitecturePhotons({ pipes = ARCH_PIPES, isDark = true }) {
  const photonsRef = useRef([]);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    pipes.forEach((pipe, i) => {
      const el = photonsRef.current[i];
      if (!el) return;
      const speed = 0.55 + (i % 4) * 0.15;
      const t = (elapsed * speed + i * 0.25) % 1;
      const x = pipe.start[0] + (pipe.end[0] - pipe.start[0]) * t;
      const y = pipe.start[1] + (pipe.end[1] - pipe.start[1]) * t;
      const z = pipe.start[2] + (pipe.end[2] - pipe.start[2]) * t;
      el.position.set(x, y, z);
    });
  });

  return (
    <group>
      {pipes.map((pipe, idx) => (
        <mesh
          key={pipe.id}
          ref={(r) => {
            photonsRef.current[idx] = r;
          }}
        >
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshBasicMaterial color={pipe.color} />
        </mesh>
      ))}
    </group>
  );
}

/* =========================================================================
   8. Camera Controller with Smooth GSAP Presets and Orbit Controls
   ========================================================================= */
function CameraController({ viewPreset = 'isometric', isOrbiting = false }) {
  const { camera } = useThree();
  const controlsRef = useRef();

  useEffect(() => {
    if (!camera) return;
    if (viewPreset === 'isometric') {
      // Grand Left-to-Right Campus Isometric Overview
      gsap.to(camera.position, { x: 24, y: 24, z: 28, duration: 1.1, ease: 'power2.inOut' });
      if (controlsRef.current) gsap.to(controlsRef.current.target, { x: 3.0, y: 0.0, z: 0.0, duration: 1.1 });
    } else if (viewPreset === 'core') {
      // Direct focus on Tier 4 PHPA Predictive Core Platform
      gsap.to(camera.position, { x: 14, y: 10, z: 8, duration: 1.1, ease: 'power2.inOut' });
      if (controlsRef.current) gsap.to(controlsRef.current.target, { x: 12.0, y: 0.5, z: 0.0, duration: 1.1 });
    } else if (viewPreset === 'front') {
      // Direct frontal terrace view
      gsap.to(camera.position, { x: 2, y: 10, z: 32, duration: 1.1, ease: 'power2.inOut' });
      if (controlsRef.current) gsap.to(controlsRef.current.target, { x: 2.0, y: 0.0, z: 0.0, duration: 1.1 });
    } else if (viewPreset === 'top') {
      // Clean overhead architectural campus blueprint
      gsap.to(camera.position, { x: 3, y: 38, z: 0, duration: 1.1, ease: 'power2.inOut' });
      if (controlsRef.current) gsap.to(controlsRef.current.target, { x: 3.0, y: 0.0, z: 0.0, duration: 1.1 });
    }
  }, [viewPreset, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan
      enableZoom
      enableRotate
      autoRotate={isOrbiting}
      autoRotateSpeed={1.8}
      dampingFactor={0.08}
      maxPolarAngle={Math.PI / 2 + 0.05}
      minDistance={6}
      maxDistance={70}
    />
  );
}

/* =========================================================================
   9. Floating 3D Legend HUD (5 Tiers)
   ========================================================================= */
function LayerLegendHUD({ isDark }) {
  return (
    <div
      className={`absolute bottom-3 left-3 z-20 pointer-events-none p-2.5 rounded-lg border font-mono text-[10px] select-none ${
        isDark
          ? 'bg-zinc-950/85 border-zinc-800 text-zinc-300'
          : 'bg-white/90 border-zinc-300 text-zinc-700'
      } backdrop-blur-md shadow-lg`}
    >
      <div className="font-bold text-[11px] mb-1.5 text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
        <Layers className="w-3.5 h-3.5 text-emerald-500" />
        <span>Architectural Tiers</span>
      </div>
      <div className="space-y-1">
        {Object.entries(ARCH_LAYERS).map(([tier, meta]) => (
          <div key={tier} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: meta.color }} />
            <span className="font-medium">{meta.name}</span>
            <span className="text-[8px] text-zinc-400 ml-auto">{meta.badge}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   10. Primary Export: Pipeline3DCanvas Component
   ========================================================================= */
export default function Pipeline3DCanvas({
  theme,
  viewPreset = 'isometric',
  isOrbiting = false,
  selectedStage = 0,
  onSelectStage,
  latest = {},
}) {
  const isDark = useAppTheme(theme);

  // Background and Grid colors
  const bgColor = isDark ? '#09090b' : '#f8fafc';
  const gridPrimary = isDark ? '#27272a' : '#cbd5e1';
  const gridSecondary = isDark ? '#18181b' : '#e2e8f0';

  // Live values
  const dynamicLatest = {
    rps: latest.currentRPS ?? 1840,
    p95: latest.currentP95 ?? 44,
    cpu: latest.currentCPU ?? 68,
    actualPods: latest.actualPods ?? 4,
    idealDemand: latest.idealDemand ?? 5,
    linearPred: latest.linearPred ?? 5,
    hwPred: latest.hwPred ?? 6,
    lstmPred: latest.lstmPred ?? 7,
    hpaPred: latest.hpaPred ?? Math.ceil((latest.actualPods ?? 4) * ((latest.currentCPU ?? 68) / 60)),
  };

  return (
    <div
      className={`w-full h-full min-h-[480px] sm:min-h-[600px] md:min-h-[720px] relative select-none overflow-hidden rounded-2xl transition-colors duration-200 ${
        isDark ? 'bg-zinc-950' : 'bg-slate-50'
      }`}
    >
      {/* Floating 5-Layer Color Legend HUD */}
      <LayerLegendHUD isDark={isDark} />

      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
        }}
        camera={{ position: [24, 24, 28], fov: 42 }}
      >
        {/* Dynamic theme background */}
        <color attach="background" args={[bgColor]} />

        {/* Ambient & Directional Studio Lighting */}
        <ambientLight intensity={isDark ? 0.65 : 0.95} />
        <directionalLight
          position={[14, 22, 14]}
          intensity={isDark ? 1.4 : 1.6}
          color="#ffffff"
        />
        <directionalLight
          position={[-12, 10, -12]}
          intensity={isDark ? 0.4 : 0.6}
          color="#94a3b8"
        />

        {/* Camera and Uninterrupted Orbit Controls */}
        <CameraController viewPreset={viewPreset} isOrbiting={isOrbiting} />

        {/* Clean Ground Grid */}
        <gridHelper
          args={[60, 60, gridPrimary, gridSecondary]}
          position={[0, -5.0, 0]}
        />

        {/* Architectural Tier Grounding Slabs */}
        {TIER_PLATFORMS.map((plat) => (
          <PlatformSlab key={plat.id} platform={plat} isDark={isDark} />
        ))}

        {/* Directional 3D Pipes between Layers */}
        {ARCH_PIPES.map((pipe) => (
          <Line
            key={pipe.id}
            points={[pipe.start, pipe.end]}
            color={pipe.color}
            lineWidth={2.8}
            transparent
            opacity={0.8}
          />
        ))}

        {/* Continuous 3D Traveling Photons */}
        <ArchitecturePhotons pipes={ARCH_PIPES} isDark={isDark} />

        {/* Closed Feedback Loop Pipe (Scale Actuator -> Target Pods Cluster) */}
        <ClosedFeedbackLoopPipe isDark={isDark} />

        {/* Centerpiece: Circular Target Pods Cluster */}
        <CircularTargetPodsCluster
          center={[7.0, 0.6, -3.5]}
          actualPods={dynamicLatest.actualPods}
          idealDemand={dynamicLatest.idealDemand}
          cpu={dynamicLatest.cpu}
          isSelected={selectedStage === 2}
          isDark={isDark}
          onSelect={onSelectStage}
        />

        {/* All Other Architecture Nodes Across Layers 1, 2, 3, 4, 5 */}
        {ARCH_NODES.map((node) => (
          <ArchitectureNode
            key={node.id}
            node={node}
            isSelected={selectedStage === node.stageId}
            isDark={isDark}
            latest={dynamicLatest}
            onSelect={onSelectStage}
          />
        ))}
      </Canvas>
    </div>
  );
}
