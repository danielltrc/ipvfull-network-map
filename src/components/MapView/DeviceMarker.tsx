import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { NetworkDevice } from '../../types';
import { statusToColor } from '../../utils/color';
import { ImageProvider } from '../../services/ImageProvider';
import { useNetworkStore } from '../../store/networkStore';

interface DeviceMarkerProps {
  device: NetworkDevice;
}

function createDeviceIcon(device: NetworkDevice): L.DivIcon {
  const color = statusToColor(device.status);
  const iconUrl = ImageProvider.getFallbackUrl(device.type);

  return L.divIcon({
    html: `
      <div style="
        position: relative;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(8,12,24,0.9);
        border: 2px solid ${color};
        box-shadow: 0 0 8px ${color}88, 0 2px 6px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      ">
        <img src="${iconUrl}" width="24" height="24" style="border-radius:50%;object-fit:contain;" />
        <div style="
          position: absolute;
          bottom: -18px;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          font-size: 10px;
          font-family: monospace;
          color: #e0e0e0;
          text-shadow: 0 1px 2px rgba(0,0,0,0.9);
          pointer-events: none;
        ">${device.label}</div>
        ${
          device.metrics.alarmCount && device.metrics.alarmCount > 0
            ? `<div style="
                position: absolute;
                top: -4px;
                right: -4px;
                width: 14px;
                height: 14px;
                border-radius: 50%;
                background: #ff4444;
                color: white;
                font-size: 8px;
                font-family: monospace;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
              ">${Math.min(99, device.metrics.alarmCount)}</div>`
            : ''
        }
      </div>
    `,
    className: 'ipvfull-map-marker',
    iconSize: [36, 54],
    iconAnchor: [18, 18],
    popupAnchor: [0, -22],
  });
}

export function DeviceMarker({ device }: DeviceMarkerProps) {
  const selectDevice = useNetworkStore((s) => s.selectDevice);

  if (!device.geo) {
    return null;
  }

  const icon = createDeviceIcon(device);
  const color = statusToColor(device.status);

  return (
    <Marker
      position={[device.geo.lat, device.geo.lng]}
      icon={icon}
      eventHandlers={{
        click: () => selectDevice(device.id),
      }}
    >
      <Popup>
        <div style={{ fontFamily: 'monospace', fontSize: 12, minWidth: 160 }}>
          <div style={{ fontWeight: 'bold', color, marginBottom: 4 }}>{device.label}</div>
          {device.model && <div style={{ color: '#666' }}>{device.model}</div>}
          {device.ip && <div style={{ color: '#888', fontSize: 11 }}>IP: {device.ip}</div>}
          <div style={{ marginTop: 4, color }}>● {device.status.toUpperCase()}</div>
        </div>
      </Popup>
    </Marker>
  );
}
