import { openDB, IDBPDatabase } from 'idb';
import { NetworkDevice, DeviceType } from '../types';

const DB_NAME = 'ipvfull-image-cache';
const DB_VERSION = 1;
const STORE_NAME = 'images';
const IMAGE_SIZE = 200;

interface ImageCacheSchema {
  images: {
    key: string;
    value: string; // base64 data URL
  };
}

// Known manufacturer image URLs (public CDN, no auth required)
const MODEL_IMAGE_MAP: Record<string, string> = {
  'mikrotik-rb4011igs': 'https://i.mt.lv/routerboard/files/rb4011-1.png',
  'mikrotik-ccr2216': 'https://i.mt.lv/routerboard/files/CCR2216-1G-12XS-2XQ.png',
  'mikrotik-ccr2004': 'https://i.mt.lv/routerboard/files/CCR2004-1G-12S+2XS.png',
  'mikrotik-crs317': 'https://i.mt.lv/routerboard/files/CRS317-1G-16S+.png',
  'mikrotik-crs312': 'https://i.mt.lv/routerboard/files/CRS312-4C+8XG.png',
  'mikrotik-rb3011': 'https://i.mt.lv/routerboard/files/RB3011UiAS-RM-1.png',
  'ubiquiti-edgerouter': 'https://dl.ubnt.com/press/EdgeRouter/EdgeRouter_Front_PoE.png',
};

// Fallback SVG icons per device type (bundled in assets/images/)
const TYPE_ICON_MAP: Record<DeviceType, string> = {
  router: require('../assets/images/router.svg'),
  core: require('../assets/images/core.svg'),
  bng: require('../assets/images/bng.svg'),
  cgnat: require('../assets/images/cgnat.svg'),
  firewall: require('../assets/images/firewall.svg'),
  olt: require('../assets/images/olt.svg'),
  onu: require('../assets/images/onu.svg'),
  switch: require('../assets/images/switch.svg'),
  server: require('../assets/images/server.svg'),
  storage: require('../assets/images/storage.svg'),
  radio: require('../assets/images/radio.svg'),
  ap: require('../assets/images/ap.svg'),
  backbone: require('../assets/images/backbone.svg'),
  pop: require('../assets/images/pop.svg'),
  ix: require('../assets/images/ix.svg'),
  datacenter: require('../assets/images/datacenter.svg'),
  cloud: require('../assets/images/cloud.svg'),
};

let db: IDBPDatabase<ImageCacheSchema> | null = null;

async function getDB(): Promise<IDBPDatabase<ImageCacheSchema>> {
  if (!db) {
    db = await openDB<ImageCacheSchema>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return db;
}

function normalizeKey(vendor: string, model: string): string {
  return `${vendor}-${model}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function getCached(key: string): Promise<string | null> {
  try {
    const database = await getDB();
    const value = await database.get(STORE_NAME, key);
    return value ?? null;
  } catch {
    return null;
  }
}

async function setCached(key: string, dataUrl: string): Promise<void> {
  try {
    const database = await getDB();
    await database.put(STORE_NAME, dataUrl, key);
  } catch {
    // IndexedDB unavailable (e.g., private browsing) — continue without caching
  }
}

async function fetchAndResize(url: string): Promise<string> {
  const response = await fetch(url, { mode: 'cors' });
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);

  const canvas = new OffscreenCanvas(IMAGE_SIZE, IMAGE_SIZE);
  const ctx = canvas.getContext('2d')!;

  const scale = Math.min(IMAGE_SIZE / bitmap.width, IMAGE_SIZE / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  const offsetX = (IMAGE_SIZE - w) / 2;
  const offsetY = (IMAGE_SIZE - h) / 2;

  ctx.clearRect(0, 0, IMAGE_SIZE, IMAGE_SIZE);
  ctx.drawImage(bitmap, offsetX, offsetY, w, h);

  const resultBlob = await canvas.convertToBlob({ type: 'image/png' });
  return blobToDataUrl(resultBlob);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export class ImageProvider {
  static getFallbackUrl(type: DeviceType): string {
    return TYPE_ICON_MAP[type] ?? TYPE_ICON_MAP.router;
  }

  static async getImageUrl(device: NetworkDevice): Promise<string> {
    // 1. User-provided custom image (highest priority)
    if (device.customImageUrl) {
      return device.customImageUrl;
    }

    const vendor = device.vendor ?? '';
    const model = device.model ?? '';

    if (!vendor && !model) {
      return this.getFallbackUrl(device.type);
    }

    const key = normalizeKey(vendor, model);

    // 2. IndexedDB cache
    const cached = await getCached(key);
    if (cached) {
      return cached;
    }

    // 3. Known manufacturer CDN
    const cdnUrl = MODEL_IMAGE_MAP[key];
    if (cdnUrl) {
      try {
        const dataUrl = await fetchAndResize(cdnUrl);
        await setCached(key, dataUrl);
        return dataUrl;
      } catch {
        // CDN fetch failed (CORS, network, etc.) — fall through
      }
    }

    // 4. Bundled SVG fallback
    return this.getFallbackUrl(device.type);
  }

  static async preloadBatch(devices: NetworkDevice[]): Promise<void> {
    await Promise.allSettled(devices.map((d) => this.getImageUrl(d)));
  }

  static async uploadCustomImage(file: File): Promise<string> {
    const bitmap = await createImageBitmap(file);
    const canvas = new OffscreenCanvas(IMAGE_SIZE, IMAGE_SIZE);
    const ctx = canvas.getContext('2d')!;

    const scale = Math.min(IMAGE_SIZE / bitmap.width, IMAGE_SIZE / bitmap.height);
    const w = bitmap.width * scale;
    const h = bitmap.height * scale;
    const offsetX = (IMAGE_SIZE - w) / 2;
    const offsetY = (IMAGE_SIZE - h) / 2;

    ctx.clearRect(0, 0, IMAGE_SIZE, IMAGE_SIZE);
    ctx.drawImage(bitmap, offsetX, offsetY, w, h);

    const blob = await canvas.convertToBlob({ type: 'image/png' });
    return blobToDataUrl(blob);
  }

  static async clearCache(): Promise<void> {
    try {
      const database = await getDB();
      await database.clear(STORE_NAME);
    } catch {
      // Ignore
    }
  }
}
