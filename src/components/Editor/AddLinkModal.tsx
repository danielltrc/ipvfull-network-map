import React, { useState, useMemo } from 'react';
import { Modal, Button, Input, Select, Field } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { LinkType } from '../../types';
import { useNetworkStore } from '../../store/networkStore';

const LINK_TYPE_OPTIONS: Array<SelectableValue<LinkType>> = [
  { value: 'fiber', label: 'Fiber' },
  { value: 'radio', label: 'Radio' },
  { value: 'mpls', label: 'MPLS' },
  { value: 'l2', label: 'L2' },
  { value: 'l3', label: 'L3' },
  { value: 'dwdm', label: 'DWDM' },
];

const CAPACITY_OPTIONS: Array<SelectableValue<number>> = [
  { value: 100e6, label: '100 Mbps' },
  { value: 1e9, label: '1 Gbps' },
  { value: 10e9, label: '10 Gbps' },
  { value: 40e9, label: '40 Gbps' },
  { value: 100e9, label: '100 Gbps' },
  { value: 400e9, label: '400 Gbps' },
];

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (sourceId: string, targetId: string, type: LinkType, capacity?: number, label?: string) => void;
  preselectedSourceId?: string;
  preselectedTargetId?: string;
}

export function AddLinkModal({
  isOpen,
  onClose,
  onConfirm,
  preselectedSourceId,
  preselectedTargetId,
}: AddLinkModalProps) {
  const topology = useNetworkStore((s) => s.topology);
  const [sourceId, setSourceId] = useState(preselectedSourceId ?? '');
  const [targetId, setTargetId] = useState(preselectedTargetId ?? '');
  const [type, setType] = useState<LinkType>('fiber');
  const [capacity, setCapacity] = useState<number | undefined>(1e9);
  const [label, setLabel] = useState('');

  const deviceOptions = useMemo<Array<SelectableValue<string>>>(
    () =>
      Object.values(topology.devices).map((d) => ({
        value: d.id,
        label: d.label,
        description: d.ip,
      })),
    [topology.devices]
  );

  const handleConfirm = () => {
    if (!sourceId || !targetId || sourceId === targetId) {
      return;
    }
    onConfirm(sourceId, targetId, type, capacity, label || undefined);
    onClose();
    setSourceId('');
    setTargetId('');
    setLabel('');
  };

  return (
    <Modal title="Add Link" isOpen={isOpen} onDismiss={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="Source Device" required>
          <Select
            options={deviceOptions}
            value={sourceId}
            onChange={(v) => v.value && setSourceId(v.value)}
            placeholder="Select source device..."
          />
        </Field>

        <Field label="Target Device" required>
          <Select
            options={deviceOptions}
            value={targetId}
            onChange={(v) => v.value && setTargetId(v.value)}
            placeholder="Select target device..."
          />
        </Field>

        <Field label="Link Type" required>
          <Select
            options={LINK_TYPE_OPTIONS}
            value={type}
            onChange={(v) => v.value && setType(v.value)}
          />
        </Field>

        <Field label="Capacity">
          <Select
            options={CAPACITY_OPTIONS}
            value={capacity}
            onChange={(v) => v.value && setCapacity(v.value)}
          />
        </Field>

        <Field label="Label">
          <Input
            value={label}
            onChange={(e) => setLabel(e.currentTarget.value)}
            placeholder="e.g. SP01 → SP02 Backbone"
          />
        </Field>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!sourceId || !targetId || sourceId === targetId}
          >
            Add Link
          </Button>
        </div>
      </div>
    </Modal>
  );
}
