import React, { useRef, useCallback, useState } from 'react';
import { PanelProps } from '@grafana/data';
import { ReactFlowProvider } from '@xyflow/react';
import { NetworkMapOptions, NetworkDevice, DeviceType, LinkType } from '../../types';
import { useNetworkData } from '../../hooks/useNetworkData';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useEditor } from '../../hooks/useEditor';
import { useNetworkStore } from '../../store/networkStore';
import { TopologyView } from './TopologyView';
import { MapView } from '../MapView/MapView';
import { HybridView } from '../MapView/HybridView';
import { DeviceSidePanel } from '../SidePanel/DeviceSidePanel';
import { LinkSidePanel } from '../SidePanel/LinkSidePanel';
import { FilterBar } from '../FilterBar/FilterBar';
import { MiniMap } from '../MiniMap/MiniMap';
import { NOCMode } from '../NOCMode/NOCMode';
import { AlarmPanel } from '../AlarmPanel/AlarmPanel';
import { EditorToolbar } from '../Editor/EditorToolbar';
import { AddDeviceModal } from '../Editor/AddDeviceModal';
import { AddLinkModal } from '../Editor/AddLinkModal';
import { LayoutSelector } from '../LayoutSelector/LayoutSelector';
import '../../styles/index.css';

interface AddDeviceState {
  open: boolean;
  position: { x: number; y: number };
}

export function NetworkMapPanel(props: PanelProps<NetworkMapOptions>) {
  const { data, options, width, height, onOptionsChange } = props;

  // Hydrate store from data
  useNetworkData(data, options);

  // WebSocket real-time updates
  const { connected: wsConnected } = useWebSocket(options.wsUrl, !!options.wsUrl);

  // Sync panel options → store
  const viewMode = useNetworkStore((s) => s.viewMode);
  const nocMode = useNetworkStore((s) => s.nocMode);
  const editMode = useNetworkStore((s) => s.editMode);
  const selectedDeviceId = useNetworkStore((s) => s.selectedDeviceId);
  const selectedLinkId = useNetworkStore((s) => s.selectedLinkId);
  const setViewMode = useNetworkStore((s) => s.setViewMode);
  const setEditMode = useNetworkStore((s) => s.setEditMode);
  const setNocMode = useNetworkStore((s) => s.setNocMode);

  // Initialize store view/edit from panel options on first render
  React.useEffect(() => {
    setViewMode(options.viewMode ?? 'topology');
    setEditMode(options.editMode ?? false);
    setNocMode(options.nocMode ?? false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const editor = useEditor(onOptionsChange, options);

  const containerRef = useRef<HTMLDivElement>(null);

  const [addDeviceState, setAddDeviceState] = useState<AddDeviceState>({
    open: false,
    position: { x: 200, y: 200 },
  });
  const [addLinkOpen, setAddLinkOpen] = useState(false);

  const handleEditorAddDevice = useCallback(
    (partial: Partial<NetworkDevice>) => {
      editor.addDevice(addDeviceState.position, (partial.type ?? 'router') as DeviceType, partial.label);
    },
    [editor, addDeviceState.position]
  );

  const handleEditorAddLink = useCallback(
    (sourceId: string, targetId: string, type: LinkType, capacity?: number, label?: string) => {
      editor.addLink(sourceId, targetId, type, label);
    },
    [editor]
  );

  return (
    <div
      ref={containerRef}
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        background: '#070c1a',
        fontFamily: 'monospace',
      }}
    >
      {/* NOC mode overlay */}
      {nocMode && <NOCMode width={width} height={height} />}

      {/* Main views (wrapped in ReactFlowProvider for topology + hybrid) */}
      {!nocMode && (
        <>
          {viewMode === 'topology' && (
            <ReactFlowProvider>
              <TopologyView
                width={width}
                height={height}
                particleAnimations={options.particleAnimations ?? true}
                particleCount={options.particleCount ?? 6}
                editMode={editMode}
              />
              {/* Layout selector inside RF context */}
              {editMode && <LayoutSelector />}
            </ReactFlowProvider>
          )}

          {viewMode === 'geographic' && (
            <MapView
              width={width}
              height={height}
              tileLayerUrl={options.tileLayerUrl}
              tileLayerAttribution={options.tileLayerAttribution}
            />
          )}

          {viewMode === 'hybrid' && (
            <ReactFlowProvider>
              <HybridView
                width={width}
                height={height}
                tileLayerUrl={options.tileLayerUrl}
                tileLayerAttribution={options.tileLayerAttribution}
              />
            </ReactFlowProvider>
          )}

          {/* Shared UI overlays */}
          {options.showFilterBar !== false && <FilterBar />}
          {options.showMiniMap !== false && <MiniMap />}
          {options.showAlarmPanel !== false && <AlarmPanel />}

          {/* Side panels */}
          {selectedDeviceId && <DeviceSidePanel />}
          {selectedLinkId && !selectedDeviceId && <LinkSidePanel />}

          {/* View mode switcher */}
          <ViewModeSwitcher />

          {/* Editor toolbar */}
          {editMode && (
            <EditorToolbar
              activeTool={editor.activeTool}
              onSetTool={editor.setActiveTool}
              onUndo={editor.undo}
              onRedo={editor.redo}
              canUndo={editor.canUndo}
              canRedo={editor.canRedo}
              snapToGrid={editor.snapToGrid}
              onToggleSnap={() => editor.setSnapToGrid(!editor.snapToGrid)}
              isDirty={editor.isDirty}
              onSave={editor.save}
            />
          )}

          {/* WS status indicator */}
          {options.wsUrl && (
            <div
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 50,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'rgba(8, 12, 24, 0.8)',
                border: '1px solid #2a3a5a',
                borderRadius: 4,
                padding: '2px 8px',
                fontSize: 10,
                fontFamily: 'monospace',
                color: wsConnected ? '#00cc88' : '#ff4444',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: wsConnected ? '#00cc88' : '#ff4444',
                  display: 'inline-block',
                }}
              />
              {wsConnected ? 'LIVE' : 'OFFLINE'}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <AddDeviceModal
        isOpen={addDeviceState.open}
        onClose={() => setAddDeviceState((s) => ({ ...s, open: false }))}
        onConfirm={handleEditorAddDevice}
        position={addDeviceState.position}
      />

      <AddLinkModal
        isOpen={addLinkOpen}
        onClose={() => setAddLinkOpen(false)}
        onConfirm={handleEditorAddLink}
      />
    </div>
  );
}

function ViewModeSwitcher() {
  const viewMode = useNetworkStore((s) => s.viewMode);
  const setViewMode = useNetworkStore((s) => s.setViewMode);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 12,
        right: 12,
        zIndex: 50,
        display: 'flex',
        gap: 4,
        background: 'rgba(8, 12, 24, 0.9)',
        border: '1px solid #2a3a5a',
        borderRadius: 6,
        padding: '4px',
        backdropFilter: 'blur(8px)',
      }}
    >
      {(['topology', 'geographic', 'hybrid'] as const).map((mode) => (
        <button
          key={mode}
          onClick={() => setViewMode(mode)}
          style={{
            background: viewMode === mode ? 'rgba(68, 136, 255, 0.25)' : 'transparent',
            border: `1px solid ${viewMode === mode ? '#4488ff' : 'transparent'}`,
            borderRadius: 4,
            color: viewMode === mode ? '#4488ff' : '#666',
            padding: '3px 8px',
            cursor: 'pointer',
            fontSize: 10,
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            transition: 'all 0.15s ease',
          }}
        >
          {mode === 'topology' ? '⬡ Topo' : mode === 'geographic' ? '🌐 Map' : '⊕ Hybrid'}
        </button>
      ))}
    </div>
  );
}
