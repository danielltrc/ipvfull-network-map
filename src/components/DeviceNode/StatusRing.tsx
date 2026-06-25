import React from 'react';
import { DeviceStatus } from '../../types';
import { statusToGlowCSS, statusToColor } from '../../utils/color';

interface StatusRingProps {
  status: DeviceStatus;
  size: number;
}

const PULSE_STATUSES: DeviceStatus[] = ['online', 'warning', 'degraded'];

export const StatusRing = React.memo(function StatusRing({ status, size }: StatusRingProps) {
  const color = statusToColor(status);
  const glow = statusToGlowCSS(status);
  const pulse = PULSE_STATUSES.includes(status);
  const borderWidth = Math.max(2, Math.round(size * 0.04));

  return (
    <div
      style={{
        position: 'absolute',
        top: -borderWidth - 2,
        left: -borderWidth - 2,
        width: size + (borderWidth + 2) * 2,
        height: size + (borderWidth + 2) * 2,
        borderRadius: '50%',
        border: `${borderWidth}px solid ${color}`,
        boxShadow: glow,
        animation: pulse ? `ipvfull-pulse-${status} 2s ease-in-out infinite` : 'none',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
});
