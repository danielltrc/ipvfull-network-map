import { NetworkTopology, NetworkDevice, DeviceStatus } from '../types';

export interface AlarmEntry {
  deviceId: string;
  deviceLabel: string;
  count: number;
  status: DeviceStatus;
  ip?: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export class AlarmProcessor {
  static getActiveAlarms(topology: NetworkTopology): AlarmEntry[] {
    const alarms: AlarmEntry[] = [];

    for (const device of Object.values(topology.devices)) {
      if (device.status === 'offline') {
        alarms.push({
          deviceId: device.id,
          deviceLabel: device.label,
          count: device.metrics.alarmCount ?? 1,
          status: device.status,
          ip: device.ip,
          type: 'Device Offline',
          severity: 'critical',
        });
      } else if (device.metrics.alarmCount && device.metrics.alarmCount > 0) {
        alarms.push({
          deviceId: device.id,
          deviceLabel: device.label,
          count: device.metrics.alarmCount,
          status: device.status,
          ip: device.ip,
          type: this.inferAlarmType(device),
          severity: this.inferSeverity(device),
        });
      }
    }

    // Sort: critical → high → medium → low, then by alarm count desc
    const severityOrder: Record<AlarmEntry['severity'], number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    return alarms.sort(
      (a, b) =>
        severityOrder[a.severity] - severityOrder[b.severity] || b.count - a.count
    );
  }

  static getTotalAlarmCount(topology: NetworkTopology): number {
    return Object.values(topology.devices).reduce(
      (sum, d) => sum + (d.metrics.alarmCount ?? 0),
      0
    );
  }

  private static inferAlarmType(device: NetworkDevice): string {
    const m = device.metrics;
    if (m.cpuPercent !== undefined && m.cpuPercent >= 90) {
      return 'CPU High';
    }
    if (m.memoryPercent !== undefined && m.memoryPercent >= 90) {
      return 'Memory High';
    }
    if (m.temperatureCelsius !== undefined && m.temperatureCelsius >= 80) {
      return 'Temperature High';
    }
    if (device.status === 'warning') {
      return 'Warning';
    }
    if (device.status === 'degraded') {
      return 'Degraded';
    }
    return 'Alert';
  }

  private static inferSeverity(device: NetworkDevice): AlarmEntry['severity'] {
    if (device.status === 'offline') {
      return 'critical';
    }
    const m = device.metrics;
    if (
      (m.cpuPercent !== undefined && m.cpuPercent >= 90) ||
      (m.memoryPercent !== undefined && m.memoryPercent >= 95) ||
      (m.temperatureCelsius !== undefined && m.temperatureCelsius >= 85)
    ) {
      return 'critical';
    }
    if (
      (m.cpuPercent !== undefined && m.cpuPercent >= 70) ||
      (m.memoryPercent !== undefined && m.memoryPercent >= 80) ||
      device.status === 'degraded'
    ) {
      return 'high';
    }
    if (device.status === 'warning') {
      return 'medium';
    }
    return 'low';
  }
}
