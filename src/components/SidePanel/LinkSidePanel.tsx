import React from 'react';
import { useNetworkStore } from '../../store/networkStore';
import { linkStatusToColor, utilizationToColor } from '../../utils/color';
import { formatBps, formatLatency, formatDistance, formatOpticalPower, formatPercent } from '../../utils/format';

export function LinkSidePanel() {
  const selectedId = useNetworkStore((s) => s.selectedLinkId);
  const topology = useNetworkStore((s) => s.topology);
  const selectLink = useNetworkStore((s) => s.selectLink);

  if (!selectedId) {
    return null;
  }

  const link = topology.links[selectedId];
  if (!link) {
    return null;
  }

  const source = topology.devices[link.sourceId];
  const target = topology.devices[link.targetId];
  const statusColor = linkStatusToColor(link.status);
  const utilColor = utilizationToColor(link.metrics.utilizationPercent);

  return (
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 280,
        background: 'rgba(8, 12, 24, 0.95)',
        borderLeft: `2px solid ${statusColor}44`,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(12px)',
        fontFamily: 'monospace',
        fontSize: 12,
        color: '#e0e0e0',
        overflowY: 'auto',
        animation: 'ipvfull-slide-in-right 0.2s ease',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${statusColor}33`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: `${statusColor}11`,
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ fontWeight: 'bold', fontSize: 13, color: '#fff' }}>
            {link.label ?? 'Link Detail'}
          </div>
          <div style={{ fontSize: 10, color: statusColor, marginTop: 2 }}>
            {link.type.toUpperCase()} · {link.status.toUpperCase()}
          </div>
        </div>
        <button
          onClick={() => selectLink(null)}
          style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: 18, padding: 0 }}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div style={{ padding: 16, flex: 1 }}>
        <Section title="ENDPOINTS">
          <Row label="Source" value={source?.label ?? link.sourceId} />
          <Row label="Target" value={target?.label ?? link.targetId} />
        </Section>

        <Section title="TRAFFIC">
          {link.metrics.rxBps !== undefined && (
            <Row label="RX" value={formatBps(link.metrics.rxBps)} color="#00cc88" />
          )}
          {link.metrics.txBps !== undefined && (
            <Row label="TX" value={formatBps(link.metrics.txBps)} color="#4488ff" />
          )}
          {link.metrics.capacityBps !== undefined && (
            <Row label="Capacity" value={formatBps(link.metrics.capacityBps)} />
          )}
          {link.metrics.utilizationPercent !== undefined && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ color: '#888', fontSize: 10 }}>Utilization</span>
                <span style={{ color: utilColor, fontSize: 11 }}>
                  {formatPercent(link.metrics.utilizationPercent)}
                </span>
              </div>
              <div style={{ background: '#111', borderRadius: 3, height: 8, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${link.metrics.utilizationPercent}%`,
                    height: '100%',
                    background: utilColor,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          )}
        </Section>

        <Section title="QUALITY">
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
              color={link.metrics.lossPercent > 1 ? '#ff4444' : '#00cc88'}
            />
          )}
          {link.metrics.distanceKm !== undefined && (
            <Row label="Distance" value={formatDistance(link.metrics.distanceKm)} />
          )}
          {link.metrics.opticalPowerDbm !== undefined && (
            <Row label="Optical" value={formatOpticalPower(link.metrics.opticalPowerDbm)} />
          )}
        </Section>

        {link.description && (
          <Section title="DESCRIPTION">
            <p style={{ color: '#aaa', fontSize: 11, margin: 0, lineHeight: 1.5 }}>{link.description}</p>
          </Section>
        )}

        {link.tags && link.tags.length > 0 && (
          <Section title="TAGS">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {link.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    background: '#1a2744',
                    border: '1px solid #333',
                    borderRadius: 3,
                    padding: '1px 5px',
                    fontSize: 10,
                    color: '#88aaff',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10, color: '#555', letterSpacing: 1, marginBottom: 8, borderBottom: '1px solid #1a1a1a', paddingBottom: 4 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
      <span style={{ color: '#666', fontSize: 10 }}>{label}</span>
      <span style={{ color: color ?? '#ccc', fontSize: 11 }}>{value}</span>
    </div>
  );
}
