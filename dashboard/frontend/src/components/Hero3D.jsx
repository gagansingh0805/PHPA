import React, { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Play, Layers, ArrowUpRight, BookOpen, Sun, Moon, Sparkles, LayoutDashboard } from 'lucide-react';
import PhpaLogo from './PhpaLogo';

/* =========================================================================
   1. Central "Electron Cluster" Mesh: Core + Wireframe Lattice + Orbital Rings
   ========================================================================= */
function ClusterCore({ isMobile, isDark }) {
  const coreRef = useRef();
  const wireframeRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  const ring3Ref = useRef();

  // Create procedural geometries and dynamic black/white materials
  const { coreGeo, wireGeo, ringGeo, coreMat, wireMat, ringMat } = useMemo(() => {
    const cg = new THREE.IcosahedronGeometry(1.35, 0);
    const wg = new THREE.IcosahedronGeometry(1.95, 1);
    const rg = new THREE.TorusGeometry(2.6, 0.012, 16, 100);

    // Dark mode: deep obsidian core with white wireframe & glowing silver
    // Light mode: clean platinum core with pitch black wireframe & charcoal rings
    const cm = new THREE.MeshStandardMaterial({
      color: isDark ? '#111217' : '#e4e4e7',
      emissive: isDark ? '#ffffff' : '#09090b',
      emissiveIntensity: isDark ? 0.08 : 0.02,
      roughness: isDark ? 0.2 : 0.35,
      metalness: isDark ? 0.9 : 0.2,
      wireframe: false,
    });

    const wm = new THREE.MeshStandardMaterial({
      color: isDark ? '#ffffff' : '#09090b',
      emissive: isDark ? '#ffffff' : '#18181b',
      emissiveIntensity: isDark ? 1.0 : 0.05,
      wireframe: true,
      transparent: true,
      opacity: isDark ? 0.9 : 0.85,
    });

    const rm = new THREE.MeshBasicMaterial({
      color: isDark ? '#ffffff' : '#09090b',
      wireframe: true,
      transparent: true,
      opacity: isDark ? 0.35 : 0.25,
    });

    return { coreGeo: cg, wireGeo: wg, ringGeo: rg, coreMat: cm, wireMat: wm, ringMat: rm };
  }, [isDark]);

  // Clean up WebGL resources
  useEffect(() => {
    return () => {
      coreGeo.dispose();
      wireGeo.dispose();
      ringGeo.dispose();
      coreMat.dispose();
      wireMat.dispose();
      ringMat.dispose();
    };
  }, [coreGeo, wireGeo, ringGeo, coreMat, wireMat, ringMat]);

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
      {/* Solid nucleus */}
      <mesh ref={coreRef} geometry={coreGeo} material={coreMat} />

      {/* Wireframe lattice */}
      <mesh ref={wireframeRef} geometry={wireGeo} material={wireMat} />

      {/* Latitudinal electron orbital coordinate rings */}
      <mesh ref={ring1Ref} geometry={ringGeo} material={ringMat} rotation={[Math.PI / 4, 0, 0]} />
      <mesh ref={ring2Ref} geometry={ringGeo} material={ringMat} rotation={[-Math.PI / 3, Math.PI / 6, 0]} />
      {!isMobile && (
        <mesh ref={ring3Ref} geometry={ringGeo} material={ringMat} rotation={[0, Math.PI / 3, Math.PI / 4]} />
      )}
    </group>
  );
}

/* =========================================================================
   2. Orbiting Electrons Particle Field (Black & White / Grayscale)
   ========================================================================= */
function PodField({ count = 200, isDark }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Electron orbital metadata
  const pods = useMemo(() => {
    const data = [];
    const darkPalette = ['#ffffff', '#f4f4f5', '#e4e4e7', '#d4d4d8', '#a1a1aa', '#71717a'];
    const lightPalette = ['#09090b', '#18181b', '#27272a', '#3f3f46', '#52525b', '#71717a'];
    const palette = isDark ? darkPalette : lightPalette;

    for (let i = 0; i < count; i++) {
      const radius = THREE.MathUtils.randFloat(2.6, 6.4);
      const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
      const speed = THREE.MathUtils.randFloat(0.18, 0.5) * (Math.random() > 0.5 ? 1 : -1);
      const yOffset = THREE.MathUtils.randFloat(-2.0, 2.0);
      const scale = THREE.MathUtils.randFloat(0.035, 0.085);
      const color = palette[Math.floor(Math.random() * palette.length)];
      data.push({ radius, theta, speed, yOffset, scale, color });
    }
    return data;
  }, [count, isDark]);

  const { sphereGeo, sphereMat } = useMemo(() => {
    const sg = new THREE.SphereGeometry(1, 10, 10);
    const sm = new THREE.MeshStandardMaterial({
      color: isDark ? '#ffffff' : '#09090b',
      emissive: isDark ? '#ffffff' : '#18181b',
      emissiveIntensity: isDark ? 2.0 : 0.05,
      roughness: isDark ? 0.15 : 0.4,
      metalness: isDark ? 0.95 : 0.1,
    });
    return { sphereGeo: sg, sphereMat: sm };
  }, [isDark]);

  useEffect(() => {
    return () => {
      sphereGeo.dispose();
      sphereMat.dispose();
    };
  }, [sphereGeo, sphereMat]);

  // Set instance colors
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
      p.theta += p.speed * delta * 0.75;

      const x = Math.cos(p.theta) * p.radius;
      const z = Math.sin(p.theta) * p.radius;
      const y = p.yOffset + Math.sin(time * 0.9 + i * 1.5) * 0.22;

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[sphereGeo, sphereMat, count]} />
  );
}

/* =========================================================================
   3. Main 3D Scene Controller (Parallax + Rotation)
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

      {/* Orbiting Electrons Particle Field: 200 on desktop, 50 on mobile */}
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
  const containerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const isDark = theme === 'dark';

  // Mouse normalized [-1, 1] tracking
  const mousePosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    mousePosRef.current = { x, y };
  };

  return (
    <main
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`relative w-screen h-screen min-h-screen overflow-hidden select-none flex flex-col justify-between transition-colors duration-300 ${
        isDark ? 'bg-[#000000] text-white' : 'bg-[#fafafa] text-zinc-950'
      }`}
      style={{
        background: isDark
          ? 'radial-gradient(circle at 50% 50%, #0c0c0e 0%, #030304 65%, #000000 100%)'
          : 'radial-gradient(circle at 50% 50%, #ffffff 0%, #f4f4f6 70%, #e9e9ee 100%)',
      }}
    >
      {/* 3D WebGL Canvas Viewport filling 100% of the screen */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <Canvas
          dpr={[1, 2]} // Performance capped
          gl={{
            antialias: !isMobile,
            powerPreference: 'high-performance',
            alpha: true,
          }}
        >
          <PerspectiveCamera makeDefault position={[0, 0, 6.2]} fov={48} />

          {/* Neutral Clean Lighting */}
          <ambientLight intensity={isDark ? 0.35 : 0.75} />
          <pointLight position={[10, 10, 10]} intensity={isDark ? 1.4 : 1.2} color="#ffffff" />
          <pointLight position={[-10, -10, -10]} intensity={isDark ? 0.9 : 0.8} color={isDark ? '#e4e4e7' : '#d4d4d8'} />
          <pointLight position={[0, 0, 4]} intensity={isDark ? 1.1 : 0.6} color="#ffffff" />

          {/* Procedural 3D Scene */}
          <SceneContent
            isMobile={isMobile}
            isDark={isDark}
            mousePosRef={mousePosRef}
          />

          {/* Subtle White Ethereal Bloom (Dark mode only) */}
          {isDark && !isMobile && (
            <EffectComposer multisampling={0}>
              <Bloom
                intensity={0.7}
                luminanceThreshold={0.4}
                luminanceSmoothing={0.8}
                mipmapBlur
              />
            </EffectComposer>
          )}
        </Canvas>
      </div>

      {/* Top Brand Navigation Bar */}
      <header className="relative z-20 w-full px-5 sm:px-8 py-4 flex items-center justify-between pointer-events-auto">
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
              onClick={onToggleTheme}
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

      {/* Center Hero Standalone Overlay */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 text-center pointer-events-none space-y-6 my-auto">
        {/* Architectural Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[11px] sm:text-xs font-mono tracking-wider backdrop-blur-md shadow-sm pointer-events-auto transition-colors">
          <span className={`w-2 h-2 rounded-full animate-ping ${isDark ? 'bg-white' : 'bg-black'}`} />
          <span className={isDark ? 'text-zinc-300' : 'text-zinc-700'}>
            AUTONOMOUS KUBERNETES AUTOSCALER
          </span>
        </div>

        {/* Title: Black and White Typography */}
        <h1
          className={`text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] ${
            isDark
              ? 'text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-500'
              : 'text-transparent bg-clip-text bg-gradient-to-b from-zinc-950 via-zinc-850 to-zinc-600'
          }`}
        >
          Predictive Horizontal Pod Autoscaler
        </h1>

        {/* Subtitle */}
        <p
          className={`max-w-2xl mx-auto text-sm sm:text-base md:text-lg leading-relaxed font-normal ${
            isDark ? 'text-zinc-400' : 'text-zinc-600'
          }`}
        >
          Zero-deficit proactive Kubernetes autoscaling combining 2-Layer Stacked LSTM neural lookahead, Holt-Winters seasonality, and ordinary least squares trend projection.
        </p>

        {/* High-Contrast Interactive Call-To-Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-4 pointer-events-auto">
          {/* Primary CTA: Launch Live Simulation Lab */}
          <button
            onClick={onLaunchLab}
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
              onClick={onExplorePipeline}
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
              onClick={onOpenOverview}
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
      <footer className="relative z-20 w-full px-5 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono pointer-events-auto">
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
    </main>
  );
}
