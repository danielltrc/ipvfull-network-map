import React, { useMemo } from 'react';
import { useNetworkStore } from '../../store/networkStore';
import { AlarmProcessor } from '../../services/AlarmProcessor';

const SEVERITY_COLOR = {
  critical: '#ff4444',
  high: '#ff8800',
  medium: '#ffcc00',
  low: '#4488ff',
};

export function AlarmPanel() {
  const topology = useNetworkStore((s) => s.topology);
  const selectDevice = useNetworkStore((s) => s.selectDevice);
  const alarms = useMemo(() => AlarmProcessor.getActiveAlarms(topology), [topology]);

  if (alarms.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 48,
        left: 12,
        zIndex: 50,
        width: 240,
        maxHeight: 300,
        overflowY: 'auto',
        background: 'rgba(8, 12, 24, 0.95)',
        border: '1px solid #2a1a1a',
        borderRadius: 8,
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(8px)',
        fontFamily: 'monospace',
        fontSize: 11,
      }}
    >
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid #1a1a1a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: 'rgba(8, 12, 24, 0.98)',
        }}
      >
        <span style={{ color: '#ff4444', fontWeight: 'bold', letterSpacing: 1 }}>
          ALARMS
        </span>
        <span style={{ color: '#ff4444' }}>{alarms.length}</span>
      </div>

      {alarms.map((alarm) => (
        <div
          key={alarm.deviceId}
          onClick={() => selectDevice(alarm.deviceId)}
          style={{
            padding: '6px 12px',
            borderBottom: '1px solid #111',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'background 0.15s ease',
          }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,68,68,0.08)';
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLDivElement).style.background = 'transparent';
          }}
        >
          <div>
            <div
              style={{
                color: SEVERITY_COLOR[alarm.severity],
                fontSize: 11,
                fontWeight: 'bold',
              }}
            >
              {alarm.deviceLabel}
            </div>
            <div style={{ color: '#666', fontSize: 10, marginTop: 1 }}>{alarm.type}</div>
          </div>
          <div
            style={{
              background: SEVERITY_COLOR[alarm.severity] + '22',
              border: `1px solid ${SEVERITY_COLOR[alarm.severity]}66`,
              borderRadius: 3,
              color: SEVERITY_COLOR[alarm.severity],
              padding: '1px 5px',
              fontSize: 10,
            }}
          >
            {alarm.count}
          </div>
        </div>
      ))}
    </div>
  );
}
