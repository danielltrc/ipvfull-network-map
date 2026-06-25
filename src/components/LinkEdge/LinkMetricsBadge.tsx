import React from 'react';
import { NetworkLink } from '../../types';
import { formatBps, formatLatency } from '../../utils/format';
import { utilizationToColor } from '../../utils/color';

interface LinkMetricsBadgeProps {
  link: NetworkLink;
  x: number;
  y: number;
  zoom: number;
}

export const LinkMetricsBadge = React.memo(function LinkMetricsBadge({
  link,
  x,
  y,
  zoom,
}: LinkMetricsBadgeProps) {
  if (zoom < 0.3) {
    return null;
  }

  const { metrics } = link;
  const hasRxTx = metrics.rxBps !== undefined || metrics.txBps !== undefined;
  const hasLatency = metrics.latencyMs !== undefined;
  const hasLoss = metrics.lossPercent !== undefined;
  const hasUtil = metrics.utilizationPercent !== undefined;

  if (!hasRxTx && !hasLatency && !hasLoss) {
    return null;
  }

  const utilColor = utilizationToColor(metrics.utilizationPercent);
  const fontSize = Math.max(9, Math.min(12, 10 / zoom));

  return (
    <div
      style={{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
        background: 'rgba(0, 0, 0, 0.75)',
        border: `1px solid ${utilColor}`,
        borderRadius: 4,
        padding: '2px 5px',
        pointerEvents: 'none',
        fontSize,
        fontFamily: 'monospace',
        color: '#e0e0e0',
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        backdropFilter: 'blur(4px)',
        zIndex: 10,
      }}
    >
      {hasRxTx && (
        <div style={{ display: 'flex', gap: 6 }}>
          {metrics.rxBps !== undefined && (
            <span style={{ color: '#00cc88' }}>↓{formatBps(metrics.rxBps)}</span>
          )}
          {metrics.txBps !== undefined && (
            <span style={{ color: '#4488ff' }}>↑{formatBps(metrics.txBps)}</span>
          )}
        </div>
      )}
      {(hasLatency || hasLoss || hasUtil) && (
        <div style={{ display: 'flex', gap: 6, opacity: 0.85 }}>
          {hasLatency && (
            <span>{formatLatency(metrics.latencyMs!)}</span>
          )}
          {hasLoss && metrics.lossPercent! > 0 && (
            <span style={{ color: '#ff4444' }}>{metrics.lossPercent!.toFixed(1)}%loss</span>
          )}
          {hasUtil && (
            <span style={{ color: utilColor }}>{metrics.utilizationPercent!.toFixed(0)}%</span>
          )}
        </div>
      )}
    </div>
  );
});
