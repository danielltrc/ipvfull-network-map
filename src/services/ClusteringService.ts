import { NetworkTopology, NetworkDevice, ClusterGroup, DeviceStatus } from '../types';
import { centroid } from '../utils/geo';

export class ClusteringService {
  static clusterByPOP(topology: NetworkTopology): ClusterGroup[] {
    return this.clusterBy(topology, (d) => d.popId ?? null, 'POP');
  }

  static clusterByCity(topology: NetworkTopology): ClusterGroup[] {
    return this.clusterBy(topology, (d) => d.city ?? null, 'City');
  }

  static clusterByRegion(topology: NetworkTopology): ClusterGroup[] {
    return this.clusterBy(topology, (d) => d.regionId ?? d.state ?? null, 'Region');
  }

  static clusterByCustomer(topology: NetworkTopology): ClusterGroup[] {
    return this.clusterBy(topology, (d) => d.customerId ?? null, 'Customer');
  }

  static clusterByVendor(topology: NetworkTopology): ClusterGroup[] {
    return this.clusterBy(topology, (d) => d.vendor ?? null, 'Vendor');
  }

  private static clusterBy(
    topology: NetworkTopology,
    getKey: (device: NetworkDevice) => string | null,
    prefix: string
  ): ClusterGroup[] {
    const groups = new Map<string, NetworkDevice[]>();

    for (const device of Object.values(topology.devices)) {
      const key = getKey(device);
      if (!key) {
        continue;
      }
      const existing = groups.get(key) ?? [];
      existing.push(device);
      groups.set(key, existing);
    }

    return Array.from(groups.entries()).map(([key, devices]) => {
      const geoCoords = devices
        .filter((d) => d.geo)
        .map((d) => d.geo!);

      const worstStatus = getWorstStatus(devices.map((d) => d.status));
      const totalAlarms = devices.reduce(
        (sum, d) => sum + (d.metrics.alarmCount ?? 0),
        0
      );

      return {
        id: `cluster-${prefix.toLowerCase()}-${key}`,
        label: `${key} (${devices.length})`,
        deviceIds: devices.map((d) => d.id),
        geo: centroid(geoCoords),
        status: worstStatus,
        alarmCount: totalAlarms,
        expanded: false,
      };
    });
  }
}

const STATUS_SEVERITY: Record<DeviceStatus, number> = {
  offline: 5,
  degraded: 4,
  warning: 3,
  maintenance: 2,
  unknown: 1,
  online: 0,
};

function getWorstStatus(statuses: DeviceStatus[]): DeviceStatus {
  let worst: DeviceStatus = 'online';
  let worstSeverity = 0;

  for (const status of statuses) {
    const severity = STATUS_SEVERITY[status] ?? 0;
    if (severity > worstSeverity) {
      worstSeverity = severity;
      worst = status;
    }
  }

  return worst;
}
