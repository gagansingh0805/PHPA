import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STEP_COLORS = {
  0: { ring: 'ring-emerald-500', hex: '#10b981', border: 'border-emerald-500', badge: 'bg-emerald-500 text-white' },
  1: { ring: 'ring-rose-500', hex: '#f43f5e', border: 'border-rose-500', badge: 'bg-rose-500 text-white' },
  2: { ring: 'ring-purple-500', hex: '#a855f7', border: 'border-purple-500', badge: 'bg-purple-500 text-white' },
  3: { ring: 'ring-cyan-500', hex: '#06b6d4', border: 'border-cyan-500', badge: 'bg-cyan-500 text-white' },
  4: { ring: 'ring-amber-500', hex: '#f59e0b', border: 'border-amber-500', badge: 'bg-amber-500 text-white' },
};

export default function DemoSpotlightOverlay({ active, step = 0, targetId, stageName = '' }) {
  const [rect, setRect] = useState(null);
  const color = STEP_COLORS[step] || STEP_COLORS[0];

  useEffect(() => {
    if (!active) {
      setRect(null);
      return;
    }

    const updateRect = () => {
      const el = document.getElementById(targetId);
      if (el) {
        const b = el.getBoundingClientRect();
        setRect({
          left: b.left,
          top: b.top,
          width: b.width,
          height: b.height,
          right: b.right,
          bottom: b.bottom,
        });
      } else {
        setRect(null);
      }
    };

    // Immediate calculation + delayed for tab switch & layout stabilization
    updateRect();
    const t1 = setTimeout(updateRect, 60);
    const t2 = setTimeout(updateRect, 250);
    const t3 = setTimeout(updateRect, 500);

    // Smoothly scroll target element into viewport center
    const el = document.getElementById(targetId);
    if (el) {
      const b = el.getBoundingClientRect();
      const inView = b.top >= 60 && b.bottom <= window.innerHeight - 60;
      if (!inView) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [active, step, targetId]);

  if (!active) return null;

  const pad = 8;
  const rx = rect ? Math.max(0, rect.left - pad) : 0;
  const ry = rect ? Math.max(0, rect.top - pad) : 0;
  const rw = rect ? Math.min(window.innerWidth - rx, rect.width + pad * 2) : 0;
  const rh = rect ? Math.min(window.innerHeight - ry, rect.height + pad * 2) : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-30 pointer-events-none"
        aria-hidden="true"
      >
        {/* SVG Mask Cutout: Dimmed everywhere EXCEPT over target area */}
        <svg className="w-full h-full block">
          <defs>
            <mask id="phpa-spotlight-mask">
              {/* 1. White covers whole screen (causes mask to draw dark overlay) */}
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {/* 2. Black hole cuts out a clear window directly over spotlighted element */}
              {rect && (
                <rect
                  x={rx}
                  y={ry}
                  width={rw}
                  height={rh}
                  rx="12"
                  ry="12"
                  fill="black"
                />
              )}
            </mask>
          </defs>

          {/* Semi-transparent dark focus blanket with clear hole */}
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(5, 5, 8, 0.72)"
            mask="url(#phpa-spotlight-mask)"
          />
        </svg>

        {/* Illuminated Glowing Border Box directly around the spotlighted element */}
        {rect && (
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              position: 'fixed',
              top: ry,
              left: rx,
              width: rw,
              height: rh,
              borderRadius: 12,
              pointerEvents: 'none',
              boxShadow: `0 0 0 2px ${color.hex}, 0 0 28px ${color.hex}55`,
            }}
          >
            {/* Top Indicator Badge */}
            <div
              className={`absolute -top-3 left-4 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg ${color.badge}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              <span>{stageName || 'Demo Focus'}</span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
