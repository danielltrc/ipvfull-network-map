import Papa from 'papaparse';
import yaml from 'js-yaml';
import {
  SerializedTopology,
  NetworkDevice,
  NetworkLink,
  ImportSource,
  MergeStrategy,
  DeviceType,
  LinkType,
} from '../types';

export class ImportService {
  static async importFromFile(
    file: File,
    source: ImportSource
  ): Promise<SerializedTopology> {
    const text = await file.text();

    switch (source) {
      case 'json':
        return this.parseJSON(text);
      case 'yaml':
        return this.parseYAML(text);
      case 'csv':
        return this.parseCSV(text);
      default:
        throw new Error(`File import not supported for source: ${source}`);
    }
  }

  static async importFromUrl(
    url: string,
    source: ImportSource,
    apiKey?: string
  ): Promise<SerializedTopology> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    switch (source) {
      case 'zabbix':
        return this.importFromZabbix(url, apiKey);
      case 'netbox':
        return this.importFromNetBox(url, apiKey);
      case 'librenms':
        return this.importFromLibreNMS(url, apiKey);
      default: {
        const resp = await fetch(url, { headers });
        const text = await resp.text();
        return this.parseJSON(text);
      }
    }
  }

  static parseJSON(data: string): SerializedTopology {
    const parsed = JSON.parse(data);

    // Support our own SerializedTopology format
    if (Array.isArray(parsed.devices) || Array.isArray(parsed.links)) {
      return {
        devices: (parsed.devices ?? []).map(normalizeDevice),
        links: (parsed.links ?? []).map(normalizeLink),
      };
    }

    // Support flat array of devices
    if (Array.isArray(parsed)) {
      const devices = parsed.filter((item) => item.id && !item.sourceId).map(normalizeDevice);
      const links = parsed.filter((item) => item.sourceId && item.targetId).map(normalizeLink);
      return { devices, links };
    }

    throw new Error('Unrecognized JSON topology format');
  }

  static parseYAML(data: string): SerializedTopology {
    const parsed = yaml.load(data) as Record<string, unknown>;
    return this.parseJSON(JSON.stringify(parsed));
  }

  static parseCSV(data: string): SerializedTopology {
    const result = Papa.parse<Record<string, string>>(data, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
    });

    const rows = result.data;
    const devices: NetworkDevice[] = [];
    const links: NetworkLink[] = [];

    for (const row of rows) {
      if (row.sourceid || row.source_id || row.source) {
        // Link row
        const sourceId = row.sourceid ?? row.source_id ?? row.source;
        const targetId = row.targetid ?? row.target_id ?? row.target;
        if (sourceId && targetId) {
          links.push({
            id: row.id ?? `link-${sourceId}-${targetId}`,
            sourceId,
            targetId,
            type: ((row.type ?? 'fiber').toLowerCase()) as LinkType,
            status: 'unknown',
            metrics: {
              capacityBps: parseOptionalFloat(row.capacity),
            },
            label: row.label || undefined,
          });
        }
      } else if (row.id || row.label) {
        // Device row
        const lat = parseOptionalFloat(row.lat ?? row.latitude);
        const lng = parseOptionalFloat(row.lng ?? row.longitude);
        devices.push({
          id: row.id ?? `dev-${Date.now()}-${Math.random()}`,
          label: row.label ?? row.name ?? row.id,
          type: ((row.type ?? 'router').toLowerCase()) as DeviceType,
          status: 'unknown',
          metrics: {},
          model: row.model || undefined,
          vendor: row.vendor || undefined,
          ip: row.ip || undefined,
          geo: lat !== undefined && lng !== undefined ? { lat, lng } : undefined,
        });
      }
    }

    return { devices, links };
  }

  private static async importFromZabbix(
    apiUrl: string,
    apiKey?: string
  ): Promise<SerializedTopology> {
    // Zabbix 6.0+ JSON-RPC 2.0 API
    const auth = apiKey ?? null;

    const call = async (method: string, params: unknown) => {
      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method,
          params,
          auth,
          id: 1,
        }),
      });
      const json = await resp.json();
      if (json.error) {
        throw new Error(`Zabbix API error: ${json.error.data}`);
      }
      return json.result;
    };

    const hosts = await call('host.get', {
      output: ['hostid', 'host', 'name', 'status'],
      selectInterfaces: ['ip', 'main'],
      selectInventory: ['vendor', 'model', 'serialno_a', 'os'],
      selectGroups: ['groupid', 'name'],
    });

    const devices: NetworkDevice[] = hosts.map((host: Record<string, unknown>) => {
      const ifaces = (host.interfaces as Array<Record<string, string>>) ?? [];
      const mainIface = ifaces.find((i) => i.main === '1') ?? ifaces[0];
      const inv = (host.inventory as Record<string, string>) ?? {};

      return {
        id: String(host.hostid),
        label: String(host.name ?? host.host),
        hostname: String(host.host),
        type: 'router' as DeviceType,
        status: host.status === '0' ? 'online' : 'offline',
        metrics: {},
        ip: mainIface?.ip,
        vendor: inv.vendor || undefined,
        model: inv.model || undefined,
        serialNumber: inv.serialno_a || undefined,
        os: inv.os || undefined,
      } as NetworkDevice;
    });

    return { devices, links: [] };
  }

  private static async importFromNetBox(
    apiUrl: string,
    apiKey?: string
  ): Promise<SerializedTopology> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Token ${apiKey}`;
    }

    const baseUrl = apiUrl.replace(/\/$/, '');

    const [devResp, cableResp] = await Promise.all([
      fetch(`${baseUrl}/api/dcim/devices/?limit=1000`, { headers }),
      fetch(`${baseUrl}/api/dcim/cables/?limit=1000`, { headers }),
    ]);

    const devData = await devResp.json();
    const cableData = await cableResp.json();

    const devices: NetworkDevice[] = (devData.results ?? []).map(
      (dev: Record<string, unknown>) => {
        const prim = dev.primary_ip as Record<string, string> | null;
        const site = dev.site as Record<string, string> | null;

        return {
          id: String(dev.id),
          label: String(dev.name ?? dev.id),
          type: 'router' as DeviceType,
          status: dev.status === 'active' ? 'online' : 'unknown',
          metrics: {},
          ip: prim?.address?.split('/')[0],
          location: site?.name,
        } as NetworkDevice;
      }
    );

    const links: NetworkLink[] = (cableData.results ?? [])
      .map((cable: Record<string, unknown>) => {
        const aTerminations = (cable.a_terminations as Array<Record<string, unknown>>) ?? [];
        const bTerminations = (cable.b_terminations as Array<Record<string, unknown>>) ?? [];

        const aDevice = aTerminations[0]?.object as Record<string, unknown> | undefined;
        const bDevice = bTerminations[0]?.object as Record<string, unknown> | undefined;

        const aDevObj = aDevice?.device as Record<string, unknown> | undefined;
        const bDevObj = bDevice?.device as Record<string, unknown> | undefined;
        const sourceId = String(aDevObj?.id ?? '');
        const targetId = String(bDevObj?.id ?? '');

        if (!sourceId || !targetId) {
          return null;
        }

        return {
          id: String(cable.id),
          sourceId,
          targetId,
          type: 'fiber' as LinkType,
          status: cable.status === 'connected' ? 'up' : 'unknown',
          metrics: {},
        } as NetworkLink;
      })
      .filter(Boolean) as NetworkLink[];

    return { devices, links };
  }

  private static async importFromLibreNMS(
    apiUrl: string,
    apiKey?: string
  ): Promise<SerializedTopology> {
    const headers: Record<string, string> = {
      'X-Auth-Token': apiKey ?? '',
      'Content-Type': 'application/json',
    };
    const baseUrl = apiUrl.replace(/\/$/, '');

    const resp = await fetch(`${baseUrl}/api/v0/devices`, { headers });
    const data = await resp.json();

    const devices: NetworkDevice[] = (data.devices ?? []).map(
      (dev: Record<string, unknown>) => ({
        id: String(dev.device_id),
        label: String(dev.sysName ?? dev.hostname ?? dev.device_id),
        hostname: String(dev.hostname ?? ''),
        type: 'router' as DeviceType,
        status: dev.status === 1 ? 'online' : 'offline',
        metrics: {
          uptimeSeconds: typeof dev.uptime === 'number' ? dev.uptime : undefined,
        },
        ip: String(dev.ip ?? dev.hostname ?? ''),
        os: String(dev.os ?? ''),
        location: String(dev.location ?? ''),
      } as NetworkDevice)
    );

    return { devices, links: [] };
  }

  static merge(
    existing: SerializedTopology,
    incoming: SerializedTopology,
    strategy: MergeStrategy
  ): SerializedTopology {
    if (strategy === 'replace') {
      return incoming;
    }

    if (strategy === 'metrics_only') {
      const existingDevMap = new Map(existing.devices.map((d) => [d.id, d]));
      const existingLinkMap = new Map(existing.links.map((l) => [l.id, l]));

      for (const d of incoming.devices) {
        const existing = existingDevMap.get(d.id);
        if (existing) {
          existingDevMap.set(d.id, { ...existing, metrics: d.metrics, status: d.status });
        }
      }
      for (const l of incoming.links) {
        const existingLink = existingLinkMap.get(l.id);
        if (existingLink) {
          existingLinkMap.set(l.id, { ...existingLink, metrics: l.metrics, status: l.status });
        }
      }

      return {
        devices: Array.from(existingDevMap.values()),
        links: Array.from(existingLinkMap.values()),
      };
    }

    // merge: add new, keep existing positions
    const deviceMap = new Map(existing.devices.map((d) => [d.id, d]));
    for (const d of incoming.devices) {
      const ex = deviceMap.get(d.id);
      deviceMap.set(d.id, ex ? { ...ex, ...d, x: ex.x, y: ex.y } : d);
    }

    const linkMap = new Map(existing.links.map((l) => [l.id, l]));
    for (const l of incoming.links) {
      linkMap.set(l.id, l);
    }

    return {
      devices: Array.from(deviceMap.values()),
      links: Array.from(linkMap.values()),
    };
  }
}

function normalizeDevice(raw: Record<string, unknown>): NetworkDevice {
  const lat = parseOptionalFloat(raw.lat ?? raw.latitude);
  const lng = parseOptionalFloat(raw.lng ?? raw.longitude);

  return {
    id: String(raw.id ?? `dev-${Math.random()}`),
    label: String(raw.label ?? raw.name ?? raw.id ?? 'Unknown'),
    type: ((String(raw.type ?? 'router')).toLowerCase()) as DeviceType,
    status: (raw.status as NetworkDevice['status']) ?? 'unknown',
    metrics: (raw.metrics as NetworkDevice['metrics']) ?? {},
    model: raw.model ? String(raw.model) : undefined,
    vendor: raw.vendor ? String(raw.vendor) : undefined,
    ip: raw.ip ? String(raw.ip) : undefined,
    hostname: raw.hostname ? String(raw.hostname) : undefined,
    geo: lat !== undefined && lng !== undefined ? { lat, lng } : undefined,
    x: parseOptionalFloat(raw.x),
    y: parseOptionalFloat(raw.y),
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : undefined,
    notes: raw.notes ? String(raw.notes) : undefined,
  };
}

function normalizeLink(raw: Record<string, unknown>): NetworkLink {
  return {
    id: String(raw.id ?? `link-${Math.random()}`),
    sourceId: String(raw.sourceId ?? raw.source ?? ''),
    targetId: String(raw.targetId ?? raw.target ?? ''),
    type: ((String(raw.type ?? 'fiber')).toLowerCase()) as LinkType,
    status: (raw.status as NetworkLink['status']) ?? 'unknown',
    metrics: (raw.metrics as NetworkLink['metrics']) ?? {},
    label: raw.label ? String(raw.label) : undefined,
  };
}

function parseOptionalFloat(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const n = parseFloat(String(value));
  return isFinite(n) ? n : undefined;
}
