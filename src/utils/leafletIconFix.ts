import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Webpack bundles leaflet images with hashed URLs; this fixes the broken default icon path.
// Must be imported once at module init (src/module.ts).
export function fixLeafletDefaultIcon(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: iconUrl as string,
    iconRetinaUrl: iconRetinaUrl as string,
    shadowUrl: shadowUrl as string,
  });
}
