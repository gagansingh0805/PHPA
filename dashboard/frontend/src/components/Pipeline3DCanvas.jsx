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
} from 'lucide-react';

/* =========================================================================
   1. Theme Detection Hook (Syncs with prop or document.documentElement)
   ========================================================================= */
export function useAppTheme(propTheme) {
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
   2. Symmetrical 3D Pipeline Coordinates (Centered around [0, 0, 0])
   ========================================================================= */
export const PIPELINE_NODES = [
  {
    id: 0,
    title: 'Edge Ingestion',
    subtitle: 'HTTP/gRPC Stream',
    position: [-4.8, 1.4, 0],
    icon: Activity,
    color: '#38bdf8', // Cyan
    getStat: (latest) => `${latest?.rps || 125} RPS`,
  },
  {
    id: 1,
    title: 'Ingress Router',
    subtitle: 'Envoy Service Mesh',
    position: [-1.8, 1.4, 0],
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
    position: [4.8, -1.5, 0],
    icon: Cpu,
    color: '#818cf8', // Indigo
    getStat: (latest) => `MAX: ${latest?.predicted_pods || latest?.actual_pods || 6} Pods`,
  },
  {
    id: 5,
    title: 'Scale Actuator',
    subtitle: 'Kube-API Patch',
    position: [4.8, 1.4, 0],
    icon: Zap,
    color: '#f59e0b', // Amber
    getStat: () => 'k8s REST Patch',
  },
];

/* Prominent Highway Connections matching 2D sequence (Centered & Symmetrical) */
export const PIPELINE_CONNECTIONS = [
  // Hop 1: Ingestion -> Ingress
  { id: 1, from: 0, to: 1, start: [-3.65, 1.4, 0], end: [-2.95, 1.4, 0] },
  // Hop 2: Ingress -> Pods
  { id: 2, from: 1, to: 2, start: [-0.65, 1.4, 0], end: [0.15, 1.4, 0] },
  // Hop 3: Pods -> Telemetry (downward)
  { id: 3, from: 2, to: 3, start: [1.3, 0.75, 0], end: [1.3, -0.85, 0] },
  // Hop 4: Telemetry -> Models Brain (rightward)
  { id: 4, from: 3, to: 4, start: [2.45, -1.5, 0], end: [3.65, -1.5, 0] },
  // Hop 5: Models Brain -> Scale Actuator (upward)
  { id: 5, from: 4, to: 5, start: [4.8, -0.85, 0], end: [4.8, 0.75, 0] },
  // Hop 6: Scale Actuator -> Pods (closing loop into cluster)
  { id: 6, from: 5, to: 2, start: [3.65, 1.4, 0], end: [2.45, 1.4, 0] },
];

/* =========================================================================
   3. Individual 3D Stage Node Mesh with Theme-Aware Styling & Active Pulse
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

  // Subtle floating idle motion + dynamic pulse when active
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      const floatY = Math.sin(t * 1.5 + node.id * 1.1) * 0.035;
      meshRef.current.position.y = node.position[1] + floatY;

      // Scale pulse when active during trace
      const baseScale = isActiveHop ? 1.05 + Math.sin(t * 6) * 0.025 : hovered ? 1.03 : 1.0;
      meshRef.current.scale.set(baseScale, baseScale, baseScale);
    }

    if (ringRef.current && isActiveHop) {
      ringRef.current.rotation.z += 0.03;
      const s = 1.0 + Math.sin(t * 7) * 0.08;
      ringRef.current.scale.set(s, s, 1);
    }
  });

  const statText = node.getStat(latest);

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
          <ringGeometry args={[1.38, 1.52, 36]} />
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
          color={cardColor}
          roughness={isDark ? 0.25 : 0.2}
          metalness={isDark ? 0.25 : 0.1}
          emissive={isActiveHop ? node.color : isSelected ? (isDark ? '#27272a' : '#e2e8f0') : '#000000'}
          emissiveIntensity={isActiveHop ? (isDark ? 0.65 : 0.45) : isSelected ? 0.15 : 0}
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
        <circleGeometry args={[1.2, 32]} />
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
          className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all duration-200 cursor-pointer min-w-[126px] ${
            isActiveHop
              ? isDark
                ? 'bg-zinc-950/95 border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.25)] ring-1 ring-sky-400/50'
                : 'bg-white/95 border-sky-500 shadow-[0_4px_16px_rgba(2,132,199,0.25)] ring-1 ring-sky-500/60'
              : isSelected
              ? isDark
                ? 'bg-zinc-900/90 border-zinc-600 shadow-md'
                : 'bg-white/95 border-zinc-400 shadow-md ring-1 ring-zinc-300'
              : isDark
              ? 'bg-zinc-950/85 border-zinc-800/90 hover:border-zinc-700 hover:bg-zinc-900/90'
              : 'bg-white/90 border-zinc-200/90 hover:border-zinc-300 hover:bg-zinc-50/95 shadow-sm'
          }`}
        >
          {/* Header Row */}
          <div className="flex items-center gap-1.5 mb-1 w-full justify-between">
            <div className="flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${isActiveHop ? 'animate-ping' : ''}`}
                style={{ backgroundColor: node.color }}
              />
              <span
                className={`text-[9px] font-mono font-bold uppercase tracking-wider ${
                  isDark ? 'text-zinc-400' : 'text-zinc-500'
                }`}
              >
                0{node.id + 1}
              </span>
            </div>
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                isActiveHop
                  ? isDark
                    ? 'bg-sky-950/80 text-sky-200 border-sky-700/80'
                    : 'bg-sky-50 text-sky-700 border-sky-300'
                  : isDark
                  ? 'bg-zinc-800/90 text-zinc-200 border-zinc-700/60'
                  : 'bg-zinc-100 text-zinc-800 border-zinc-200'
              }`}
            >
              {statText}
            </span>
          </div>

          {/* Node Title & Subtitle */}
          <span
            className={`text-[11px] font-semibold font-mono tracking-tight text-center truncate w-full ${
              isDark ? 'text-zinc-100' : 'text-zinc-900'
            }`}
          >
            {node.title}
          </span>
          <span
            className={`text-[8.5px] font-mono tracking-tight text-center truncate w-full ${
              isDark ? 'text-zinc-500' : 'text-zinc-500'
            }`}
          >
            {node.subtitle}
          </span>
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
  const targetPos = useRef(new THREE.Vector3(0, 8.2, 11.5));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));
  const isTransitioning = useRef(true);

  useEffect(() => {
    if (preset === 'isometric') {
      // Symmetrical ~44° elevation angle looking at true center [0, 0, 0]
      targetPos.current.set(0, 8.2, 11.5);
      targetLook.current.set(0, 0, 0);
      isTransitioning.current = true;
    } else if (preset === 'front') {
      // Symmetrical ~12° elevation angle
      targetPos.current.set(0, 2.2, 13.5);
      targetLook.current.set(0, 0, 0);
      isTransitioning.current = true;
    } else if (preset === 'top') {
      // Symmetrical ~68° top-down elevation angle
      targetPos.current.set(0, 14.0, 5.5);
      targetLook.current.set(0, 0, 0);
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
      maxDistance={24}
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
      className={`w-full h-full min-h-[440px] sm:min-h-[540px] md:min-h-[660px] relative select-none overflow-hidden rounded-2xl transition-colors duration-200 ${
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
        camera={{ position: [0, 8.2, 11.5], fov: 36 }}
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
          args={[26, 26, gridPrimary, gridSecondary]}
          position={[0, -2.65, 0]}
        />

        {/* Soft Ground Contact Shadows */}
        <ContactShadows
          position={[0, -2.64, 0]}
          opacity={isDark ? 0.7 : 0.38}
          scale={22}
          blur={1.8}
          far={6}
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
