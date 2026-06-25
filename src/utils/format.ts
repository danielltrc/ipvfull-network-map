export function formatBps(bps: number): string {
  if (bps >= 1e12) {
    return `${(bps / 1e12).toFixed(2)} Tbps`;
  }
  if (bps >= 1e9) {
    return `${(bps / 1e9).toFixed(2)} Gbps`;
  }
  if (bps >= 1e6) {
    return `${(bps / 1e6).toFixed(1)} Mbps`;
  }
  if (bps >= 1e3) {
    return `${(bps / 1e3).toFixed(0)} Kbps`;
  }
  return `${bps.toFixed(0)} bps`;
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1e12) {
    return `${(bytes / 1e12).toFixed(2)} TB`;
  }
  if (bytes >= 1e9) {
    return `${(bytes / 1e9).toFixed(2)} GB`;
  }
  if (bytes >= 1e6) {
    return `${(bytes / 1e6).toFixed(1)} MB`;
  }
  if (bytes >= 1e3) {
    return `${(bytes / 1e3).toFixed(0)} KB`;
  }
  return `${bytes.toFixed(0)} B`;
}

export function formatLatency(ms: number): string {
  if (ms < 1) {
    return `${(ms * 1000).toFixed(0)} µs`;
  }
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)} s`;
  }
  return `${ms.toFixed(1)} ms`;
}

export function formatDistance(km: number): string {
  if (km >= 1000) {
    return `${(km / 1000).toFixed(1)} Mm`;
  }
  return `${km.toFixed(1)} km`;
}

export function formatOpticalPower(dbm: number): string {
  return `${dbm.toFixed(1)} dBm`;
}

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatCapacity(bps: number): string {
  if (bps >= 1e12) {
    return `${(bps / 1e12).toFixed(0)}T`;
  }
  if (bps >= 1e9) {
    return `${(bps / 1e9).toFixed(0)}G`;
  }
  if (bps >= 1e6) {
    return `${(bps / 1e6).toFixed(0)}M`;
  }
  if (bps >= 1e3) {
    return `${(bps / 1e3).toFixed(0)}K`;
  }
  return `${bps}`;
}

export function formatTemperature(celsius: number): string {
  return `${celsius.toFixed(0)}°C`;
}
