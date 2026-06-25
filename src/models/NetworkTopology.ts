import { NetworkTopology, NetworkDevice, NetworkLink, SerializedTopology } from '../types';

export class TopologyBuilder {
  static empty(): NetworkTopology {
    return {
      devices: {},
      links: {},
      version: 0,
      lastUpdated: Date.now(),
    };
  }

  static fromSerialized(saved: SerializedTopology): NetworkTopology {
    const devices: Record<string, NetworkDevice> = {};
    const links: Record<string, NetworkLink> = {};

    for (const d of saved.devices ?? []) {
      devices[d.id] = d;
    }
    for (const l of saved.links ?? []) {
      links[l.id] = l;
    }

    return {
      devices,
      links,
      version: 0,
      lastUpdated: saved.savedAt ?? Date.now(),
    };
  }

  static toSerialized(topo: NetworkTopology): SerializedTopology {
    return {
      devices: Object.values(topo.devices),
      links: Object.values(topo.links),
      savedAt: Date.now(),
    };
  }

  static merge(existing: NetworkTopology, incoming: Partial<NetworkTopology>): NetworkTopology {
    const devices = { ...existing.devices };
    const links = { ...existing.links };

    if (incoming.devices) {
      for (const [id, device] of Object.entries(incoming.devices)) {
        const existingDevice = devices[id];
        if (existingDevice) {
          // Preserve manually-set position (x, y) from existing device
          devices[id] = {
            ...existingDevice,
            ...device,
            x: existingDevice.x ?? device.x,
            y: existingDevice.y ?? device.y,
          };
        } else {
          devices[id] = device;
        }
      }
    }

    if (incoming.links) {
      for (const [id, link] of Object.entries(incoming.links)) {
        links[id] = link;
      }
    }

    return {
      devices,
      links,
      version: (existing.version ?? 0) + 1,
      lastUpdated: Date.now(),
    };
  }

  static updateDeviceMetrics(
    topo: NetworkTopology,
    deviceId: string,
    updates: Partial<NetworkDevice['metrics']>
  ): NetworkTopology {
    const device = topo.devices[deviceId];
    if (!device) {
      return topo;
    }
    return {
      ...topo,
      devices: {
        ...topo.devices,
        [deviceId]: {
          ...device,
          metrics: { ...device.metrics, ...updates },
        },
      },
      version: topo.version + 1,
      lastUpdated: Date.now(),
    };
  }

  static updateLinkMetrics(
    topo: NetworkTopology,
    linkId: string,
    updates: Partial<NetworkLink['metrics']>
  ): NetworkTopology {
    const link = topo.links[linkId];
    if (!link) {
      return topo;
    }
    return {
      ...topo,
      links: {
        ...topo.links,
        [linkId]: {
          ...link,
          metrics: { ...link.metrics, ...updates },
        },
      },
      version: topo.version + 1,
      lastUpdated: Date.now(),
    };
  }

  static addDevice(topo: NetworkTopology, device: NetworkDevice): NetworkTopology {
    return {
      ...topo,
      devices: { ...topo.devices, [device.id]: device },
      version: topo.version + 1,
      lastUpdated: Date.now(),
    };
  }

  static removeDevice(topo: NetworkTopology, deviceId: string): NetworkTopology {
    const devices = { ...topo.devices };
    delete devices[deviceId];

    // Remove all links connected to this device
    const links: Record<string, NetworkLink> = {};
    for (const [id, link] of Object.entries(topo.links)) {
      if (link.sourceId !== deviceId && link.targetId !== deviceId) {
        links[id] = link;
      }
    }

    return {
      ...topo,
      devices,
      links,
      version: topo.version + 1,
      lastUpdated: Date.now(),
    };
  }

  static addLink(topo: NetworkTopology, link: NetworkLink): NetworkTopology {
    return {
      ...topo,
      links: { ...topo.links, [link.id]: link },
      version: topo.version + 1,
      lastUpdated: Date.now(),
    };
  }

  static removeLink(topo: NetworkTopology, linkId: string): NetworkTopology {
    const links = { ...topo.links };
    delete links[linkId];
    return {
      ...topo,
      links,
      version: topo.version + 1,
      lastUpdated: Date.now(),
    };
  }

  static updateDevicePosition(
    topo: NetworkTopology,
    deviceId: string,
    x: number,
    y: number
  ): NetworkTopology {
    const device = topo.devices[deviceId];
    if (!device) {
      return topo;
    }
    return {
      ...topo,
      devices: {
        ...topo.devices,
        [deviceId]: { ...device, x, y },
      },
    };
  }
}
