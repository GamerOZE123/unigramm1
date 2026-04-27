import React, { useEffect, useRef, useState } from 'react';
import maplibregl, { Map as MLMap, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { STATE_COORDS, STATE_RADIUS } from '@/data/indianStateCoords';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, GraduationCap, Sparkles, Globe2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type UniMap = Record<string, string[]>;

// Deterministic pseudo-random for stable dot positions
function seeded(i: number) {
  const x = Math.sin(i * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

interface UniFeatureProps {
  name: string;
  state: string;
  idx: number;
}

const AdminUniversityMap: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ states: 0, universities: 0 });
  const [enrolledByUniv, setEnrolledByUniv] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<{ name: string; state: string; enrolled: number } | null>(null);

  useEffect(() => {
    let mounted = true;
    let map: MLMap | null = null;

    (async () => {
      // Lazy-load the heavy JSON
      const data = (await import('@/data/universities.json')).default as UniMap;

      // Fetch enrolled counts per university from profiles
      let enrolledMap: Record<string, number> = {};
      try {
        const { data: profs } = await supabase
          .from('profiles')
          .select('university')
          .not('university', 'is', null)
          .limit(10000);
        (profs || []).forEach((p: any) => {
          if (p.university) enrolledMap[p.university] = (enrolledMap[p.university] || 0) + 1;
        });
      } catch {}
      if (!mounted) return;
      setEnrolledByUniv(enrolledMap);

      // Build GeoJSON features
      const features: any[] = [];
      let total = 0;
      let counter = 0;
      Object.entries(data).forEach(([state, list]) => {
        const center = STATE_COORDS[state];
        const radius = STATE_RADIUS[state] || 1.2;
        if (!center) return;
        list.forEach((name, i) => {
          // Polar jitter for organic spread within state
          const r1 = seeded(counter * 2);
          const r2 = seeded(counter * 2 + 1);
          const angle = r1 * Math.PI * 2;
          const dist = Math.sqrt(r2) * radius;
          const lng = center.lng + Math.cos(angle) * dist;
          const lat = center.lat + Math.sin(angle) * dist * 0.85;
          counter++;
          total++;
          features.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [lng, lat] },
            properties: { name, state, idx: counter, enrolled: enrolledMap[name] || 0 },
          });
        });
      });

      setStats({ states: Object.keys(data).length, universities: total });

      if (!containerRef.current) return;

      map = new maplibregl.Map({
        container: containerRef.current,
        style: {
          version: 8,
          sources: {
            'carto-dark': {
              type: 'raster',
              tiles: [
                'https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png',
                'https://b.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png',
                'https://c.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png',
                'https://d.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png',
              ],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors © CARTO',
            },
            'carto-labels': {
              type: 'raster',
              tiles: ['https://a.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}@2x.png'],
              tileSize: 256,
            },
          },
          layers: [
            { id: 'bg', type: 'background', paint: { 'background-color': '#02030a' } },
            { id: 'carto-dark', type: 'raster', source: 'carto-dark', paint: { 'raster-opacity': 0.55, 'raster-saturation': -0.3, 'raster-contrast': 0.15 } },
            { id: 'carto-labels', type: 'raster', source: 'carto-labels', paint: { 'raster-opacity': 0.6 } },
          ],
        },
        center: [82.5, 22.5],
        zoom: 4.2,
        minZoom: 2,
        maxZoom: 16,
        attributionControl: false,
        pitch: 25,
        bearing: 0,
      });
      mapRef.current = map;

      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
      map.addControl(new maplibregl.AttributionControl({ compact: true }));

      map.on('load', () => {
        if (!map) return;

        map.addSource('unis', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features },
          cluster: true,
          clusterMaxZoom: 8,
          clusterRadius: 45,
        });

        // Cluster bubbles — sci-fi cyan glow
        map.addLayer({
          id: 'clusters-glow',
          type: 'circle',
          source: 'unis',
          filter: ['has', 'point_count'],
          paint: {
            'circle-radius': ['step', ['get', 'point_count'], 28, 50, 38, 200, 50, 1000, 65],
            'circle-color': '#00e0ff',
            'circle-opacity': 0.12,
            'circle-blur': 1,
          },
        });
        map.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'unis',
          filter: ['has', 'point_count'],
          paint: {
            'circle-radius': ['step', ['get', 'point_count'], 16, 50, 22, 200, 28, 1000, 36],
            'circle-color': ['step', ['get', 'point_count'], '#06b6d4', 50, '#22d3ee', 200, '#a78bfa', 1000, '#f0abfc'],
            'circle-stroke-color': '#e0f7ff',
            'circle-stroke-width': 1.5,
            'circle-opacity': 0.85,
          },
        });
        map.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'unis',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-size': 12,
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          },
          paint: { 'text-color': '#001018' },
        });

        // Individual university dots
        map.addLayer({
          id: 'unis-glow',
          type: 'circle',
          source: 'unis',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-radius': 8,
            'circle-color': '#22d3ee',
            'circle-opacity': 0.18,
            'circle-blur': 0.8,
          },
        });
        map.addLayer({
          id: 'unis-core',
          type: 'circle',
          source: 'unis',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 1.5, 8, 3, 12, 5, 16, 8],
            'circle-color': [
              'case',
              ['>', ['get', 'enrolled'], 0], '#f0abfc',
              '#67e8f9',
            ],
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 0.4,
            'circle-stroke-opacity': 0.6,
          },
        });

        // Cursor + interactions
        const setPointer = () => (map!.getCanvas().style.cursor = 'pointer');
        const resetPointer = () => (map!.getCanvas().style.cursor = '');

        map.on('mouseenter', 'clusters', setPointer);
        map.on('mouseleave', 'clusters', resetPointer);
        map.on('mouseenter', 'unis-core', setPointer);
        map.on('mouseleave', 'unis-core', resetPointer);

        map.on('click', 'clusters', (e) => {
          const f = e.features?.[0] as any;
          if (!f) return;
          const clusterId = f.properties.cluster_id;
          (map!.getSource('unis') as any).getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
            if (err) return;
            map!.easeTo({ center: f.geometry.coordinates, zoom });
          });
        });

        map.on('click', 'unis-core', (e) => {
          const f = e.features?.[0] as any;
          if (!f) return;
          const props = f.properties as UniFeatureProps & { enrolled: number };
          const coords = (f.geometry.coordinates as [number, number]).slice() as [number, number];
          setSelected({ name: props.name, state: props.state, enrolled: Number(props.enrolled || 0) });

          if (popupRef.current) popupRef.current.remove();
          popupRef.current = new maplibregl.Popup({ closeButton: false, offset: 14, className: 'sci-fi-popup' })
            .setLngLat(coords)
            .setHTML(`
              <div style="background:linear-gradient(135deg,#021526 0%,#03304a 100%);border:1px solid #00e0ff55;padding:10px 12px;border-radius:8px;color:#dffaff;font-family:system-ui;min-width:200px;box-shadow:0 0 24px #00e0ff44;">
                <div style="font-size:10px;letter-spacing:1.5px;color:#67e8f9;text-transform:uppercase;margin-bottom:4px;">${props.state}</div>
                <div style="font-size:13px;font-weight:700;line-height:1.3;margin-bottom:6px;">${props.name}</div>
                <div style="font-size:11px;color:#a5f3fc;">👥 ${Number(props.enrolled || 0)} enrolled · 🏛️ 0 clubs</div>
              </div>
            `)
            .addTo(map!);

          map!.easeTo({ center: coords, zoom: Math.max(map!.getZoom(), 9) });
        });

        setLoading(false);
      });
    })();

    return () => {
      mounted = false;
      if (popupRef.current) popupRef.current.remove();
      if (map) map.remove();
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Sci-fi HUD header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 to-slate-950/40">
          <CardContent className="pt-5 flex items-center gap-3">
            <Globe2 className="w-5 h-5 text-cyan-400" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-cyan-300/70">Coverage</p>
              <p className="text-lg font-bold text-cyan-100">India · 35 States/UTs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 to-slate-950/40">
          <CardContent className="pt-5 flex items-center gap-3">
            <GraduationCap className="w-5 h-5 text-cyan-400" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-cyan-300/70">Universities Indexed</p>
              <p className="text-lg font-bold text-cyan-100">{stats.universities.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-950/30 to-slate-950/40">
          <CardContent className="pt-5 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-fuchsia-400" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-fuchsia-300/70">Active Universities</p>
              <p className="text-lg font-bold text-fuchsia-100">{Object.keys(enrolledByUniv).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 to-slate-950/40">
          <CardContent className="pt-5 flex items-center gap-3">
            <MapPin className="w-5 h-5 text-cyan-400" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-cyan-300/70">Total Enrolled</p>
              <p className="text-lg font-bold text-cyan-100">
                {Object.values(enrolledByUniv).reduce((a, b) => a + b, 0).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-cyan-500/30" style={{ height: 'calc(100vh - 280px)', minHeight: 520 }}>
        {/* Scanline overlay */}
        <div className="pointer-events-none absolute inset-0 z-10 sci-fi-scanlines" />
        {/* Corner brackets */}
        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-cyan-400/60" />
          <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-cyan-400/60" />
          <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 border-cyan-400/60" />
          <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-cyan-400/60" />
        </div>
        {/* HUD label */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/40 backdrop-blur">
          <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-300 font-mono">UNIGRAMM · NETWORK GRID</p>
        </div>
        {loading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
            <div className="flex items-center gap-2 text-cyan-300 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Initializing network grid…
            </div>
          </div>
        )}
        <div ref={containerRef} className="absolute inset-0" />

        {/* Selected info panel */}
        {selected && (
          <div className="absolute bottom-4 left-4 z-20 max-w-sm p-4 rounded-lg bg-slate-950/90 border border-cyan-400/40 backdrop-blur">
            <div className="flex items-start justify-between gap-2 mb-2">
              <Badge variant="outline" className="border-cyan-400/40 text-cyan-300 text-[10px]">{selected.state}</Badge>
              <button onClick={() => setSelected(null)} className="text-cyan-400/60 hover:text-cyan-300 text-xs">✕</button>
            </div>
            <p className="text-sm font-bold text-cyan-100 mb-2 leading-tight">{selected.name}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/20">
                <p className="text-[10px] uppercase tracking-wider text-cyan-300/70">Enrolled</p>
                <p className="text-cyan-100 font-bold">{selected.enrolled}</p>
              </div>
              <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/20">
                <p className="text-[10px] uppercase tracking-wider text-cyan-300/70">Clubs</p>
                <p className="text-cyan-100 font-bold">0</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .sci-fi-scanlines {
          background: repeating-linear-gradient(
            0deg,
            rgba(0, 224, 255, 0.04) 0px,
            rgba(0, 224, 255, 0.04) 1px,
            transparent 1px,
            transparent 3px
          );
        }
        .maplibregl-popup-content { background: transparent !important; padding: 0 !important; box-shadow: none !important; }
        .maplibregl-popup-tip { display: none !important; }
        .maplibregl-ctrl-attrib { background: rgba(0,0,0,0.5) !important; color: #67e8f9 !important; font-size: 9px !important; }
        .maplibregl-ctrl-attrib a { color: #a5f3fc !important; }
      `}</style>
    </div>
  );
};

export default AdminUniversityMap;
