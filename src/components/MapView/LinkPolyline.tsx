import React from 'react';
import { Polyline, Tooltip } from 'react-leaflet';
import { NetworkLink } from '../../types';
import { Link } from '../../models/Link';
import { useNetworkStore } from '../../store/networkStore';
import { formatBps, formatLatency, formatPercent } from '../../utils/format';

interface LinkPolylineProps {
  link: NetworkLink;
}

export function LinkPolyline({ link }: LinkPolylineProps) {
  const topology = useNetworkStore((s) => s.topology);
  const selectLink = useNetworkStore((s) => s.selectLink);
  const selectedId = useNetworkStore((s) => s.selectedLinkId);

  const source = topology.devices[link.sourceId];
  const target = topology.devices[link.targetId];

  if (!source?.geo || !target?.geo) {
    return null;
  }

  const color = Link.getLinkColor(link);
  const weight = Link.getThickness(link) + 1;
  const selected = selectedId === link.id;

  const positions: [number, number][] = [
    [source.geo.lat, source.geo.lng],
    [target.geo.lat, target.geo.lng],
  ];

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color,
        weight: selected ? weight + 2 : weight,
        opacity: selected ? 1 : 0.75,
        dashArray: link.status === 'degraded' ? '8 4' : link.status === 'down' ? '4 4' : undefined,
      }}
      eventHandlers={{
        click: () => selectLink(link.id),
      }}
    >
      <Tooltip sticky>
        <div style={{ fontFamily: 'monospace', fontSize: 11 }}>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
            {source.label} ↔ {target.label}
          </div>
          {link.metrics.rxBps !== undefined && (
            <div>↓ {formatBps(link.metrics.rxBps)}</div>
          )}
          {link.metrics.txBps !== undefined && (
            <div>↑ {formatBps(link.metrics.txBps)}</div>
          )}
          {link.metrics.utilizationPercent !== undefined && (
            <div>Util: {formatPercent(link.metrics.utilizationPercent)}</div>
          )}
          {link.metrics.latencyMs !== undefined && (
            <div>Latency: {formatLatency(link.metrics.latencyMs)}</div>
          )}
          {link.metrics.distanceKm !== undefined && (
            <div>Distance: {link.metrics.distanceKm.toFixed(1)} km</div>
          )}
        </div>
      </Tooltip>
    </Polyline>
  );
}
