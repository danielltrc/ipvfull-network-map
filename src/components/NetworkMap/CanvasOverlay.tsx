import React, { useRef, useEffect } from 'react';
import { Edge, useOnViewportChange } from '@xyflow/react';
import { LinkEdgeData } from '../../types';
import { useAnimations } from '../../hooks/useAnimations';

interface CanvasOverlayProps {
  edges: Array<Edge<LinkEdgeData>>;
  width: number;
  height: number;
  enabled: boolean;
  particleCount: number;
}

export function CanvasOverlay({
  edges,
  width,
  height,
  enabled,
  particleCount,
}: CanvasOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef({ x: 0, y: 0, zoom: 1 });

  useOnViewportChange({
    onChange: (vp) => {
      viewportRef.current = vp;
    },
  });

  // Keep canvas sized to panel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }, [width, height]);

  useAnimations(
    canvasRef,
    edges,
    viewportRef.current,
    enabled,
    particleCount,
    width,
    height
  );

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 5,
      }}
    />
  );
}
