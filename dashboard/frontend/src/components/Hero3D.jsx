import React, { useRef, useMemo, useEffect, useState, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Play, Layers, ArrowUpRight, Sparkles, Cpu } from 'lucide-react';

// Register GSAP ScrollTrigger plugin once
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/* =========================================================================
   1. Central "Cluster" Mesh: Core + Wireframe Lattice + Orbital Rings
   ========================================================================= */
function ClusterCore({ isMobile }) {
  const coreRef = useRef();
  const wireframeRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();

  // Create & dispose procedural geometries and materials properly
  const { coreGeo, wireGeo, ringGeo, coreMat, wireMat, ringMat } = useMemo(() => {
    const cg = new THREE.IcosahedronGeometry(1.3, 0);
    const wg = new THREE.IcosahedronGeometry(1.9, 1);
    const rg = new THREE.TorusGeometry(2.5, 0.015, 16, 90);

    const cm = new THREE.MeshStandardMaterial({
      color: '#0891b2',
      emissive: '#06b6d4',
      emissiveIntensity: 0.8,
      roughness: 0.25,
      metalness: 0.85,
      wireframe: false,
    });

    const wm = new THREE.MeshStandardMaterial({
      color: '#06b6d4',
      emissive: '#38bdf8',
      emissiveIntensity: 1.6,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });

    const rm = new THREE.MeshBasicMaterial({
      color: '#0ea5e9',
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });

    return { coreGeo: cg, wireGeo: wg, ringGeo: rg, coreMat: cm, wireMat: wm, ringMat: rm };
  }, []);

  // Cleanup WebGL resources on unmount
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
      coreRef.current.rotation.x += delta * 0.25;
      coreRef.current.rotation.y += delta * 0.35;
    }
    if (wireframeRef.current) {
      wireframeRef.current.rotation.x -= delta * 0.18;
      wireframeRef.current.rotation.y -= delta * 0.22;
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x += delta * 0.12;
      ring1Ref.current.rotation.z += delta * 0.15;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y += delta * 0.14;
      ring2Ref.current.rotation.x -= delta * 0.1;
    }
  });

  return (
    <group>
      {/* Solid emissive cluster nucleus */}
      <mesh ref={coreRef} geometry={coreGeo} material={coreMat} />

      {/* Outer wireframe lattice */}
      <mesh ref={wireframeRef} geometry={wireGeo} material={wireMat} />

      {/* Latitudinal Control-Plane Coordinate Rings */}
      <mesh ref={ring1Ref} geometry={ringGeo} material={ringMat} rotation={[Math.PI / 4, 0, 0]} />
      {!isMobile && (
        <mesh ref={ring2Ref} geometry={ringGeo} material={ringMat} rotation={[-Math.PI / 3, Math.PI / 6, 0]} />
      )}
    </group>
  );
}

/* =========================================================================
   2. Orbiting Pods / Nodes Particle Field (InstancedMesh for 60fps)
   ========================================================================= */
function PodField({ count = 200 }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Pod orbital metadata
  const pods = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      const radius = THREE.MathUtils.randFloat(2.8, 6.2);
      const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
      const speed = THREE.MathUtils.randFloat(0.15, 0.45) * (Math.random() > 0.5 ? 1 : -1);
      const yOffset = THREE.MathUtils.randFloat(-1.8, 1.8);
      const scale = THREE.MathUtils.randFloat(0.04, 0.09);
      // Health / Status color tint (emerald = healthy pod, cyan = reactive, purple = lstm)
      const colorType = Math.random();
      const color = colorType > 0.3 ? '#38bdf8' : colorType > 0.1 ? '#10b981' : '#a855f7';
      data.push({ radius, theta, speed, yOffset, scale, color });
    }
    return data;
  }, [count]);

  const { sphereGeo, sphereMat } = useMemo(() => {
    const sg = new THREE.SphereGeometry(1, 10, 10);
    const sm = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      emissive: '#38bdf8',
      emissiveIntensity: 2.2,
      roughness: 0.2,
      metalness: 0.9,
    });
    return { sphereGeo: sg, sphereMat: sm };
  }, []);

  useEffect(() => {
    return () => {
      sphereGeo.dispose();
      sphereMat.dispose();
    };
  }, [sphereGeo, sphereMat]);

  // Set initial colors on instance
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
      const y = p.yOffset + Math.sin(time * 0.8 + i) * 0.25;

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
   3. Main 3D Scene Controller (Parallax + Scroll Animation Hooks)
   ========================================================================= */
function SceneContent({ isMobile, scrollProgressRef, mousePosRef }) {
  const mainGroupRef = useRef();

  useFrame((state) => {
    if (!mainGroupRef.current) return;

    // A. Smooth Mouse Parallax Damping
    const targetRotX = mousePosRef.current.y * 0.25;
    const targetRotY = mousePosRef.current.x * 0.35;

    mainGroupRef.current.rotation.x = THREE.MathUtils.lerp(
      mainGroupRef.current.rotation.x,
      targetRotX,
      0.05
    );
    mainGroupRef.current.rotation.y = THREE.MathUtils.lerp(
      mainGroupRef.current.rotation.y,
      targetRotY + (scrollProgressRef.current.scrollRotation || 0),
      0.05
    );

    // B. Apply ScrollTrigger scrubbed scale and position
    if (scrollProgressRef.current) {
      const { scrollScale = 1, scrollPosY = 0 } = scrollProgressRef.current;
      mainGroupRef.current.scale.setScalar(
        THREE.MathUtils.lerp(mainGroupRef.current.scale.x, scrollScale, 0.08)
      );
      mainGroupRef.current.position.y = THREE.MathUtils.lerp(
        mainGroupRef.current.position.y,
        scrollPosY,
        0.08
      );
    }
  });

  return (
    <group ref={mainGroupRef}>
      {/* Central Kubernetes Infrastructure Cluster */}
      <ClusterCore isMobile={isMobile} />

      {/* Orbiting Pod Replicas: 200 on desktop, 50 on mobile */}
      <PodField count={isMobile ? 50 : 200} />
    </group>
  );
}

/* =========================================================================
   4. Hero3D Component (Self-Contained Export)
   ========================================================================= */
export default function Hero3D({
  title = "Predictive Horizontal Pod Autoscaler",
  subtitle = "Zero-deficit Kubernetes autoscaling with multi-model predictive ML and preemptive scheduling.",
  badgeText = "PHPA ARCHITECTURE v1.0",
  onCtaClick,
  onPipelineClick,
}) {
  const containerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  // Mouse normalized [-1, 1] tracking for parallax
  const mousePosRef = useRef({ x: 0, y: 0 });

  // Scroll values driven by GSAP ScrollTrigger
  const scrollProgressRef = useRef({
    scrollRotation: 0,
    scrollScale: 1,
    scrollPosY: 0,
  });

  // Responsive device viewport check
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mouse move handler for smooth damping parallax
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    mousePosRef.current = { x, y };
  };

  // GSAP ScrollTrigger Integration
  useEffect(() => {
    if (!containerRef.current) return;

    const scrollContainer = document.getElementById('main-scroll-container') || window;

    // Animate 3D group over the height of the hero section
    const st = ScrollTrigger.create({
      trigger: containerRef.current,
      scroller: scrollContainer,
      start: 'top top',
      end: 'bottom top',
      scrub: 1.2, // Smooth scrubbing
      onUpdate: (self) => {
        const p = self.progress; // 0 to 1
        // Rotation: rotates by Math.PI (180 deg) as user scrolls down
        // Scale: gently scales down from 1 to 0.72
        // Position Y: moves down subtly from 0 to -1.2
        scrollProgressRef.current = {
          scrollRotation: p * Math.PI,
          scrollScale: 1 - p * 0.28,
          scrollPosY: -p * 1.2,
        };
      },
    });

    return () => {
      st.kill();
    };
  }, []);

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full h-[600px] sm:h-[700px] md:h-[780px] rounded-2xl border border-zinc-300 dark:border-zinc-800 overflow-hidden bg-zinc-950 text-white flex items-center justify-center select-none shadow-2xl"
      style={{
        background: 'radial-gradient(ellipse at 50% 45%, #0c1527 0%, #09090b 70%, #030712 100%)',
      }}
    >
      {/* 3D WebGL Canvas Viewport */}
      <div className="absolute inset-0 z-0">
        <Canvas
          dpr={[1, 2]} // Performance constraint: capped at [1, 2]
          gl={{
            antialias: !isMobile,
            powerPreference: 'high-performance',
            alpha: true,
          }}
        >
          <PerspectiveCamera makeDefault position={[0, 0, 6.2]} fov={50} />

          {/* Lighting Rig */}
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1.2} color="#38bdf8" />
          <pointLight position={[-10, -10, -10]} intensity={0.8} color="#10b981" />
          <pointLight position={[0, 0, 4]} intensity={0.9} color="#a855f7" />

          {/* Procedural 3D Scene */}
          <SceneContent
            isMobile={isMobile}
            scrollProgressRef={scrollProgressRef}
            mousePosRef={mousePosRef}
          />

          {/* Post-Processing: Bloom Pass with Tunable Thresholds (Disabled on mobile for battery/GPU performance) */}
          {!isMobile && (
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

      {/* Hero Foreground Content (Glassmorphic Overlay with Pointer-Events Passthrough) */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center pointer-events-none space-y-6">
        {/* Release / Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-mono tracking-wider backdrop-blur-md shadow-lg pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{badgeText}</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-500 leading-tight">
          {title}
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-sm sm:text-base md:text-lg text-zinc-400 leading-relaxed font-normal">
          {subtitle}
        </p>

        {/* Call to Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-4 pointer-events-auto">
          <button
            onClick={onCtaClick}
            className="group flex items-center gap-2.5 px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-zinc-950 font-extrabold text-xs sm:text-sm transition-all duration-300 shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 active:scale-95 cursor-pointer font-mono tracking-tight"
          >
            <Play className="w-4 h-4 fill-current transition-transform duration-200 group-hover:scale-125" />
            <span>Launch Live Simulation Lab</span>
          </button>

          {onPipelineClick && (
            <button
              onClick={onPipelineClick}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 hover:border-cyan-500/50 text-zinc-200 font-semibold text-xs sm:text-sm transition-all duration-200 backdrop-blur-md cursor-pointer font-mono hover:scale-105 active:scale-95 shadow-lg"
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>3D Pipeline Architecture</span>
            </button>
          )}

          <a
            href="https://github.com/gagansingh0805/PHPA"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-900/40 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 font-medium text-xs sm:text-sm transition-all duration-200 backdrop-blur-sm cursor-pointer font-mono"
          >
            <span>GitHub</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Scroll Indicator Prompt */}
        <div className="pt-8 flex flex-col items-center justify-center gap-1.5 text-[11px] font-mono text-zinc-500">
          <span>Scroll to Inspect Infrastructure</span>
          <div className="w-4 h-7 rounded-full border border-zinc-700 flex items-start justify-center p-1">
            <div className="w-1 h-2 rounded-full bg-cyan-400 animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
}

