import { NetworkLink, LinkType, LinkStatus, LinkMetrics, FieldMapping } from '../types';
import { utilizationToColor, linkStatusToColor } from '../utils/color';

const MIN_THICKNESS = 1;
const MAX_THICKNESS = 8;

export class Link {
  static fromFrame(row: Record<string, unknown>, mapping: FieldMapping): NetworkLink {
    const id = String(
      row['id'] ?? `${row[mapping.linkSourceField]}-${row[mapping.linkTargetField]}`
    );
    const sourceId = String(row[mapping.linkSourceField] ?? '');
    const targetId = String(row[mapping.linkTargetField] ?? '');
    const status = normalizeLinkStatus(String(row[mapping.linkStatusField] ?? 'unknown'));
    const type = (String(row['type'] ?? 'fiber').toLowerCase()) as LinkType;

    const rxBps = parseOptionalFloat(row[mapping.linkRxField]);
    const txBps = parseOptionalFloat(row[mapping.linkTxField]);
    const capacityBps = parseOptionalFloat(row[mapping.linkCapacityField]);

    const metrics: LinkMetrics = {
      rxBps,
      txBps,
      capacityBps,
      latencyMs: parseOptionalFloat(row[mapping.linkLatencyField]),
      lossPercent: parseOptionalFloat(row[mapping.linkLossField]),
    };

    if (capacityBps && capacityBps > 0 && (rxBps !== undefined || txBps !== undefined)) {
      const maxFlow = Math.max(rxBps ?? 0, txBps ?? 0);
      metrics.utilizationPercent = Math.min(100, (maxFlow / capacityBps) * 100);
    }

    return {
      id,
      sourceId,
      targetId,
      type: isValidLinkType(type) ? type : 'fiber',
      status,
      metrics,
    };
  }

  static getUtilizationColor(link: NetworkLink): string {
    if (link.status === 'down') {
      return '#111111';
    }
    return utilizationToColor(link.metrics.utilizationPercent);
  }

  static getLinkColor(link: NetworkLink): string {
    if (link.status === 'down') {
      return linkStatusToColor('down');
    }
    if (link.metrics.utilizationPercent !== undefined) {
      return utilizationToColor(link.metrics.utilizationPercent);
    }
    return linkStatusToColor(link.status);
  }

  static getThickness(link: NetworkLink): number {
    const util = link.metrics.utilizationPercent;
    if (util === undefined) {
      return 2;
    }
    const normalized = util / 100;
    return Math.max(MIN_THICKNESS, Math.round(MIN_THICKNESS + normalized * (MAX_THICKNESS - MIN_THICKNESS)));
  }

  static getParticleCount(link: NetworkLink, baseCount: number): number {
    const util = link.metrics.utilizationPercent ?? 0;
    return Math.max(1, Math.round((util / 100) * baseCount));
  }

  static getParticleSpeed(link: NetworkLink): number {
    const util = link.metrics.utilizationPercent ?? 50;
    // Congested links have slower particles (more visible congestion signal)
    return 0.003 + (1 - util / 100) * 0.007;
  }
}

function normalizeLinkStatus(raw: string): LinkStatus {
  const lower = raw.toLowerCase();
  if (lower === '1' || lower === 'up' || lower === 'online') {
    return 'up';
  }
  if (lower === '0' || lower === 'down' || lower === 'offline') {
    return 'down';
  }
  if (lower === 'degraded' || lower === 'partial') {
    return 'degraded';
  }
  return 'unknown';
}

const VALID_LINK_TYPES = new Set<string>(['fiber', 'radio', 'mpls', 'l2', 'l3', 'dwdm']);

function isValidLinkType(t: string): t is LinkType {
  return VALID_LINK_TYPES.has(t);
}

function parseOptionalFloat(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const n = parseFloat(String(value));
  return isFinite(n) ? n : undefined;
}
