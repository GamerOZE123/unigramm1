export type LatLng = [number, number];
export interface ShapeStyle {
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeOpacity: number;
  strokeWidth: number;
  strokeDash: boolean;
}
export type ShapeType = 'building' | 'zone' | 'path' | 'landmark' | 'restricted';
export interface Shape {
  id: string;
  type: ShapeType;
  label: string;
  coordinates: LatLng[];
  style: ShapeStyle;
  order: number;
  hidden?: boolean;
}

export interface Bounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export function getBounds(boundary: LatLng[] | null, shapes: Shape[]): Bounds | null {
  const all: LatLng[] = [];
  if (boundary && boundary.length) all.push(...boundary);
  shapes.forEach((s) => all.push(...s.coordinates));
  if (!all.length) return null;
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const [lat, lng] of all) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }
  // pad 5%
  const padLat = (maxLat - minLat) * 0.05 || 0.0005;
  const padLng = (maxLng - minLng) * 0.05 || 0.0005;
  return {
    minLat: minLat - padLat,
    maxLat: maxLat + padLat,
    minLng: minLng - padLng,
    maxLng: maxLng + padLng,
  };
}

export function geoToSvg(lat: number, lng: number, b: Bounds, size = 800) {
  const x = ((lng - b.minLng) / (b.maxLng - b.minLng)) * size;
  const y = ((b.maxLat - lat) / (b.maxLat - b.minLat)) * size;
  return { x, y };
}

function pointsAttr(coords: LatLng[], b: Bounds, size: number) {
  return coords.map(([lat, lng]) => {
    const { x, y } = geoToSvg(lat, lng, b, size);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
}

export function buildSvg(opts: { shapes: Shape[]; boundary: LatLng[] | null; size?: number }): string {
  const size = opts.size ?? 800;
  const bounds = getBounds(opts.boundary, opts.shapes);
  if (!bounds) {
    return `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" fill="#080c17"/></svg>`;
  }
  const parts: string[] = [];
  parts.push(`<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`);
  parts.push(`<rect width="${size}" height="${size}" fill="#080c17"/>`);
  // grid
  parts.push('<g stroke="#1a2238" stroke-width="0.5" opacity="0.4">');
  for (let i = 1; i < 10; i++) {
    const p = (size / 10) * i;
    parts.push(`<line x1="${p}" y1="0" x2="${p}" y2="${size}"/>`);
    parts.push(`<line x1="0" y1="${p}" x2="${size}" y2="${p}"/>`);
  }
  parts.push('</g>');
  // boundary
  if (opts.boundary && opts.boundary.length >= 3) {
    const pts = pointsAttr(opts.boundary, bounds, size);
    parts.push(`<polygon points="${pts}" fill="none" stroke="#4f8eff" stroke-opacity="0.8" stroke-width="1.5" stroke-dasharray="4 4"/>`);
  }
  const sorted = [...opts.shapes].filter(s => !s.hidden).sort((a, b) => a.order - b.order);
  const labels: string[] = [];
  for (const s of sorted) {
    const st = s.style;
    const dash = st.strokeDash ? ` stroke-dasharray="3 3"` : '';
    if (s.type === 'path') {
      const pts = pointsAttr(s.coordinates, bounds, size);
      parts.push(`<polyline points="${pts}" fill="none" stroke="${st.strokeColor}" stroke-opacity="${st.strokeOpacity}" stroke-width="${st.strokeWidth}"${dash}/>`);
    } else if (s.type === 'landmark') {
      const c = s.coordinates[0];
      if (!c) continue;
      const { x, y } = geoToSvg(c[0], c[1], bounds, size);
      parts.push(`<polygon points="${x},${y - 6} ${x + 6},${y} ${x},${y + 6} ${x - 6},${y}" fill="${st.fillColor}" fill-opacity="${st.fillOpacity}" stroke="${st.strokeColor}" stroke-opacity="${st.strokeOpacity}" stroke-width="${st.strokeWidth}"/>`);
      if (s.label) labels.push(`<text x="${x + 9}" y="${y + 3}" font-size="8" fill="#9bbcff" font-family="monospace">${escapeXml(s.label)}</text>`);
    } else {
      const pts = pointsAttr(s.coordinates, bounds, size);
      parts.push(`<polygon points="${pts}" fill="${st.fillColor}" fill-opacity="${st.fillOpacity}" stroke="${st.strokeColor}" stroke-opacity="${st.strokeOpacity}" stroke-width="${st.strokeWidth}"${dash}/>`);
      if (s.label) {
        // centroid
        let cx = 0, cy = 0;
        for (const [lat, lng] of s.coordinates) {
          const p = geoToSvg(lat, lng, bounds, size);
          cx += p.x; cy += p.y;
        }
        cx /= s.coordinates.length; cy /= s.coordinates.length;
        labels.push(`<text x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" font-size="9" text-anchor="middle" fill="#cfe1ff" font-family="monospace">${escapeXml(s.label)}</text>`);
      }
    }
  }
  parts.push(...labels);
  parts.push('</svg>');
  return parts.join('');
}

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] as string));
}

export const DEFAULT_STYLES: Record<ShapeType, ShapeStyle> = {
  building: { fillColor: '#0d1420', fillOpacity: 0.8, strokeColor: '#4f8eff', strokeOpacity: 0.5, strokeWidth: 1, strokeDash: false },
  zone:     { fillColor: '#4f8eff', fillOpacity: 0.08, strokeColor: '#4f8eff', strokeOpacity: 0.3, strokeWidth: 1, strokeDash: true },
  path:     { fillColor: 'transparent', fillOpacity: 0, strokeColor: '#4f8eff', strokeOpacity: 0.2, strokeWidth: 1.5, strokeDash: false },
  landmark: { fillColor: '#8dcfff', fillOpacity: 0.9, strokeColor: '#4f8eff', strokeOpacity: 1, strokeWidth: 1, strokeDash: false },
  restricted: { fillColor: '#ef4444', fillOpacity: 0.05, strokeColor: '#ef4444', strokeOpacity: 0.3, strokeWidth: 1, strokeDash: false },
};

export const COLOR_PRESETS = [
  { name: 'Default',    color: '#4f8eff' },
  { name: 'Highlight',  color: '#8dcfff' },
  { name: 'Event zone', color: '#f59e0b' },
  { name: 'Restricted', color: '#ef4444' },
];