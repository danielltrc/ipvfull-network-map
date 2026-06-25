import React, { useCallback, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';
import { LayoutMode, DeviceNodeData, LinkEdgeData } from '../../types';
import { useNetworkStore } from '../../store/networkStore';
import { useLayout } from '../../hooks/useLayout';
import { Node, Edge } from '@xyflow/react';
import { TopologyBuilder } from '../../models/NetworkTopology';

const LAYOUT_OPTIONS: Array<{ value: LayoutMode; label: string; icon: string }> = [
  { value: 'manual', label: 'Manual', icon: '✥' },
  { value: 'force', label: 'Force Graph', icon: '⬡' },
  { value: 'tree', label: 'Tree', icon: '⫶' },
  { value: 'hierarchical', label: 'Hierarchical', icon: '≡' },
  { value: 'circular', label: 'Circular', icon: '◎' },
  { value: 'grid', label: 'Grid', icon: '⊞' },
  { value: 'radial', label: 'Radial', icon: '✳' },
];

export function LayoutSelector() {
  const layoutMode = useNetworkStore((s) => s.layoutMode);
  const setLayoutMode = useNetworkStore((s) => s.setLayoutMode);
  const topology = useNetworkStore((s) => s.topology);
  const setTopology = useNetworkStore((s) => s.setTopology);
  const { applyLayout } = useLayout();
  const { getNodes, getEdges, setNodes } = useReactFlow();
  const isRunning = useRef(false);

  const handleSelect = useCallback(
    async (mode: LayoutMode) => {
      setLayoutMode(mode);
      if (mode === 'manual' || isRunning.current) {
        return;
      }

      isRunning.current = true;
      try {
        const nodes = getNodes() as Array<Node<DeviceNodeData>>;
        const edges = getEdges() as Array<Edge<LinkEdgeData>>;
        const positioned = await applyLayout(mode, nodes, edges);
        setNodes(positioned);

        // Persist positions back to topology
        let updated = topology;
        for (const node of positioned) {
          updated = TopologyBuilder.updateDevicePosition(
            updated,
            node.id,
            node.position.x,
            node.position.y
          );
        }
        setTopology(updated);
      } finally {
        isRunning.current = false;
      }
    },
    [setLayoutMode, getNodes, getEdges, applyLayout, setNodes, topology, setTopology]
  );

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 56,
        left: 12,
        zIndex: 50,
        background: 'rgba(8, 12, 24, 0.9)',
        border: '1px solid #2a3a5a',
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {LAYOUT_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => handleSelect(opt.value)}
          title={opt.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            width: '100%',
            background: layoutMode === opt.value ? 'rgba(68, 136, 255, 0.2)' : 'transparent',
            border: 'none',
            borderLeft: layoutMode === opt.value ? '2px solid #4488ff' : '2px solid transparent',
            color: layoutMode === opt.value ? '#4488ff' : '#888',
            padding: '5px 10px',
            cursor: 'pointer',
            fontSize: 11,
            fontFamily: 'monospace',
            textAlign: 'left',
            transition: 'all 0.15s ease',
          }}
        >
          <span style={{ fontSize: 13 }}>{opt.icon}</span>
          {opt.label}
        </button>
      ))}
    </div>
  );
}
