import React, { useState } from 'react';
import { Modal, Button, Input, Select, Field } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { DeviceType, NetworkDevice } from '../../types';

const DEVICE_TYPE_OPTIONS: Array<SelectableValue<DeviceType>> = [
  { value: 'router', label: 'Router' },
  { value: 'core', label: 'Core Router' },
  { value: 'bng', label: 'BNG' },
  { value: 'cgnat', label: 'CGNAT' },
  { value: 'firewall', label: 'Firewall' },
  { value: 'olt', label: 'OLT' },
  { value: 'onu', label: 'ONU' },
  { value: 'switch', label: 'Switch' },
  { value: 'server', label: 'Server' },
  { value: 'storage', label: 'Storage' },
  { value: 'radio', label: 'Radio' },
  { value: 'ap', label: 'AP' },
  { value: 'backbone', label: 'Backbone' },
  { value: 'pop', label: 'POP' },
  { value: 'ix', label: 'IX' },
  { value: 'datacenter', label: 'Datacenter' },
  { value: 'cloud', label: 'Cloud' },
];

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (partial: Partial<NetworkDevice>) => void;
  position: { x: number; y: number };
}

export function AddDeviceModal({ isOpen, onClose, onConfirm, position }: AddDeviceModalProps) {
  const [label, setLabel] = useState('');
  const [type, setType] = useState<DeviceType>('router');
  const [model, setModel] = useState('');
  const [vendor, setVendor] = useState('');
  const [ip, setIp] = useState('');
  const [hostname, setHostname] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  const handleConfirm = () => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    onConfirm({
      label: label || `New ${type}`,
      type,
      model: model || undefined,
      vendor: vendor || undefined,
      ip: ip || undefined,
      hostname: hostname || undefined,
      geo:
        isFinite(latNum) && isFinite(lngNum)
          ? { lat: latNum, lng: lngNum }
          : undefined,
      x: position.x,
      y: position.y,
    });
    onClose();
    // Reset form
    setLabel('');
    setModel('');
    setVendor('');
    setIp('');
    setHostname('');
    setLat('');
    setLng('');
  };

  return (
    <Modal title="Add Device" isOpen={isOpen} onDismiss={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="Label" required>
          <Input
            value={label}
            onChange={(e) => setLabel(e.currentTarget.value)}
            placeholder="e.g. Core-Router-SP01"
            autoFocus
          />
        </Field>

        <Field label="Type" required>
          <Select
            options={DEVICE_TYPE_OPTIONS}
            value={type}
            onChange={(v) => v.value && setType(v.value)}
          />
        </Field>

        <Field label="Vendor">
          <Input
            value={vendor}
            onChange={(e) => setVendor(e.currentTarget.value)}
            placeholder="e.g. MikroTik, Cisco, Huawei"
          />
        </Field>

        <Field label="Model">
          <Input
            value={model}
            onChange={(e) => setModel(e.currentTarget.value)}
            placeholder="e.g. CCR2216-1G-12XS"
          />
        </Field>

        <Field label="IP Address">
          <Input
            value={ip}
            onChange={(e) => setIp(e.currentTarget.value)}
            placeholder="e.g. 192.168.1.1"
          />
        </Field>

        <Field label="Hostname">
          <Input
            value={hostname}
            onChange={(e) => setHostname(e.currentTarget.value)}
            placeholder="e.g. core-sp01.example.com"
          />
        </Field>

        <div style={{ display: 'flex', gap: 8 }}>
          <Field label="Latitude" style={{ flex: 1 }}>
            <Input
              value={lat}
              onChange={(e) => setLat(e.currentTarget.value)}
              placeholder="-23.5505"
              type="number"
            />
          </Field>
          <Field label="Longitude" style={{ flex: 1 }}>
            <Input
              value={lng}
              onChange={(e) => setLng(e.currentTarget.value)}
              placeholder="-46.6333"
              type="number"
            />
          </Field>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={!label && !type}>
            Add Device
          </Button>
        </div>
      </div>
    </Modal>
  );
}
