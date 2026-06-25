import React, { useMemo, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  BackgroundVariant,
  NodeTypes,
  EdgeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { DeviceNodeData, LinkEdgeData } from '../../types';
import { DeviceNode } from '../DeviceNode/DeviceNode';
import { LinkEdge } from '../LinkEdge/LinkEdge';
import { CanvasOverlay } from './CanvasOverlay';
import { useNetworkStore } from '../../store/networkStore';
import { topologyToRFNodes, topologyToRFEdges } from '../../utils/rfTransform';
import { TopologyBuilder } from '../../models/NetworkTopology';

// Node and edge type registries must be stable (defined outside component)
const nodeTypes: NodeTypes = { device: DeviceNode as NodeTypes[string] };
const edgeTypes: EdgeTypes = { link: LinkEdge as EdgeTypes[string] };

interface TopologyViewProps {
  width: number;
  height: number;
  particleAnimations: boolean;
  particleCount: number;
  editMode: boolean;
}

export function TopologyView({
  width,
  height,
  particleAnimations,
  particleCount,
  editMode,
}: TopologyViewProps) {
  const topology = useNetworkStore((s) => s.topology);
  const selectDevice = useNetworkStore((s) => s.selectDevice);
  const selectLink = useNetworkStore((s) => s.selectLink);
  const setTopology = useNetworkStore((s) => s.setTopology);

  const initialNodes = useMemo(
    () => topologyToRFNodes(topology),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [topology.version]
  );
  const initialEdges = useMemo(
    () => topologyToRFEdges(topology),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [topology.version]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<DeviceNodeData>>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<LinkEdgeData>>(initialEdges);

  // Sync store topology → RF nodes/edges when topology version changes
  useEffect(() => {
    setNodes(topologyToRFNodes(topology));
    setEdges(topologyToRFEdges(topology));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topology.version]);

  const handleNodeDragStop = useCallback(
    (_: MouseEvent | TouchEvent, node: Node<DeviceNodeData>) => {
      if (!editMode) {
        return;
      }
      const updated = TopologyBuilder.updateDevicePosition(
        topology,
        node.id,
        node.position.x,
        node.position.y
      );
      setTopology(updated);
    },
    [editMode, topology, setTopology]
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node<DeviceNodeData>) => {
      selectDevice(node.id);
    },
    [selectDevice]
  );

  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge<LinkEdgeData>) => {
      selectLink(edge.id);
    },
    [selectLink]
  );

  const handlePaneClick = useCallback(() => {
    selectDevice(null);
    selectLink(null);
  }, [selectDevice, selectLink]);

  const handleNodesChange = useCallback(
    (changes: NodeChange<Node<DeviceNodeData>>[]) => {
      onNodesChange(changes);
    },
    [onNodesChange]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange<Edge<LinkEdgeData>>[]) => {
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  return (
    <div style={{ position: 'relative', width, height }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onPaneClick={handlePaneClick}
        connectionMode={ConnectionMode.Loose}
        minZoom={0.01}
        maxZoom={4}
        onlyRenderVisibleElements
        nodesDraggable={editMode}
        nodesConnectable={editMode}
        elementsSelectable
        panOnDrag
        zoomOnScroll
        fitView
        fitViewOptions={{ padding: 0.1 }}
        style={{ background: 'transparent' }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#333" />
        <Controls position="bottom-right" showInteractive={false} />
      </ReactFlow>

      <CanvasOverlay
        edges={edges as Array<Edge<LinkEdgeData>>}
        width={width}
        height={height}
        enabled={particleAnimations}
        particleCount={particleCount}
      />
    </div>
  );
}
