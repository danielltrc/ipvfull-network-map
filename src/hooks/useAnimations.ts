import { useEffect, useRef, useCallback } from 'react';
import { Edge } from '@xyflow/react';
import { LinkEdgeData, Particle } from '../types';
import {
  applyViewportTransform,
  drawParticle,
  bezierPoint,
  cubicControlPoints,
  isPointInViewport,
  Viewport,
} from '../utils/canvas';
import { utilizationToColor } from '../utils/color';
import { Link } from '../models/Link';

const MAX_TOTAL_PARTICLES = 5000;
const FPS_SAMPLE_SIZE = 30;
const MIN_FPS = 25;

interface AnimationState {
  particles: Particle[];
  frameId: number;
  frameTimes: number[];
  fps: number;
}

function createParticlePool(count: number, edge: Edge<LinkEdgeData>): Particle[] {
  const link = edge.data!.link;
  const color = utilizationToColor(link.metrics.utilizationPercent);
  const speed = Link.getParticleSpeed(link);
  return Array.from({ length: count }, (_, i) => ({
    edgeId: edge.id,
    progress: i / count,
    speed,
    color,
    radius: 2.5,
  }));
}

export function useAnimations(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  edges: Array<Edge<LinkEdgeData>>,
  viewport: Viewport,
  enabled: boolean,
  particleCount: number,
  canvasWidth: number,
  canvasHeight: number
): void {
  const stateRef = useRef<AnimationState>({
    particles: [],
    frameId: 0,
    frameTimes: [],
    fps: 60,
  });

  const viewportRef = useRef<Viewport>(viewport);
  viewportRef.current = viewport;

  const edgesRef = useRef<Array<Edge<LinkEdgeData>>>(edges);
  edgesRef.current = edges;

  const buildParticles = useCallback(
    (currentEdges: Array<Edge<LinkEdgeData>>, currentFps: number): Particle[] => {
      if (!enabled || currentEdges.length === 0) {
        return [];
      }

      const fpsFactor = currentFps < MIN_FPS ? currentFps / MIN_FPS : 1;
      const budget = Math.floor(Math.min(MAX_TOTAL_PARTICLES, particleCount * currentEdges.length) * fpsFactor);
      const perEdge = Math.max(1, Math.floor(budget / currentEdges.length));

      const particles: Particle[] = [];
      for (const edge of currentEdges) {
        if (!edge.data?.link) {
          continue;
        }
        const link = edge.data.link;
        const count = Link.getParticleCount(link, perEdge);
        particles.push(...createParticlePool(count, edge as Edge<LinkEdgeData>));
      }
      return particles;
    },
    [enabled, particleCount]
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    stateRef.current.particles = buildParticles(edges, stateRef.current.fps);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edges.length, enabled, particleCount]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const edgeMap = new Map<string, Edge<LinkEdgeData>>();

    function drawFrame(timestamp: number): void {
      const state = stateRef.current;
      const vp = viewportRef.current;
      const currentEdges = edgesRef.current;

      // FPS tracking
      state.frameTimes.push(timestamp);
      if (state.frameTimes.length > FPS_SAMPLE_SIZE) {
        state.frameTimes.shift();
      }
      if (state.frameTimes.length >= 2) {
        const elapsed = state.frameTimes[state.frameTimes.length - 1] - state.frameTimes[0];
        state.fps = (state.frameTimes.length - 1) / (elapsed / 1000);
      }

      // Rebuild edge map each frame (cheap for typical ISP scale)
      edgeMap.clear();
      for (const edge of currentEdges) {
        edgeMap.set(edge.id, edge);
      }

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      applyViewportTransform(ctx!, vp);

      for (const particle of state.particles) {
        const edge = edgeMap.get(particle.edgeId);
        if (!edge) {
          continue;
        }

        const { sourceX, sourceY, targetX, targetY } = edge as unknown as {
          sourceX: number;
          sourceY: number;
          targetX: number;
          targetY: number;
        };

        if (sourceX === undefined) {
          continue;
        }

        // Skip particles outside viewport (performance)
        if (
          !isPointInViewport(
            (sourceX + targetX) / 2,
            (sourceY + targetY) / 2,
            vp,
            canvasWidth,
            canvasHeight
          )
        ) {
          continue;
        }

        const { cp1, cp2 } = cubicControlPoints(sourceX, sourceY, targetX, targetY, 0.25);
        const pos = bezierPoint(
          { x: sourceX, y: sourceY },
          cp1,
          cp2,
          { x: targetX, y: targetY },
          particle.progress
        );

        drawParticle(ctx!, pos.x, pos.y, particle.radius, particle.color + 'bb');

        // Advance particle
        particle.progress += particle.speed;
        if (particle.progress > 1) {
          particle.progress = 0;
        }
      }

      // Reset transform
      ctx!.setTransform(1, 0, 0, 1, 0, 0);

      state.frameId = requestAnimationFrame(drawFrame);
    }

    stateRef.current.frameId = requestAnimationFrame(drawFrame);

    return () => {
      cancelAnimationFrame(stateRef.current.frameId);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [enabled, canvasRef, canvasWidth, canvasHeight]);
}
