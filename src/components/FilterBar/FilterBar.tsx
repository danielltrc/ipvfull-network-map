import React, { useEffect, useRef } from 'react';
import { useNetworkStore } from '../../store/networkStore';
import { DeviceStatus, DeviceType } from '../../types';

const STATUS_OPTIONS: Array<{ value: DeviceStatus | ''; label: string }> = [
  { value: '', label: 'All Status' },
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
  { value: 'warning', label: 'Warning' },
  { value: 'degraded', label: 'Degraded' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'unknown', label: 'Unknown' },
];

const TYPE_OPTIONS: Array<{ value: DeviceType | ''; label: string }> = [
  { value: '', label: 'All Types' },
  { value: 'router', label: 'Router' },
  { value: 'core', label: 'Core' },
  { value: 'bng', label: 'BNG' },
  { value: 'cgnat', label: 'CGNAT' },
  { value: 'firewall', label: 'Firewall' },
  { value: 'olt', label: 'OLT' },
  { value: 'onu', label: 'ONU' },
  { value: 'switch', label: 'Switch' },
  { value: 'server', label: 'Server' },
];

export function FilterBar() {
  const filterQuery = useNetworkStore((s) => s.filterQuery);
  const filterStatus = useNetworkStore((s) => s.filterStatus);
  const filterType = useNetworkStore((s) => s.filterType);
  const setFilterQuery = useNetworkStore((s) => s.setFilterQuery);
  const setFilterStatus = useNetworkStore((s) => s.setFilterStatus);
  const setFilterType = useNetworkStore((s) => s.setFilterType);

  const inputRef = useRef<HTMLInputElement>(null);

  // Ctrl+F shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 50,
        display: 'flex',
        gap: 6,
        background: 'rgba(8, 12, 24, 0.9)',
        border: '1px solid #2a3a5a',
        borderRadius: 8,
        padding: '6px 8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(8px)',
        alignItems: 'center',
      }}
    >
      {/* Search input */}
      <input
        ref={inputRef}
        type="text"
        value={filterQuery}
        onChange={(e) => setFilterQuery(e.currentTarget.value)}
        placeholder="Search… (⌘F)"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid #2a3a5a',
          borderRadius: 4,
          color: '#e0e0e0',
          padding: '3px 8px',
          fontSize: 12,
          fontFamily: 'monospace',
          width: 180,
          outline: 'none',
        }}
      />

      {/* Status filter */}
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.currentTarget.value)}
        style={{
          background: '#0d1b33',
          border: '1px solid #2a3a5a',
          borderRadius: 4,
          color: '#e0e0e0',
          padding: '3px 6px',
          fontSize: 11,
          fontFamily: 'monospace',
          cursor: 'pointer',
        }}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {/* Type filter */}
      <select
        value={filterType}
        onChange={(e) => setFilterType(e.currentTarget.value)}
        style={{
          background: '#0d1b33',
          border: '1px solid #2a3a5a',
          borderRadius: 4,
          color: '#e0e0e0',
          padding: '3px 6px',
          fontSize: 11,
          fontFamily: 'monospace',
          cursor: 'pointer',
        }}
      >
        {TYPE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {/* Clear button */}
      {(filterQuery || filterStatus || filterType) && (
        <button
          onClick={() => {
            setFilterQuery('');
            setFilterStatus('');
            setFilterType('');
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            fontSize: 14,
            padding: '0 4px',
            lineHeight: 1,
          }}
          title="Clear filters"
        >
          ×
        </button>
      )}
    </div>
  );
}
