import React, { useCallback } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { DeviceNodeData } from '../../types';
import { DeviceImage } from './DeviceImage';
import { StatusRing } from './StatusRing';
import { Device } from '../../models/Device';
import { severityToColor } from '../../utils/color';
import { formatPercent, formatTemperature } from '../../utils/format';
import { useNetworkStore } from '../../store/networkStore';

const NODE_SIZE = 56;

export const DeviceNode = React.memo(function DeviceNode({
  data,
  selected,
}: NodeProps<Node<DeviceNodeData>>) {
  const { device } = data as DeviceNodeData;
  const selectDevice = useNetworkStore((s) => s.selectDevice);
  const hoverDevice = useNetworkStore((s) => s.hoverDevice);
  const badges = Device.getBadgeThresholds(device.metrics);

  const handleClick = useCallback(() => {
    selectDevice(device.id);
  }, [device.id, selectDevice]);

  const handleMouseEnter = useCallback(() => {
    hoverDevice(device.id);
  }, [device.id, hoverDevice]);

  const handleMouseLeave = useCallback(() => {
    hoverDevice(null);
  }, [hoverDevice]);

  return (
    <div
      className="ipvfull-device-node"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        width: NODE_SIZE + 16,
        userSelect: 'none',
      }}
    >
      {/* Handles for link connections */}
      <Handle type="source" position={Position.Top} id="top" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} id="right" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Left} id="left" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Top} id="top-t" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Right} id="right-t" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Bottom} id="bottom-t" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} id="left-t" style={{ opacity: 0 }} />

      {/* Device image + status ring */}
      <div
        style={{
          position: 'relative',
          width: NODE_SIZE,
          height: NODE_SIZE,
          borderRadius: '50%',
          background: selected ? 'rgba(68, 136, 255, 0.15)' : 'rgba(0,0,0,0.4)',
          border: selected ? '2px solid #4488ff' : '2px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          boxSizing: 'border-box',
        }}
      >
        <StatusRing status={device.status} size={NODE_SIZE} />
        <DeviceImage device={device} size={NODE_SIZE - 8} />
      </div>

      {/* Device label */}
      <span
        style={{
          marginTop: 4,
          fontSize: 11,
          fontFamily: 'monospace',
          color: '#e0e0e0',
          textAlign: 'center',
          maxWidth: 90,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textShadow: '0 1px 3px rgba(0,0,0,0.8)',
          lineHeight: 1.2,
        }}
      >
        {device.label}
      </span>

      {/* Metric badges */}
      {badges.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 2,
            marginTop: 2,
            flexWrap: 'wrap',
            justifyContent: 'center',
            maxWidth: 90,
          }}
        >
          {badges.map((badge) => (
            <span
              key={badge.label}
              style={{
                fontSize: 9,
                fontFamily: 'monospace',
                background: severityToColor(badge.severity),
                color: '#000',
                borderRadius: 3,
                padding: '0 3px',
                fontWeight: 'bold',
                lineHeight: '14px',
              }}
            >
              {badge.label === 'TEMP'
                ? formatTemperature(badge.value)
                : badge.label === 'ALM'
                ? `${badge.value}⚠`
                : formatPercent(badge.value, 0)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});
