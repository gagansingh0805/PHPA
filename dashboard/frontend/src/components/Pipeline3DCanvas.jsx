import React, { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, RoundedBox, Edges, Line, Html } from '@react-three/drei';
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
   2. 5-Layer 3D Architecture Coordinates & Metadata
   ========================================================================= */
const ARCH_LAYERS = {
  1: { name: 'Client / Frontend', color: '#38bdf8', badge: 'Tier 1' },
  2: { name: 'Edge & Ingress', color: '#3b82f6', badge: 'Tier 2' },
  3: { name: 'Backend Workload', color: '#8b5cf6', badge: 'Tier 3' },
  4: { name: 'PHPA Autoscaling Core', color: '#10b981', badge: 'Centerpiece' },
  5: { name: 'State & Metrics Data', color: '#f43f5e', badge: 'Tier 5' },
};

// All Nodes across 5 distinct vertical elevations (Y) and depth planes (Z)
const ARCH_NODES = [
  // --- LAYER 1: CLIENT / FRONTEND (Elevated Top Front: Y=+4.4, Z=+3.8) ---
  {
    id: 'web-app',
    stageId: 0,
    layer: 1,
    title: 'Web App Client',
    subtitle: 'React / Next.js SPA',
    position: [-3.8, 4.4, 3.8],
    size: [2.3, 1.2, 0.3],
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
    position: [0.0, 4.4, 3.8],
    size: [2.3, 1.2, 0.3],
    htmlWidth: 175,
    icon: Smartphone,
    color: '#38bdf8',
  },
  {
    id: 'api-consumer',
    stageId: 0,
    layer: 1,
    title: 'API Consumer',
    subtitle: 'Partner SDK / Webhooks',
    position: [3.8, 4.4, 3.8],
    size: [2.3, 1.2, 0.3],
    htmlWidth: 175,
    icon: Terminal,
    color: '#38bdf8',
  },

  // --- LAYER 2: EDGE / INGRESS (Mid-High: Y=+2.2, Z=+1.8) ---
  {
    id: 'cdn-waf',
    stageId: 1,
    layer: 2,
    title: 'CDN / Cloud WAF',
    subtitle: 'Edge Shield & Caching',
    position: [-4.0, 2.2, 1.8],
    size: [2.4, 1.3, 0.3],
    htmlWidth: 180,
    icon: Shield,
    color: '#3b82f6',
  },
  {
    id: 'traffic-ingestion',
    stageId: 0,
    layer: 2,
    title: '1. Traffic Ingestion',
    subtitle: 'HTTP/gRPC Stream',
    position: [0.0, 2.2, 1.8],
    size: [2.6, 1.4, 0.35],
    htmlWidth: 190,
    icon: Activity,
    color: '#38bdf8',
    isPrimary: true,
  },
  {
    id: 'ingress-router',
    stageId: 1,
    layer: 2,
    title: '2. Ingress Router',
    subtitle: 'Envoy Service Mesh',
    position: [4.0, 2.2, 1.8],
    size: [2.6, 1.4, 0.35],
    htmlWidth: 190,
    icon: Network,
    color: '#3b82f6',
    isPrimary: true,
  },

  // --- LAYER 3: GENERIC BACKEND WORKLOAD (Center: Y=+0.3, Z=+0.2) ---
  {
    id: 'backend-workload',
    stageId: 2,
    layer: 3,
    title: 'Sample Web Workload',
    subtitle: 'Target Application Service',
    position: [0.0, 0.3, 0.2],
    size: [3.4, 1.4, 0.35],
    htmlWidth: 230,
    icon: Box,
    color: '#8b5cf6',
  },

  // --- LAYER 4: PHPA PREDICTIVE AUTOSCALING CORE (Centerpiece: Y=-0.4 to +1.8, Z=-4.0 to -5.2) ---
  // k8s Horizon Metrics Collector
  {
    id: 'k8s-metrics',
    stageId: 3,
    layer: 4,
    title: '4. k8shorizmetrics',
    subtitle: 'cAdvisor Daemon Scrape',
    position: [-0.6, -0.4, -4.5],
    size: [2.6, 1.5, 0.35],
    htmlWidth: 195,
    icon: Layers,
    color: '#10b981',
    isPrimary: true,
  },

  // The 4 Parallel Forecasting Models (Rendered as independent 3D objects!)
  {
    id: 'model-hpa',
    stageId: 4,
    layer: 4,
    title: 'Reactive HPA',
    subtitle: 'Rule-Based Baseline',
    position: [2.5, 1.35, -4.8],
    size: [2.2, 0.85, 0.3],
    htmlWidth: 165,
    icon: Cpu,
    color: '#6366f1',
    modelKey: 'Reactive HPA',
  },
  {
    id: 'model-ols',
    stageId: 4,
    layer: 4,
    title: 'Linear OLS Regressor',
    subtitle: 'Trend Rate dy/dt',
    position: [2.5, 0.45, -4.8],
    size: [2.2, 0.85, 0.3],
    htmlWidth: 165,
    icon: Activity,
    color: '#6366f1',
    modelKey: 'Linear',
  },
  {
    id: 'model-hw',
    stageId: 4,
    layer: 4,
    title: 'Holt-Winters Seasonal',
    subtitle: 'Triple Exponential',
    position: [2.5, -0.45, -4.8],
    size: [2.2, 0.85, 0.3],
    htmlWidth: 165,
    icon: Layers,
    color: '#6366f1',
    modelKey: 'Holt-Winters',
  },
  {
    id: 'model-lstm',
    stageId: 4,
    layer: 4,
    title: '2-Layer Stacked LSTM',
    subtitle: 'Deep Neural Memory',
    position: [2.5, -1.35, -4.8],
    size: [2.2, 0.85, 0.3],
    htmlWidth: 165,
    icon: Sparkles,
    color: '#6366f1',
    modelKey: 'LSTM',
  },

  // MAX Arbiter (Decision Engine)
  {
    id: 'max-arbiter',
    stageId: 4,
    layer: 4,
    title: '5. MAX Arbiter',
    subtitle: 'Upper Envelope Decision',
    position: [5.5, -0.05, -4.8],
    size: [2.6, 1.8, 0.35],
    htmlWidth: 200,
    icon: Cpu,
    color: '#10b981',
    isPrimary: true,
  },

  // Scale Actuator (ScaleClient)
  {
    id: 'scale-actuator',
    stageId: 5,
    layer: 4,
    title: '6. Scale Actuator',
    subtitle: 'Kube-API ScaleClient',
    position: [5.0, 1.8, -3.8],
    size: [2.6, 1.4, 0.35],
    htmlWidth: 195,
    icon: Zap,
    color: '#f59e0b',
    isPrimary: true,
  },

  // --- LAYER 5: STATE & METRICS DATA LAYER (Bottom: Y=-3.2, Z=-2.4) ---
  {
    id: 'data-metrics',
    stageId: 3,
    layer: 5,
    title: 'Metrics TSDB Store',
    subtitle: 'Prometheus / Timescale',
    position: [-2.6, -3.2, -2.4],
    size: [2.6, 1.2, 0.3],
    htmlWidth: 180,
    icon: Database,
    color: '#f43f5e',
  },
  {
    id: 'data-etcd',
    stageId: 5,
    layer: 5,
    title: 'Config & State Store',
    subtitle: 'etcd / k8s Control State',
    position: [2.6, -3.2, -2.4],
    size: [2.6, 1.2, 0.3],
    htmlWidth: 180,
    icon: HardDrive,
    color: '#f43f5e',
  },
];

/* =========================================================================
   3. Directional 3D Pipes & Data Flow Highways
   ========================================================================= */
const ARCH_PIPES = [
  // Layer 1 -> Layer 2
  { id: 'p-web-waf', start: [-3.8, 3.8, 3.8], end: [-4.0, 2.9, 1.8], color: '#38bdf8' },
  { id: 'p-mob-traffic', start: [0.0, 3.8, 3.8], end: [0.0, 2.9, 1.8], color: '#38bdf8' },
  { id: 'p-api-ingress', start: [3.8, 3.8, 3.8], end: [4.0, 2.9, 1.8], color: '#38bdf8' },

  // Layer 2 internal
  { id: 'p-waf-traffic', start: [-2.8, 2.2, 1.8], end: [-1.3, 2.2, 1.8], color: '#3b82f6' },
  { id: 'p-traffic-ingress', start: [1.3, 2.2, 1.8], end: [2.7, 2.2, 1.8], color: '#3b82f6' },

  // Layer 2 -> Layer 3 (Ingress to Web Workload)
  { id: 'p-ingress-workload', start: [3.0, 1.5, 1.8], end: [1.7, 0.4, 0.2], color: '#8b5cf6' },

  // Layer 3 -> Layer 4 (Workload to Circular Pod Cluster)
  { id: 'p-workload-pods', start: [-1.7, 0.3, 0.2], end: [-3.8, -0.4, -2.8], color: '#a855f7' },

  // Layer 4 Internal: Pod Cluster -> Metrics Collector
  { id: 'p-pods-metrics', start: [-2.4, -0.4, -4.2], end: [-1.9, -0.4, -4.5], color: '#10b981' },

  // Layer 4 Internal: Metrics Collector -> 4 Forecasting Models in Parallel
  { id: 'p-met-hpa', start: [0.7, -0.4, -4.5], end: [1.4, 1.35, -4.8], color: '#6366f1' },
  { id: 'p-met-ols', start: [0.7, -0.4, -4.5], end: [1.4, 0.45, -4.8], color: '#6366f1' },
  { id: 'p-met-hw', start: [0.7, -0.4, -4.5], end: [1.4, -0.45, -4.8], color: '#6366f1' },
  { id: 'p-met-lstm', start: [0.7, -0.4, -4.5], end: [1.4, -1.35, -4.8], color: '#6366f1' },

  // Layer 4 Internal: 4 Models -> MAX Arbiter
  { id: 'p-hpa-arbiter', start: [3.6, 1.35, -4.8], end: [4.2, 0.4, -4.8], color: '#6366f1' },
  { id: 'p-ols-arbiter', start: [3.6, 0.45, -4.8], end: [4.2, 0.1, -4.8], color: '#6366f1' },
  { id: 'p-hw-arbiter', start: [3.6, -0.45, -4.8], end: [4.2, -0.2, -4.8], color: '#6366f1' },
  { id: 'p-lstm-arbiter', start: [3.6, -1.35, -4.8], end: [4.2, -0.5, -4.8], color: '#6366f1' },

  // Layer 4 Internal: MAX Arbiter -> Scale Actuator
  { id: 'p-arbiter-actuator', start: [5.5, 0.85, -4.8], end: [5.0, 1.1, -3.8], color: '#10b981' },

  // Layer 5 -> Layer 4: Metrics TSDB -> Models & etcd -> Scale Actuator
  { id: 'p-data-models', start: [-1.3, -2.6, -2.4], end: [1.4, -1.35, -4.8], color: '#f43f5e' },
  { id: 'p-etcd-actuator', start: [3.9, -2.6, -2.4], end: [5.0, 1.1, -3.8], color: '#f43f5e' },
];

/* =========================================================================
   4. Circular Target Pods Cluster Mesh (Centerpiece)
   ========================================================================= */
function CircularTargetPodsCluster({
  center = [-3.8, -0.4, -4.2],
  actualPods = 4,
  idealDemand = 4,
  cpu = 50,
  isSelected = false,
  isDark = true,
  onSelect,
}) {
  const radius = 1.4;
  const podCount = Math.min(10, Math.max(1, actualPods));

  // Angles for circular arrangement
  const podPositions = useMemo(() => {
    return Array.from({ length: podCount }).map((_, idx) => {
      const angle = (idx / podCount) * Math.PI * 2 - Math.PI / 2;
      return {
        idx,
        x: center[0] + Math.cos(angle) * radius,
        y: center[1],
        z: center[2] + Math.sin(angle) * radius,
        angle,
      };
    });
  }, [podCount, center]);

  return (
    <group>
      {/* Central Ring Rail */}
      <mesh position={center} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.08, radius + 0.08, 64]} />
        <meshBasicMaterial
          color={isDark ? '#3f3f46' : '#cbd5e1'}
          transparent
          opacity={0.45}
        />
      </mesh>

      {/* Central Cluster Console Node */}
      <group position={center}>
        <RoundedBox
          args={[2.8, 1.7, 0.35]}
          radius={0.08}
          smoothness={4}
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(2);
          }}
        >
          <meshStandardMaterial
            color={isDark ? '#09090b' : '#ffffff'}
            roughness={0.25}
            metalness={0.1}
          />
          <Edges
            threshold={15}
            color={isSelected ? '#a855f7' : isDark ? '#3f3f46' : '#cbd5e1'}
          />
        </RoundedBox>

        <Html position={[0, 0, 0.22]} center distanceFactor={10.2} className="pointer-events-auto select-none">
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(2);
            }}
            className={`flex flex-col p-2.5 rounded-xl border transition-all cursor-pointer ${
              isSelected
                ? 'bg-purple-900/40 border-purple-500 shadow-lg ring-1 ring-purple-500/50'
                : isDark
                ? 'bg-zinc-950/95 border-zinc-800 hover:border-zinc-600 shadow-md'
                : 'bg-white/98 border-zinc-200 hover:border-zinc-300 shadow-md'
            }`}
            style={{ width: '220px' }}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-[10px] font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  3. Target Pods Cluster
                </span>
              </div>
              <span className="text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/30">
                {actualPods} Replicas
              </span>
            </div>
            <span className="text-[8px] font-mono text-zinc-500 truncate mb-1">
              Radial Pod Mesh Orbit
            </span>
            <div className="flex items-center justify-between text-[8px] font-mono text-zinc-600 dark:text-zinc-400 pt-1 border-t border-zinc-200/80 dark:border-zinc-800/80">
              <span>Avg CPU: <strong className="text-zinc-900 dark:text-zinc-100">{cpu}%</strong></span>
              <span>Ideal: <strong className="text-zinc-900 dark:text-zinc-100">{idealDemand}</strong></span>
            </div>
          </div>
        </Html>
      </group>

      {/* Radial Pod Replicas Arranged in Circle */}
      {podPositions.map((pod) => {
        const podCpu = Math.min(100, Math.max(10, Math.round(cpu + (pod.idx % 3) * 4 - 4)));
        return (
          <group key={`pod-${pod.idx}`} position={[pod.x, pod.y, pod.z]}>
            {/* Pod Pedestal Cylinder */}
            <mesh position={[0, -0.15, 0]}>
              <cylinderGeometry args={[0.22, 0.24, 0.28, 24]} />
              <meshStandardMaterial
                color={isDark ? '#18181b' : '#f1f5f9'}
                roughness={0.3}
                metalness={0.2}
              />
            </mesh>

            {/* Glowing Status Beacon */}
            <mesh position={[0, 0.05, 0]}>
              <sphereGeometry args={[0.09, 16, 16]} />
              <meshBasicMaterial color="#10b981" />
            </mesh>

            {/* Mini Pod Blade HTML Tag */}
            <Html position={[0, 0.28, 0]} center distanceFactor={10.2} className="pointer-events-none select-none">
              <div className="flex flex-col items-center bg-zinc-900/90 text-white dark:bg-zinc-100/90 dark:text-zinc-900 px-1.5 py-0.5 rounded text-[7.5px] font-mono shadow-sm border border-zinc-700/60 dark:border-zinc-300/60 whitespace-nowrap">
                <span className="font-bold">Pod #{pod.idx + 1}</span>
                <span className="text-[6.5px] opacity-80">{podCpu}% CPU</span>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

/* =========================================================================
   5. Standard 3D Node Mesh
   ========================================================================= */
function ArchitectureNode({
  node,
  isSelected,
  isDark,
  latest,
  onSelect,
}) {
  const Icon = node.icon || Box;
  const isWinner =
    node.modelKey &&
    (latest?.winningModel === node.modelKey ||
      (node.modelKey === 'Linear' && latest?.winningModel === 'Linear OLS'));

  return (
    <group position={node.position}>
      <RoundedBox
        args={node.size}
        radius={0.06}
        smoothness={4}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(node.stageId);
        }}
      >
        <meshStandardMaterial
          color={isDark ? '#09090b' : '#ffffff'}
          roughness={0.25}
          metalness={0.1}
        />
        <Edges
          threshold={15}
          color={
            isWinner
              ? '#10b981'
              : isSelected
              ? node.color
              : isDark
              ? '#27272a'
              : '#e2e8f0'
          }
        />
      </RoundedBox>

      {/* HTML Overlay Label */}
      <Html
        position={[0, 0, node.size[2] / 2 + 0.05]}
        center
        distanceFactor={10.2}
        className="pointer-events-auto select-none"
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(node.stageId);
          }}
          style={{ width: `${node.htmlWidth}px` }}
          className={`flex flex-col p-2.5 rounded-xl border transition-all cursor-pointer ${
            isWinner
              ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/50'
              : isSelected
              ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-900 dark:border-zinc-100 shadow-md ring-1 ring-zinc-500/40'
              : isDark
              ? 'bg-zinc-950/90 border-zinc-800 hover:border-zinc-600 shadow-sm'
              : 'bg-white/95 border-zinc-200 hover:border-zinc-300 shadow-sm'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5" style={{ color: node.color }} />
              <span className="text-[10px] font-mono font-bold text-zinc-900 dark:text-zinc-100 truncate">
                {node.title}
              </span>
            </div>
            {node.modelKey && (
              <span className={`text-[7.5px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                isWinner
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/40'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700'
              }`}>
                {isWinner ? 'WINNER' : 'MODEL'}
              </span>
            )}
            {node.id === 'traffic-ingestion' && (
              <span className="text-[8px] font-mono font-bold px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                LIVE
              </span>
            )}
          </div>

          <span className="text-[8px] font-mono text-zinc-500 truncate mb-1">
            {node.subtitle}
          </span>

          {/* Node Specific Dynamic Telemetry */}
          {node.id === 'traffic-ingestion' && (
            <div className="mt-0.5">
              <div className="flex items-baseline justify-between text-[9px] font-mono">
                <span className="text-zinc-500">Volume:</span>
                <strong className="text-zinc-900 dark:text-zinc-100">{latest.rps || 125} RPS</strong>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1 overflow-hidden mt-1">
                <div
                  className="h-full bg-sky-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round(((latest.rps || 125) / 500) * 100))}%` }}
                />
              </div>
            </div>
          )}

          {node.id === 'ingress-router' && (
            <div className="flex items-baseline justify-between text-[9px] font-mono mt-0.5">
              <span className="text-zinc-500">P95 Latency:</span>
              <strong className="text-zinc-900 dark:text-zinc-100">{latest.p95_latency_ms || 32.5}ms</strong>
            </div>
          )}

          {node.id === 'backend-workload' && (
            <div className="flex items-baseline justify-between text-[9px] font-mono mt-0.5">
              <span className="text-zinc-500">Target Scale:</span>
              <strong className="text-purple-600 dark:text-purple-400 font-bold">{latest.actual_pods || 4} Pods</strong>
            </div>
          )}

          {node.id === 'k8s-metrics' && (
            <div className="flex items-center justify-between text-[8px] font-mono text-zinc-500 mt-0.5">
              <span>Cadence: <strong>15s</strong></span>
              <span>Filtered: <strong>0 pods</strong></span>
            </div>
          )}

          {/* Forecast Model Preds */}
          {node.id === 'model-hpa' && (
            <div className="flex items-baseline justify-between text-[9px] font-mono mt-0.5 font-bold">
              <span className="text-zinc-500 font-normal">Recommendation:</span>
              <span className="text-zinc-900 dark:text-zinc-100">{latest.reactive_hpa || 4} pods</span>
            </div>
          )}
          {node.id === 'model-ols' && (
            <div className="flex items-baseline justify-between text-[9px] font-mono mt-0.5 font-bold">
              <span className="text-zinc-500 font-normal">Recommendation:</span>
              <span className="text-zinc-900 dark:text-zinc-100">{latest.linear_pred || 4} pods</span>
            </div>
          )}
          {node.id === 'model-hw' && (
            <div className="flex items-baseline justify-between text-[9px] font-mono mt-0.5 font-bold">
              <span className="text-zinc-500 font-normal">Recommendation:</span>
              <span className="text-zinc-900 dark:text-zinc-100">{latest.holt_winters_pred || 4} pods</span>
            </div>
          )}
          {node.id === 'model-lstm' && (
            <div className="flex items-baseline justify-between text-[9px] font-mono mt-0.5 font-bold">
              <span className="text-zinc-500 font-normal">Recommendation:</span>
              <span className="text-zinc-900 dark:text-zinc-100">{latest.lstm_pred || 4} pods</span>
            </div>
          )}

          {node.id === 'max-arbiter' && (
            <div className="mt-0.5 pt-1 border-t border-zinc-200/80 dark:border-zinc-800/80 text-[8.5px] font-mono">
              <span className="text-zinc-500 block mb-0.5">MAX Envelope Decision:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                <Sparkles className="w-2.5 h-2.5" />
                {latest.maxVal || 4} Pods via {latest.winningModel || 'LSTM'}
              </strong>
            </div>
          )}

          {node.id === 'scale-actuator' && (
            <div className="mt-0.5 text-[8.5px] font-mono">
              <div className="flex items-baseline justify-between">
                <span className="text-zinc-500">Patched:</span>
                <strong className="text-zinc-900 dark:text-zinc-100">{latest.actual_pods || 4} pods</strong>
              </div>
              <span className="text-[7.5px] text-emerald-600 dark:text-emerald-400 block mt-0.5 font-semibold">
                Loop Closed ✓ Kube-API
              </span>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

/* =========================================================================
   6. Closed Feedback Loop 3D Pipe (Scale Actuator -> Target Pods Cluster)
   ========================================================================= */
function ClosedFeedbackLoopPipe({ isDark = true }) {
  const curve = useMemo(() => {
    // Arching 3D spline high across the control plane
    const start = new THREE.Vector3(5.0, 1.8, -3.8);
    const mid = new THREE.Vector3(0.5, 3.2, -4.2);
    const end = new THREE.Vector3(-3.8, 0.9, -4.2);
    return new THREE.QuadraticBezierCurve3(start, mid, end);
  }, []);

  const points = useMemo(() => curve.getPoints(50), [curve]);

  // Traveling photon along feedback curve
  const photonRef = useRef();
  useFrame(({ clock }) => {
    if (!photonRef.current) return;
    const t = (clock.getElapsedTime() * 0.45) % 1;
    const pos = curve.getPoint(t);
    photonRef.current.position.copy(pos);
  });

  return (
    <group>
      {/* 3D Glowing Dashed Feedback Line */}
      <Line
        points={points}
        color={isDark ? '#f59e0b' : '#d97706'}
        lineWidth={3.5}
        dashed
        dashScale={2.5}
        dashSize={0.4}
        gapSize={0.2}
      />

      {/* Traveling Closed-Loop Photon */}
      <mesh ref={photonRef}>
        <sphereGeometry args={[0.11, 16, 16]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>

      {/* Billboarded Label on top of feedback loop */}
      <Html position={[0.5, 3.4, -4.2]} center distanceFactor={10.2} className="pointer-events-none select-none">
        <div className="flex items-center gap-1 bg-amber-500/90 text-white dark:bg-amber-400 dark:text-zinc-950 px-2 py-0.5 rounded-full text-[8px] font-mono font-bold shadow-md whitespace-nowrap">
          <RotateCcw className="w-2.5 h-2.5 animate-spin" />
          <span>PHPA Closed-Loop Actuation (scale.patch)</span>
        </div>
      </Html>
    </group>
  );
}

/* =========================================================================
   7. Continuous 3D Traveling Photons
   ========================================================================= */
function ArchitecturePhotons({ pipes = ARCH_PIPES, isDark = true }) {
  const photonRefs = useRef([]);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    pipes.forEach((pipe, idx) => {
      const el = photonRefs.current[idx];
      if (!el) return;
      const progress = ((elapsed * 0.85 + idx * 0.15) % 1);
      const x = pipe.start[0] + (pipe.end[0] - pipe.start[0]) * progress;
      const y = pipe.start[1] + (pipe.end[1] - pipe.start[1]) * progress;
      const z = pipe.start[2] + (pipe.end[2] - pipe.start[2]) * progress;
      el.position.set(x, y, z);
    });
  });

  return (
    <group>
      {pipes.map((pipe, idx) => (
        <mesh
          key={pipe.id}
          ref={(ref) => (photonRefs.current[idx] = ref)}
        >
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshBasicMaterial color={pipe.color || (isDark ? '#38bdf8' : '#0284c7')} />
        </mesh>
      ))}
    </group>
  );
}

/* =========================================================================
   8. Camera Controller with Presets (Isometric, PHPA Core, Front, Top)
   ========================================================================= */
function CameraController({ preset = 'isometric', isOrbiting = false }) {
  const controlsRef = useRef();
  const targetPos = useRef(new THREE.Vector3(10.0, 9.0, 14.5));
  const targetLook = useRef(new THREE.Vector3(0.0, 0.2, -1.5));
  const isTransitioning = useRef(true);

  useEffect(() => {
    if (preset === 'isometric') {
      targetPos.current.set(10.0, 9.0, 14.5);
      targetLook.current.set(0.0, 0.2, -1.5);
      isTransitioning.current = true;
    } else if (preset === 'core') {
      // Focuses in on the PHPA Control Plane centerpiece
      targetPos.current.set(3.5, 4.0, 3.5);
      targetLook.current.set(1.0, 0.0, -4.2);
      isTransitioning.current = true;
    } else if (preset === 'front') {
      targetPos.current.set(0.0, 2.5, 17.5);
      targetLook.current.set(0.0, 0.5, 0.0);
      isTransitioning.current = true;
    } else if (preset === 'top') {
      targetPos.current.set(0.0, 20.0, 0.0);
      targetLook.current.set(0.0, 0.0, -1.5);
      isTransitioning.current = true;
    } else if (preset === 'free') {
      isTransitioning.current = false;
    }
  }, [preset]);

  useFrame((state, delta) => {
    if (isTransitioning.current && preset !== 'free') {
      state.camera.position.lerp(targetPos.current, Math.min(1, delta * 3.8));
      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLook.current, Math.min(1, delta * 3.8));
        controlsRef.current.update();
      }
      if (state.camera.position.distanceTo(targetPos.current) < 0.08) {
        isTransitioning.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      autoRotate={isOrbiting}
      autoRotateSpeed={1.0}
      enableDamping
      dampingFactor={0.06}
      minDistance={4}
      maxDistance={35}
      maxPolarAngle={Math.PI / 2 + 0.08}
    />
  );
}

/* =========================================================================
   9. Floating 3D Layer Legend HUD
   ========================================================================= */
function LayerLegendHUD({ isDark = true }) {
  return (
    <div className="absolute bottom-3 left-3 z-30 pointer-events-auto bg-white/95 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 shadow-lg backdrop-blur-md text-[10px] font-mono space-y-1 select-none">
      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
        3D Architectural Layers (5 Tiers)
      </span>
      {Object.entries(ARCH_LAYERS).map(([layerId, info]) => (
        <div key={layerId} className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
            style={{ backgroundColor: info.color }}
          />
          <span className="text-zinc-700 dark:text-zinc-300 font-medium truncate">
            {info.name}
          </span>
          <span className="text-zinc-400 text-[8px] ml-auto">
            {info.badge}
          </span>
        </div>
      ))}
    </div>
  );
}

/* =========================================================================
   10. Main 3D Pipeline Canvas Component
   ========================================================================= */
export default function Pipeline3DCanvas({
  theme,
  viewPreset = 'isometric',
  isOrbiting = false,
  selectedStage = 2,
  onSelectStage,
  latest = {},
  isSpiking = false,
}) {
  const isDark = useAppTheme(theme);

  const bgColor = isDark ? '#09090b' : '#f8fafc';
  const gridPrimary = isDark ? '#1f1f23' : '#e2e8f0';
  const gridSecondary = isDark ? '#141417' : '#f1f5f9';

  // Dynamic values
  const actualPods = Math.min(30, Math.max(2, latest.actual_pods || 4));
  const idealDemand = latest.ideal_demand || 4;
  const cpu = latest.cpu_utilization || 50;
  const reactiveHpa = latest.reactive_hpa || actualPods;
  const linearPred = latest.linear_pred || actualPods;
  const hwPred = latest.holt_winters_pred || actualPods;
  const lstmPred = latest.lstm_pred || actualPods;
  const maxVal = Math.max(reactiveHpa, linearPred, hwPred, lstmPred);

  let winningModel = 'LSTM';
  if (maxVal === lstmPred) winningModel = 'LSTM';
  else if (maxVal === hwPred) winningModel = 'Holt-Winters';
  else if (maxVal === linearPred) winningModel = 'Linear';
  else winningModel = 'Reactive HPA';

  const dynamicLatest = {
    ...latest,
    actual_pods: actualPods,
    ideal_demand: idealDemand,
    cpu_utilization: cpu,
    reactive_hpa: reactiveHpa,
    linear_pred: linearPred,
    holt_winters_pred: hwPred,
    lstm_pred: lstmPred,
    maxVal,
    winningModel,
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
        camera={{ position: [10.0, 9.0, 14.5], fov: 42 }}
      >
        {/* Dynamic theme background */}
        <color attach="background" args={[bgColor]} />

        {/* Ambient & Directional Studio Lighting */}
        <ambientLight intensity={isDark ? 0.65 : 0.95} />
        <directionalLight
          position={[12, 18, 12]}
          intensity={isDark ? 1.4 : 1.6}
          color="#ffffff"
        />
        <directionalLight
          position={[-10, 8, -10]}
          intensity={isDark ? 0.4 : 0.6}
          color="#94a3b8"
        />

        {/* Camera and Uninterrupted Orbit Controls */}
        <CameraController preset={viewPreset} isOrbiting={isOrbiting} />

        {/* Clean Ground Grid */}
        <gridHelper
          args={[40, 40, gridPrimary, gridSecondary]}
          position={[0, -4.0, 0]}
        />

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
          center={[-3.8, -0.4, -4.2]}
          actualPods={actualPods}
          idealDemand={idealDemand}
          cpu={cpu}
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
