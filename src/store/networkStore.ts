import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  NetworkTopology,
  DeviceMetrics,
  LinkMetrics,
  ViewMode,
  LayoutMode,
  EditorTool,
} from '../types';
import { TopologyBuilder } from '../models/NetworkTopology';

const MAX_HISTORY = 50;

interface NetworkStore {
  topology: NetworkTopology;
  selectedDeviceId: string | null;
  selectedLinkId: string | null;
  hoveredDeviceId: string | null;
  hoveredLinkId: string | null;
  viewMode: ViewMode;
  layoutMode: LayoutMode;
  editMode: boolean;
  nocMode: boolean;
  activeTool: EditorTool;
  snapToGrid: boolean;
  history: NetworkTopology[];
  historyIndex: number;
  filterQuery: string;
  filterStatus: string;
  filterType: string;

  setTopology: (topo: NetworkTopology) => void;
  mergeTopology: (incoming: Partial<NetworkTopology>) => void;
  updateDeviceMetrics: (id: string, metrics: Partial<DeviceMetrics>) => void;
  updateLinkMetrics: (id: string, metrics: Partial<LinkMetrics>) => void;
  selectDevice: (id: string | null) => void;
  selectLink: (id: string | null) => void;
  hoverDevice: (id: string | null) => void;
  hoverLink: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setLayoutMode: (mode: LayoutMode) => void;
  setEditMode: (enabled: boolean) => void;
  setNocMode: (enabled: boolean) => void;
  setActiveTool: (tool: EditorTool) => void;
  setSnapToGrid: (enabled: boolean) => void;
  setFilterQuery: (q: string) => void;
  setFilterStatus: (s: string) => void;
  setFilterType: (t: string) => void;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
}

export const useNetworkStore = create<NetworkStore>()(
  devtools(
    (set, get) => ({
      topology: TopologyBuilder.empty(),
      selectedDeviceId: null,
      selectedLinkId: null,
      hoveredDeviceId: null,
      hoveredLinkId: null,
      viewMode: 'topology',
      layoutMode: 'manual',
      editMode: false,
      nocMode: false,
      activeTool: 'select',
      snapToGrid: false,
      history: [],
      historyIndex: -1,
      filterQuery: '',
      filterStatus: '',
      filterType: '',

      setTopology: (topo) => set({ topology: topo }),

      mergeTopology: (incoming) =>
        set((state) => ({
          topology: TopologyBuilder.merge(state.topology, incoming),
        })),

      updateDeviceMetrics: (id, metrics) =>
        set((state) => ({
          topology: TopologyBuilder.updateDeviceMetrics(state.topology, id, metrics),
        })),

      updateLinkMetrics: (id, metrics) =>
        set((state) => ({
          topology: TopologyBuilder.updateLinkMetrics(state.topology, id, metrics),
        })),

      selectDevice: (id) =>
        set({ selectedDeviceId: id, selectedLinkId: null }),

      selectLink: (id) =>
        set({ selectedLinkId: id, selectedDeviceId: null }),

      hoverDevice: (id) => set({ hoveredDeviceId: id }),

      hoverLink: (id) => set({ hoveredLinkId: id }),

      setViewMode: (mode) => set({ viewMode: mode }),

      setLayoutMode: (mode) => set({ layoutMode: mode }),

      setEditMode: (enabled) => set({ editMode: enabled }),

      setNocMode: (enabled) => set({ nocMode: enabled }),

      setActiveTool: (tool) => set({ activeTool: tool }),

      setSnapToGrid: (enabled) => set({ snapToGrid: enabled }),

      setFilterQuery: (q) => set({ filterQuery: q }),

      setFilterStatus: (s) => set({ filterStatus: s }),

      setFilterType: (t) => set({ filterType: t }),

      pushHistory: () => {
        const state = get();
        const history = state.history.slice(0, state.historyIndex + 1);
        const newHistory = [...history, state.topology].slice(-MAX_HISTORY);
        set({ history: newHistory, historyIndex: newHistory.length - 1 });
      },

      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex <= 0) {
          return;
        }
        const newIndex = historyIndex - 1;
        set({ topology: history[newIndex], historyIndex: newIndex });
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex >= history.length - 1) {
          return;
        }
        const newIndex = historyIndex + 1;
        set({ topology: history[newIndex], historyIndex: newIndex });
      },
    }),
    { name: 'IPvFullNetworkMap' }
  )
);
