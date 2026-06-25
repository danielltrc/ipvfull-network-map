import { useEffect, useRef, useState } from 'react';
import { WebSocketAPI } from '../api/WebSocketAPI';
import { WSMessage, WSDeviceUpdate, WSLinkUpdate, WSTopologyUpdate } from '../types';
import { useNetworkStore } from '../store/networkStore';
import { TopologyBuilder } from '../models/NetworkTopology';

interface UseWebSocketResult {
  connected: boolean;
  error: string | null;
}

export function useWebSocket(wsUrl: string | undefined, enabled: boolean): UseWebSocketResult {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocketAPI | null>(null);

  const updateDeviceMetrics = useNetworkStore((s) => s.updateDeviceMetrics);
  const updateLinkMetrics = useNetworkStore((s) => s.updateLinkMetrics);
  const setTopology = useNetworkStore((s) => s.setTopology);
  const topology = useNetworkStore((s) => s.topology);

  useEffect(() => {
    if (!enabled || !wsUrl?.trim()) {
      return;
    }

    const ws = new WebSocketAPI(wsUrl);
    wsRef.current = ws;

    ws.on('connect', () => {
      setConnected(true);
      setError(null);
    });

    ws.on('disconnect', () => {
      setConnected(false);
    });

    ws.on('error', () => {
      setError('WebSocket connection failed');
    });

    ws.on('message', (message: WSMessage) => {
      if (message.type === 'device') {
        const msg = message as WSDeviceUpdate;
        updateDeviceMetrics(msg.id, msg.metrics);
      } else if (message.type === 'link') {
        const msg = message as WSLinkUpdate;
        updateLinkMetrics(msg.id, msg.metrics);
      } else if (message.type === 'topology') {
        const msg = message as WSTopologyUpdate;
        const incoming: Partial<typeof topology> = {};
        if (msg.devices) {
          incoming.devices = {};
          for (const d of msg.devices) {
            incoming.devices[d.id] = d;
          }
        }
        if (msg.links) {
          incoming.links = {};
          for (const l of msg.links) {
            incoming.links[l.id] = l;
          }
        }
        const merged = TopologyBuilder.merge(topology, incoming);
        setTopology(merged);
      }
    });

    ws.connect();

    return () => {
      ws.disconnect();
      wsRef.current = null;
      setConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsUrl, enabled]);

  return { connected, error };
}
