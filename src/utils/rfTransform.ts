import { Node, Edge } from '@xyflow/react';
import { NetworkTopology, DeviceNodeData, LinkEdgeData } from '../types';

const DEFAULT_NODE_WIDTH = 80;
const DEFAULT_NODE_HEIGHT = 80;

export function topologyToRFNodes(topology: NetworkTopology): Array<Node<DeviceNodeData>> {
  return Object.values(topology.devices).map((device, index) => ({
    id: device.id,
    type: 'device',
    position: {
      x: device.x ?? (index % 20) * 150,
      y: device.y ?? Math.floor(index / 20) * 150,
    },
    data: { device },
    width: DEFAULT_NODE_WIDTH,
    height: DEFAULT_NODE_HEIGHT,
    measured: {
      width: DEFAULT_NODE_WIDTH,
      height: DEFAULT_NODE_HEIGHT,
    },
  }));
}

export function topologyToRFEdges(topology: NetworkTopology): Array<Edge<LinkEdgeData>> {
  return Object.values(topology.links)
    .filter(
      (link) =>
        topology.devices[link.sourceId] !== undefined &&
        topology.devices[link.targetId] !== undefined
    )
    .map((link) => ({
      id: link.id,
      source: link.sourceId,
      target: link.targetId,
      type: 'link',
      data: { link },
      animated: false,
    }));
}
