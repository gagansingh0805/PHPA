import React, { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, RoundedBox, Edges, Line, Html, ContactShadows } from '@react-three/drei';
import {
  Activity,
  Network,
  Server,
  Layers,
  Cpu,
  Zap,
  Sparkles,
} from 'lucide-react';

/* =========================================================================
   1. Theme Detection Hook (Syncs with prop or document.documentElement)
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
   2. Symmetrical 3D Pipeline Coordinates & Dimensions
   ========================================================================= */
const PIPELINE_NODES = [
  {
    id: 0,
    title: 'Traffic Ingestion',
    subtitle: 'HTTP/gRPC Stream',
    position: [-6.0, 1.6, 0],
    size: [2.6, 1.5, 0.35],
    htmlWidth: 200,
    icon: Activity,
    color: '#38bdf8', // Cyan
  },
  {
    id: 1,
    title: 'Ingress Router',
    subtitle: 'Envoy Service Mesh',
    position: [-3.0, 1.6, 0],
    size: [2.6, 1.5, 0.35],
    htmlWidth: 200,
    icon: Network,
    color: '#60a5fa', // Blue
  },
  {
    id: 2,
    title: 'Target Pods Cluster',
    subtitle: 'k8s: default/web-workload',
    position: [1.1, 1.6, 0],
    size: [4.4, 2.4, 0.35],
    htmlWidth: 330,
    icon: Server,
    color: '#a855f7', // Purple
  },
  {
    id: 3,
    title: 'k8shorizmetrics',
    subtitle: 'cAdvisor / Kubelet',
    position: [1.1, -1.9, 0],
    size: [2.8, 1.6, 0.35],
    htmlWidth: 220,
    icon: Layers,
    color: '#34d399', // Emerald
  },
  {
    id: 4,
    title: 'Parallel Model Evaluator',
    subtitle: 'Multi-Model Core',
    position: [5.8, -1.9, 0],
    size: [5.2, 2.6, 0.35],
    htmlWidth: 390,
    icon: Cpu,
    color: '#818cf8', // Indigo
  },
  {
    id: 5,
    title: 'Scale Actuator',
    subtitle: 'Kube-API Patch',
    position: [5.8, 1.6, 0],
    size: [2.8, 1.5, 0.35],
    htmlWidth: 220,
    icon: Zap,
    color: '#f59e0b', // Amber
  },
];

/* Prominent Orthogonal Highway Connections between Nodes */
const PIPELINE_CONNECTIONS = [
  // Hop 1: Ingestion -> Ingress (rightward)
  { id: 1, from: 0, to: 1, start: [-4.7, 1.6, 0], end: [-4.3, 1.6, 0] },
  // Hop 2: Ingress -> Pods Cluster (rightward)
  { id: 2, from: 1, to: 2, start: [-1.7, 1.6, 0], end: [-1.1, 1.6, 0] },
  // Hop 3: Pods Cluster -> Telemetry (straight downward)
  { id: 3, from: 2, to: 3, start: [1.1, 0.4, 0], end: [1.1, -1.1, 0] },
  // Hop 4: Telemetry -> Models Evaluator (straight rightward)
  { id: 4, from: 3, to: 4, start: [2.5, -1.9, 0], end: [3.2, -1.9, 0] },
  // Hop 5: Models Evaluator -> Scale Actuator (straight upward)
  { id: 5, from: 4, to: 5, start: [5.8, -0.6, 0], end: [5.8, 0.85, 0] },
  // Hop 6: Scale Actuator -> Pods Cluster (straight leftward back into Pods)
  { id: 6, from: 5, to: 2, start: [4.4, 1.6, 0], end: [3.3, 1.6, 0] },
];

/* =========================================================================
   3. Specialized Sub-Component Content Renderers
   ========================================================================= */
function NodeInnerContent({
  node,
  rps,
  p95,
  actualPods,
  cpu,
  idealDemand,
  reactiveHpa,
  linearPred,
  hwPred,
  lstmPred,
  maxVal,
  winningModel,
  isActiveHop,
}) {
  switch (node.id) {
    case 0: // 1. Traffic Ingestion
      return (
        <div className="flex flex-col w-full text-left">
          <div className="flex items-center justify-between w-full mb-1">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-500" />
              <span className="text-[10px] font-mono font-bold tracking-wider text-zinc-400">01</span>
            </div>
            <span className="text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              LIVE
            </span>
          </div>
          <span className="text-[11px] font-bold font-mono text-zinc-900 dark:text-zinc-100 truncate w-full">
            1. Traffic Ingestion
          </span>
          <div className="flex items-baseline justify-between w-full my-1">
            <span className="text-[9px] font-mono text-zinc-500">Volume:</span>
            <span className="text-[12px] font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
              {rps} RPS
            </span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1 overflow-hidden my-0.5">
            <div
              className="h-full bg-sky-500 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.round((rps / 500) * 100))}%` }}
            />
          </div>
          <span className="text-[8px] font-mono text-zinc-500 truncate w-full mt-0.5">
            HTTP / gRPC Stream
          </span>
        </div>
      );

    case 1: // 2. Ingress Router
      return (
        <div className="flex flex-col w-full text-left">
          <div className="flex items-center justify-between w-full mb-1">
            <div className="flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[10px] font-mono font-bold tracking-wider text-zinc-400">02</span>
            </div>
            <span className="text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
              Envoy Mesh
            </span>
          </div>
          <span className="text-[11px] font-bold font-mono text-zinc-900 dark:text-zinc-100 truncate w-full">
            2. Ingress Router
          </span>
          <div className="flex items-baseline justify-between w-full my-1">
            <span className="text-[9px] font-mono text-zinc-500">P95 Latency:</span>
            <span className="text-[12px] font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
              {p95}ms
            </span>
          </div>
          <span className="text-[8px] font-mono text-zinc-500 truncate w-full mt-0.5">
            Weighted Round Robin
          </span>
        </div>
      );

    case 2: // 3. Target Pods Cluster (Expanded Grid View)
      return (
        <div className="flex flex-col w-full text-left">
          {/* Header */}
          <div className="flex items-center justify-between w-full mb-1">
            <div className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-purple-500" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-zinc-400">03</span>
                  <span className="text-[11px] font-bold font-mono text-zinc-900 dark:text-zinc-100">
                    3. Target Pods Cluster
                  </span>
                </div>
                <span className="text-[7.5px] font-mono text-zinc-500 block leading-tight">
                  k8s: default/web-workload
                </span>
              </div>
            </div>
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/30">
              {actualPods} Active Replicas
            </span>
          </div>

          {/* Pod Blades Rack Grid */}
          <div className="bg-zinc-100/80 dark:bg-zinc-950/90 rounded-lg p-1.5 border border-zinc-200/80 dark:border-zinc-800/80 w-full my-1">
            <div className="grid grid-cols-4 gap-1 w-full">
              {Array.from({ length: Math.min(12, actualPods) }).map((_, idx) => {
                const podCpu = Math.min(100, Math.max(10, Math.round(cpu + (idx % 3) * 4 - 4)));
                const isTargeted = isActiveHop && idx === 0;
                return (
                  <div
                    key={idx}
                    className={`rounded p-1 text-center border transition-all ${
                      isTargeted
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-sm'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[7.5px] font-mono leading-none mb-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${isTargeted ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500'}`} />
                      <span className={isTargeted ? 'text-zinc-200 dark:text-zinc-700' : 'text-zinc-500'}>#{idx + 1}</span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1 overflow-hidden my-0.5">
                      <div
                        className={`h-full ${isTargeted ? 'bg-emerald-400' : 'bg-zinc-900 dark:bg-zinc-100'}`}
                        style={{ width: `${podCpu}%` }}
                      />
                    </div>
                    <span className={`text-[7px] font-mono block leading-none ${isTargeted ? 'text-white dark:text-zinc-900 font-bold' : 'text-zinc-500'}`}>
                      {podCpu}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Stats */}
          <div className="flex items-center justify-between text-[8px] font-mono text-zinc-500 dark:text-zinc-400 w-full pt-1 border-t border-zinc-200/60 dark:border-zinc-800/60">
            <span>Avg Pod CPU: <strong className="text-zinc-900 dark:text-zinc-100">{cpu}%</strong></span>
            <span>Target: <strong>60%</strong></span>
            <span>Ideal: <strong className="text-zinc-900 dark:text-zinc-100">{idealDemand} pods</strong></span>
          </div>
        </div>
      );

    case 3: // 4. k8shorizmetrics
      return (
        <div className="flex flex-col w-full text-left">
          <div className="flex items-center justify-between w-full mb-1">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] font-mono font-bold tracking-wider text-zinc-400">04</span>
            </div>
            <span className="text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              15s Cadence
            </span>
          </div>
          <span className="text-[11px] font-bold font-mono text-zinc-900 dark:text-zinc-100 truncate w-full">
            4. k8shorizmetrics
          </span>
          <span className="text-[8.5px] font-mono text-zinc-500 truncate w-full my-1">
            cAdvisor scrape & metric buffer
          </span>
          <div className="flex items-center justify-between text-[8px] font-mono w-full pt-1 border-t border-zinc-200/60 dark:border-zinc-800/60">
            <span className="text-zinc-500">Unready pods:</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">0 filtered</span>
          </div>
        </div>
      );

    case 4: // 5. Parallel Model Evaluator (All 4 Models Concurrently!)
      return (
        <div className="flex flex-col w-full text-left">
          {/* Header */}
          <div className="flex items-center justify-between w-full mb-1">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-500" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-zinc-400">05</span>
                  <span className="text-[11px] font-bold font-mono text-zinc-900 dark:text-zinc-100">
                    5. Parallel Model Evaluator
                  </span>
                </div>
                <span className="text-[7.5px] font-mono text-zinc-500 block leading-tight">
                  Dispatching 4 Models Concurrently
                </span>
              </div>
            </div>
            <span className="text-[8.5px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30">
              MAX Envelope
            </span>
          </div>

          {/* 4 Models 2x2 Grid */}
          <div className="grid grid-cols-2 gap-1.5 w-full my-1">
            {/* Model 1: Reactive HPA */}
            <div className={`rounded-md p-1.5 border text-[8.5px] font-mono transition-all ${
              winningModel === 'Reactive HPA'
                ? 'bg-zinc-200/90 dark:bg-zinc-800 border-zinc-900 dark:border-zinc-200 text-zinc-900 dark:text-zinc-100 shadow-sm ring-1 ring-zinc-900/20'
                : 'bg-zinc-100/70 dark:bg-zinc-950/80 border-zinc-200/80 dark:border-zinc-800/80 text-zinc-500 dark:text-zinc-400'
            }`}>
              <div className="flex items-center justify-between text-[8px] mb-0.5">
                <span className="font-semibold text-zinc-600 dark:text-zinc-400 truncate">Reactive HPA</span>
                {winningModel === 'Reactive HPA' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
              </div>
              <div className="flex items-baseline justify-between font-bold text-zinc-900 dark:text-zinc-100 text-[10px]">
                <span>{reactiveHpa}</span>
                <span className="text-[7.5px] font-normal text-zinc-500">pods</span>
              </div>
            </div>

            {/* Model 2: Linear OLS */}
            <div className={`rounded-md p-1.5 border text-[8.5px] font-mono transition-all ${
              winningModel === 'Linear OLS' || winningModel === 'Linear'
                ? 'bg-zinc-200/90 dark:bg-zinc-800 border-zinc-900 dark:border-zinc-200 text-zinc-900 dark:text-zinc-100 shadow-sm ring-1 ring-zinc-900/20'
                : 'bg-zinc-100/70 dark:bg-zinc-950/80 border-zinc-200/80 dark:border-zinc-800/80 text-zinc-500 dark:text-zinc-400'
            }`}>
              <div className="flex items-center justify-between text-[8px] mb-0.5">
                <span className="font-semibold text-zinc-600 dark:text-zinc-400 truncate">Linear OLS</span>
                {(winningModel === 'Linear OLS' || winningModel === 'Linear') && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
              </div>
              <div className="flex items-baseline justify-between font-bold text-zinc-900 dark:text-zinc-100 text-[10px]">
                <span>{linearPred}</span>
                <span className="text-[7.5px] font-normal text-zinc-500">pods</span>
              </div>
            </div>

            {/* Model 3: Holt-Winters */}
            <div className={`rounded-md p-1.5 border text-[8.5px] font-mono transition-all ${
              winningModel === 'Holt-Winters'
                ? 'bg-zinc-200/90 dark:bg-zinc-800 border-zinc-900 dark:border-zinc-200 text-zinc-900 dark:text-zinc-100 shadow-sm ring-1 ring-zinc-900/20'
                : 'bg-zinc-100/70 dark:bg-zinc-950/80 border-zinc-200/80 dark:border-zinc-800/80 text-zinc-500 dark:text-zinc-400'
            }`}>
              <div className="flex items-center justify-between text-[8px] mb-0.5">
                <span className="font-semibold text-zinc-600 dark:text-zinc-400 truncate">Holt-Winters</span>
                {winningModel === 'Holt-Winters' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
              </div>
              <div className="flex items-baseline justify-between font-bold text-zinc-900 dark:text-zinc-100 text-[10px]">
                <span>{hwPred}</span>
                <span className="text-[7.5px] font-normal text-zinc-500">pods</span>
              </div>
            </div>

            {/* Model 4: 2-Layer LSTM */}
            <div className={`rounded-md p-1.5 border text-[8.5px] font-mono transition-all ${
              winningModel === 'LSTM'
                ? 'bg-zinc-200/90 dark:bg-zinc-800 border-zinc-900 dark:border-zinc-200 text-zinc-900 dark:text-zinc-100 shadow-sm ring-1 ring-zinc-900/20'
                : 'bg-zinc-100/70 dark:bg-zinc-950/80 border-zinc-200/80 dark:border-zinc-800/80 text-zinc-500 dark:text-zinc-400'
            }`}>
              <div className="flex items-center justify-between text-[8px] mb-0.5">
                <span className="font-semibold text-zinc-600 dark:text-zinc-400 truncate">2-Layer LSTM</span>
                {winningModel === 'LSTM' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />}
              </div>
              <div className="flex items-baseline justify-between font-bold text-zinc-900 dark:text-zinc-100 text-[10px]">
                <span>{lstmPred}</span>
                <span className="text-[7.5px] font-normal text-zinc-500">pods</span>
              </div>
            </div>
          </div>

          {/* Footer: MAX Decision Synthesis */}
          <div className="flex items-center justify-between text-[8.5px] font-mono w-full pt-1 border-t border-zinc-200/60 dark:border-zinc-800/60">
            <span className="text-zinc-500 dark:text-zinc-400">MAX Output:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              {maxVal} Replicas via {winningModel}
            </span>
          </div>
        </div>
      );

    case 5: // 6. Scale Actuator
      return (
        <div className="flex flex-col w-full text-left">
          <div className="flex items-center justify-between w-full mb-1">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[10px] font-mono font-bold tracking-wider text-zinc-400">06</span>
            </div>
            <span className="text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              ScaleClient
            </span>
          </div>
          <span className="text-[11px] font-bold font-mono text-zinc-900 dark:text-zinc-100 truncate w-full">
            6. Scale Actuator
          </span>
          <div className="flex items-baseline justify-between w-full my-1">
            <span className="text-[9px] font-mono text-zinc-500">Patched:</span>
            <span className="text-[12px] font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
              {actualPods} pods
            </span>
          </div>
          <span className="text-[8px] font-mono text-emerald-600 dark:text-emerald-400 truncate w-full mt-0.5">
            Loop Closed ✓ Kube-API
          </span>
        </div>
      );

    default:
      return null;
  }
}

/* =========================================================================
   4. Individual 3D Stage Node Mesh with Theme-Aware Styling & Active Pulse
   ========================================================================= */
function StageNode({
  node,
  isSelected,
  isActiveHop,
  isDark,
  latest,
  onSelect,
}) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef();
  const ringRef = useRef();

  // Metrics calculation
  const rps = latest?.rps || 125;
  const p95 = latest?.p95 || 35.4;
  const actualPods = latest?.actual_pods || 5;
  const cpu = latest?.cpu || 48;
  const idealDemand = latest?.ideal_demand || Math.max(1, Math.ceil((actualPods * cpu) / 60));
  const reactiveHpa = latest?.reactive_hpa || actualPods;
  const linearPred = latest?.linear_pred || actualPods;
  const hwPred = latest?.holt_winters_pred || actualPods;
  const lstmPred = latest?.lstm_pred || actualPods;
  const maxVal = Math.max(reactiveHpa, linearPred, hwPred, lstmPred);

  let winningModel = 'LSTM';
  if (maxVal === lstmPred) winningModel = 'LSTM';
  else if (maxVal === hwPred) winningModel = 'Holt-Winters';
  else if (maxVal === linearPred) winningModel = 'Linear';
  else winningModel = 'Reactive HPA';

  // Subtle floating idle motion + dynamic pulse when active
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      const floatY = Math.sin(t * 1.5 + node.id * 1.1) * 0.035;
      meshRef.current.position.y = node.position[1] + floatY;

      // Scale pulse when active during trace
      const baseScale = isActiveHop ? 1.04 + Math.sin(t * 6) * 0.02 : hovered ? 1.025 : 1.0;
      meshRef.current.scale.set(baseScale, baseScale, baseScale);
    }

    if (ringRef.current && isActiveHop) {
      ringRef.current.rotation.z += 0.03;
      const s = 1.0 + Math.sin(t * 7) * 0.06;
      ringRef.current.scale.set(s, s, 1);
    }
  });

  // Theme-Aware Materials
  const cardColor = isDark
    ? isSelected
      ? '#222329'
      : '#131418'
    : isSelected
    ? '#ffffff'
    : '#f8fafc';

  const edgeColor = isActiveHop
    ? node.color
    : hovered
    ? isDark
      ? '#71717a'
      : '#94a3b8'
    : isDark
    ? '#2f3139'
    : '#cbd5e1';

  return (
    <group ref={meshRef} position={node.position} rotation={[0, 0, 0]}>
      {/* Active Aura / Glowing Ring Mesh (rendered when node is active) */}
      {isActiveHop && (
        <mesh ref={ringRef} position={[0, 0, -0.05]}>
          <ringGeometry args={[node.size[0] * 0.52, node.size[0] * 0.56, 36]} />
          <meshBasicMaterial
            color={node.color}
            transparent
            opacity={isDark ? 0.75 : 0.55}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 3D Rounded Box Mesh */}
      <RoundedBox
        args={node.size}
        radius={0.08}
        smoothness={4}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(node.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={cardColor}
          roughness={isDark ? 0.25 : 0.2}
          metalness={isDark ? 0.25 : 0.1}
          emissive={isActiveHop ? node.color : isSelected ? (isDark ? '#27272a' : '#e2e8f0') : '#000000'}
          emissiveIntensity={isActiveHop ? (isDark ? 0.55 : 0.35) : isSelected ? 0.12 : 0}
        />
        {/* Crisp wireframe border edge */}
        <Edges
          linewidth={isActiveHop ? 2.5 : 1.5}
          scale={1.002}
          color={edgeColor}
        />
      </RoundedBox>

      {/* Ground Anchor Pedestal / Drop Shadow Disc */}
      <mesh position={[0, -2.62 - node.position[1], 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[node.size[0] * 0.42, 32]} />
        <meshBasicMaterial
          color={isDark ? '#000000' : '#475569'}
          transparent
          opacity={isDark ? (isActiveHop ? 0.65 : 0.4) : (isActiveHop ? 0.35 : 0.18)}
        />
      </mesh>

      {/* HTML Overlay Label (Billboarded, always crisp & readable in both themes) */}
      <Html
        position={[0, 0, 0.22]}
        center
        distanceFactor={10.2}
        className="pointer-events-auto select-none"
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(node.id);
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{ width: `${node.htmlWidth}px` }}
          className={`flex flex-col p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
            isActiveHop
              ? isDark
                ? 'bg-zinc-950/95 border-sky-400 shadow-[0_0_24px_rgba(56,189,248,0.25)] ring-1 ring-sky-400/50'
                : 'bg-white/98 border-sky-500 shadow-[0_4px_20px_rgba(2,132,199,0.25)] ring-1 ring-sky-500/60'
              : isSelected
              ? isDark
                ? 'bg-zinc-900/95 border-zinc-500 shadow-md ring-1 ring-zinc-500/40'
                : 'bg-white/98 border-zinc-400 shadow-md ring-1 ring-zinc-300'
              : isDark
              ? 'bg-zinc-950/90 border-zinc-800/90 hover:border-zinc-700 hover:bg-zinc-900/90 shadow-sm'
              : 'bg-white/95 border-zinc-200/90 hover:border-zinc-300 hover:bg-zinc-50/95 shadow-sm'
          }`}
        >
          <NodeInnerContent
            node={node}
            rps={rps}
            p95={p95}
            actualPods={actualPods}
            cpu={cpu}
            idealDemand={idealDemand}
            reactiveHpa={reactiveHpa}
            linearPred={linearPred}
            hwPred={hwPred}
            lstmPred={lstmPred}
            maxVal={maxVal}
            winningModel={winningModel}
            isActiveHop={isActiveHop}
            isDark={isDark}
          />
        </div>
      </Html>
    </group>
  );
}

/* =========================================================================
   4. Animated Trace Particle Traveling Along Connection Highways
   ========================================================================= */
function TraceParticleSystem({
  isProbePlaying,
  probeHop,
  probeSpeed = 1,
  isDark = true,
  onProbeHopChange,
}) {
  const particleRef = useRef();
  const lightRef = useRef();
  const progressRef = useRef(0);
  const currentHopRef = useRef(probeHop > 0 ? probeHop : 1);

  useEffect(() => {
    if (probeHop > 0) {
      currentHopRef.current = probeHop;
      progressRef.current = 0;
    }
  }, [probeHop]);

  useFrame((_, delta) => {
    if (!particleRef.current) return;

    if (isProbePlaying) {
      // 1.2s base segment duration dynamically scaled by probeSpeed (0.5x, 1x, 2x, 4x)
      const baseDuration = 1.2;
      const segmentDuration = baseDuration / Math.max(0.25, probeSpeed);

      progressRef.current += delta / segmentDuration;

      if (progressRef.current >= 1) {
        progressRef.current = 0;
        const nextHop = (currentHopRef.current % 6) + 1;
        currentHopRef.current = nextHop;
        onProbeHopChange?.(nextHop);
      }
    }

    const conn = PIPELINE_CONNECTIONS[currentHopRef.current - 1];
    if (conn) {
      const p = isProbePlaying ? progressRef.current : 0.5;
      const x = conn.start[0] + (conn.end[0] - conn.start[0]) * p;
      const y = conn.start[1] + (conn.end[1] - conn.start[1]) * p;
      const z = conn.start[2] + (conn.end[2] - conn.start[2]) * p;

      particleRef.current.position.set(x, y, z);
      if (lightRef.current) {
        lightRef.current.position.set(x, y, z + 0.25);
      }
    }
  });

  const shouldRender = isProbePlaying || probeHop > 0;
  if (!shouldRender) return null;

  return (
    <>
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.16, 20, 20]} />
        <meshBasicMaterial color={isDark ? '#ffffff' : '#0284c7'} />
      </mesh>
      <pointLight
        ref={lightRef}
        color={isDark ? '#38bdf8' : '#0284c7'}
        intensity={isDark ? 3.5 : 2.5}
        distance={3.2}
      />
    </>
  );
}

/* =========================================================================
   5. Ambient Micro-Photons (Continuous Pipeline Traffic)
   ========================================================================= */
function AmbientPhotons({ isSpiking, isDark }) {
  const meshRefs = useRef([]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * (isSpiking ? 1.8 : 0.85);

    PIPELINE_CONNECTIONS.forEach((conn, idx) => {
      const mesh = meshRefs.current[idx];
      if (mesh) {
        const p = (t + idx * 0.25) % 1;
        const x = conn.start[0] + (conn.end[0] - conn.start[0]) * p;
        const y = conn.start[1] + (conn.end[1] - conn.start[1]) * p;
        const z = conn.start[2] + (conn.end[2] - conn.start[2]) * p;
        mesh.position.set(x, y, z);
      }
    });
  });

  return (
    <group>
      {PIPELINE_CONNECTIONS.map((_, idx) => (
        <mesh key={idx} ref={(el) => (meshRefs.current[idx] = el)}>
          <sphereGeometry args={[0.065, 12, 12]} />
          <meshBasicMaterial
            color={isDark ? '#e4e4e7' : '#334155'}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

/* =========================================================================
   6. Camera Controller with Smooth Lerp Presets & Uninterrupted OrbitControls
   ========================================================================= */
function CameraController({ preset = 'isometric', isOrbiting = false }) {
  const controlsRef = useRef();
  const targetPos = useRef(new THREE.Vector3(0, 9.8, 15.0));
  const targetLook = useRef(new THREE.Vector3(0.6, -0.15, 0));
  const isTransitioning = useRef(true);

  useEffect(() => {
    if (preset === 'isometric') {
      targetPos.current.set(0, 9.8, 15.0);
      targetLook.current.set(0.6, -0.15, 0);
      isTransitioning.current = true;
    } else if (preset === 'front') {
      targetPos.current.set(0, 2.2, 17.5);
      targetLook.current.set(0.6, -0.15, 0);
      isTransitioning.current = true;
    } else if (preset === 'top') {
      targetPos.current.set(0.6, 18.5, 3.5);
      targetLook.current.set(0.6, -0.15, 0);
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
      if (state.camera.position.distanceTo(targetPos.current) < 0.05) {
        isTransitioning.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      autoRotate={isOrbiting}
      autoRotateSpeed={1.2}
      enableDamping
      dampingFactor={0.06}
      minDistance={3.5}
      maxDistance={28}
      maxPolarAngle={Math.PI / 2 + 0.02}
    />
  );
}

/* =========================================================================
   7. Main 3D Pipeline Canvas Component (Full Theme Adaptation)
   ========================================================================= */
export default function Pipeline3DCanvas({
  theme,
  viewPreset = 'isometric',
  isOrbiting = false,
  isProbePlaying = false,
  probeHop = 0,
  probeSpeed = 1,
  onProbeHopChange,
  selectedStage = 2,
  onSelectStage,
  latest = {},
  isSpiking = false,
}) {
  const isDark = useAppTheme(theme);

  // Palette definitions
  const bgColor = isDark ? '#09090b' : '#f4f4f5';
  const gridPrimary = isDark ? '#27272a' : '#cbd5e1';
  const gridSecondary = isDark ? '#18181b' : '#e2e8f0';
  const lineBaseColor = isDark ? '#71717a' : '#475569';
  const lineActiveColor = isDark ? '#38bdf8' : '#0284c7';

  return (
    <div
      className={`w-full h-full min-h-[460px] sm:min-h-[560px] md:min-h-[680px] relative select-none overflow-hidden rounded-2xl transition-colors duration-200 ${
        isDark ? 'bg-zinc-950' : 'bg-zinc-100'
      }`}
    >
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
        }}
        camera={{ position: [0, 9.8, 15.0], fov: 38 }}
      >
        {/* Dynamic theme background color */}
        <color attach="background" args={[bgColor]} />

        {/* Studio Lighting */}
        <ambientLight intensity={isDark ? 0.6 : 0.95} />
        <directionalLight
          position={[6, 14, 8]}
          intensity={isDark ? 1.3 : 1.5}
          color="#ffffff"
        />
        <directionalLight
          position={[-6, -8, -6]}
          intensity={isDark ? 0.3 : 0.5}
          color="#ffffff"
        />

        {/* Camera and Uninterrupted Orbit Controls */}
        <CameraController preset={viewPreset} isOrbiting={isOrbiting} />

        {/* Symmetrical Ground Grid */}
        <gridHelper
          args={[32, 32, gridPrimary, gridSecondary]}
          position={[0, -2.65, 0]}
        />

        {/* Soft Ground Contact Shadows */}
        <ContactShadows
          position={[0, -2.64, 0]}
          opacity={isDark ? 0.7 : 0.38}
          scale={26}
          blur={2.0}
          far={8}
          color={isDark ? '#000000' : '#334155'}
        />

        {/* Prominent Highway Connection Lines between Nodes */}
        {PIPELINE_CONNECTIONS.map((conn) => {
          const isActive = probeHop === conn.id;
          return (
            <Line
              key={conn.id}
              points={[conn.start, conn.end]}
              color={isActive ? lineActiveColor : lineBaseColor}
              lineWidth={isActive ? 5.5 : 3.5}
              transparent
              opacity={isActive ? 1.0 : 0.85}
            />
          );
        })}

        {/* Pipeline Stage Nodes */}
        {PIPELINE_NODES.map((node) => {
          const isSelected = selectedStage === node.id;
          // Node is active if it's currently transmitting/processing the hop
          const isActiveHop =
            probeHop > 0 &&
            (node.id === probeHop - 1 || (probeHop === 6 && node.id === 5));

          return (
            <StageNode
              key={node.id}
              node={node}
              isSelected={isSelected}
              isActiveHop={isActiveHop}
              isDark={isDark}
              latest={latest}
              onSelect={onSelectStage}
            />
          );
        })}

        {/* Continuous Highway Photons */}
        <AmbientPhotons isSpiking={isSpiking} isDark={isDark} />

        {/* Active Step-by-Step Probe Particle */}
        <TraceParticleSystem
          isProbePlaying={isProbePlaying}
          probeHop={probeHop}
          probeSpeed={probeSpeed}
          isDark={isDark}
          onProbeHopChange={onProbeHopChange}
        />
      </Canvas>
    </div>
  );
}
