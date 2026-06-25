import React, { useState, useEffect } from 'react';
import { NetworkDevice } from '../../types';
import { ImageProvider } from '../../services/ImageProvider';

interface DeviceImageProps {
  device: NetworkDevice;
  size: number;
}

export const DeviceImage = React.memo(function DeviceImage({ device, size }: DeviceImageProps) {
  const [src, setSrc] = useState<string>(() => ImageProvider.getFallbackUrl(device.type));

  useEffect(() => {
    let cancelled = false;
    ImageProvider.getImageUrl(device).then((url) => {
      if (!cancelled) {
        setSrc(url);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [device.id, device.customImageUrl, device.model, device.vendor, device.type]);

  return (
    <img
      src={src}
      alt={device.label}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        borderRadius: '50%',
        display: 'block',
        filter: device.status === 'offline' ? 'grayscale(80%) opacity(0.6)' : 'none',
        transition: 'filter 0.3s ease',
      }}
      onError={() => {
        setSrc(ImageProvider.getFallbackUrl(device.type));
      }}
      draggable={false}
    />
  );
});
