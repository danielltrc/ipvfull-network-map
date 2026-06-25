import { DeviceStatus, LinkStatus } from '../types';

export const STATUS_COLORS: Record<DeviceStatus, string> = {
  online: '#00cc88',
  offline: '#ff4444',
  warning: '#ffcc00',
  degraded: '#ff8800',
  maintenance: '#4488ff',
  unknown: '#888888',
};

export const STATUS_GLOW: Record<DeviceStatus, string> = {
  online: '0 0 12px 4px rgba(0, 204, 136, 0.7)',
  offline: '0 0 12px 4px rgba(255, 68, 68, 0.7)',
  warning: '0 0 12px 4px rgba(255, 204, 0, 0.7)',
  degraded: '0 0 12px 4px rgba(255, 136, 0, 0.7)',
  maintenance: '0 0 12px 4px rgba(68, 136, 255, 0.7)',
  unknown: '0 0 8px 2px rgba(136, 136, 136, 0.4)',
};

export function statusToGlowCSS(status: DeviceStatus): string {
  return STATUS_GLOW[status] ?? STATUS_GLOW.unknown;
}

export function statusToColor(status: DeviceStatus): string {
  return STATUS_COLORS[status] ?? STATUS_COLORS.unknown;
}

export function linkStatusToColor(status: LinkStatus): string {
  const map: Record<LinkStatus, string> = {
    up: '#00cc88',
    down: '#111111',
    degraded: '#ff8800',
    unknown: '#888888',
  };
  return map[status] ?? map.unknown;
}

export function utilizationToColor(percent: number | undefined): string {
  if (percent === undefined || percent === null) {
    return '#888888';
  }
  if (percent >= 85) {
    return '#ff4444';
  }
  if (percent >= 70) {
    return '#ff8800';
  }
  if (percent >= 50) {
    return '#ffcc00';
  }
  return '#00cc88';
}

export function utilizationToRGB(percent: number): [number, number, number] {
  const color = utilizationToColor(percent);
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return [r, g, b];
}

export function cpuToSeverity(percent: number): 'ok' | 'warning' | 'critical' {
  if (percent >= 90) {
    return 'critical';
  }
  if (percent >= 70) {
    return 'warning';
  }
  return 'ok';
}

export function memToSeverity(percent: number): 'ok' | 'warning' | 'critical' {
  if (percent >= 90) {
    return 'critical';
  }
  if (percent >= 80) {
    return 'warning';
  }
  return 'ok';
}

export function tempToSeverity(celsius: number): 'ok' | 'warning' | 'critical' {
  if (celsius >= 80) {
    return 'critical';
  }
  if (celsius >= 65) {
    return 'warning';
  }
  return 'ok';
}

const SEVERITY_COLOR: Record<'ok' | 'warning' | 'critical', string> = {
  ok: '#00cc88',
  warning: '#ffcc00',
  critical: '#ff4444',
};

export function severityToColor(severity: 'ok' | 'warning' | 'critical'): string {
  return SEVERITY_COLOR[severity];
}
