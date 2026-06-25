import { useCallback, useRef } from 'react';
import { XYPosition } from '@xyflow/react';
import { NetworkDevice, NetworkLink, DeviceType, LinkType, NetworkMapOptions } from '../types';
import { useNetworkStore } from '../store/networkStore';
import { TopologyBuilder } from '../models/NetworkTopology';

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

export function useEditor(
  onOptionsChange: ((options: NetworkMapOptions) => void) | undefined,
  options: NetworkMapOptions
) {
  const store = useNetworkStore();
  const isDirtyRef = useRef(false);

  const pushAndMutate = useCallback(
    (mutate: () => void) => {
      store.pushHistory();
      mutate();
      isDirtyRef.current = true;

      // Debounced auto-save
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
      autoSaveTimer = setTimeout(() => {
        save();
        isDirtyRef.current = false;
      }, 3000);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store]
  );

  const save = useCallback(() => {
    if (!onOptionsChange) {
      return;
    }
    const serialized = TopologyBuilder.toSerialized(store.topology);
    onOptionsChange({ ...options, topology: serialized });
  }, [onOptionsChange, options, store.topology]);

  const addDevice = useCallback(
    (position: XYPosition, type: DeviceType, label?: string): NetworkDevice => {
      const id = `device-${Date.now()}`;
      const device: NetworkDevice = {
        id,
        label: label ?? `New ${type}`,
        type,
        status: 'unknown',
        metrics: {},
        x: position.x,
        y: position.y,
      };
      pushAndMutate(() => {
        const updated = TopologyBuilder.addDevice(store.topology, device);
        store.setTopology(updated);
      });
      return device;
    },
    [pushAndMutate, store]
  );

  const deleteDevice = useCallback(
    (deviceId: string) => {
      pushAndMutate(() => {
        const updated = TopologyBuilder.removeDevice(store.topology, deviceId);
        store.setTopology(updated);
        store.selectDevice(null);
      });
    },
    [pushAndMutate, store]
  );

  const addLink = useCallback(
    (sourceId: string, targetId: string, type: LinkType, label?: string): NetworkLink => {
      const id = `link-${sourceId}-${targetId}-${Date.now()}`;
      const link: NetworkLink = {
        id,
        sourceId,
        targetId,
        type,
        status: 'unknown',
        metrics: {},
        label,
      };
      pushAndMutate(() => {
        const updated = TopologyBuilder.addLink(store.topology, link);
        store.setTopology(updated);
      });
      return link;
    },
    [pushAndMutate, store]
  );

  const deleteLink = useCallback(
    (linkId: string) => {
      pushAndMutate(() => {
        const updated = TopologyBuilder.removeLink(store.topology, linkId);
        store.setTopology(updated);
        store.selectLink(null);
      });
    },
    [pushAndMutate, store]
  );

  const updateDevicePosition = useCallback(
    (deviceId: string, position: XYPosition) => {
      const updated = TopologyBuilder.updateDevicePosition(
        store.topology,
        deviceId,
        position.x,
        position.y
      );
      store.setTopology(updated);
      isDirtyRef.current = true;
    },
    [store]
  );

  return {
    activeTool: store.activeTool,
    setActiveTool: store.setActiveTool,
    snapToGrid: store.snapToGrid,
    setSnapToGrid: store.setSnapToGrid,
    addDevice,
    deleteDevice,
    addLink,
    deleteLink,
    updateDevicePosition,
    undo: store.undo,
    redo: store.redo,
    canUndo: store.historyIndex > 0,
    canRedo: store.historyIndex < store.history.length - 1,
    isDirty: isDirtyRef.current,
    save,
  };
}
