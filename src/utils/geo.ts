import { GeoCoordinate, NetworkDevice } from '../types';

const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: GeoCoordinate, b: GeoCoordinate): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const chord =
    sinDLat * sinDLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(chord));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function midpoint(a: GeoCoordinate, b: GeoCoordinate): GeoCoordinate {
  return {
    lat: (a.lat + b.lat) / 2,
    lng: (a.lng + b.lng) / 2,
  };
}

export function autoDistanceKm(
  source: NetworkDevice,
  target: NetworkDevice
): number | undefined {
  if (!source.geo || !target.geo) {
    return undefined;
  }
  return haversineKm(source.geo, target.geo);
}

export function boundsFromDevices(
  devices: NetworkDevice[]
): { minLat: number; maxLat: number; minLng: number; maxLng: number } | null {
  const geoDevices = devices.filter((d) => d.geo);
  if (geoDevices.length === 0) {
    return null;
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const d of geoDevices) {
    const { lat, lng } = d.geo!;
    if (lat < minLat) {
      minLat = lat;
    }
    if (lat > maxLat) {
      maxLat = lat;
    }
    if (lng < minLng) {
      minLng = lng;
    }
    if (lng > maxLng) {
      maxLng = lng;
    }
  }

  return { minLat, maxLat, minLng, maxLng };
}

export function centroid(coords: GeoCoordinate[]): GeoCoordinate | undefined {
  if (coords.length === 0) {
    return undefined;
  }
  const lat = coords.reduce((sum, c) => sum + c.lat, 0) / coords.length;
  const lng = coords.reduce((sum, c) => sum + c.lng, 0) / coords.length;
  return { lat, lng };
}

export function latLngToTile(
  lat: number,
  lng: number,
  zoom: number
): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y };
}
