import { useEffect, useRef } from 'react';
import { PanelData, LoadingState } from '@grafana/data';
import { NetworkMapOptions } from '../types';
import { DataTransformer } from '../services/DataTransformer';
import { useNetworkStore } from '../store/networkStore';
import { TopologyBuilder } from '../models/NetworkTopology';

export function useNetworkData(data: PanelData, options: NetworkMapOptions): void {
  const setTopology = useNetworkStore((s) => s.setTopology);
  const currentTopology = useNetworkStore((s) => s.topology);
  const hasInitializedFromOptions = useRef(false);

  // On first mount, load the persisted topology from panel options
  useEffect(() => {
    if (!hasInitializedFromOptions.current && options.topology?.devices?.length) {
      const persisted = TopologyBuilder.fromSerialized(options.topology);
      setTopology(persisted);
      hasInitializedFromOptions.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On data refresh, transform and merge incoming metrics
  useEffect(() => {
    if (data.state !== LoadingState.Done || !data.series?.length) {
      return;
    }

    const hasMeaningfulFields =
      options.fieldMapping.deviceIdField.trim() !== '' ||
      options.fieldMapping.deviceLabelField.trim() !== '' ||
      options.fieldMapping.linkSourceField.trim() !== '';

    if (!hasMeaningfulFields) {
      return;
    }

    const fresh = DataTransformer.transform(data, options);

    if (
      Object.keys(fresh.devices).length === 0 &&
      Object.keys(fresh.links).length === 0
    ) {
      return;
    }

    const merged = DataTransformer.mergeWithExisting(currentTopology, fresh);
    setTopology(merged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.series, data.state]);
}
