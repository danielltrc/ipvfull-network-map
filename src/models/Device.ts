import {
  NetworkDevice,
  DeviceType,
  DeviceStatus,
  DeviceMetrics,
  FieldMapping,
  BadgeState,
} from '../types';
import { statusToColor, cpuToSeverity, memToSeverity, tempToSeverity } from '../utils/color';

export class Device {
  static fromFrame(row: Record<string, unknown>, mapping: FieldMapping): NetworkDevice {
    const id = String(row[mapping.deviceIdField] ?? `device-${Date.now()}-${Math.random()}`);
    const label = String(row[mapping.deviceLabelField] ?? id);
    const type = (String(row[mapping.deviceTypeField] ?? 'router').toLowerCase()) as DeviceType;
    const status = normalizeStatus(String(row[mapping.deviceStatusField] ?? 'unknown'));
    const lat = parseFloat(String(row[mapping.deviceLatField] ?? 'NaN'));
    const lng = parseFloat(String(row[mapping.deviceLngField] ?? 'NaN'));

    const metrics: DeviceMetrics = {
      cpuPercent: parseOptionalFloat(row[mapping.deviceCpuField]),
      memoryPercent: parseOptionalFloat(row[mapping.deviceMemoryField]),
      temperatureCelsius: parseOptionalFloat(row[mapping.deviceTempField]),
      alarmCount: parseOptionalInt(row[mapping.deviceAlarmCountField]),
    };

    return {
      id,
      label,
      type: isValidDeviceType(type) ? type : 'router',
      status,
      metrics,
      geo: isFinite(lat) && isFinite(lng) ? { lat, lng } : undefined,
    };
  }

  static getStatusGlowColor(status: DeviceStatus): string {
    return statusToColor(status);
  }

  static getBadgeThresholds(metrics: DeviceMetrics): BadgeState[] {
    const badges: BadgeState[] = [];

    if (metrics.cpuPercent !== undefined) {
      badges.push({
        label: 'CPU',
        value: metrics.cpuPercent,
        severity: cpuToSeverity(metrics.cpuPercent),
      });
    }

    if (metrics.memoryPercent !== undefined) {
      badges.push({
        label: 'MEM',
        value: metrics.memoryPercent,
        severity: memToSeverity(metrics.memoryPercent),
      });
    }

    if (metrics.temperatureCelsius !== undefined) {
      badges.push({
        label: 'TEMP',
        value: metrics.temperatureCelsius,
        severity: tempToSeverity(metrics.temperatureCelsius),
      });
    }

    if (metrics.alarmCount !== undefined && metrics.alarmCount > 0) {
      badges.push({
        label: 'ALM',
        value: metrics.alarmCount,
        severity: metrics.alarmCount >= 5 ? 'critical' : 'warning',
      });
    }

    return badges;
  }
}

function normalizeStatus(raw: string): DeviceStatus {
  const lower = raw.toLowerCase();
  if (lower === '1' || lower === 'up' || lower === 'online' || lower === 'ok') {
    return 'online';
  }
  if (lower === '0' || lower === 'down' || lower === 'offline') {
    return 'offline';
  }
  if (lower === 'warning' || lower === 'warn') {
    return 'warning';
  }
  if (lower === 'degraded' || lower === 'partial') {
    return 'degraded';
  }
  if (lower === 'maintenance' || lower === 'maint') {
    return 'maintenance';
  }
  return 'unknown';
}

const VALID_DEVICE_TYPES = new Set<string>([
  'router', 'core', 'bng', 'cgnat', 'firewall', 'olt', 'onu',
  'switch', 'server', 'storage', 'radio', 'ap', 'backbone',
  'pop', 'ix', 'datacenter', 'cloud',
]);

function isValidDeviceType(t: string): t is DeviceType {
  return VALID_DEVICE_TYPES.has(t);
}

function parseOptionalFloat(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const n = parseFloat(String(value));
  return isFinite(n) ? n : undefined;
}

function parseOptionalInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const n = parseInt(String(value), 10);
  return isFinite(n) ? n : undefined;
}
