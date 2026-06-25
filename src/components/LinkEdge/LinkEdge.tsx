import React, { useMemo } from 'react';
import {
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  useReactFlow,
  Edge,
} from '@xyflow/react';
import { LinkEdgeData } from '../../types';
import { Link } from '../../models/Link';
import { LinkMetricsBadge } from './LinkMetricsBadge';

export const LinkEdge = React.memo(function LinkEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<Edge<LinkEdgeData>>) {
  const { link } = (data ?? {}) as LinkEdgeData;
  const { getViewport } = useReactFlow();
  const viewport = getViewport();

  const [edgePath, labelX, labelY] = useMemo(
    () =>
      getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
      }),
    [sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition]
  );

  const strokeColor = Link.getLinkColor(link);
  const strokeWidth = selected
    ? Link.getThickness(link) + 2
    : Link.getThickness(link);

  const isDegraded = link.status === 'degraded';
  const isDown = link.status === 'down';

  return (
    <>
      {/* Shadow/glow path */}
      <path
        id={`${id}-shadow`}
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth + 4}
        opacity={0.15}
        style={{ pointerEvents: 'none' }}
      />

      {/* Main edge path */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={isDegraded ? '8 4' : isDown ? '4 4' : undefined}
        style={{
          animation: isDegraded ? 'ipvfull-dash-flow 1s linear infinite' : 'none',
          cursor: 'pointer',
          transition: 'stroke 0.3s ease',
        }}
      />

      {/* Selected highlight */}
      {selected && (
        <path
          d={edgePath}
          fill="none"
          stroke="#4488ff"
          strokeWidth={strokeWidth + 4}
          opacity={0.3}
          style={{ pointerEvents: 'none' }}
        />
      )}

      <EdgeLabelRenderer>
        <LinkMetricsBadge
          link={link}
          x={labelX}
          y={labelY}
          zoom={viewport.zoom}
        />
      </EdgeLabelRenderer>
    </>
  );
});
