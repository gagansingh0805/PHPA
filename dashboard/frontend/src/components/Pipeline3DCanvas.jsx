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
   2. Tier Platform Slabs (Vertical Cascade from Top to Bottom)
   ========================================================================= */
const ARCH_LAYERS = {
  1: { name: 'Client Skydeck', color: '#38bdf8', badge: 'Tier 1' },
  2: { name: 'Edge & Ingress Mesh', color: '#3b82f6', badge: 'Tier 2' },
  3: { name: 'Backend Workload Bridge', color: '#8b5cf6', badge: 'Tier 3' },
  4: { name: 'PHPA Predictive Core Stage', color: '#10b981', badge: 'Centerpiece' },
  5: { name: 'Persistence Foundation', color: '#f43f5e', badge: 'Tier 5' },
};

const TIER_PLATFORMS = [
  // Tier 1: Client Skydeck (Top: Y = +7.2, Z = +5.5)
  {
    id: 'plat-1',
    layer: 1,
    position: [0.0, 6.4, 5.5],
    size: [48.0, 0.3, 6.0],
    color: '#38bdf8',
    label: 'TIER 1 • CLIENT SKYDECK',
  },
  // Tier 2: Ingress & Edge (Upper Mid: Y = +3.2, Z = +3.0)
  {
    id: 'plat-2',
    layer: 2,
    position: [0.0, 2.4, 3.0],
    size: [48.0, 0.3, 6.0],
    color: '#3b82f6',
    label: 'TIER 2 • EDGE & INGRESS MESH',
  },
  // Tier 3: Workload Service (Center: Y = -0.6, Z = 0.0)
  {
    id: 'plat-3',
    layer: 3,
    position: [0.0, -1.2, 0.0],
    size: [24.0, 0.3, 6.5],
    color: '#8b5cf6',
    label: 'TIER 3 • TARGET WORKLOAD SERVICE',
  },
  // Tier 4: PHPA Core Control Plane (Grand Wide Centerpiece: Y = -5.4, Z = -3.5)
  {
    id: 'plat-4',
    layer: 4,
    position: [0.0, -5.4, -3.5],
    size: [64.0, 0.35, 15.0],
    color: '#10b981',
    label: 'TIER 4 • PHPA PREDICTIVE CONTROL PLANE (CENTERPIECE)',
  },
  // Tier 5: Persistence Foundation (Sub-Level: Y = -9.8, Z = +2.5)
  {
    id: 'plat-5',
    layer: 5,
    position: [0.0, -9.8, 2.5],
    size: [48.0, 0.3, 6.0],
    color: '#f43f5e',
    label: 'TIER 5 • STATE & METRICS TSDB PERSISTENCE',
  },
];

/* Solid 3D Server Pedestals: Vertical Tiers & Wide Horizontal Spread */
const ARCH_NODES = [
  // --- TIER 1: CLIENT SKYDECK (Y = +7.2, Z = +5.5) ---
  {
    id: 'web-app',
    stageId: 0,
    layer: 1,
    title: 'Web App Client',
    subtitle: 'React / Next.js SPA',
    position: [-16.0, 7.2, 5.5],
    size: [4.4, 0.9, 2.6],
    icon: Globe,
    color: '#38bdf8',
  },
  {
    id: 'mobile-app',
    stageId: 0,
    layer: 1,
    title: 'Mobile App Client',
    subtitle: 'iOS & Android Native',
    position: [0.0, 7.2, 5.5],
    size: [4.4, 0.9, 2.6],
    icon: Smartphone,
    color: '#38bdf8',
  },
  {
    id: 'api-consumer',
    stageId: 0,
    layer: 1,
    title: 'API Consumer',
    subtitle: 'Partner SDK / Webhook',
    position: [16.0, 7.2, 5.5],
    size: [4.4, 0.9, 2.6],
    icon: Terminal,
    color: '#38bdf8',
  },

  // --- TIER 2: EDGE & INGRESS MESH (Y = +3.2, Z = +3.0) ---
  {
    id: 'cdn-waf',
    stageId: 1,
    layer: 2,
    title: 'CDN / Cloud WAF',
    subtitle: 'Edge Shield & Caching',
    position: [-16.0, 3.2, 3.0],
    size: [4.4, 0.9, 2.6],
    icon: Shield,
    color: '#3b82f6',
  },
  {
    id: 'traffic-ingestion',
    stageId: 0,
    layer: 2,
    title: 'Traffic Ingestion',
    subtitle: 'HTTP/gRPC Live Stream',
    position: [0.0, 3.2, 3.0],
    size: [4.8, 0.9, 2.6],
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
    position: [16.0, 3.2, 3.0],
    size: [4.8, 0.9, 2.6],
    icon: Network,
    color: '#3b82f6',
    isPrimary: true,
  },

  // --- TIER 3: BACKEND WORKLOAD BRIDGE (Y = -0.6, Z = 0.0) ---
  {
    id: 'backend-workload',
    stageId: 2,
    layer: 3,
    title: 'Sample Web Workload',
    subtitle: 'Target Application Cluster',
    position: [0.0, -0.6, 0.0],
    size: [8.5, 1.1, 3.6],
    icon: Box,
    color: '#8b5cf6',
  },

  // --- TIER 4: PHPA PREDICTIVE AUTOSCALING CORE (Y = -4.6) ---
  // k8s Horizon Metrics Collector Scraper
  {
    id: 'k8s-metrics',
    stageId: 3,
    layer: 4,
    title: 'k8shorizmetrics',
    subtitle: 'cAdvisor Scraper 15s',
    position: [-10.5, -4.6, -3.5],
    size: [4.4, 0.9, 2.6],
    icon: Layers,
    color: '#10b981',
    isCollector: true,
  },

  // 4 Staggered Parallel Forecasting Models (Non-overlapping staggered lanes)
  {
    id: 'model-hpa',
    stageId: 4,
    layer: 4,
    modelKey: 'hpa',
    title: 'Reactive HPA',
    subtitle: '⌈Cur × (CPU/60%)⌉',
    position: [-3.0, -4.6, -5.8],
    size: [4.2, 0.85, 2.4],
    icon: Zap,
    color: '#10b981',
    isModel: true,
  },
  {
    id: 'model-ols',
    stageId: 4,
    layer: 4,
    modelKey: 'ols',
    title: 'Linear OLS',
    subtitle: 'dy/dt Regression Slope',
    position: [3.5, -4.6, -2.0],
    size: [4.2, 0.85, 2.4],
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
    position: [10.0, -4.6, -5.8],
    size: [4.2, 0.85, 2.4],
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
    subtitle: 'Deep Sequence Predictor',
    position: [16.5, -4.6, -2.0],
    size: [4.2, 0.85, 2.4],
    icon: Cpu,
    color: '#10b981',
    isModel: true,
  },

  // Decision Arbiter & Scale Actuator (Well-separated lanes in X and Z)
  {
    id: 'max-arbiter',
    stageId: 4,
    layer: 4,
    title: 'MAX Arbiter',
    subtitle: 'Envelope Decision Engine',
    position: [23.5, -4.6, -5.8],
    size: [4.6, 1.1, 2.6],
    icon: Shield,
    color: '#10b981',
    isArbiter: true,
  },
  {
    id: 'scale-actuator',
    stageId: 5,
    layer: 4,
    title: 'Scale Actuator',
    subtitle: 'Kube-API /scale PATCH Client',
    position: [23.5, -3.2, 0.5],
    size: [4.6, 0.9, 2.4],
    icon: RotateCcw,
    color: '#10b981',
    isActuator: true,
  },

  // --- TIER 5: PERSISTENCE FOUNDATION (Y = -9.0, Z = +2.5) ---
  {
    id: 'tsdb-store',
    stageId: 3,
    layer: 5,
    title: 'Metrics TSDB Store',
    subtitle: 'Prometheus Historical TSDB',
    position: [-14.0, -9.0, 2.5],
    size: [5.2, 0.9, 2.6],
    icon: Database,
    color: '#f43f5e',
  },
  {
    id: 'etcd-store',
    stageId: 5,
    layer: 5,
    title: 'Config & etcd State',
    subtitle: 'Cluster Desired State',
    position: [14.0, -9.0, 2.5],
    size: [5.2, 0.9, 2.6],
    icon: HardDrive,
    color: '#f43f5e',
  },
];

/* Clean Directional Conduits with Smooth Photon Flow */
const ARCH_PIPES = [
  // Tier 1 -> Tier 2 (Vertical descent)
  { id: 'p-web-traffic', start: [-16.0, 6.7, 5.5], end: [-16.0, 3.8, 3.0], color: '#38bdf8' },
  { id: 'p-mob-traffic', start: [0.0, 6.7, 5.5], end: [0.0, 3.8, 3.0], color: '#38bdf8' },
  { id: 'p-api-waf', start: [16.0, 6.7, 5.5], end: [16.0, 3.8, 3.0], color: '#38bdf8' },

  // Tier 2 internal flow
  { id: 'p-waf-traffic', start: [-13.5, 3.2, 3.0], end: [-2.6, 3.2, 3.0], color: '#3b82f6' },
  { id: 'p-traffic-router', start: [2.6, 3.2, 3.0], end: [13.5, 3.2, 3.0], color: '#3b82f6' },

  // Tier 2 Ingress -> Tier 3 Workload Bridge
  { id: 'p-router-workload', start: [16.0, 2.6, 3.0], end: [4.5, -0.2, 0.0], color: '#8b5cf6' },

  // Tier 3 Workload -> Tier 4 Core (Pods & Scraper)
  { id: 'p-workload-pods', start: [-4.5, -0.6, 0.0], end: [-17.0, -4.6, -3.5], color: '#a855f7' },
  { id: 'p-workload-metrics', start: [-2.0, -1.0, 0.0], end: [-10.5, -4.0, -3.5], color: '#10b981' },
  { id: 'p-pods-metrics', start: [-17.0, -4.6, -3.5], end: [-12.8, -4.6, -3.5], color: '#10b981' },

  // Scraper -> 4 Models
  { id: 'p-met-hpa', start: [-8.2, -4.6, -3.5], end: [-5.2, -4.6, -5.8], color: '#10b981' },
  { id: 'p-met-ols', start: [-8.2, -4.6, -3.5], end: [1.3, -4.6, -2.0], color: '#10b981' },
  { id: 'p-met-hw', start: [-8.2, -4.6, -3.5], end: [7.8, -4.6, -5.8], color: '#10b981' },
  { id: 'p-met-lstm', start: [-8.2, -4.6, -3.5], end: [14.3, -4.6, -2.0], color: '#10b981' },

  // 4 Models -> MAX Arbiter
  { id: 'p-hpa-arb', start: [-0.8, -4.6, -5.8], end: [21.0, -4.6, -5.8], color: '#10b981' },
  { id: 'p-ols-arb', start: [5.7, -4.6, -2.0], end: [21.0, -4.6, -5.8], color: '#10b981' },
  { id: 'p-hw-arb', start: [12.2, -4.6, -5.8], end: [21.0, -4.6, -5.8], color: '#10b981' },
  { id: 'p-lstm-arb', start: [18.7, -4.6, -2.0], end: [21.0, -4.6, -5.8], color: '#10b981' },

  // Arbiter -> Actuator
  { id: 'p-arb-act', start: [23.5, -4.0, -5.8], end: [23.5, -3.6, 0.5], color: '#10b981' },

  // Tier 4 -> Tier 5 Foundation Persistence
  { id: 'p-scrape-tsdb', start: [-10.5, -5.2, -3.5], end: [-14.0, -8.5, 2.5], color: '#f43f5e' },
  { id: 'p-act-etcd', start: [23.5, -3.6, 0.5], end: [14.0, -8.5, 2.5], color: '#f43f5e' },
];

/* =========================================================================
   3. Platform Slab Component
   ========================================================================= */
function PlatformSlab({ platform, isDark }) {
  return (
    <group position={platform.position}>
      <RoundedBox args={platform.size} radius={0.12} smoothness={4}>
        <meshStandardMaterial
          color={isDark ? '#080c16' : '#f8fafc'}
          roughness={0.4}
          metalness={0.18}
          transparent
          opacity={isDark ? 0.85 : 0.95}
        />
        <Edges
          color={platform.color}
          lineWidth={1.5}
          transparent
          opacity={isDark ? 0.45 : 0.7}
        />
      </RoundedBox>

      {/* Perimeter Accent Strip */}
      <mesh
        position={[-platform.size[0] / 2 + 3.0, platform.size[1] / 2 + 0.01, platform.size[2] / 2 - 0.4]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[5.0, 0.35]} />
        <meshBasicMaterial color={platform.color} transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

/* =========================================================================
   4. Grand Circular Target Pods Cluster (Radius = 3.2 units)
   ========================================================================= */
function CircularTargetPodsCluster({
  center = [-20.0, -4.6, -3.5],
  actualPods = 4,
  idealDemand = 5,
  cpu = 72,
  isSelected = false,
  isDark = true,
  probeHop = 0,
  isModalOpen = false,
  onSelect,
}) {
  const ringRadius = 3.2;
  const totalPodsCount = Math.max(actualPods, 6);
  const isActiveProbe = probeHop === 3 || probeHop === 6;

  // Generate pod positions in a 3D circle around center
  const podNodes = useMemo(() => {
    const list = [];
    for (let i = 0; i < totalPodsCount; i++) {
      const angle = (i / totalPodsCount) * Math.PI * 2;
      const x = center[0] + Math.cos(angle) * ringRadius;
      const z = center[2] + Math.sin(angle) * ringRadius;
      const y = center[1] + 0.35 + Math.sin(angle * 2) * 0.12;
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
      <mesh position={[center[0], center[1] - 0.2, center[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[ringRadius - 0.08, ringRadius + 0.08, 64]} />
        <meshBasicMaterial
          color={isActiveProbe ? '#f59e0b' : isSelected ? '#10b981' : isDark ? '#334155' : '#94a3b8'}
          transparent
          opacity={isActiveProbe ? 0.9 : isDark ? 0.6 : 0.8}
        />
      </mesh>

      {/* Central Interactive Console Pedestal */}
      <group
        position={[center[0], center[1] + 0.5, center[2]]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(2);
        }}
        className="cursor-pointer"
      >
        <RoundedBox args={[2.8, 1.1, 2.0]} radius={0.08} smoothness={4}>
          <meshStandardMaterial
            color={isSelected ? (isDark ? '#064e3b' : '#d1fae5') : isDark ? '#0f172a' : '#ffffff'}
            metalness={0.25}
            roughness={0.2}
          />
          <Edges
            color={isActiveProbe ? '#f59e0b' : isSelected ? '#10b981' : isDark ? '#3b82f6' : '#94a3b8'}
            lineWidth={isActiveProbe || isSelected ? 3.5 : 1.5}
          />
        </RoundedBox>

        {/* Billboard HUD Screen: ALWAYS faces the camera, hidden when modal is open */}
        {!isModalOpen && (
          <Html
            position={[0, 1.0, 0]}
            center
            distanceFactor={13.5}
            zIndexRange={[50, 0]}
            style={{ pointerEvents: 'none' }}
          >
          <div
            className={`p-2 rounded-xl border text-center font-mono select-none ${
              isActiveProbe
                ? 'bg-zinc-950/95 border-amber-500 text-zinc-100 shadow-2xl ring-2 ring-amber-500/30'
                : isDark
                ? 'bg-zinc-950/90 border-emerald-500/50 text-zinc-200 shadow-2xl'
                : 'bg-white/95 border-emerald-500/60 text-zinc-800 shadow-xl'
            } backdrop-blur-md`}
            style={{ width: '160px' }}
          >
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-500">
              <Server className="w-3.5 h-3.5" />
              <span>Target Pods Cluster</span>
            </div>
            {isActiveProbe && (
              <div className="my-1 flex items-center justify-between text-[10px] bg-amber-500/20 border border-amber-500/40 text-amber-500 dark:text-amber-400 px-2 py-0.5 rounded font-bold animate-pulse">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  {probeHop === 3 ? 'WORKLOAD INGESTION' : 'CONTROL LOOP CLOSED ✓'}
                </span>
                <span>HOP {probeHop}</span>
              </div>
            )}
            <div className="mt-1 flex items-center justify-center gap-2.5 text-xs">
              <div>
                <span className="text-[9px] block text-zinc-400">Avg CPU</span>
                <span className="font-bold text-amber-500">{cpu}%</span>
              </div>
              <div className="w-[1px] h-5 bg-zinc-300 dark:bg-zinc-700" />
              <div>
                <span className="text-[9px] block text-zinc-400">Replicas</span>
                <span className="font-bold text-emerald-500">{actualPods} pods</span>
              </div>
            </div>
            <div className="text-[9px] text-zinc-400 mt-0.5">Target: 60% • Ideal: {idealDemand}</div>
          </div>
        </Html>
      )}
      </group>

      {/* Individual Radial Pod Blades */}
      {podNodes.map((pod) => (
        <group
          key={pod.id}
          position={pod.position}
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(2);
          }}
          className="cursor-pointer"
        >
          {/* Miniature base disc */}
          <mesh position={[0, -0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.55, 24]} />
            <meshBasicMaterial
              color={pod.isActive ? (pod.cpu > 70 ? '#f59e0b' : '#10b981') : '#71717a'}
              transparent
              opacity={0.3}
            />
          </mesh>

          {/* Solid 3D Pod Hardware Blade */}
          <RoundedBox args={[1.2, 0.65, 0.9]} radius={0.06} smoothness={4}>
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
              metalness={0.2}
              roughness={0.25}
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

          {/* Status LED on top */}
          <mesh position={[0, 0.38, 0]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshBasicMaterial
              color={pod.isActive ? (pod.cpu > 70 ? '#fbbf24' : '#34d399') : '#9ca3af'}
            />
          </mesh>

          {/* Billboard Pod Micro-Badge: render ONLY when modal is closed */}
          {!isModalOpen && (
            <Html
              position={[0, 0.75, 0]}
              center
              distanceFactor={13.5}
              zIndexRange={[50, 0]}
              style={{ pointerEvents: 'none' }}
            >
              <div
                className={`px-1.5 py-0.5 rounded-lg text-center font-mono select-none text-[9px] ${
                  pod.isActive
                    ? isDark
                      ? 'bg-zinc-900/90 text-zinc-100 border border-emerald-500/50'
                      : 'bg-white/95 text-zinc-800 border border-emerald-500/60'
                    : isDark
                    ? 'bg-zinc-900/60 text-zinc-500 border border-zinc-700/30'
                    : 'bg-zinc-100 text-zinc-400 border border-zinc-300'
                } backdrop-blur-md shadow-md`}
                style={{ minWidth: '60px' }}
              >
                <div className="flex items-center justify-center gap-1 font-bold">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      pod.isActive
                        ? pod.cpu > 70
                          ? 'bg-amber-400 animate-ping'
                          : 'bg-emerald-400'
                        : 'bg-zinc-400'
                    }`}
                  />
                  <span>pod-{pod.index}</span>
                </div>
                <div
                  className={`font-semibold text-[8px] ${
                    pod.cpu > 70 ? 'text-amber-500' : 'text-emerald-500'
                  }`}
                >
                  {pod.cpu}% CPU
                </div>
              </div>
            </Html>
          )}
        </group>
      ))}
    </group>
  );
}

/* =========================================================================
   5. Architecture Node Component (Solid 3D Hardware Pedestal + Billboard HUD)
   ========================================================================= */
function ArchitectureNode({ node, isSelected, isDark, latest, probeHop = 0, isModalOpen = false, onSelect }) {
  const Icon = node.icon;
  const [hovered, setHovered] = useState(false);

  // Check if this node is active during the current probe hop
  const isActiveProbe = (
    (probeHop === 1 && (node.id === 'traffic-ingestion' || node.layer === 1)) ||
    (probeHop === 2 && node.id === 'ingress-router') ||
    (probeHop === 3 && node.id === 'backend-workload') ||
    (probeHop === 4 && node.id === 'k8s-metrics') ||
    (probeHop === 5 && (node.isModel || node.id === 'max-arbiter')) ||
    (probeHop === 6 && node.id === 'scale-actuator')
  );

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
  const nodeBgColor = isActiveProbe
    ? isDark
      ? '#271f0c'
      : '#fffbeb'
    : isSelected
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

  const borderColor = isActiveProbe
    ? '#f59e0b'
    : isSelected
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
      {/* Solid 3D Hardware Pedestal Chassis */}
      <RoundedBox args={node.size} radius={0.08} smoothness={4}>
        <meshStandardMaterial color={nodeBgColor} metalness={0.25} roughness={0.25} />
        <Edges
          color={borderColor}
          lineWidth={isActiveProbe ? 3.5 : isSelected || isWinning ? 3 : hovered ? 2 : 1.2}
        />
      </RoundedBox>

      {/* Top Accent Light Disc */}
      <mesh position={[0, node.size[1] / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[node.size[0] * 0.85, node.size[2] * 0.85]} />
        <meshBasicMaterial
          color={isActiveProbe ? '#f59e0b' : node.color}
          transparent
          opacity={isActiveProbe ? 0.35 : 0.12}
        />
      </mesh>

      {/* Pulsing Status LED Beacon */}
      <mesh position={[node.size[0] / 2 - 0.35, node.size[1] / 2 + 0.08, -node.size[2] / 2 + 0.35]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={isActiveProbe ? '#f59e0b' : node.color} />
      </mesh>

      {/* Winning Model Halo Ring on Platform */}
      {isWinning && (
        <mesh position={[0, -node.size[1] / 2 - 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[node.size[0] * 0.52, node.size[0] * 0.58, 48]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.8} />
        </mesh>
      )}

      {/* Billboard HUD Panel: render ONLY when modal is closed */}
      {!isModalOpen && (
        <Html
          position={[0, node.size[1] / 2 + 0.9, 0]}
          center
          distanceFactor={13.5}
          zIndexRange={[50, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div
            className={`p-2 rounded-xl font-mono select-none transition-all duration-200 ${
              isActiveProbe
                ? 'bg-zinc-950/95 text-zinc-100 border border-amber-500 shadow-2xl ring-2 ring-amber-500/30'
                : isDark
                ? 'bg-zinc-950/90 text-zinc-100 border border-zinc-750/80 shadow-2xl'
                : 'bg-white/95 text-zinc-900 border border-zinc-300 shadow-xl'
            } backdrop-blur-md`}
            style={{ minWidth: node.isModel ? '150px' : '175px', maxWidth: node.isModel ? '180px' : '210px' }}
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <div className="flex items-center gap-1.5 overflow-hidden">
                <span style={{ color: isActiveProbe ? '#f59e0b' : node.color }} className="flex-shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span className="text-[11px] font-bold truncate">{node.title}</span>
              </div>
              {isWinning ? (
                <span className="text-[8px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-500 font-bold border border-emerald-500/40 animate-pulse">
                  WINNER
                </span>
              ) : isActiveProbe ? (
                <span className="text-[8px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/40 animate-pulse">
                  HOP {probeHop}
                </span>
              ) : null}
            </div>

            <div className="text-[9px] text-zinc-400 dark:text-zinc-500 truncate mb-1">
              {node.subtitle}
            </div>

            {isActiveProbe && (
              <div className="my-1 flex items-center justify-between text-[10px] bg-amber-500/15 border border-amber-500/30 text-amber-500 dark:text-amber-400 px-2 py-0.5 rounded font-bold animate-pulse">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  PROBE ACTIVE
                </span>
                <span>HOP {probeHop}</span>
              </div>
            )}

            {/* Node-specific dynamic telemetry widgets */}
            {node.id === 'traffic-ingestion' && (
              <div className="flex items-center justify-between text-[10px] bg-zinc-100 dark:bg-zinc-900/80 px-2 py-0.5 rounded">
                <span className="text-zinc-500">Rate:</span>
                <span className="font-bold text-sky-500">{rps} RPS</span>
              </div>
            )}

            {node.id === 'ingress-router' && (
              <div className="flex items-center justify-between text-[10px] bg-zinc-100 dark:bg-zinc-900/80 px-2 py-0.5 rounded">
                <span className="text-zinc-500">P95 Lat:</span>
                <span className="font-bold text-blue-500">{p95}ms</span>
              </div>
            )}

            {node.id === 'backend-workload' && (
              <div className="flex items-center justify-between text-[10px] bg-zinc-100 dark:bg-zinc-900/80 px-2 py-0.5 rounded">
                <span className="text-zinc-500">Active Workload:</span>
                <span className="font-bold text-purple-500">{actualPods} active pods</span>
              </div>
            )}

            {node.id === 'k8s-metrics' && (
              <div className="flex items-center justify-between text-[10px] bg-zinc-100 dark:bg-zinc-900/80 px-2 py-0.5 rounded">
                <span className="text-zinc-500">Cadence:</span>
                <span className="font-bold text-emerald-500">15s cAdvisor</span>
              </div>
            )}

            {node.isModel && (
              <div className="flex items-center justify-between text-[10px] bg-zinc-100 dark:bg-zinc-900/80 px-2 py-0.5 rounded">
                <span className="text-zinc-500">Predicted:</span>
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
              <div className="flex items-center justify-between text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Winning MAX:</span>
                <span className="font-extrabold text-emerald-500 text-xs">{maxVal} pods</span>
              </div>
            )}

            {node.isActuator && (
              <div className="flex items-center justify-between text-[10px] bg-zinc-100 dark:bg-zinc-900/80 px-2 py-0.5 rounded">
                <span className="text-zinc-500">Actuation:</span>
                <span className="font-bold text-emerald-500">PATCH → {maxVal}</span>
              </div>
            )}

            {(node.id === 'tsdb-store' || node.id === 'etcd-store') && (
              <div className="flex items-center justify-between text-[9px] bg-zinc-100 dark:bg-zinc-900/80 px-2 py-0.5 rounded text-rose-500">
                <span>Status:</span>
                <span className="font-bold">SYNCED</span>
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

/* =========================================================================
   6. Closed Feedback Loop Conduit with Traveling Photons
   ========================================================================= */
function ClosedFeedbackLoopPipe({ isDark, isActiveProbe = false }) {
  const curve = useMemo(() => {
    // Arching 3D bezier from Scale Actuator [23.5, -3.2, 0.5] high through [0.0, 3.5, -1.0] down to Pod Cluster [-20.0, -3.8, -3.5]
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(23.5, -3.2, 0.5),
      new THREE.Vector3(0.0, 3.5, -1.0),
      new THREE.Vector3(-20.0, -3.8, -3.5)
    );
  }, []);

  const points = useMemo(() => curve.getPoints(60), [curve]);
  const photonRef = useRef();

  useFrame(({ clock }) => {
    if (!photonRef.current) return;
    const t = (clock.getElapsedTime() * (isActiveProbe ? 0.85 : 0.4)) % 1;
    const pos = curve.getPoint(t);
    photonRef.current.position.set(pos.x, pos.y, pos.z);
  });

  return (
    <group>
      <Line
        points={points}
        color={isActiveProbe ? '#34d399' : '#10b981'}
        lineWidth={isActiveProbe ? 5.5 : 3.6}
        dashed={!isActiveProbe}
        dashScale={2.5}
        dashSize={0.45}
        gapSize={0.25}
        transparent
        opacity={isDark ? 0.95 : 0.85}
      />

      {/* Traveling Feedback Actuation Photon */}
      <mesh ref={photonRef}>
        <sphereGeometry args={[isActiveProbe ? 0.32 : 0.22, 16, 16]} />
        <meshBasicMaterial color={isActiveProbe ? '#6ee7b7' : '#34d399'} />
      </mesh>
    </group>
  );
}

/* =========================================================================
   6B. 3D Step-by-Step Probe Tracer & Docking Beacons
   ========================================================================= */
const PROBE_WAYPOINTS_3D = [
  { id: 1, name: 'Traffic Ingestion', position: [0.0, 3.2, 3.0], color: '#38bdf8' },
  { id: 2, name: 'Ingress Router', position: [16.0, 3.2, 3.0], color: '#3b82f6' },
  { id: 3, name: 'Target Pods Cluster', position: [-20.0, -4.6, -3.5], color: '#10b981' },
  { id: 4, name: 'k8shorizmetrics Harvester', position: [-10.5, -4.6, -3.5], color: '#10b981' },
  { id: 5, name: 'MAX Decision Arbiter', position: [23.5, -4.6, -5.8], color: '#10b981' },
  { id: 6, name: 'Scale Actuator', position: [23.5, -3.2, 0.5], color: '#10b981' },
];

function DockingBeacon3D({ position, color = '#f59e0b' }) {
  const ringRef = useRef();
  const markerRef = useRef();

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    if (ringRef.current) {
      const scale = 1 + (elapsed * 2.2) % 1.4;
      ringRef.current.scale.set(scale, scale, 1);
      ringRef.current.material.opacity = Math.max(0, 1 - (scale - 1) / 1.4);
    }
    if (markerRef.current) {
      markerRef.current.position.y = position[1] + 1.2 + Math.sin(elapsed * 4.5) * 0.12;
      markerRef.current.rotation.y = elapsed * 2.0;
    }
  });

  return (
    <group position={position}>
      {/* Expanding ground ripple ring */}
      <mesh ref={ringRef} position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.7, 0.95, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>

      {/* Floating Diamond / Beacon Marker */}
      <mesh ref={markerRef} position={[0, 1.2, 0]} rotation={[0, 0, Math.PI / 4]}>
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Vertical light beam / column */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.2, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function ProbeTracer3D({
  probeHop = 0,
  probeSpeed = 1,
  isProbePlaying = false,
  winningModel = 'LSTM',
  isDark = true,
}) {
  const mainParticleRef = useRef();
  const branchRefs = useRef([]);
  const convergenceRefs = useRef([]);
  const decisionRef = useRef();
  const feedbackRef = useRef();

  // Closed feedback loop curve
  const feedbackCurve = useMemo(() => {
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(23.5, -3.2, 0.5),
      new THREE.Vector3(0.0, 3.5, -1.0),
      new THREE.Vector3(-20.0, -3.8, -3.5)
    );
  }, []);

  // Frame loop for traveling particles
  useFrame(({ clock }) => {
    if (probeHop === 0) return;
    const speed = Math.max(0.4, 0.8 * (probeSpeed || 1));
    const t = (clock.getElapsedTime() * speed) % 1;

    // Hop 1: Skydeck -> Traffic Ingestion
    if (probeHop === 1 && mainParticleRef.current) {
      const p0 = new THREE.Vector3(0.0, 7.2, 5.5);
      const p1 = new THREE.Vector3(0.0, 3.2, 3.0);
      mainParticleRef.current.position.lerpVectors(p0, p1, t);
    }

    // Hop 2: Traffic Ingestion -> Ingress Router -> Backend Workload
    if (probeHop === 2 && mainParticleRef.current) {
      if (t < 0.5) {
        const subT = t * 2;
        const p0 = new THREE.Vector3(0.0, 3.2, 3.0);
        const p1 = new THREE.Vector3(16.0, 3.2, 3.0);
        mainParticleRef.current.position.lerpVectors(p0, p1, subT);
      } else {
        const subT = (t - 0.5) * 2;
        const p0 = new THREE.Vector3(16.0, 2.6, 3.0);
        const p1 = new THREE.Vector3(0.0, -0.6, 0.0);
        mainParticleRef.current.position.lerpVectors(p0, p1, subT);
      }
    }

    // Hop 3: Backend Workload -> Target Pods Cluster
    if (probeHop === 3 && mainParticleRef.current) {
      const p0 = new THREE.Vector3(0.0, -0.6, 0.0);
      const p1 = new THREE.Vector3(-20.0, -4.6, -3.5);
      mainParticleRef.current.position.lerpVectors(p0, p1, t);
    }

    // Hop 4: Target Pods -> k8shorizmetrics -> 4 Parallel Models
    if (probeHop === 4) {
      if (mainParticleRef.current) {
        const p0 = new THREE.Vector3(-20.0, -4.6, -3.5);
        const p1 = new THREE.Vector3(-10.5, -4.6, -3.5);
        mainParticleRef.current.position.lerpVectors(p0, p1, t);
      }
      // 4 branch streams into models
      const modelTargets = [
        new THREE.Vector3(-3.0, -4.6, -5.8), // HPA
        new THREE.Vector3(3.5, -4.6, -2.0),  // OLS
        new THREE.Vector3(10.0, -4.6, -5.8), // HW
        new THREE.Vector3(16.5, -4.6, -2.0), // LSTM
      ];
      const startP = new THREE.Vector3(-10.5, -4.6, -3.5);
      modelTargets.forEach((tgt, i) => {
        const ref = branchRefs.current[i];
        if (ref) {
          ref.position.lerpVectors(startP, tgt, t);
        }
      });
    }

    // Hop 5: 4 Models -> MAX Arbiter -> Scale Actuator
    if (probeHop === 5) {
      const modelStarts = [
        new THREE.Vector3(-3.0, -4.6, -5.8), // HPA
        new THREE.Vector3(3.5, -4.6, -2.0),  // OLS
        new THREE.Vector3(10.0, -4.6, -5.8), // HW
        new THREE.Vector3(16.5, -4.6, -2.0), // LSTM
      ];
      const arbiterPos = new THREE.Vector3(23.5, -4.6, -5.8);
      modelStarts.forEach((start, i) => {
        const ref = convergenceRefs.current[i];
        if (ref) {
          ref.position.lerpVectors(start, arbiterPos, t);
        }
      });
      if (decisionRef.current) {
        const p0 = new THREE.Vector3(23.5, -4.0, -5.8);
        const p1 = new THREE.Vector3(23.5, -3.2, 0.5);
        decisionRef.current.position.lerpVectors(p0, p1, t);
      }
    }

    // Hop 6: Scale Actuator -> Closed Feedback Loop -> Target Pods
    if (probeHop === 6 && feedbackRef.current) {
      const pos = feedbackCurve.getPoint(t);
      feedbackRef.current.position.set(pos.x, pos.y, pos.z);
    }
  });

  if (probeHop === 0) return null;

  const currentWp = PROBE_WAYPOINTS_3D.find((w) => w.id === probeHop);

  return (
    <group>
      {/* 1. Docking Beacon at Current Active Waypoint */}
      {currentWp && <DockingBeacon3D position={currentWp.position} color="#f59e0b" />}

      {/* 2. Active Illuminated Conduits for the Current Hop */}
      {probeHop === 1 && (
        <Line
          points={[[0.0, 7.2, 5.5], [0.0, 3.2, 3.0]]}
          color="#f59e0b"
          lineWidth={5.0}
        />
      )}
      {probeHop === 2 && (
        <>
          <Line
            points={[[0.0, 3.2, 3.0], [16.0, 3.2, 3.0]]}
            color="#f59e0b"
            lineWidth={5.0}
          />
          <Line
            points={[[16.0, 2.6, 3.0], [0.0, -0.6, 0.0]]}
            color="#f59e0b"
            lineWidth={5.0}
          />
        </>
      )}
      {probeHop === 3 && (
        <Line
          points={[[0.0, -0.6, 0.0], [-20.0, -4.6, -3.5]]}
          color="#f59e0b"
          lineWidth={5.0}
        />
      )}
      {probeHop === 4 && (
        <>
          <Line
            points={[[-20.0, -4.6, -3.5], [-10.5, -4.6, -3.5]]}
            color="#f59e0b"
            lineWidth={5.0}
          />
          {/* Branch lines into 4 models */}
          <Line points={[[-10.5, -4.6, -3.5], [-3.0, -4.6, -5.8]]} color="#f59e0b" lineWidth={3.5} />
          <Line points={[[-10.5, -4.6, -3.5], [3.5, -4.6, -2.0]]} color="#f59e0b" lineWidth={3.5} />
          <Line points={[[-10.5, -4.6, -3.5], [10.0, -4.6, -5.8]]} color="#f59e0b" lineWidth={3.5} />
          <Line points={[[-10.5, -4.6, -3.5], [16.5, -4.6, -2.0]]} color="#f59e0b" lineWidth={3.5} />
        </>
      )}
      {probeHop === 5 && (
        <>
          <Line points={[[-3.0, -4.6, -5.8], [23.5, -4.6, -5.8]]} color="#10b981" lineWidth={3.5} />
          <Line points={[[3.5, -4.6, -2.0], [23.5, -4.6, -5.8]]} color="#10b981" lineWidth={3.5} />
          <Line points={[[10.0, -4.6, -5.8], [23.5, -4.6, -5.8]]} color="#10b981" lineWidth={3.5} />
          <Line points={[[16.5, -4.6, -2.0], [23.5, -4.6, -5.8]]} color="#10b981" lineWidth={3.5} />
          <Line points={[[23.5, -4.0, -5.8], [23.5, -3.2, 0.5]]} color="#10b981" lineWidth={5.0} />
        </>
      )}
      {probeHop === 6 && (
        <Line
          points={feedbackCurve.getPoints(50)}
          color="#10b981"
          lineWidth={6.0}
        />
      )}

      {/* 3. Primary Luminous Traveling Probe Particle (Hops 1, 2, 3, 4) */}
      {(probeHop === 1 || probeHop === 2 || probeHop === 3 || probeHop === 4) && (
        <mesh ref={mainParticleRef}>
          <sphereGeometry args={[0.36, 24, 24]} />
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#f59e0b"
            emissiveIntensity={3.0}
            roughness={0.1}
          />
        </mesh>
      )}

      {/* 4. Parallel Branch Particles for Hop 4 (Streaming into 4 Models) */}
      {probeHop === 4 &&
        [0, 1, 2, 3].map((idx) => (
          <mesh
            key={`b-${idx}`}
            ref={(r) => {
              branchRefs.current[idx] = r;
            }}
          >
            <sphereGeometry args={[0.26, 16, 16]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#fbbf24"
              emissiveIntensity={2.5}
              roughness={0.1}
            />
          </mesh>
        ))}

      {/* 5. Parallel Convergence Particles for Hop 5 (Streaming from 4 Models into Arbiter) */}
      {probeHop === 5 && (
        <>
          {[0, 1, 2, 3].map((idx) => (
            <mesh
              key={`c-${idx}`}
              ref={(r) => {
                convergenceRefs.current[idx] = r;
              }}
            >
              <sphereGeometry args={[0.26, 16, 16]} />
              <meshStandardMaterial
                color="#34d399"
                emissive="#34d399"
                emissiveIntensity={2.5}
                roughness={0.1}
              />
            </mesh>
          ))}
          <mesh ref={decisionRef}>
            <sphereGeometry args={[0.38, 24, 24]} />
            <meshStandardMaterial
              color="#10b981"
              emissive="#10b981"
              emissiveIntensity={3.5}
              roughness={0.1}
            />
          </mesh>
        </>
      )}

      {/* 6. Actuation Loop Closed Particle for Hop 6 */}
      {probeHop === 6 && (
        <mesh ref={feedbackRef}>
          <sphereGeometry args={[0.42, 24, 24]} />
          <meshStandardMaterial
            color="#34d399"
            emissive="#34d399"
            emissiveIntensity={4.0}
            roughness={0.1}
          />
        </mesh>
      )}
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
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshBasicMaterial color={pipe.color} />
        </mesh>
      ))}
    </group>
  );
}

/* =========================================================================
   8. Camera Controller with Balanced Presets & Orbit Controls
   ========================================================================= */
function CameraController({ viewPreset = 'isometric', isOrbiting = false }) {
  const { camera } = useThree();
  const controlsRef = useRef();

  useEffect(() => {
    if (!camera) return;
    if (viewPreset === 'isometric') {
      // Elevated diagonal isometric perspective framing all 5 tiers
      gsap.to(camera.position, { x: 18, y: 22, z: 42, duration: 1.1, ease: 'power2.inOut' });
      if (controlsRef.current) gsap.to(controlsRef.current.target, { x: 0.0, y: -1.5, z: -1.0, duration: 1.1 });
    } else if (viewPreset === 'core') {
      // Direct close-up on Tier 4 PHPA Autoscaling Platform
      gsap.to(camera.position, { x: 2, y: 6, z: 26, duration: 1.1, ease: 'power2.inOut' });
      if (controlsRef.current) gsap.to(controlsRef.current.target, { x: 2.0, y: -4.6, z: -3.0, duration: 1.1 });
    } else if (viewPreset === 'front') {
      // Clean Frontal Elevation View
      gsap.to(camera.position, { x: 0, y: 0, z: 48, duration: 1.1, ease: 'power2.inOut' });
      if (controlsRef.current) gsap.to(controlsRef.current.target, { x: 0.0, y: -1.0, z: 0.0, duration: 1.1 });
    } else if (viewPreset === 'top') {
      // Overhead Architectural Blueprint View
      gsap.to(camera.position, { x: 0, y: 56, z: 0.5, duration: 1.1, ease: 'power2.inOut' });
      if (controlsRef.current) gsap.to(controlsRef.current.target, { x: 0.0, y: -1.0, z: 0.0, duration: 1.1 });
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
      maxDistance={80}
    />
  );
}

/* =========================================================================
   9. Floating 3D Legend HUD (5 Tiers)
   ========================================================================= */
function LayerLegendHUD({ isDark, isModalOpen = false }) {
  if (isModalOpen) return null;
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
  isProbePlaying = false,
  probeHop = 0,
  probeSpeed = 1,
  onProbeHopChange,
  selectedStage = 0,
  onSelectStage,
  isModalOpen = false,
  latest = {},
  isSpiking = false,
}) {
  const isDark = useAppTheme(theme);

  // Background and Grid colors
  const bgColor = isDark ? '#09090b' : '#f8fafc';
  const gridPrimary = isDark ? '#27272a' : '#cbd5e1';
  const gridSecondary = isDark ? '#18181b' : '#e2e8f0';

  // Live dynamic values
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

  const maxVal = Math.max(
    dynamicLatest.hpaPred,
    dynamicLatest.linearPred,
    dynamicLatest.hwPred,
    dynamicLatest.lstmPred
  );
  let winningModel = 'LSTM';
  if (maxVal === dynamicLatest.lstmPred) winningModel = 'LSTM';
  else if (maxVal === dynamicLatest.hwPred) winningModel = 'Holt-Winters';
  else if (maxVal === dynamicLatest.linearPred) winningModel = 'Linear';
  else winningModel = 'Reactive HPA';

  return (
    <div
      className={`w-full h-full min-h-[480px] sm:min-h-[600px] md:min-h-[720px] relative select-none overflow-hidden rounded-2xl transition-colors duration-200 ${
        isDark ? 'bg-zinc-950' : 'bg-slate-50'
      }`}
    >
      {/* Floating 5-Layer Color Legend HUD */}
      <LayerLegendHUD isDark={isDark} isModalOpen={isModalOpen} />

      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
        }}
        camera={{ position: [18, 22, 42], fov: 42 }}
      >
        {/* Dynamic theme background */}
        <color attach="background" args={[bgColor]} />

        {/* Ambient & Directional Studio Lighting */}
        <ambientLight intensity={isDark ? 0.7 : 0.95} />
        <directionalLight
          position={[16, 26, 16]}
          intensity={isDark ? 1.5 : 1.7}
          color="#ffffff"
        />
        <directionalLight
          position={[-16, 12, -16]}
          intensity={isDark ? 0.45 : 0.65}
          color="#94a3b8"
        />

        {/* Camera and Orbit Controls */}
        <CameraController viewPreset={viewPreset} isOrbiting={isOrbiting} />

        {/* Clean Ground Grid */}
        <gridHelper
          args={[90, 90, gridPrimary, gridSecondary]}
          position={[0, -11.0, 0]}
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
            lineWidth={3.0}
            transparent
            opacity={0.85}
          />
        ))}

        {/* Continuous 3D Traveling Photons */}
        <ArchitecturePhotons pipes={ARCH_PIPES} isDark={isDark} />

        {/* Step-by-Step Active 3D Probe Tracer & Docking Beacons */}
        <ProbeTracer3D
          probeHop={probeHop}
          probeSpeed={probeSpeed}
          isProbePlaying={isProbePlaying}
          winningModel={winningModel}
          isDark={isDark}
        />

        {/* Closed Feedback Loop Pipe (Scale Actuator -> Target Pods Cluster) */}
        <ClosedFeedbackLoopPipe isDark={isDark} isActiveProbe={probeHop === 6} />

        {/* Centerpiece: Grand Circular Target Pods Cluster */}
        <CircularTargetPodsCluster
          center={[-20.0, -4.6, -3.5]}
          actualPods={dynamicLatest.actualPods}
          idealDemand={dynamicLatest.idealDemand}
          cpu={dynamicLatest.cpu}
          isSelected={selectedStage === 2}
          isDark={isDark}
          probeHop={probeHop}
          isModalOpen={isModalOpen}
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
            probeHop={probeHop}
            isModalOpen={isModalOpen}
            onSelect={onSelectStage}
          />
        ))}
      </Canvas>
    </div>
  );
}
