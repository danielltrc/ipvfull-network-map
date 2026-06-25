import { PanelPlugin } from '@grafana/data';
import { NetworkMapOptions, FieldMapping } from './types';
import { NetworkMapPanel } from './components/NetworkMap/NetworkMapPanel';
import { fixLeafletDefaultIcon } from './utils/leafletIconFix';

fixLeafletDefaultIcon();

const DEFAULT_FIELD_MAPPING: FieldMapping = {
  deviceIdField: 'id',
  deviceLabelField: 'name',
  deviceStatusField: 'status',
  deviceTypeField: 'type',
  deviceCpuField: 'cpu',
  deviceMemoryField: 'memory',
  deviceTempField: 'temperature',
  deviceLatField: 'lat',
  deviceLngField: 'lng',
  deviceAlarmCountField: 'alarms',
  linkSourceField: 'source',
  linkTargetField: 'target',
  linkRxField: 'rx_bps',
  linkTxField: 'tx_bps',
  linkCapacityField: 'capacity_bps',
  linkLatencyField: 'latency_ms',
  linkLossField: 'loss_pct',
  linkStatusField: 'link_status',
};

export const plugin = new PanelPlugin<NetworkMapOptions>(NetworkMapPanel).setPanelOptions(
  (builder) => {
    return builder
      .addRadio({
        path: 'viewMode',
        name: 'Default View',
        defaultValue: 'topology',
        settings: {
          options: [
            { value: 'topology', label: 'Topology' },
            { value: 'geographic', label: 'Geographic' },
            { value: 'hybrid', label: 'Hybrid' },
          ],
        },
        category: ['Display'],
      })
      .addBooleanSwitch({
        path: 'particleAnimations',
        name: 'Particle Animations',
        defaultValue: true,
        category: ['Display'],
      })
      .addNumberInput({
        path: 'particleCount',
        name: 'Particles per Link',
        defaultValue: 6,
        settings: { min: 1, max: 20, integer: true },
        showIf: (opts) => opts.particleAnimations === true,
        category: ['Display'],
      })
      .addBooleanSwitch({
        path: 'showMiniMap',
        name: 'Show MiniMap',
        defaultValue: true,
        category: ['Display'],
      })
      .addBooleanSwitch({
        path: 'showFilterBar',
        name: 'Show Filter Bar',
        defaultValue: true,
        category: ['Display'],
      })
      .addBooleanSwitch({
        path: 'showAlarmPanel',
        name: 'Show Alarm Panel',
        defaultValue: true,
        category: ['Display'],
      })
      .addBooleanSwitch({
        path: 'nocMode',
        name: 'NOC Mode (Videowall)',
        defaultValue: false,
        category: ['Display'],
      })
      .addBooleanSwitch({
        path: 'editMode',
        name: 'Edit Mode',
        defaultValue: false,
        category: ['Display'],
      })
      .addTextInput({
        path: 'wsUrl',
        name: 'WebSocket URL',
        description: 'ws:// or wss:// URL for real-time updates. Leave empty to use Grafana polling.',
        defaultValue: '',
        category: ['Data'],
      })
      .addTextInput({
        path: 'tileLayerUrl',
        name: 'Tile Layer URL',
        description:
          'Map tile URL template. Example: https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        defaultValue: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        category: ['Map'],
      })
      .addTextInput({
        path: 'tileLayerAttribution',
        name: 'Tile Attribution',
        defaultValue:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        category: ['Map'],
      })
      .addTextInput({
        path: 'fieldMapping.deviceIdField',
        name: 'Device ID Field',
        defaultValue: DEFAULT_FIELD_MAPPING.deviceIdField,
        category: ['Field Mapping – Devices'],
      })
      .addTextInput({
        path: 'fieldMapping.deviceLabelField',
        name: 'Device Label Field',
        defaultValue: DEFAULT_FIELD_MAPPING.deviceLabelField,
        category: ['Field Mapping – Devices'],
      })
      .addTextInput({
        path: 'fieldMapping.deviceStatusField',
        name: 'Device Status Field',
        defaultValue: DEFAULT_FIELD_MAPPING.deviceStatusField,
        category: ['Field Mapping – Devices'],
      })
      .addTextInput({
        path: 'fieldMapping.deviceTypeField',
        name: 'Device Type Field',
        defaultValue: DEFAULT_FIELD_MAPPING.deviceTypeField,
        category: ['Field Mapping – Devices'],
      })
      .addTextInput({
        path: 'fieldMapping.deviceCpuField',
        name: 'CPU % Field',
        defaultValue: DEFAULT_FIELD_MAPPING.deviceCpuField,
        category: ['Field Mapping – Devices'],
      })
      .addTextInput({
        path: 'fieldMapping.deviceMemoryField',
        name: 'Memory % Field',
        defaultValue: DEFAULT_FIELD_MAPPING.deviceMemoryField,
        category: ['Field Mapping – Devices'],
      })
      .addTextInput({
        path: 'fieldMapping.deviceTempField',
        name: 'Temperature Field',
        defaultValue: DEFAULT_FIELD_MAPPING.deviceTempField,
        category: ['Field Mapping – Devices'],
      })
      .addTextInput({
        path: 'fieldMapping.deviceLatField',
        name: 'Latitude Field',
        defaultValue: DEFAULT_FIELD_MAPPING.deviceLatField,
        category: ['Field Mapping – Devices'],
      })
      .addTextInput({
        path: 'fieldMapping.deviceLngField',
        name: 'Longitude Field',
        defaultValue: DEFAULT_FIELD_MAPPING.deviceLngField,
        category: ['Field Mapping – Devices'],
      })
      .addTextInput({
        path: 'fieldMapping.linkSourceField',
        name: 'Link Source Field',
        defaultValue: DEFAULT_FIELD_MAPPING.linkSourceField,
        category: ['Field Mapping – Links'],
      })
      .addTextInput({
        path: 'fieldMapping.linkTargetField',
        name: 'Link Target Field',
        defaultValue: DEFAULT_FIELD_MAPPING.linkTargetField,
        category: ['Field Mapping – Links'],
      })
      .addTextInput({
        path: 'fieldMapping.linkRxField',
        name: 'Link RX bps Field',
        defaultValue: DEFAULT_FIELD_MAPPING.linkRxField,
        category: ['Field Mapping – Links'],
      })
      .addTextInput({
        path: 'fieldMapping.linkTxField',
        name: 'Link TX bps Field',
        defaultValue: DEFAULT_FIELD_MAPPING.linkTxField,
        category: ['Field Mapping – Links'],
      })
      .addTextInput({
        path: 'fieldMapping.linkCapacityField',
        name: 'Link Capacity bps Field',
        defaultValue: DEFAULT_FIELD_MAPPING.linkCapacityField,
        category: ['Field Mapping – Links'],
      })
      .addTextInput({
        path: 'fieldMapping.linkLatencyField',
        name: 'Latency ms Field',
        defaultValue: DEFAULT_FIELD_MAPPING.linkLatencyField,
        category: ['Field Mapping – Links'],
      })
      .addTextInput({
        path: 'fieldMapping.linkLossField',
        name: 'Loss % Field',
        defaultValue: DEFAULT_FIELD_MAPPING.linkLossField,
        category: ['Field Mapping – Links'],
      });
  }
);
