import React, { useRef, useEffect, useCallback } from 'react';
import { useNetworkStore } from '../../store/networkStore';
import { statusToColor } from '../../utils/color';

const MINI_WIDTH = 160;
const MINI_HEIGHT = 100;
const DOT_SIZE = 2;
const PADDING = 8;

export function MiniMap() {
  const topology = useNetworkStore((s) => s.topology);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const devices = Object.values(topology.devices);
    if (devices.length === 0) {
      ctx.clearRect(0, 0, MINI_WIDTH, MINI_HEIGHT);
      return;
    }

    // Compute bounds
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const d of devices) {
      const x = d.x ?? 0;
      const y = d.y ?? 0;
      if (x < minX) { minX = x; }
      if (x > maxX) { maxX = x; }
      if (y < minY) { minY = y; }
      if (y > maxY) { maxY = y; }
    }

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const drawW = MINI_WIDTH - PADDING * 2;
    const drawH = MINI_HEIGHT - PADDING * 2;

    ctx.clearRect(0, 0, MINI_WIDTH, MINI_HEIGHT);

    // Background
    ctx.fillStyle = 'rgba(8, 12, 24, 0.95)';
    ctx.fillRect(0, 0, MINI_WIDTH, MINI_HEIGHT);

    // Links
    ctx.strokeStyle = 'rgba(68, 136, 255, 0.15)';
    ctx.lineWidth = 0.5;
    for (const link of Object.values(topology.links)) {
      const src = topology.devices[link.sourceId];
      const tgt = topology.devices[link.targetId];
      if (!src || !tgt) { continue; }
      const sx = PADDING + ((src.x ?? 0) - minX) / rangeX * drawW;
      const sy = PADDING + ((src.y ?? 0) - minY) / rangeY * drawH;
      const tx = PADDING + ((tgt.x ?? 0) - minX) / rangeX * drawW;
      const ty = PADDING + ((tgt.y ?? 0) - minY) / rangeY * drawH;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
    }

    // Devices as dots
    for (const d of devices) {
      const x = PADDING + ((d.x ?? 0) - minX) / rangeX * drawW;
      const y = PADDING + ((d.y ?? 0) - minY) / rangeY * drawH;
      const color = statusToColor(d.status);

      ctx.beginPath();
      ctx.arc(x, y, DOT_SIZE, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }, [topology]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 48,
        right: 12,
        zIndex: 50,
        borderRadius: 6,
        overflow: 'hidden',
        border: '1px solid #1a2744',
        boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
      }}
    >
      <canvas
        ref={canvasRef}
        width={MINI_WIDTH}
        height={MINI_HEIGHT}
        style={{ display: 'block' }}
        title="Mini Map"
      />
    </div>
  );
}
