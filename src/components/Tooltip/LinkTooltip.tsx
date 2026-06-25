import React from 'react';
import { createPortal } from 'react-dom';
import { useNetworkStore } from '../../store/networkStore';
import { linkStatusToColor, utilizationToColor } from '../../utils/color';
import { formatBps, formatLatency, formatDistance, formatOpticalPower, formatPercent } from '../../utils/format';

interface LinkTooltipProps {
  position: { x: number; y: number };
}

export function LinkTooltip({ position }: LinkTooltipProps) {
  const hoveredId = useNetworkStore((s) => s.hoveredLinkId);
  const topology = useNetworkStore((s) => s.topology);

  if (!hoveredId) {
    return null;
  }

  const link = topology.links[hoveredId];
  if (!link) {
    return null;
  }

  const source = topology.devices[link.sourceId];
  const target = topology.devices[link.targetId];
  const statusColor = linkStatusToColor(link.status);
  const utilColor = utilizationToColor(link.metrics.utilizationPercent);

  const tooltip = (
    <div
      style={{
        position: 'fixed',
        left: position.x + 20,
        top: position.y + 10,
        zIndex: 9999,
        background: 'rgba(10, 15, 30, 0.95)',
        border: `1px solid ${statusColor}`,
        borderRadius: 8,
        padding: '10px 14px',
        minWidth: 220,
        boxShadow: `0 4px 20px rgba(0,0,0,0.5)`,
        backdropFilter: 'blur(8px)',
        fontFamily: 'monospace',
        fontSize: 12,
        color: '#e0e0e0',
        pointerEvents: 'none',
      }}
    >
      <div style={{ fontWeight: 'bold', fontSize: 13, color: '#fff', marginBottom: 8 }}>
        {link.label ?? `${source?.label ?? link.sourceId} ↔ ${target?.label ?? link.targetId}`}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: '#888', fontSize: 10 }}>STATUS</span>
        <span style={{ color: statusColor, fontSize: 11 }}>{link.status.toUpperCase()}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: '#888', fontSize: 10 }}>TYPE</span>
        <span style={{ color: '#ccc', fontSize: 11 }}>{link.type.toUpperCase()}</span>
      </div>

      {link.metrics.utilizationPercent !== undefined && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
            <span style={{ color: '#888' }}>UTILIZATION</span>
            <span style={{ color: utilColor }}>{formatPercent(link.metrics.utilizationPercent)}</span>
          </div>
          <div style={{ background: '#222', borderRadius: 2, height: 6, overflow: 'hidden' }}>
            <div
              style={{
                width: `${link.metrics.utilizationPercent}%`,
                height: '100%',
                background: utilColor,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      )}

      <div style={{ borderTop: '1px solid #333', paddingTop: 8 }}>
        {link.metrics.rxBps !== undefined && (
          <Row label="RX" value={formatBps(link.metrics.rxBps)} color="#00cc88" />
        )}
        {link.metrics.txBps !== undefined && (
          <Row label="TX" value={formatBps(link.metrics.txBps)} color="#4488ff" />
        )}
        {link.metrics.capacityBps !== undefined && (
          <Row label="Capacity" value={formatBps(link.metrics.capacityBps)} />
        )}
        {link.metrics.latencyMs !== undefined && (
          <Row label="Latency" value={formatLatency(link.metrics.latencyMs)} />
        )}
        {link.metrics.jitterMs !== undefined && (
          <Row label="Jitter" value={formatLatency(link.metrics.jitterMs)} />
        )}
        {link.metrics.lossPercent !== undefined && (
          <Row
            label="Loss"
            value={formatPercent(link.metrics.lossPercent)}
            color={link.metrics.lossPercent > 1 ? '#ff4444' : '#ccc'}
          />
        )}
        {link.metrics.distanceKm !== undefined && (
          <Row label="Distance" value={formatDistance(link.metrics.distanceKm)} />
        )}
        {link.metrics.opticalPowerDbm !== undefined && (
          <Row label="Optical" value={formatOpticalPower(link.metrics.opticalPowerDbm)} />
        )}
      </div>
    </div>
  );

  return createPortal(tooltip, document.body);
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
      <span style={{ color: '#888', fontSize: 10 }}>{label}</span>
      <span style={{ color: color ?? '#ccc', fontSize: 11 }}>{value}</span>
    </div>
  );
}
