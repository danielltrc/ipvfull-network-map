import { Node, Edge } from '@xyflow/react';
import { LayoutMode, DeviceNodeData, LinkEdgeData } from '../types';
import dagre from 'dagre';

const NODE_WIDTH = 80;
const NODE_HEIGHT = 80;

export function useLayout() {
  return { applyLayout };
}

async function applyLayout(
  mode: LayoutMode,
  nodes: Array<Node<DeviceNodeData>>,
  edges: Array<Edge<LinkEdgeData>>
): Promise<Array<Node<DeviceNodeData>>> {
  if (mode === 'manual' || nodes.length === 0) {
    return nodes;
  }

  switch (mode) {
    case 'force':
      return applyForceLayout(nodes, edges);
    case 'tree':
      return applyDagreLayout(nodes, edges, 'TB');
    case 'hierarchical':
      return applyDagreLayout(nodes, edges, 'LR');
    case 'circular':
      return applyCircularLayout(nodes);
    case 'grid':
      return applyGridLayout(nodes);
    case 'radial':
      return applyRadialLayout(nodes, edges);
    default:
      return nodes;
  }
}

function applyDagreLayout(
  nodes: Array<Node<DeviceNodeData>>,
  edges: Array<Edge<LinkEdgeData>>,
  direction: 'TB' | 'LR' | 'BT' | 'RL'
): Array<Node<DeviceNodeData>> {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: direction, ranksep: 80, nodesep: 60 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });
}

async function applyForceLayout(
  nodes: Array<Node<DeviceNodeData>>,
  edges: Array<Edge<LinkEdgeData>>
): Promise<Array<Node<DeviceNodeData>>> {
  const { forceSimulation, forceLink, forceManyBody, forceCollide, forceCenter } = await import('d3-force');
  type SimulationNodeDatum = import('d3-force').SimulationNodeDatum;

  interface SimNode extends SimulationNodeDatum {
    id: string;
    x: number;
    y: number;
  }

  const simNodes: SimNode[] = nodes.map((n) => ({
    id: n.id,
    x: n.position.x,
    y: n.position.y,
  }));

  const nodeIndex = new Map(simNodes.map((n, i) => [n.id, i]));

  const simLinks = edges
    .filter((e) => nodeIndex.has(e.source) && nodeIndex.has(e.target))
    .map((e) => ({
      source: nodeIndex.get(e.source)!,
      target: nodeIndex.get(e.target)!,
    }));

  const centerX = nodes.length > 0 ? 400 : 0;
  const centerY = nodes.length > 0 ? 300 : 0;

  await new Promise<void>((resolve) => {
    const sim = forceSimulation<SimNode>(simNodes)
      .force('link', forceLink(simLinks).id((d) => String((d as SimNode).id)).distance(150))
      .force('charge', forceManyBody().strength(-300))
      .force('collide', forceCollide(NODE_WIDTH * 0.7))
      .force('center', forceCenter(centerX, centerY))
      .alphaDecay(0.02)
      .stop();

    const iterations = Math.ceil(Math.log(sim.alphaMin()) / Math.log(1 - sim.alphaDecay()));
    for (let i = 0; i < iterations; i++) {
      sim.tick();
    }
    resolve();
  });

  return nodes.map((node, i) => ({
    ...node,
    position: {
      x: simNodes[i].x,
      y: simNodes[i].y,
    },
  }));
}

function applyCircularLayout(
  nodes: Array<Node<DeviceNodeData>>
): Array<Node<DeviceNodeData>> {
  const count = nodes.length;
  const radius = Math.max(200, count * 40);
  const centerX = radius + NODE_WIDTH;
  const centerY = radius + NODE_HEIGHT;

  return nodes.map((node, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    return {
      ...node,
      position: {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      },
    };
  });
}

function applyGridLayout(
  nodes: Array<Node<DeviceNodeData>>
): Array<Node<DeviceNodeData>> {
  const cols = Math.ceil(Math.sqrt(nodes.length));
  const spacingX = 150;
  const spacingY = 150;

  return nodes.map((node, i) => ({
    ...node,
    position: {
      x: (i % cols) * spacingX + spacingX / 2,
      y: Math.floor(i / cols) * spacingY + spacingY / 2,
    },
  }));
}

function applyRadialLayout(
  nodes: Array<Node<DeviceNodeData>>,
  edges: Array<Edge<LinkEdgeData>>
): Array<Node<DeviceNodeData>> {
  // Find nodes with most connections for the center
  const connectionCount = new Map<string, number>();
  for (const edge of edges) {
    connectionCount.set(edge.source, (connectionCount.get(edge.source) ?? 0) + 1);
    connectionCount.set(edge.target, (connectionCount.get(edge.target) ?? 0) + 1);
  }

  const sorted = [...nodes].sort(
    (a, b) => (connectionCount.get(b.id) ?? 0) - (connectionCount.get(a.id) ?? 0)
  );

  const rings = [1, 6, 12, 24, 48];
  let placed = 0;
  const result = new Map<string, { x: number; y: number }>();
  const centerX = 500;
  const centerY = 400;

  for (let ring = 0; ring < rings.length && placed < sorted.length; ring++) {
    const capacity = rings[ring];
    const radius = ring === 0 ? 0 : ring * 180;
    const inRing = Math.min(capacity, sorted.length - placed);

    for (let i = 0; i < inRing; i++) {
      const angle = ring === 0 ? 0 : (2 * Math.PI * i) / inRing - Math.PI / 2;
      result.set(sorted[placed + i].id, {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    }
    placed += inRing;
  }

  // Any remaining nodes go in a large outer ring
  if (placed < sorted.length) {
    const remaining = sorted.slice(placed);
    const outerRadius = rings.length * 180;
    remaining.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / remaining.length - Math.PI / 2;
      result.set(n.id, {
        x: centerX + outerRadius * Math.cos(angle),
        y: centerY + outerRadius * Math.sin(angle),
      });
    });
  }

  return nodes.map((node) => ({
    ...node,
    position: result.get(node.id) ?? node.position,
  }));
}
