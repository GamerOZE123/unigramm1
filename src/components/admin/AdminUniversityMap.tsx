import React, { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { Map as MLMap, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { STATE_COORDS, STATE_RADIUS } from '@/data/indianStateCoords';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, GraduationCap, Sparkles, Globe2, Search, Maximize2, Minimize2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type UniMap = Record<string, string[]>;
type Univ = { name: string; state: string; lng: number; lat: number; enrolled: number };

function seeded(i: number) {
  const x = Math.sin(i * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

const AdminUniversityMap: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const allUniv = useRef<Univ[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ states: 0, universities: 0 });
  const [enrolledByUniv, setEnrolledByUniv] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<{ name: string; state: string; enrolled: number } | null>(null);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // Search results (top 8)
  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || q.length < 2) return [] as Univ[];
    const out: Univ[] = [];
    for (const u of allUniv.current) {
      if (u.name.toLowerCase().includes(q) || u.state.toLowerCase().includes(q)) {
        out.push(u);
        if (out.length >= 12) break;
      }
    }
    return out;
  }, [search]);

  useEffect(() => {
    let mounted = true;
    let map: MLMap | null = null;

    (async () => {
      const data = (await import('@/data/universities.json')).default as UniMap;

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

      const features: any[] = [];
      const flat: Univ[] = [];
      let total = 0, counter = 0;
      Object.entries(data).forEach(([state, list]) => {
        const center = STATE_COORDS[state];
        const radius = STATE_RADIUS[state] || 1.2;
        if (!center) return;
        list.forEach((name) => {
          const r1 = seeded(counter * 2);
          const r2 = seeded(counter * 2 + 1);
          const angle = r1 * Math.PI * 2;
          const dist = Math.sqrt(r2) * radius;
          const lng = center.lng + Math.cos(angle) * dist;
          const lat = center.lat + Math.sin(angle) * dist * 0.85;
          counter++; total++;
          const enrolled = enrolledMap[name] || 0;
          flat.push({ name, state, lng, lat, enrolled });
          features.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [lng, lat] },
            properties: { name, state, idx: counter, enrolled },
          });
        });
      });
      allUniv.current = flat;
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
              attribution: '© OSM © CARTO',
            },
            'carto-labels': {
              type: 'raster',
              tiles: ['https://a.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}@2x.png'],
              tileSize: 256,
            },
          },
          layers: [
            { id: 'bg', type: 'background', paint: { 'background-color': '#080014' } },
            { id: 'carto-dark', type: 'raster', source: 'carto-dark', paint: { 'raster-opacity': 0.5, 'raster-saturation': -0.5, 'raster-contrast': 0.2, 'raster-hue-rotate': 250 } },
            { id: 'carto-labels', type: 'raster', source: 'carto-labels', paint: { 'raster-opacity': 0.55 } },
          ],
        },
        center: [82.5, 22.5],
        zoom: 4.2,
        minZoom: 2,
        maxZoom: 16,
        attributionControl: false,
        pitch: 30,
      });
      mapRef.current = map;

      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');
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

        // Magenta/violet neon theme
        map.addLayer({
          id: 'clusters-glow', type: 'circle', source: 'unis',
          filter: ['has', 'point_count'],
          paint: {
            'circle-radius': ['step', ['get', 'point_count'], 30, 50, 42, 200, 56, 1000, 72],
            'circle-color': '#d946ef',
            'circle-opacity': 0.15,
            'circle-blur': 1,
          },
        });
        map.addLayer({
          id: 'clusters', type: 'circle', source: 'unis',
          filter: ['has', 'point_count'],
          paint: {
            'circle-radius': ['step', ['get', 'point_count'], 16, 50, 22, 200, 28, 1000, 36],
            'circle-color': ['step', ['get', 'point_count'], '#a855f7', 50, '#c026d3', 200, '#ec4899', 1000, '#f0abfc'],
            'circle-stroke-color': '#fce7f3',
            'circle-stroke-width': 1.5,
            'circle-opacity': 0.9,
          },
        });
        map.addLayer({
          id: 'cluster-count', type: 'symbol', source: 'unis',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-size': 12,
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          },
          paint: { 'text-color': '#1a0024' },
        });

        map.addLayer({
          id: 'unis-glow', type: 'circle', source: 'unis',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-radius': 8, 'circle-color': '#e879f9', 'circle-opacity': 0.2, 'circle-blur': 0.8,
          },
        });
        map.addLayer({
          id: 'unis-core', type: 'circle', source: 'unis',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 1.5, 8, 3, 12, 5, 16, 8],
            'circle-color': ['case', ['>', ['get', 'enrolled'], 0], '#fde047', '#f0abfc'],
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 0.4,
            'circle-stroke-opacity': 0.6,
          },
        });

        const setPointer = () => (map!.getCanvas().style.cursor = 'pointer');
        const resetPointer = () => (map!.getCanvas().style.cursor = '');
        map.on('mouseenter', 'clusters', setPointer);
        map.on('mouseleave', 'clusters', resetPointer);
        map.on('mouseenter', 'unis-core', setPointer);
        map.on('mouseleave', 'unis-core', resetPointer);

        map.on('click', 'clusters', (e) => {
          const f = e.features?.[0] as any;
          if (!f) return;
          (map!.getSource('unis') as any).getClusterExpansionZoom(f.properties.cluster_id, (err: any, zoom: number) => {
            if (err) return;
            map!.easeTo({ center: f.geometry.coordinates, zoom });
          });
        });

        map.on('click', 'unis-core', (e) => {
          const f = e.features?.[0] as any;
          if (!f) return;
          openUni({
            name: f.properties.name,
            state: f.properties.state,
            enrolled: Number(f.properties.enrolled || 0),
            lng: f.geometry.coordinates[0],
            lat: f.geometry.coordinates[1],
          });
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

  const openUni = (u: { name: string; state: string; enrolled: number; lng: number; lat: number }) => {
    const map = mapRef.current;
    if (!map) return;
    setSelected({ name: u.name, state: u.state, enrolled: u.enrolled });
    if (popupRef.current) popupRef.current.remove();
    popupRef.current = new maplibregl.Popup({ closeButton: false, offset: 14, className: 'sci-fi-popup' })
      .setLngLat([u.lng, u.lat])
      .setHTML(`
        <div style="background:linear-gradient(135deg,#1a0024 0%,#3b0764 100%);border:1px solid #e879f988;padding:10px 12px;border-radius:8px;color:#fce7f3;font-family:system-ui;min-width:220px;box-shadow:0 0 30px #d946ef55;">
          <div style="font-size:10px;letter-spacing:1.5px;color:#f0abfc;text-transform:uppercase;margin-bottom:4px;">${u.state}</div>
          <div style="font-size:13px;font-weight:700;line-height:1.3;margin-bottom:6px;">${u.name}</div>
          <div style="font-size:11px;color:#fbcfe8;">👥 ${u.enrolled} enrolled · 🏛️ 0 clubs</div>
        </div>
      `)
      .addTo(map);
    map.flyTo({ center: [u.lng, u.lat], zoom: Math.max(map.getZoom(), 9), duration: 900 });
  };

  const toggleFullscreen = async () => {
    const el = wrapperRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen?.();
      setFullscreen(true);
    } else {
      await document.exitFullscreen?.();
      setFullscreen(false);
    }
  };

  useEffect(() => {
    const onFs = () => {
      setFullscreen(!!document.fullscreenElement);
      // Resize map after transition
      setTimeout(() => mapRef.current?.resize(), 250);
    };
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  // Trigger map resize on mount/window resize for full-bleed sizing
  useEffect(() => {
    const onResize = () => mapRef.current?.resize();
    window.addEventListener('resize', onResize);
    const t = setTimeout(onResize, 300);
    return () => { window.removeEventListener('resize', onResize); clearTimeout(t); };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full bg-[#080014] overflow-hidden"
      style={{ height: fullscreen ? '100vh' : 'calc(100vh - 64px)' }}
    >
      {/* MAP */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Scanlines + corner brackets */}
      <div className="pointer-events-none absolute inset-0 z-10 sci-fi-scanlines" />
      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-fuchsia-400/60" />
        <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-fuchsia-400/60" />
        <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 border-fuchsia-400/60" />
        <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-fuchsia-400/60" />
      </div>

      {/* Top HUD: title + stats */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full bg-fuchsia-500/10 border border-fuchsia-400/40 backdrop-blur-md">
        <p className="text-[10px] uppercase tracking-[0.35em] text-fuchsia-300 font-mono">UNIGRAMM · NETWORK GRID</p>
      </div>

      {/* Top-left stat tiles (transparent overlay) */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 max-w-[200px]">
        <StatTile icon={<Globe2 className="w-3.5 h-3.5" />} label="States" value={`${stats.states}`} />
        <StatTile icon={<GraduationCap className="w-3.5 h-3.5" />} label="Universities" value={stats.universities.toLocaleString()} />
        <StatTile icon={<Sparkles className="w-3.5 h-3.5" />} label="Active" value={`${Object.keys(enrolledByUniv).length}`} accent />
        <StatTile icon={<MapPin className="w-3.5 h-3.5" />} label="Enrolled" value={Object.values(enrolledByUniv).reduce((a, b) => a + b, 0).toLocaleString()} />
      </div>

      {/* Top-right: search + fullscreen */}
      <div className="absolute top-3 right-3 z-30 flex items-start gap-2">
        <div className="relative">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-full bg-black/40 backdrop-blur-md border transition-all ${searchOpen || search ? 'border-fuchsia-400/60 w-72' : 'border-fuchsia-400/30 w-10 cursor-pointer'}`}
            onClick={() => setSearchOpen(true)}>
            <Search className="w-4 h-4 text-fuchsia-300 shrink-0" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search university or state…"
              className={`bg-transparent outline-none text-xs text-fuchsia-100 placeholder:text-fuchsia-300/40 flex-1 transition-all ${searchOpen || search ? 'w-full opacity-100' : 'w-0 opacity-0'}`}
            />
            {search && (
              <button onClick={(e) => { e.stopPropagation(); setSearch(''); }} className="text-fuchsia-300/60 hover:text-fuchsia-200">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {results.length > 0 && (
            <div className="absolute top-full mt-2 right-0 w-80 max-h-80 overflow-y-auto rounded-lg bg-[#0c0118]/95 backdrop-blur-md border border-fuchsia-400/30 shadow-[0_0_30px_rgba(217,70,239,0.25)]">
              {results.map((u, i) => (
                <button
                  key={i}
                  onClick={() => { openUni(u); setSearchOpen(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-fuchsia-500/10 border-b border-fuchsia-500/10 last:border-0 transition-colors"
                >
                  <p className="text-[10px] uppercase tracking-widest text-fuchsia-300/70">{u.state}</p>
                  <p className="text-xs text-fuchsia-100 font-medium leading-tight">{u.name}</p>
                  {u.enrolled > 0 && <p className="text-[10px] text-yellow-300 mt-0.5">👥 {u.enrolled} enrolled</p>}
                </button>
              ))}
            </div>
          )}
          {search.length >= 2 && results.length === 0 && (
            <div className="absolute top-full mt-2 right-0 w-80 px-3 py-3 rounded-lg bg-[#0c0118]/95 backdrop-blur-md border border-fuchsia-400/30 text-xs text-fuchsia-300/60">
              No matches for "{search}"
            </div>
          )}
        </div>

        <button
          onClick={toggleFullscreen}
          title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-fuchsia-400/30 flex items-center justify-center text-fuchsia-300 hover:border-fuchsia-400/60 hover:text-fuchsia-100 transition-colors"
        >
          {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Bottom-left: selected info panel */}
      {selected && (
        <div className="absolute bottom-4 left-4 z-20 max-w-sm p-4 rounded-lg bg-[#0c0118]/85 border border-fuchsia-400/40 backdrop-blur-md shadow-[0_0_30px_rgba(217,70,239,0.25)]">
          <div className="flex items-start justify-between gap-2 mb-2">
            <Badge variant="outline" className="border-fuchsia-400/40 text-fuchsia-300 text-[10px]">{selected.state}</Badge>
            <button onClick={() => { setSelected(null); popupRef.current?.remove(); }} className="text-fuchsia-400/60 hover:text-fuchsia-200">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-sm font-bold text-fuchsia-100 mb-2 leading-tight">{selected.name}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded bg-fuchsia-500/10 border border-fuchsia-500/20">
              <p className="text-[10px] uppercase tracking-wider text-fuchsia-300/70">Enrolled</p>
              <p className="text-yellow-300 font-bold">{selected.enrolled}</p>
            </div>
            <div className="p-2 rounded bg-fuchsia-500/10 border border-fuchsia-500/20">
              <p className="text-[10px] uppercase tracking-wider text-fuchsia-300/70">Clubs</p>
              <p className="text-fuchsia-100 font-bold">0</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#080014]/80">
          <div className="flex items-center gap-2 text-fuchsia-300 text-sm font-mono">
            <Loader2 className="w-4 h-4 animate-spin" />
            INITIALIZING NETWORK GRID…
          </div>
        </div>
      )}

      <style>{`
        .sci-fi-scanlines {
          background: repeating-linear-gradient(
            0deg,
            rgba(232, 121, 249, 0.04) 0px,
            rgba(232, 121, 249, 0.04) 1px,
            transparent 1px,
            transparent 3px
          );
        }
        .maplibregl-popup-content { background: transparent !important; padding: 0 !important; box-shadow: none !important; }
        .maplibregl-popup-tip { display: none !important; }
        .maplibregl-ctrl-attrib { background: rgba(0,0,0,0.5) !important; color: #f0abfc !important; font-size: 9px !important; }
        .maplibregl-ctrl-attrib a { color: #fbcfe8 !important; }
        .maplibregl-ctrl-group { background: rgba(12,1,24,0.7) !important; border: 1px solid rgba(217,70,239,0.4) !important; backdrop-filter: blur(8px); }
        .maplibregl-ctrl-group button { background: transparent !important; }
        .maplibregl-ctrl-group button span { filter: invert(1) hue-rotate(270deg) brightness(1.5); }
      `}</style>
    </div>
  );
};

const StatTile: React.FC<{ icon: React.ReactNode; label: string; value: string; accent?: boolean }> = ({ icon, label, value, accent }) => (
  <div className={`px-3 py-2 rounded-lg backdrop-blur-md border flex items-center gap-2 ${accent ? 'bg-yellow-500/10 border-yellow-400/30' : 'bg-[#0c0118]/60 border-fuchsia-400/25'}`}>
    <div className={accent ? 'text-yellow-300' : 'text-fuchsia-300'}>{icon}</div>
    <div className="leading-tight">
      <p className={`text-[9px] uppercase tracking-widest ${accent ? 'text-yellow-300/70' : 'text-fuchsia-300/70'}`}>{label}</p>
      <p className={`text-xs font-bold font-mono ${accent ? 'text-yellow-100' : 'text-fuchsia-100'}`}>{value}</p>
    </div>
  </div>
);

export default AdminUniversityMap;
