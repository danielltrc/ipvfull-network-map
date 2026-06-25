import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNetworkStore } from '../../store/networkStore';
import { DeviceMarker } from './DeviceMarker';
import { LinkPolyline } from './LinkPolyline';
import { boundsFromDevices } from '../../utils/geo';

interface MapViewProps {
  width: number;
  height: number;
  tileLayerUrl: string;
  tileLayerAttribution: string;
}

function AutoFitBounds({ devices }: { devices: ReturnType<typeof Object.values> }) {
  const map = useMap();

  useEffect(() => {
    const bounds = boundsFromDevices(devices as Parameters<typeof boundsFromDevices>[0]);
    if (!bounds) {
      return;
    }
    const leafletBounds: LatLngBoundsExpression = [
      [bounds.minLat, bounds.minLng],
      [bounds.maxLat, bounds.maxLng],
    ];
    map.fitBounds(leafletBounds, { padding: [40, 40], maxZoom: 12 });
  // Only fit on initial mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export function MapView({ width, height, tileLayerUrl, tileLayerAttribution }: MapViewProps) {
  const topology = useNetworkStore((s) => s.topology);

  const geoDevices = useMemo(
    () => Object.values(topology.devices).filter((d) => d.geo),
    [topology.devices]
  );

  const geoLinks = useMemo(
    () =>
      Object.values(topology.links).filter((l) => {
        const src = topology.devices[l.sourceId];
        const tgt = topology.devices[l.targetId];
        return src?.geo && tgt?.geo;
      }),
    [topology.links, topology.devices]
  );

  const defaultCenter: [number, number] = useMemo(() => {
    if (geoDevices.length > 0) {
      const lat = geoDevices.reduce((s, d) => s + d.geo!.lat, 0) / geoDevices.length;
      const lng = geoDevices.reduce((s, d) => s + d.geo!.lng, 0) / geoDevices.length;
      return [lat, lng];
    }
    return [-15.78, -47.93]; // Brazil center (default for ISP context)
  }, [geoDevices]);

  const url =
    tileLayerUrl ||
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const attribution =
    tileLayerAttribution ||
    '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  return (
    <div style={{ width, height, position: 'relative' }}>
      <MapContainer
        center={defaultCenter}
        zoom={5}
        style={{ width, height }}
        preferCanvas
      >
        <TileLayer url={url} attribution={attribution} />

        {geoDevices.length > 0 && <AutoFitBounds devices={geoDevices} />}

        {geoLinks.map((link) => (
          <LinkPolyline key={link.id} link={link} />
        ))}

        {geoDevices.map((device) => (
          <DeviceMarker key={device.id} device={device} />
        ))}
      </MapContainer>
    </div>
  );
}
