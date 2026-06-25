export type DeviceType =
  | 'router'
  | 'core'
  | 'bng'
  | 'cgnat'
  | 'firewall'
  | 'olt'
  | 'onu'
  | 'switch'
  | 'server'
  | 'storage'
  | 'radio'
  | 'ap'
  | 'backbone'
  | 'pop'
  | 'ix'
  | 'datacenter'
  | 'cloud';

export type DeviceStatus = 'online' | 'offline' | 'warning' | 'degraded' | 'maintenance' | 'unknown';

export type LinkType = 'fiber' | 'radio' | 'mpls' | 'l2' | 'l3' | 'dwdm';

export type LinkStatus = 'up' | 'down' | 'degraded' | 'unknown';

export type LayoutMode = 'manual' | 'force' | 'tree' | 'hierarchical' | 'circular' | 'grid' | 'radial';

export type ViewMode = 'topology' | 'geographic' | 'hybrid';

export type ImportSource =
  | 'json'
  | 'yaml'
  | 'csv'
  | 'zabbix'
  | 'netbox'
  | 'librenms'
  | 'mikrotik'
  | 'huawei'
  | 'lldp'
  | 'snmp';

export type MergeStrategy = 'replace' | 'merge' | 'metrics_only';

export interface GeoCoordinate {
  lat: number;
  lng: number;
}

export interface InterfaceMetric {
  name: string;
  rxBps: number;
  txBps: number;
  status: 'up' | 'down';
  capacity?: number;
}

export interface DeviceMetrics {
  cpuPercent?: number;
  memoryPercent?: number;
  temperatureCelsius?: number;
  alarmCount?: number;
  uptimeSeconds?: number;
  diskPercent?: number;
  interfaces?: InterfaceMetric[];
}

export interface NetworkDevice {
  id: string;
  label: string;
  type: DeviceType;
  model?: string;
  vendor?: string;
  hostname?: string;
  serialNumber?: string;
  ip?: string;
  ipv6?: string;
  asn?: string;
  os?: string;
  osVersion?: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  geo?: GeoCoordinate;
  status: DeviceStatus;
  metrics: DeviceMetrics;
  imageUrl?: string;
  customImageUrl?: string;
  popId?: string;
  regionId?: string;
  cityId?: string;
  customerId?: string;
  groupId?: string;
  rackId?: string;
  tags?: string[];
  notes?: string;
  x?: number;
  y?: number;
  meta?: Record<string, unknown>;
}

export interface LinkMetrics {
  rxBps?: number;
  txBps?: number;
  capacityBps?: number;
  utilizationPercent?: number;
  latencyMs?: number;
  jitterMs?: number;
  lossPercent?: number;
  distanceKm?: number;
  opticalPowerDbm?: number;
}

export interface NetworkLink {
  id: string;
  sourceId: string;
  targetId: string;
  type: LinkType;
  status: LinkStatus;
  metrics: LinkMetrics;
  label?: string;
  description?: string;
  tags?: string[];
  meta?: Record<string, unknown>;
}

export interface NetworkTopology {
  devices: Record<string, NetworkDevice>;
  links: Record<string, NetworkLink>;
  version: number;
  lastUpdated: number;
}

export interface SerializedTopology {
  devices: NetworkDevice[];
  links: NetworkLink[];
  savedAt?: number;
}

export interface ClusterGroup {
  id: string;
  label: string;
  deviceIds: string[];
  geo?: GeoCoordinate;
  status: DeviceStatus;
  alarmCount: number;
  expanded: boolean;
}

export interface FieldMapping {
  deviceIdField: string;
  deviceLabelField: string;
  deviceStatusField: string;
  deviceTypeField: string;
  deviceCpuField: string;
  deviceMemoryField: string;
  deviceTempField: string;
  deviceLatField: string;
  deviceLngField: string;
  deviceAlarmCountField: string;
  linkSourceField: string;
  linkTargetField: string;
  linkRxField: string;
  linkTxField: string;
  linkCapacityField: string;
  linkLatencyField: string;
  linkLossField: string;
  linkStatusField: string;
}

export interface NetworkMapOptions {
  viewMode: ViewMode;
  layoutMode: LayoutMode;
  tileLayerUrl: string;
  tileLayerAttribution: string;
  showMiniMap: boolean;
  showFilterBar: boolean;
  showAlarmPanel: boolean;
  nocMode: boolean;
  editMode: boolean;
  particleAnimations: boolean;
  particleCount: number;
  wsUrl: string;
  fieldMapping: FieldMapping;
  topology: SerializedTopology;
}

export interface DeviceNodeData extends Record<string, unknown> {
  device: NetworkDevice;
}

export interface LinkEdgeData extends Record<string, unknown> {
  link: NetworkLink;
}

export interface Particle {
  edgeId: string;
  progress: number;
  speed: number;
  color: string;
  radius: number;
}

export interface WSDeviceUpdate {
  type: 'device';
  id: string;
  metrics: Partial<DeviceMetrics>;
  status?: DeviceStatus;
}

export interface WSLinkUpdate {
  type: 'link';
  id: string;
  metrics: Partial<LinkMetrics>;
  status?: LinkStatus;
}

export interface WSTopologyUpdate {
  type: 'topology';
  devices?: NetworkDevice[];
  links?: NetworkLink[];
}

export type WSMessage = WSDeviceUpdate | WSLinkUpdate | WSTopologyUpdate;

export interface BadgeState {
  label: string;
  value: number;
  severity: 'ok' | 'warning' | 'critical';
}

export type EditorTool = 'select' | 'addDevice' | 'addLink' | 'delete' | 'pan';
