import React, { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
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
          color={isDark ? '#1A1510' : '#d4d4d8'}
          emissive={isDark ? '#0F0D0A' : '#ffffff'}
          emissiveIntensity={isDark ? 0.2 : 0.25}
          roughness={isDark ? 0.35 : 0.55}
          metalness={isDark ? 0.5 : 0.05}
          flatShading
        />
      </mesh>

      {/* Wireframe lattice (warm gold-beige #E8D5A8 at 30-45% opacity for gold-etched look) */}
      <mesh ref={wireframeRef} geometry={wireGeo}>
        <meshBasicMaterial
          color={isDark ? '#E8D5A8' : '#000000'}
          wireframe
          transparent
          opacity={isDark ? 0.38 : 0.25}
        />
      </mesh>

      {/* Latitudinal electron orbital coordinate rings */}
      <mesh ref={ring1Ref} geometry={ringGeo} rotation={[Math.PI / 4, 0, 0]}>
        <meshBasicMaterial
          color={isDark ? '#E8D5A8' : '#000000'}
          wireframe
          transparent
          opacity={isDark ? 0.36 : 0.25}
        />
      </mesh>
      <mesh ref={ring2Ref} geometry={ringGeo} rotation={[-Math.PI / 3, Math.PI / 6, 0]}>
        <meshBasicMaterial
          color={isDark ? '#E8D5A8' : '#000000'}
          wireframe
          transparent
          opacity={isDark ? 0.33 : 0.25}
        />
      </mesh>
      {!isMobile && (
        <mesh ref={ring3Ref} geometry={ringGeo} rotation={[0, Math.PI / 3, Math.PI / 4]}>
          <meshBasicMaterial
            color={isDark ? '#E8D5A8' : '#000000'}
            wireframe
            transparent
            opacity={isDark ? 0.30 : 0.25}
          />
        </mesh>
      )}
    </group>
  );
}

/* =========================================================================
   2. Orbiting Electrons Particle Field (Warm Cream/Champagne Orbs in Dark / Monochrome Dots in Light)
   ========================================================================= */
function PodField({ count = 200, isDark }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Electron orbital metadata with size-based opacity
  const pods = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      const radius = THREE.MathUtils.randFloat(2.4, 6.8);
      const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
      const speed = THREE.MathUtils.randFloat(0.15, 0.45) * (Math.random() > 0.5 ? 1 : -1);
      const yOffset = THREE.MathUtils.randFloat(-2.2, 2.2);
      const scale = THREE.MathUtils.randFloat(0.04, 0.095);

      // Size-based opacity: small orbs 40-70% opacity, large orbs 15-30% opacity
      const normSize = (scale - 0.04) / (0.095 - 0.04);
      const opacityFactor = THREE.MathUtils.lerp(0.65, 0.22, normSize);

      data.push({ radius, theta, speed, yOffset, scale, opacityFactor });
    }
    return data;
  }, [count]);

  const sphereGeo = useMemo(() => new THREE.SphereGeometry(1, 14, 14), []);

  useEffect(() => {
    return () => sphereGeo.dispose();
  }, [sphereGeo]);

  // Update instance colors with warm cream/champagne core & size-based opacity
  useEffect(() => {
    if (!meshRef.current) return;
    const tempColor = new THREE.Color();
    const lightPalette = ['#000000', '#000000', '#09090b', '#18181b', '#27272a'];

    pods.forEach((pod, i) => {
      if (isDark) {
        // Core: #F5E6C8 scaled by size-based opacity factor (small orbs 40-70%, large orbs 15-30%)
        tempColor.set('#F5E6C8').multiplyScalar(pod.opacityFactor);
      } else {
        tempColor.set(lightPalette[i % lightPalette.length]);
      }
      meshRef.current.setColorAt(i, tempColor);
    });
    meshRef.current.instanceColor.needsUpdate = true;
  }, [pods, isDark]);

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
        color={isDark ? '#F5E6C8' : '#050505'}
        emissive={isDark ? '#FFEFD1' : '#000000'}
        emissiveIntensity={isDark ? 1.6 : 0.0}
        roughness={isDark ? 0.1 : 0.3}
        metalness={0.0}
        onBeforeCompile={(shader) => {
          if (isDark) {
            shader.fragmentShader = shader.fragmentShader.replace(
              'vec3 totalEmissiveRadiance = emissive;',
              '#ifdef USE_INSTANCING_COLOR\nvec3 totalEmissiveRadiance = emissive * vColor;\n#else\nvec3 totalEmissiveRadiance = emissive;\n#endif'
            );
          }
        }}
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
        isDark ? 'text-[#FDF6E8]' : 'text-zinc-950'
      }`}
      style={{
        background: isDark
          ? 'radial-gradient(ellipse at 50% 50%, #1A1510 0%, #14100D 55%, #0F0D0A 100%)'
          : '#ffffff',
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

          {/* Post-Processing: Ethereal Bloom for glowing balls in dark theme */}
          {!isMobile && isDark && (
            <EffectComposer multisampling={0}>
              <Bloom
                intensity={1.25}
                luminanceThreshold={0.22}
                luminanceSmoothing={0.88}
                mipmapBlur
              />
            </EffectComposer>
          )}
        </Canvas>
      </div>

      {/* Top Brand Navigation Bar (High Z-Index, Pointer Events Auto) */}
      <header className="relative z-30 w-full px-5 sm:px-8 py-4 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3">
          <PhpaLogo size="sm" />
          <div className="flex items-center gap-2">
            <span className={`font-mono font-bold text-xs sm:text-sm tracking-tight ${isDark ? 'text-[#FDF6E8]' : 'text-zinc-950'}`}>
              PHPA
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                isDark
                  ? 'bg-[#1A1510]/80 border-[#4A3F2E] text-[#B8A888]'
                  : 'bg-zinc-100 border-zinc-300 text-zinc-600'
              }`}
            >
              v0.13.2
            </span>
          </div>
        </div>

        {/* Top Right Controls: Theme Switcher & GitHub */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Black & White / Warm Tactile Theme Switcher */}
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
                  ? 'bg-[#1A1510] border-[#4A3F2E]'
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
                    ? 'translate-x-[24px] bg-[#FDF6E8] text-[#1A1510] border-[#FDF6E8]'
                    : 'translate-x-0 bg-black text-white border-black'
                }`}
                style={{
                  width: '22px',
                  height: '22px',
                }}
              >
                {isDark ? (
                  <Sun className="w-3 h-3 text-[#1A1510]" />
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
                ? 'bg-[#1A1510]/70 hover:bg-[#261F17] border-[#4A3F2E] text-[#F5E6C8] hover:text-[#FDF6E8]'
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
        <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[11px] sm:text-xs font-mono tracking-wider backdrop-blur-md shadow-sm transition-colors ${
          isDark ? 'bg-[#1A1510]/80 border-[#4A3F2E]' : 'bg-white/80 border-zinc-300'
        }`}>
          <span className={`w-2 h-2 rounded-full animate-ping ${isDark ? 'bg-[#F5E6C8]' : 'bg-black'}`} />
          <span className={isDark ? 'text-[#B8A888]' : 'text-zinc-950 font-medium'}>
            AUTONOMOUS KUBERNETES AUTOSCALER
          </span>
        </div>

        {/* Title: Headline text #FDF6E8 */}
        <h1
          className={`text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] ${
            isDark
              ? 'text-[#FDF6E8] drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)]'
              : 'text-zinc-950 drop-shadow-[0_2px_10px_rgba(255,255,255,0.95)]'
          }`}
        >
          Predictive Horizontal Pod Autoscaler
        </h1>

        {/* Subtitle: Body text #B8A888 */}
        <p
          className={`max-w-2xl mx-auto text-sm sm:text-base md:text-lg leading-relaxed ${
            isDark
              ? 'text-[#B8A888] drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)] font-normal'
              : 'text-zinc-950 font-medium drop-shadow-[0_1px_8px_rgba(255,255,255,0.98)]'
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
                ? 'bg-[#FDF6E8] text-[#1A1510] hover:bg-[#fff9ef] shadow-[#FDF6E8]/10'
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
                  ? 'bg-[#1A1510] hover:bg-[#261F17] border-[#4A3F2E] text-[#F5E6C8] hover:border-[#E8D5A8]'
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
                  ? 'bg-[#1A1510]/90 hover:bg-[#261F17] border-[#4A3F2E] text-[#F5E6C8] hover:border-[#E8D5A8]'
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
        <div className={`flex items-center gap-2 ${isDark ? 'text-[#B8A888]/70' : 'text-zinc-500'}`}>
          <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-[#F5E6C8]' : 'bg-black'}`} />
          <span>200 Electron Pods In Orbit</span>
          <span className="opacity-40">•</span>
          <span className="hidden md:inline">Ensemble: LSTM • Holt-Winters • OLS • HPA</span>
        </div>

        <div className={`flex items-center gap-3 ${isDark ? 'text-[#B8A888]/70' : 'text-zinc-500'}`}>
          <span>SLO Target: &lt;100ms P95</span>
          <span className="opacity-40">•</span>
          <span>Move cursor to tilt 3D field</span>
        </div>
      </footer>
    </div>
  );
}
