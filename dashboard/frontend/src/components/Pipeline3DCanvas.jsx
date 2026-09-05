import React, { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, RoundedBox, Edges, Line, Html } from '@react-three/drei';
import {
  Activity,
  Network,
  Server,
  Layers,
  Cpu,
  Zap,
} from 'lucide-react';

/* =========================================================================
   1. Pipeline Node Configurations & 3D Coordinates
   ========================================================================= */
export const PIPELINE_NODES = [
  {
    id: 0,
    title: 'Edge Ingestion',
    subtitle: 'HTTP/gRPC Stream',
    position: [-5.2, 1.4, 0],
    icon: Activity,
    color: '#38bdf8', // Cyan
    getStat: (latest) => `${latest?.rps || 125} RPS`,
  },
  {
    id: 1,
    title: 'Ingress Router',
    subtitle: 'Envoy Service Mesh',
    position: [-2.1, 1.4, 0],
    icon: Network,
    color: '#60a5fa', // Blue
    getStat: (latest) => `${latest?.p95 || 35.4}ms P95`,
  },
  {
    id: 2,
    title: 'Pod Workload',
    subtitle: 'Active Cluster',
    position: [1.3, 1.4, 0],
    icon: Server,
    color: '#a855f7', // Purple
    getStat: (latest) => `${latest?.actual_pods || 4} Pods`,
  },
  {
    id: 3,
    title: 'Telemetry Harvester',
    subtitle: 'cAdvisor / Kubelet',
    position: [1.3, -1.5, 0],
    icon: Layers,
    color: '#34d399', // Emerald
    getStat: (latest) => `${latest?.cpu || 48}% CPU`,
  },
  {
    id: 4,
    title: 'PHPA Models Brain',
    subtitle: 'Multi-Model Core',
    position: [4.9, -1.5, 0],
    icon: Cpu,
    color: '#818cf8', // Indigo
    getStat: (latest) => `MAX: ${latest?.predicted_pods || latest?.actual_pods || 6} Pods`,
  },
  {
    id: 5,
    title: 'Scale Actuator',
    subtitle: 'Kube-API Patch',
    position: [4.9, 1.4, 0],
    icon: Zap,
    color: '#f59e0b', // Amber
    getStat: () => 'k8s REST Patch',
  },
];

/* Highway Connections matching 2D sequence */
export const PIPELINE_CONNECTIONS = [
  // Hop 1: Ingestion -> Ingress
  { id: 1, from: 0, to: 1, start: [-4.05, 1.4, 0], end: [-3.25, 1.4, 0] },
  // Hop 2: Ingress -> Pods
  { id: 2, from: 1, to: 2, start: [-0.95, 1.4, 0], end: [0.15, 1.4, 0] },
  // Hop 3: Pods -> Telemetry (downward)
  { id: 3, from: 2, to: 3, start: [1.3, 0.75, 0], end: [1.3, -0.85, 0] },
  // Hop 4: Telemetry -> Models Brain (rightward)
  { id: 4, from: 3, to: 4, start: [2.45, -1.5, 0], end: [3.75, -1.5, 0] },
  // Hop 5: Models Brain -> Scale Actuator (upward)
  { id: 5, from: 4, to: 5, start: [4.9, -0.85, 0], end: [4.9, 0.75, 0] },
  // Hop 6: Scale Actuator -> Pods (leftward closing the loop)
  { id: 6, from: 5, to: 2, start: [3.75, 1.4, 0], end: [2.45, 1.4, 0] },
];

/* =========================================================================
   2. Individual 3D Pipeline Stage Node Mesh
   ========================================================================= */
function StageNode({
  node,
  isSelected,
  isActiveHop,
  latest,
  onSelect,
}) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef();

  // Subtle floating idle motion
  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.getElapsedTime();
      meshRef.current.position.y =
        node.position[1] + Math.sin(t * 1.5 + node.id * 1.1) * 0.04;
    }
  });

  const statText = node.getStat(latest);

  return (
    <group ref={meshRef} position={node.position}>
      {/* 3D Rounded Box Mesh */}
      <RoundedBox
        args={[2.3, 1.25, 0.35]}
        radius={0.07}
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
          color={isSelected ? '#1c1d22' : '#121316'}
          roughness={0.25}
          metalness={0.3}
          emissive={isActiveHop ? node.color : isSelected ? '#27272a' : '#000000'}
          emissiveIntensity={isActiveHop ? 0.45 : isSelected ? 0.15 : 0}
        />
        {/* Subtle geometric wireframe edges */}
        <Edges
          linewidth={1}
          scale={1.002}
          color={isActiveHop ? node.color : hovered ? '#71717a' : '#27272a'}
        />
      </RoundedBox>

      {/* HTML Overlay Label (Billboarded, always crisp & readable at any camera angle) */}
      <Html
        position={[0, 0, 0.22]}
        center
        distanceFactor={9.5}
        className="pointer-events-auto select-none"
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(node.id);
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all duration-200 cursor-pointer min-w-[125px] ${
            isActiveHop
              ? 'bg-zinc-950/95 border-zinc-500 shadow-[0_0_15px_rgba(255,255,255,0.12)]'
              : isSelected
              ? 'bg-zinc-900/90 border-zinc-600 shadow-md'
              : 'bg-zinc-950/80 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/90'
          }`}
        >
          {/* Header Row */}
          <div className="flex items-center gap-1.5 mb-1 w-full justify-between">
            <div className="flex items-center gap-1">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: node.color }}
              />
              <span className="text-[9px] font-mono text-zinc-400 font-bold uppercase tracking-wider">
                0{node.id + 1}
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-zinc-800/90 text-zinc-200 border border-zinc-700/60">
              {statText}
            </span>
          </div>

          {/* Node Title */}
          <span className="text-[11px] font-semibold text-zinc-100 font-mono tracking-tight text-center truncate w-full">
            {node.title}
          </span>
          <span className="text-[8.5px] text-zinc-500 font-mono tracking-tight text-center truncate w-full">
            {node.subtitle}
          </span>
        </div>
      </Html>
    </group>
  );
}

/* =========================================================================
   3. Animated Trace Particle Traveling Along Connection Highways
   ========================================================================= */
function TraceParticleSystem({
  isProbePlaying,
  probeHop,
  probeSpeed = 1,
  onProbeHopChange,
}) {
  const particleRef = useRef();
  const lightRef = useRef();
  const progressRef = useRef(0);
  const currentHopRef = useRef(probeHop > 0 ? probeHop : 1);

  // Sync ref with prop
  useEffect(() => {
    if (probeHop > 0) {
      currentHopRef.current = probeHop;
      progressRef.current = 0;
    }
  }, [probeHop]);

  useFrame((_, delta) => {
    if (!particleRef.current) return;

    if (isProbePlaying) {
      // 1.2s base segment duration scaled by probeSpeed (0.5x, 1x, 2x, 4x)
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
        lightRef.current.position.set(x, y, z + 0.2);
      }
    }
  });

  const shouldRender = isProbePlaying || probeHop > 0;
  if (!shouldRender) return null;

  return (
    <>
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <pointLight
        ref={lightRef}
        color="#38bdf8"
        intensity={2.2}
        distance={2.5}
      />
    </>
  );
}

/* =========================================================================
   4. Ambient Micro-Photons (Continuous Highway Traffic)
   ========================================================================= */
function AmbientPhotons({ isSpiking }) {
  const meshRefs = useRef([]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * (isSpiking ? 1.8 : 0.8);

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
        <mesh
          key={idx}
          ref={(el) => (meshRefs.current[idx] = el)}
        >
          <sphereGeometry args={[0.045, 10, 10]} />
          <meshBasicMaterial color="#a1a1aa" transparent opacity={0.65} />
        </mesh>
      ))}
    </group>
  );
}

/* =========================================================================
   5. Camera Controller with Smooth Lerp Presets & Auto-Orbit
   ========================================================================= */
function CameraController({ preset = 'isometric', isOrbiting = false }) {
  const controlsRef = useRef();
  const targetPos = useRef(new THREE.Vector3(0.8, 6.8, 8.8));
  const targetLook = useRef(new THREE.Vector3(0.8, 0, 0));
  const isTransitioning = useRef(true);

  useEffect(() => {
    if (preset === 'isometric') {
      // ~44° elevation angle
      targetPos.current.set(0.8, 6.8, 8.8);
      targetLook.current.set(0.8, 0, 0);
      isTransitioning.current = true;
    } else if (preset === 'front') {
      // ~12° elevation angle
      targetPos.current.set(0.8, 1.6, 9.8);
      targetLook.current.set(0.8, 0, 0);
      isTransitioning.current = true;
    } else if (preset === 'top') {
      // ~68° top-down elevation angle
      targetPos.current.set(0.8, 11.2, 4.4);
      targetLook.current.set(0.8, 0, 0);
      isTransitioning.current = true;
    } else if (preset === 'free') {
      isTransitioning.current = false;
    }
  }, [preset]);

  useFrame((state, delta) => {
    if (isTransitioning.current && preset !== 'free') {
      state.camera.position.lerp(targetPos.current, Math.min(1, delta * 3.6));
      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLook.current, Math.min(1, delta * 3.6));
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
      maxDistance={22}
      maxPolarAngle={Math.PI / 2 + 0.05}
    />
  );
}

/* =========================================================================
   6. Main 3D Pipeline Canvas Component
   ========================================================================= */
export default function Pipeline3DCanvas({
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
  return (
    <div className="w-full h-full min-h-[440px] sm:min-h-[540px] md:min-h-[660px] relative bg-zinc-950 select-none overflow-hidden rounded-2xl">
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
        }}
        camera={{ position: [0.8, 6.8, 8.8], fov: 46 }}
      >
        {/* Dark theme background color */}
        <color attach="background" args={['#09090b']} />

        {/* Studio Lighting */}
        <ambientLight intensity={0.55} />
        <directionalLight position={[6, 12, 8]} intensity={1.1} color="#ffffff" />
        <directionalLight position={[-6, -8, -6]} intensity={0.3} color="#ffffff" />

        {/* Camera and Orbit Controls */}
        <CameraController preset={viewPreset} isOrbiting={isOrbiting} />

        {/* Subtle Dark Ground Grid */}
        <gridHelper
          args={[26, 26, '#27272a', '#18181b']}
          position={[0.8, -2.8, 0]}
        />

        {/* Connecting Lines between Nodes */}
        {PIPELINE_CONNECTIONS.map((conn) => {
          const isActive = probeHop === conn.id || (isProbePlaying && probeHop === conn.id);
          return (
            <Line
              key={conn.id}
              points={[conn.start, conn.end]}
              color={isActive ? '#ffffff' : '#3f3f46'}
              lineWidth={isActive ? 2.5 : 1.5}
              transparent
              opacity={isActive ? 1 : 0.65}
            />
          );
        })}

        {/* Pipeline Stage Nodes */}
        {PIPELINE_NODES.map((node) => {
          const isSelected = selectedStage === node.id;
          const isActiveHop = probeHop === node.id + 1;
          return (
            <StageNode
              key={node.id}
              node={node}
              isSelected={isSelected}
              isActiveHop={isActiveHop}
              latest={latest}
              onSelect={onSelectStage}
            />
          );
        })}

        {/* Continuous Highway Photons */}
        <AmbientPhotons isSpiking={isSpiking} />

        {/* Active Step-by-Step Probe Particle */}
        <TraceParticleSystem
          isProbePlaying={isProbePlaying}
          probeHop={probeHop}
          probeSpeed={probeSpeed}
          onProbeHopChange={onProbeHopChange}
        />
      </Canvas>
    </div>
  );
}

