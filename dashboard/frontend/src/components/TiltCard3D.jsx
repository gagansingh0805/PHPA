import React from 'react';

/**
 * TiltCard3D / NaturalRaisedWrapper
 * Clean, non-distracting wrapper providing natural elevation structure.
 * Zero hover-jumping, zero mouse tilt. Real resting depth.
 */
export default function TiltCard3D({
  children,
  className = '',
  ...props
}) {
  return (
    <div className={`raised-card ${className}`} {...props}>
      {children}
    </div>
  );
}
