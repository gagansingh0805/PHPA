import React, { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { Play, Layers, ArrowUpRight, BookOpen, Sun, Moon, Sparkles } from 'lucide-react';
import PhpaLogo from './PhpaLogo';

/* =========================================================================
   1. Central "Electron Cluster" Mesh (Declarative R3F Materials)
   ========================================================================= */
function ClusterCore({ isMobile, isDark }) {
  const coreRef = useRef();
  const wireframeRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  const ring3Ref = useRef();

  // Geometries are created ONCE and never re-allocated
  const { coreGeo, wireGeo, ringGeo } = useMemo(() => {
    return {
      coreGeo: new THREE.IcosahedronGeometry(1.35, 0),
      wireGeo: new THREE.IcosahedronGeometry(1.95, 1),
      ringGeo: new THREE.TorusGeometry(2.6, 0.012, 16, 120),
    };
  }, []);

  useEffect(() => {
    return () => {
      coreGeo.dispose();
      wireGeo.dispose();
      ringGeo.dispose();
    };
  }, [coreGeo, wireGeo, ringGeo]);

  useFrame((_, delta) => {
    if (coreRef.current) {
      coreRef.current.rotation.x += delta * 0.2;
      coreRef.current.rotation.y += delta * 0.28;
    }
    if (wireframeRef.current) {
      wireframeRef.current.rotation.x -= delta * 0.15;
      wireframeRef.current.rotation.y -= delta * 0.2;
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x += delta * 0.1;
      ring1Ref.current.rotation.z += delta * 0.14;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y += delta * 0.12;
      ring2Ref.current.rotation.x -= delta * 0.08;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.z += delta * 0.09;
      ring3Ref.current.rotation.y -= delta * 0.11;
    }
  });

  return (
    <group>
      {/* Solid central nucleus core */}
      <mesh ref={coreRef} geometry={coreGeo}>
        <meshStandardMaterial
          color={isDark ? '#111217' : '#e4e4e7'}
          emissive={isDark ? '#1e2029' : '#09090b'}
          emissiveIntensity={isDark ? 0.35 : 0.02}
          roughness={isDark ? 0.25 : 0.35}
          metalness={isDark ? 0.4 : 0.2}
        />
      </mesh>

      {/* Wireframe lattice */}
      <mesh ref={wireframeRef} geometry={wireGeo}>
        <meshBasicMaterial
          color={isDark ? '#ffffff' : '#000000'}
          wireframe
          transparent
          opacity={isDark ? 0.35 : 0.25}
        />
      </mesh>

      {/* Latitudinal electron orbital coordinate rings */}
      <mesh ref={ring1Ref} geometry={ringGeo} rotation={[Math.PI / 4, 0, 0]}>
        <meshBasicMaterial
          color={isDark ? '#ffffff' : '#000000'}
          wireframe
          transparent
          opacity={isDark ? 0.35 : 0.25}
        />
      </mesh>
      <mesh ref={ring2Ref} geometry={ringGeo} rotation={[-Math.PI / 3, Math.PI / 6, 0]}>
        <meshBasicMaterial
          color={isDark ? '#ffffff' : '#000000'}
          wireframe
          transparent
          opacity={isDark ? 0.35 : 0.25}
        />
      </mesh>
      {!isMobile && (
        <mesh ref={ring3Ref} geometry={ringGeo} rotation={[0, Math.PI / 3, Math.PI / 4]}>
          <meshBasicMaterial
            color={isDark ? '#ffffff' : '#000000'}
            wireframe
            transparent
            opacity={isDark ? 0.35 : 0.25}
          />
        </mesh>
      )}
    </group>
  );
}

/* =========================================================================
   2. Orbiting Electrons Particle Field (Pure White in Dark / Pure Black in Light)
   ========================================================================= */
function PodField({ count = 200, isDark }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Electron orbital metadata
  const pods = useMemo(() => {
    const data = [];
    // Whole black background -> Pure bright glowing white dots
    const darkPalette = ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff'];
    // Whole white background -> Pure jet black dots
    const lightPalette = ['#000000', '#000000', '#09090b', '#18181b', '#27272a'];
    const palette = isDark ? darkPalette : lightPalette;

    for (let i = 0; i < count; i++) {
      const radius = THREE.MathUtils.randFloat(2.4, 6.8);
      const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
      const speed = THREE.MathUtils.randFloat(0.15, 0.45) * (Math.random() > 0.5 ? 1 : -1);
      const yOffset = THREE.MathUtils.randFloat(-2.2, 2.2);
      const scale = THREE.MathUtils.randFloat(0.04, 0.095);
      const color = palette[Math.floor(Math.random() * palette.length)];
      data.push({ radius, theta, speed, yOffset, scale, color });
    }
    return data;
  }, [count, isDark]);

  const sphereGeo = useMemo(() => new THREE.SphereGeometry(1, 14, 14), []);

  useEffect(() => {
    return () => sphereGeo.dispose();
  }, [sphereGeo]);

  // Update instance colors
  useEffect(() => {
    if (!meshRef.current) return;
    const tempColor = new THREE.Color();
    pods.forEach((pod, i) => {
      tempColor.set(pod.color);
      meshRef.current.setColorAt(i, tempColor);
    });
    meshRef.current.instanceColor.needsUpdate = true;
  }, [pods]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      const p = pods[i];
      p.theta += p.speed * delta * 0.7;

      const x = Math.cos(p.theta) * p.radius;
      const z = Math.sin(p.theta) * p.radius;
      const y = p.yOffset + Math.sin(time * 0.8 + i * 1.3) * 0.25;

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[sphereGeo, null, count]}>
      <meshStandardMaterial
        color={isDark ? '#ffffff' : '#050505'}
        emissive={isDark ? '#ffffff' : '#000000'}
        emissiveIntensity={isDark ? 0.95 : 0.0}
        roughness={0.15}
        metalness={0.0}
      />
    </instancedMesh>
  );
}

/* =========================================================================
   3. Main 3D Scene Controller
   ========================================================================= */
function SceneContent({ isMobile, isDark, mousePosRef }) {
  const mainGroupRef = useRef();

  useFrame(() => {
    if (!mainGroupRef.current) return;

    // Smooth Mouse Parallax Damping
    const targetRotX = mousePosRef.current.y * 0.3;
    const targetRotY = mousePosRef.current.x * 0.4;

    mainGroupRef.current.rotation.x = THREE.MathUtils.lerp(
      mainGroupRef.current.rotation.x,
      targetRotX,
      0.05
    );
    mainGroupRef.current.rotation.y = THREE.MathUtils.lerp(
      mainGroupRef.current.rotation.y,
      targetRotY,
      0.05
    );
  });

  return (
    <group ref={mainGroupRef}>
      {/* Central Wireframe Nucleus & Orbitals */}
      <ClusterCore isMobile={isMobile} isDark={isDark} />

      {/* Orbiting Electrons Particle Field */}
      <PodField count={isMobile ? 50 : 200} isDark={isDark} />
    </group>
  );
}

/* =========================================================================
   4. Standalone Fullscreen Homepage Component
   ========================================================================= */
export default function Hero3D({
  theme = 'dark',
  onToggleTheme,
  onLaunchLab,
  onExplorePipeline,
  onOpenOverview,
}) {
  const [isMobile, setIsMobile] = useState(false);
  const isDark = theme === 'dark';

  // Mouse normalized [-1, 1] tracking across window
  const mousePosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Global window listener for parallax (never blocked by HTML overlays)
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      mousePosRef.current = { x, y };
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, []);

  return (
    <div
      className={`relative w-screen h-screen min-h-screen overflow-hidden flex flex-col justify-between transition-colors duration-300 ${
        isDark ? 'bg-black text-white' : 'bg-white text-zinc-950'
      }`}
      style={{
        backgroundColor: isDark ? '#000000' : '#ffffff',
      }}
    >
      {/* 3D WebGL Canvas Viewport filling 100% of the screen (pointer-events: none so it never steals clicks) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Canvas
          dpr={[1, 2]}
          style={{ pointerEvents: 'none' }}
          gl={{
            antialias: !isMobile,
            powerPreference: 'high-performance',
            alpha: true,
          }}
        >
          <PerspectiveCamera makeDefault position={[0, 0, 6.2]} fov={48} />

          {/* Clean Three-Point Lighting for 3D sphere specular highlights */}
          <ambientLight intensity={isDark ? 0.5 : 0.8} />
          <pointLight position={[10, 10, 10]} intensity={isDark ? 2.6 : 1.5} color="#ffffff" />
          <pointLight position={[-10, -10, -10]} intensity={isDark ? 1.6 : 0.9} color="#ffffff" />
          <pointLight position={[0, 0, 5]} intensity={isDark ? 1.9 : 0.9} color="#ffffff" />

          {/* Procedural 3D Scene */}
          <SceneContent
            isMobile={isMobile}
            isDark={isDark}
            mousePosRef={mousePosRef}
          />
        </Canvas>
      </div>

      {/* Top Brand Navigation Bar (High Z-Index, Pointer Events Auto) */}
      <header className="relative z-30 w-full px-5 sm:px-8 py-4 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3">
          <PhpaLogo size="sm" />
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs sm:text-sm tracking-tight">
              PHPA
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                isDark
                  ? 'bg-zinc-900/80 border-zinc-700 text-zinc-400'
                  : 'bg-zinc-100 border-zinc-300 text-zinc-600'
              }`}
            >
              v0.13.2
            </span>
          </div>
        </div>

        {/* Top Right Controls: Theme Switcher & GitHub */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Black & White Tactile Theme Switcher */}
          {onToggleTheme && (
            <button
              type="button"
              role="switch"
              aria-checked={isDark}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleTheme();
              }}
              title={`Switch to ${isDark ? 'White / Light' : 'Black / Dark'} mode`}
              className={`relative inline-flex items-center rounded-full p-[2px] cursor-pointer transition-colors duration-200 border shadow-inner ${
                isDark
                  ? 'bg-zinc-900 border-zinc-700'
                  : 'bg-zinc-200 border-zinc-300'
              }`}
              style={{
                width: '52px',
                minWidth: '52px',
                height: '28px',
              }}
            >
              <span className="sr-only">Toggle theme</span>
              <span
                className={`flex items-center justify-center rounded-full shadow-md transition-transform duration-200 ease-out border ${
                  isDark
                    ? 'translate-x-[24px] bg-white text-black border-white'
                    : 'translate-x-0 bg-black text-white border-black'
                }`}
                style={{
                  width: '22px',
                  height: '22px',
                }}
              >
                {isDark ? (
                  <Sun className="w-3 h-3 text-black" />
                ) : (
                  <Moon className="w-3 h-3 text-white" />
                )}
              </span>
            </button>
          )}

          <a
            href="https://github.com/gagansingh0805/PHPA"
            target="_blank"
            rel="noreferrer"
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all duration-150 backdrop-blur-sm ${
              isDark
                ? 'bg-zinc-900/60 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white'
                : 'bg-white/80 hover:bg-zinc-100 border-zinc-300 text-zinc-700 hover:text-zinc-950'
            }`}
          >
            <span>GitHub</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
          </a>
        </div>
      </header>

      {/* Center Hero Standalone Overlay (High Z-Index, Full Pointer Events) */}
      <section className="relative z-30 max-w-4xl mx-auto px-6 text-center space-y-6 my-auto pointer-events-auto">
        {/* Architectural Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[11px] sm:text-xs font-mono tracking-wider backdrop-blur-md shadow-sm transition-colors">
          <span className={`w-2 h-2 rounded-full animate-ping ${isDark ? 'bg-white' : 'bg-black'}`} />
          <span className={isDark ? 'text-zinc-300' : 'text-zinc-700'}>
            AUTONOMOUS KUBERNETES AUTOSCALER
          </span>
        </div>

        {/* Title: Black and White Typography */}
        <h1
          className={`text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] ${
            isDark
              ? 'text-white'
              : 'text-zinc-950'
          }`}
        >
          Predictive Horizontal Pod Autoscaler
        </h1>

        {/* Subtitle */}
        <p
          className={`max-w-2xl mx-auto text-sm sm:text-base md:text-lg leading-relaxed font-normal ${
            isDark ? 'text-zinc-300' : 'text-zinc-600'
          }`}
        >
          Zero-deficit proactive Kubernetes autoscaling combining 2-Layer Stacked LSTM neural lookahead, Holt-Winters seasonality, and ordinary least squares trend projection.
        </p>

        {/* High-Contrast Interactive Call-To-Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-4 relative z-40">
          {/* Primary CTA: Launch Live Simulation Lab */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onLaunchLab) onLaunchLab();
            }}
            className={`group flex items-center gap-2.5 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-extrabold text-xs sm:text-sm transition-all duration-200 cursor-pointer font-mono tracking-tight shadow-xl hover:scale-105 active:scale-95 ${
              isDark
                ? 'bg-white text-black hover:bg-zinc-200 shadow-white/10'
                : 'bg-black text-white hover:bg-zinc-800 shadow-black/15'
            }`}
          >
            <Play className="w-4 h-4 fill-current transition-transform duration-200 group-hover:scale-125" />
            <span>Launch Live Simulation Lab</span>
          </button>

          {/* Secondary CTA: 3D Pipeline Architecture */}
          {onExplorePipeline && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onExplorePipeline();
              }}
              className={`flex items-center gap-2 px-5 py-3.5 rounded-xl border font-semibold text-xs sm:text-sm transition-all duration-200 backdrop-blur-md cursor-pointer font-mono hover:scale-105 active:scale-95 shadow-sm ${
                isDark
                  ? 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-700 text-zinc-200 hover:border-white'
                  : 'bg-white/90 hover:bg-zinc-100 border-zinc-300 text-zinc-800 hover:border-black'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>3D Pipeline Architecture</span>
            </button>
          )}

          {/* Tertiary CTA: Research Brief */}
          {onOpenOverview && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenOverview();
              }}
              className={`flex items-center gap-2 px-4 py-3.5 rounded-xl border font-medium text-xs sm:text-sm transition-all duration-200 backdrop-blur-sm cursor-pointer font-mono ${
                isDark
                  ? 'bg-zinc-950/40 hover:bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  : 'bg-zinc-100/60 hover:bg-zinc-200 border-zinc-300 text-zinc-600 hover:text-black'
              }`}
            >
              <BookOpen className="w-4 h-4 opacity-70" />
              <span>Research Brief</span>
            </button>
          )}
        </div>
      </section>

      {/* Bottom Telemetry & Interaction Footer */}
      <footer className="relative z-30 w-full px-5 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono pointer-events-auto">
        <div className={`flex items-center gap-2 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
          <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-white' : 'bg-black'}`} />
          <span>200 Electron Pods In Orbit</span>
          <span className="opacity-40">•</span>
          <span className="hidden md:inline">Ensemble: LSTM • Holt-Winters • OLS • HPA</span>
        </div>

        <div className={`flex items-center gap-3 ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
          <span>SLO Target: &lt;100ms P95</span>
          <span className="opacity-40">•</span>
          <span>Move cursor to tilt 3D field</span>
        </div>
      </footer>
    </div>
  );
}
