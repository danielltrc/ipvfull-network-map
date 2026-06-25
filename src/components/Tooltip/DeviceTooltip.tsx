import React from 'react';
import { createPortal } from 'react-dom';
import { statusToColor } from '../../utils/color';
import { formatPercent, formatUptime, formatBps } from '../../utils/format';
import { useNetworkStore } from '../../store/networkStore';

interface TooltipPosition {
  x: number;
  y: number;
}

interface DeviceTooltipProps {
  position: TooltipPosition;
}

export function DeviceTooltip({ position }: DeviceTooltipProps) {
  const hoveredId = useNetworkStore((s) => s.hoveredDeviceId);
  const topology = useNetworkStore((s) => s.topology);

  if (!hoveredId) {
    return null;
  }

  const device = topology.devices[hoveredId];
  if (!device) {
    return null;
  }

  const statusColor = statusToColor(device.status);

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
        minWidth: 200,
        maxWidth: 280,
        boxShadow: `0 4px 20px rgba(0,0,0,0.5), 0 0 8px ${statusColor}44`,
        backdropFilter: 'blur(8px)',
        fontFamily: 'monospace',
        fontSize: 12,
        color: '#e0e0e0',
        pointerEvents: 'none',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: statusColor,
            flexShrink: 0,
            boxShadow: `0 0 6px ${statusColor}`,
          }}
        />
        <span style={{ fontWeight: 'bold', fontSize: 13, color: '#fff' }}>{device.label}</span>
      </div>

      <TooltipRow label="Status" value={device.status.toUpperCase()} color={statusColor} />
      <TooltipRow label="Type" value={device.type.toUpperCase()} />
      {device.model && <TooltipRow label="Model" value={device.model} />}
      {device.vendor && <TooltipRow label="Vendor" value={device.vendor} />}
      {device.ip && <TooltipRow label="IP" value={device.ip} />}
      {device.hostname && <TooltipRow label="Host" value={device.hostname} />}
      {device.location && <TooltipRow label="Location" value={device.location} />}

      {/* Metrics */}
      {(device.metrics.cpuPercent !== undefined ||
        device.metrics.memoryPercent !== undefined ||
        device.metrics.temperatureCelsius !== undefined) && (
        <div style={{ borderTop: '1px solid #333', marginTop: 8, paddingTop: 8 }}>
          {device.metrics.cpuPercent !== undefined && (
            <MetricBar label="CPU" value={device.metrics.cpuPercent} max={100} unit="%" warn={70} crit={90} />
          )}
          {device.metrics.memoryPercent !== undefined && (
            <MetricBar label="MEM" value={device.metrics.memoryPercent} max={100} unit="%" warn={80} crit={90} />
          )}
          {device.metrics.temperatureCelsius !== undefined && (
            <MetricBar label="TEMP" value={device.metrics.temperatureCelsius} max={100} unit="°C" warn={65} crit={80} />
          )}
          {device.metrics.uptimeSeconds !== undefined && (
            <TooltipRow label="Uptime" value={formatUptime(device.metrics.uptimeSeconds)} />
          )}
        </div>
      )}

      {/* Interfaces */}
      {device.metrics.interfaces && device.metrics.interfaces.length > 0 && (
        <div style={{ borderTop: '1px solid #333', marginTop: 8, paddingTop: 8 }}>
          <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>INTERFACES</div>
          {device.metrics.interfaces.slice(0, 5).map((iface) => (
            <div key={iface.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
              <span style={{ color: iface.status === 'up' ? '#00cc88' : '#ff4444' }}>{iface.name}</span>
              <span>{formatBps(iface.rxBps + iface.txBps)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Alarm count */}
      {device.metrics.alarmCount !== undefined && device.metrics.alarmCount > 0 && (
        <div
          style={{
            marginTop: 8,
            padding: '4px 8px',
            background: 'rgba(255, 68, 68, 0.2)',
            borderRadius: 4,
            color: '#ff4444',
            fontSize: 11,
            textAlign: 'center',
          }}
        >
          ⚠ {device.metrics.alarmCount} active alarm{device.metrics.alarmCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );

  return createPortal(tooltip, document.body);
}

function TooltipRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
      <span style={{ color: '#888', fontSize: 10 }}>{label}</span>
      <span style={{ color: color ?? '#ccc', fontSize: 11 }}>{value}</span>
    </div>
  );
}

function MetricBar({
  label,
  value,
  max,
  unit,
  warn,
  crit,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
  warn: number;
  crit: number;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const color = value >= crit ? '#ff4444' : value >= warn ? '#ffcc00' : '#00cc88';

  return (
    <div style={{ marginBottom: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
        <span style={{ color: '#888' }}>{label}</span>
        <span style={{ color }}>
          {unit === '%' ? formatPercent(value, 0) : `${value.toFixed(0)}${unit}`}
        </span>
      </div>
      <div style={{ background: '#222', borderRadius: 2, height: 4, overflow: 'hidden' }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}
