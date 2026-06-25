export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface Point {
  x: number;
  y: number;
}

const gradientCache = new Map<string, CanvasGradient>();

export function applyViewportTransform(ctx: CanvasRenderingContext2D, viewport: Viewport): void {
  ctx.setTransform(viewport.zoom, 0, 0, viewport.zoom, viewport.x, viewport.y);
}

export function drawParticle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string
): void {
  const key = `${color}-${radius}`;
  let gradient = gradientCache.get(key);

  if (!gradient) {
    gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'transparent');
    if (gradientCache.size > 200) {
      const firstKey = gradientCache.keys().next().value;
      if (firstKey !== undefined) {
        gradientCache.delete(firstKey);
      }
    }
    gradientCache.set(key, gradient);
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.restore();
}

export function bezierPoint(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
  };
}

export function cubicControlPoints(
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  curvature = 0.25
): { cp1: Point; cp2: Point } {
  const dx = tx - sx;
  const dy = ty - sy;
  return {
    cp1: { x: sx + dx * curvature, y: sy + dy * curvature },
    cp2: { x: tx - dx * curvature, y: ty - dy * curvature },
  };
}

export function isPointInViewport(
  x: number,
  y: number,
  viewport: Viewport,
  canvasWidth: number,
  canvasHeight: number,
  margin = 100
): boolean {
  const screenX = x * viewport.zoom + viewport.x;
  const screenY = y * viewport.zoom + viewport.y;
  return (
    screenX > -margin &&
    screenX < canvasWidth + margin &&
    screenY > -margin &&
    screenY < canvasHeight + margin
  );
}

export function clearGradientCache(): void {
  gradientCache.clear();
}
