import React, { useMemo } from 'react';
import { useNetworkStore } from '../../store/networkStore';
import { AlarmProcessor } from '../../services/AlarmProcessor';


export function AlarmTicker() {
  const topology = useNetworkStore((s) => s.topology);
  const alarms = useMemo(() => AlarmProcessor.getActiveAlarms(topology), [topology]);

  if (alarms.length === 0) {
    return null;
  }

  const tickerContent = alarms
    .map(
      (a) =>
        `⚠ ${a.deviceLabel} — ${a.type} (${a.count}) · ${a.ip ?? ''}`
    )
    .join('     ·····     ');

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 32,
        background: 'rgba(20, 0, 0, 0.9)',
        borderTop: '1px solid #ff444444',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        zIndex: 200,
      }}
    >
      {/* Critical label */}
      <div
        style={{
          flexShrink: 0,
          padding: '0 12px',
          background: '#ff4444',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          fontFamily: 'monospace',
          fontSize: 11,
          fontWeight: 'bold',
          color: '#fff',
          letterSpacing: 1,
        }}
      >
        ALARMS
      </div>

      {/* Scrolling ticker */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          className="ipvfull-ticker-scroll"
          style={{
            whiteSpace: 'nowrap',
            fontFamily: 'monospace',
            fontSize: 12,
            color: '#ff8888',
            paddingLeft: '100%',
          }}
        >
          {tickerContent}
        </div>
      </div>

      {/* Alarm count badge */}
      <div
        style={{
          flexShrink: 0,
          padding: '0 12px',
          fontFamily: 'monospace',
          fontSize: 12,
          color: '#ff4444',
          fontWeight: 'bold',
        }}
      >
        {alarms.length} active
      </div>
    </div>
  );
}
