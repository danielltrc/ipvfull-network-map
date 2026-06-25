import React from 'react';
import { useNetworkStore } from '../../store/networkStore';
import { statusToColor } from '../../utils/color';
import {
  formatPercent,
  formatTemperature,
  formatUptime,
  formatBps,
} from '../../utils/format';

export function DeviceSidePanel() {
  const selectedId = useNetworkStore((s) => s.selectedDeviceId);
  const topology = useNetworkStore((s) => s.topology);
  const selectDevice = useNetworkStore((s) => s.selectDevice);

  if (!selectedId) {
    return null;
  }

  const device = topology.devices[selectedId];
  if (!device) {
    return null;
  }

  const statusColor = statusToColor(device.status);

  const openUrl = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

  const sshUrl = device.ip ? `ssh://${device.ip}` : null;
  const httpUrl = device.ip ? `http://${device.ip}` : null;
  const httpsUrl = device.ip ? `https://${device.ip}` : null;
  const winboxUrl = device.ip ? `winbox://${device.ip}` : null;

  return (
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 320,
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
      {/* Header */}
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
          <div style={{ fontWeight: 'bold', fontSize: 14, color: '#fff' }}>{device.label}</div>
          <div style={{ fontSize: 10, color: statusColor, marginTop: 2 }}>
            {device.type.toUpperCase()} · {device.status.toUpperCase()}
          </div>
        </div>
        <button
          onClick={() => selectDevice(null)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            fontSize: 18,
            padding: 0,
            lineHeight: 1,
          }}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: 16, flex: 1 }}>
        {/* Device Info */}
        <Section title="DEVICE INFO">
          <InfoRow label="Hostname" value={device.hostname} />
          <InfoRow label="Model" value={device.model} />
          <InfoRow label="Vendor" value={device.vendor} />
          <InfoRow label="IP" value={device.ip} />
          <InfoRow label="IPv6" value={device.ipv6} />
          <InfoRow label="ASN" value={device.asn} />
          <InfoRow label="OS" value={device.os ? `${device.os} ${device.osVersion ?? ''}`.trim() : undefined} />
          <InfoRow label="Location" value={device.location} />
          <InfoRow label="City" value={device.city} />
          <InfoRow label="Serial" value={device.serialNumber} />
          {device.geo && (
            <InfoRow
              label="Geo"
              value={`${device.geo.lat.toFixed(4)}, ${device.geo.lng.toFixed(4)}`}
            />
          )}
          {device.tags && device.tags.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <span style={{ color: '#888', fontSize: 10 }}>Tags</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                {device.tags.map((tag) => (
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
            </div>
          )}
        </Section>

        {/* Live Metrics */}
        {(device.metrics.cpuPercent !== undefined ||
          device.metrics.memoryPercent !== undefined ||
          device.metrics.temperatureCelsius !== undefined) && (
          <Section title="LIVE METRICS">
            {device.metrics.cpuPercent !== undefined && (
              <MetricBar label="CPU" value={device.metrics.cpuPercent} unit="%" warn={70} crit={90} />
            )}
            {device.metrics.memoryPercent !== undefined && (
              <MetricBar label="Memory" value={device.metrics.memoryPercent} unit="%" warn={80} crit={90} />
            )}
            {device.metrics.diskPercent !== undefined && (
              <MetricBar label="Disk" value={device.metrics.diskPercent} unit="%" warn={80} crit={90} />
            )}
            {device.metrics.temperatureCelsius !== undefined && (
              <MetricBar label="Temp" value={device.metrics.temperatureCelsius} unit="°C" warn={65} crit={80} maxVal={100} />
            )}
            {device.metrics.uptimeSeconds !== undefined && (
              <InfoRow label="Uptime" value={formatUptime(device.metrics.uptimeSeconds)} />
            )}
            {device.metrics.alarmCount !== undefined && device.metrics.alarmCount > 0 && (
              <div
                style={{
                  padding: '6px 10px',
                  background: 'rgba(255,68,68,0.15)',
                  borderRadius: 4,
                  color: '#ff4444',
                  fontSize: 12,
                  textAlign: 'center',
                  marginTop: 8,
                }}
              >
                ⚠ {device.metrics.alarmCount} active alarm{device.metrics.alarmCount !== 1 ? 's' : ''}
              </div>
            )}
          </Section>
        )}

        {/* Interfaces */}
        {device.metrics.interfaces && device.metrics.interfaces.length > 0 && (
          <Section title="INTERFACES">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ color: '#666', fontSize: 10 }}>
                  <th style={{ textAlign: 'left', paddingBottom: 4 }}>Name</th>
                  <th style={{ textAlign: 'right' }}>RX</th>
                  <th style={{ textAlign: 'right' }}>TX</th>
                  <th style={{ textAlign: 'center' }}>St</th>
                </tr>
              </thead>
              <tbody>
                {device.metrics.interfaces.map((iface) => (
                  <tr key={iface.name} style={{ borderTop: '1px solid #1a1a1a' }}>
                    <td style={{ paddingTop: 4, paddingBottom: 4, color: '#ccc' }}>{iface.name}</td>
                    <td style={{ textAlign: 'right', color: '#00cc88' }}>{formatBps(iface.rxBps)}</td>
                    <td style={{ textAlign: 'right', color: '#4488ff' }}>{formatBps(iface.txBps)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ color: iface.status === 'up' ? '#00cc88' : '#ff4444' }}>
                        {iface.status === 'up' ? '●' : '○'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        {/* Notes */}
        {device.notes && (
          <Section title="NOTES">
            <p style={{ color: '#aaa', fontSize: 11, margin: 0, lineHeight: 1.5 }}>{device.notes}</p>
          </Section>
        )}
      </div>

      {/* Action Buttons */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid #1a1a1a',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          flexShrink: 0,
        }}
      >
        {sshUrl && (
          <ActionButton label="SSH" onClick={() => openUrl(sshUrl)} color="#4488ff" />
        )}
        {httpsUrl && (
          <ActionButton label="HTTPS" onClick={() => openUrl(httpsUrl)} color="#00cc88" />
        )}
        {httpUrl && (
          <ActionButton label="HTTP" onClick={() => openUrl(httpUrl)} color="#888" />
        )}
        {winboxUrl && (
          <ActionButton label="Winbox" onClick={() => openUrl(winboxUrl)} color="#ff8800" />
        )}
        {device.ip && (
          <ActionButton
            label="Copy IP"
            onClick={() => navigator.clipboard.writeText(device.ip!)}
            color="#888"
          />
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 10,
          color: '#555',
          letterSpacing: 1,
          marginBottom: 8,
          borderBottom: '1px solid #1a1a1a',
          paddingBottom: 4,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) {
    return null;
  }
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
      <span style={{ color: '#666', fontSize: 10 }}>{label}</span>
      <span style={{ color: '#ccc', fontSize: 11, maxWidth: 180, textAlign: 'right', wordBreak: 'break-all' }}>
        {value}
      </span>
    </div>
  );
}

function MetricBar({
  label,
  value,
  unit,
  warn,
  crit,
  maxVal = 100,
}: {
  label: string;
  value: number;
  unit: string;
  warn: number;
  crit: number;
  maxVal?: number;
}) {
  const pct = Math.min(100, (value / maxVal) * 100);
  const color = value >= crit ? '#ff4444' : value >= warn ? '#ffcc00' : '#00cc88';
  const display = unit === '%' ? formatPercent(value, 0) : formatTemperature(value);

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ color: '#888', fontSize: 10 }}>{label}</span>
        <span style={{ color, fontSize: 11 }}>{display}</span>
      </div>
      <div style={{ background: '#111', borderRadius: 3, height: 6, overflow: 'hidden' }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            borderRadius: 3,
            transition: 'width 0.4s ease, background 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  color,
}: {
  label: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: `${color}22`,
        border: `1px solid ${color}66`,
        color,
        borderRadius: 4,
        padding: '4px 10px',
        cursor: 'pointer',
        fontSize: 11,
        fontFamily: 'monospace',
        transition: 'all 0.15s ease',
      }}
      onMouseOver={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = `${color}44`;
      }}
      onMouseOut={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = `${color}22`;
      }}
    >
      {label}
    </button>
  );
}
