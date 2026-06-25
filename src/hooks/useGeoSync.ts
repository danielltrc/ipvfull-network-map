import { useState, useEffect, useCallback } from 'react';
import { Map as LeafletMap } from 'leaflet';
import { Node, Edge } from '@xyflow/react';
import { NetworkTopology, DeviceNodeData, LinkEdgeData } from '../types';
import { topologyToRFEdges } from '../utils/rfTransform';

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function useGeoSync(
  map: LeafletMap | null,
  topology: NetworkTopology
): {
  nodes: Array<Node<DeviceNodeData>>;
  edges: Array<Edge<LinkEdgeData>>;
} {
  const [nodes, setNodes] = useState<Array<Node<DeviceNodeData>>>([]);
  const edges = topologyToRFEdges(topology);

  const recalculate = useCallback(() => {
    if (!map) {
      return;
    }

    const newNodes: Array<Node<DeviceNodeData>> = [];

    for (const device of Object.values(topology.devices)) {
      if (!device.geo) {
        continue;
      }

      const point = map.latLngToContainerPoint([device.geo.lat, device.geo.lng]);

      newNodes.push({
        id: device.id,
        type: 'device',
        position: { x: point.x, y: point.y },
        data: { device },
        width: 80,
        height: 80,
        measured: { width: 80, height: 80 },
        draggable: false,
      });
    }

    setNodes(newNodes);
  }, [map, topology]);

  useEffect(() => {
    if (!map) {
      return;
    }

    recalculate();

    const debouncedRecalc = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(recalculate, 16);
    };

    map.on('moveend', debouncedRecalc);
    map.on('zoomend', debouncedRecalc);

    return () => {
      map.off('moveend', debouncedRecalc);
      map.off('zoomend', debouncedRecalc);
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [map, recalculate]);

  return { nodes, edges };
}
