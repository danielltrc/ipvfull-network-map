import React, { useEffect, useRef } from 'react';
import { useNetworkStore } from '../../store/networkStore';
import { AlarmProcessor } from '../../services/AlarmProcessor';
import { TopologyView } from '../NetworkMap/TopologyView';
import { AlarmTicker } from './AlarmTicker';

interface NOCModeProps {
  width: number;
  height: number;
}

export function NOCMode({ width, height }: NOCModeProps) {
  const topology = useNetworkStore((s) => s.topology);
  const selectDevice = useNetworkStore((s) => s.selectDevice);
  const cycleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const alarms = AlarmProcessor.getActiveAlarms(topology);
  const criticalDevices = alarms.filter((a) => a.severity === 'critical');

  // Auto-cycle focus to alarm devices every 30s
  useEffect(() => {
    if (criticalDevices.length === 0) {
      return;
    }

    let index = 0;
    const cycle = () => {
      if (criticalDevices.length > 0) {
        selectDevice(criticalDevices[index % criticalDevices.length].deviceId);
        index++;
      }
      cycleTimer.current = setTimeout(cycle, 30000);
    };

    cycleTimer.current = setTimeout(cycle, 5000);

    return () => {
      if (cycleTimer.current) {
        clearTimeout(cycleTimer.current);
      }
    };
  }, [criticalDevices.length, selectDevice]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: '#050810',
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header strip */}
      <div
        style={{
          height: 48,
          background: 'rgba(0, 0, 0, 0.8)',
          borderBottom: '1px solid #1a2744',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#00cc88',
              boxShadow: '0 0 8px #00cc88',
              display: 'inline-block',
            }}
          />
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: 14,
              fontWeight: 'bold',
              color: '#e0e0e0',
              letterSpacing: 2,
            }}
          >
            IPvFull NOC · NETWORK OPERATIONS CENTER
          </span>
        </div>

        <div style={{ display: 'flex', gap: 24, fontFamily: 'monospace', fontSize: 12 }}>
          <MetricChip
            label="Devices"
            value={Object.keys(topology.devices).length}
            color="#4488ff"
          />
          <MetricChip
            label="Links"
            value={Object.keys(topology.links).length}
            color="#00cc88"
          />
          <MetricChip
            label="Alarms"
            value={alarms.length}
            color={alarms.length > 0 ? '#ff4444' : '#00cc88'}
          />
          <div style={{ color: '#888', fontSize: 11, alignSelf: 'center' }}>
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Topology fills remaining space (minus ticker) */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <TopologyView
          width={width}
          height={height - 48 - 32}
          particleAnimations
          particleCount={8}
          editMode={false}
        />
      </div>

      {/* Alarm ticker at bottom */}
      <AlarmTicker />
    </div>
  );
}

function MetricChip({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ color, fontSize: 18, fontWeight: 'bold', lineHeight: 1 }}>{value}</div>
      <div style={{ color: '#666', fontSize: 9, letterSpacing: 1 }}>{label}</div>
    </div>
  );
}
