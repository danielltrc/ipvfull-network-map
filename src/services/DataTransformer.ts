import { PanelData, DataFrame, Field, getFieldDisplayName } from '@grafana/data';
import { NetworkTopology, NetworkDevice, NetworkLink, NetworkMapOptions } from '../types';
import { TopologyBuilder } from '../models/NetworkTopology';
import { Device } from '../models/Device';
import { Link } from '../models/Link';
import { autoDistanceKm } from '../utils/geo';

export class DataTransformer {
  static transform(data: PanelData, options: NetworkMapOptions): NetworkTopology {
    const { fieldMapping } = options;
    const devices: Record<string, NetworkDevice> = {};
    const links: Record<string, NetworkLink> = {};

    for (const frame of data.series) {
      const fields = frame.fields;
      const fieldMap = buildFieldMap(fields);

      const isLinkFrame =
        hasField(fieldMap, fieldMapping.linkSourceField) &&
        hasField(fieldMap, fieldMapping.linkTargetField);

      const isDeviceFrame =
        hasField(fieldMap, fieldMapping.deviceIdField) ||
        hasField(fieldMap, fieldMapping.deviceLabelField);

      const rowCount = frame.length;

      for (let i = 0; i < rowCount; i++) {
        const row = extractRow(frame, fieldMap, i);

        if (isLinkFrame) {
          try {
            const link = Link.fromFrame(row, fieldMapping);
            if (link.sourceId && link.targetId) {
              links[link.id] = link;
            }
          } catch {
            // malformed row — skip
          }
        } else if (isDeviceFrame) {
          try {
            const device = Device.fromFrame(row, fieldMapping);
            if (device.id) {
              devices[device.id] = device;
            }
          } catch {
            // malformed row — skip
          }
        }
      }
    }

    // Auto-compute link distances from device geo coords
    for (const link of Object.values(links)) {
      if (link.metrics.distanceKm === undefined) {
        const source = devices[link.sourceId];
        const target = devices[link.targetId];
        if (source && target) {
          const dist = autoDistanceKm(source, target);
          if (dist !== undefined) {
            link.metrics.distanceKm = dist;
          }
        }
      }
    }

    return {
      devices,
      links,
      version: 0,
      lastUpdated: Date.now(),
    };
  }

  static mergeWithExisting(
    existing: NetworkTopology,
    fresh: NetworkTopology
  ): NetworkTopology {
    return TopologyBuilder.merge(existing, fresh);
  }
}

function buildFieldMap(fields: Field[]): Map<string, Field> {
  const map = new Map<string, Field>();
  for (const field of fields) {
    map.set(field.name, field);
    const displayName = getFieldDisplayName(field);
    if (displayName !== field.name) {
      map.set(displayName, field);
    }
  }
  return map;
}

function hasField(map: Map<string, Field>, name: string): boolean {
  return map.has(name) && name.trim() !== '';
}

function extractRow(
  frame: DataFrame,
  fieldMap: Map<string, Field>,
  index: number
): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [name, field] of fieldMap.entries()) {
    row[name] = field.values[index];
  }
  return row;
}
