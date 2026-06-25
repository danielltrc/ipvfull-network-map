import React, { useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { Map as LeafletMap } from 'leaflet';
import { ReactFlow, Background, ConnectionMode, BackgroundVariant, NodeTypes, EdgeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import 'leaflet/dist/leaflet.css';
import { useNetworkStore } from '../../store/networkStore';
import { useGeoSync } from '../../hooks/useGeoSync';
import { DeviceNode } from '../DeviceNode/DeviceNode';
import { LinkEdge } from '../LinkEdge/LinkEdge';

const nodeTypes: NodeTypes = { device: DeviceNode as NodeTypes[string] };
const edgeTypes: EdgeTypes = { link: LinkEdge as EdgeTypes[string] };

interface HybridViewProps {
  width: number;
  height: number;
  tileLayerUrl: string;
  tileLayerAttribution: string;
}

export function HybridView({ width, height, tileLayerUrl, tileLayerAttribution }: HybridViewProps) {
  const topology = useNetworkStore((s) => s.topology);
  const [leafletMap, setLeafletMap] = useState<LeafletMap | null>(null);

  const { nodes, edges } = useGeoSync(leafletMap, topology);

  const geoDevices = Object.values(topology.devices).filter((d) => d.geo);
  const defaultCenter: [number, number] =
    geoDevices.length > 0
      ? [
          geoDevices.reduce((s, d) => s + d.geo!.lat, 0) / geoDevices.length,
          geoDevices.reduce((s, d) => s + d.geo!.lng, 0) / geoDevices.length,
        ]
      : [-15.78, -47.93];

  const url = tileLayerUrl || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const attribution =
    tileLayerAttribution ||
    '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  return (
    <div style={{ position: 'relative', width, height }}>
      {/* Leaflet map layer */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        <MapContainer
          center={defaultCenter}
          zoom={5}
          style={{ width, height }}
          ref={setLeafletMap}
          zoomControl={false}
          preferCanvas
        >
          <TileLayer url={url} attribution={attribution} />
        </MapContainer>
      </div>

      {/* React Flow topology overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          pointerEvents: 'none',
          background: 'transparent',
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionMode={ConnectionMode.Loose}
          minZoom={0.01}
          maxZoom={4}
          nodesDraggable={false}
          nodesConnectable={false}
          panOnDrag={false}
          zoomOnScroll={false}
          panOnScroll={false}
          style={{ background: 'transparent', pointerEvents: 'none' }}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={0} color="transparent" />
        </ReactFlow>
      </div>
    </div>
  );
}
