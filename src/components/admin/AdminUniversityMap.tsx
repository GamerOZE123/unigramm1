import React, { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { Map as MLMap, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { STATE_COORDS, STATE_RADIUS } from '@/data/indianStateCoords';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, GraduationCap, Sparkles, Globe2, Search, Maximize2, Minimize2, X, Settings2, Type, Hexagon, Star, Users, Building2, ChevronRight, ArrowLeft, ChevronLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type UniMap = Record<string, string[]>;
type Univ = { name: string; state: string; lng: number; lat: number; enrolled: number; abbr: string | null };

type ClubLite = { id: string; club_name: string; category: string | null; member_count: number | null; logo_url: string | null };

// Extract an abbreviation in parentheses, e.g. "Shiv Nadar University (SNU)" -> "SNU"
function extractAbbr(name: string): string | null {
  const m = name.match(/\(([A-Z][A-Z0-9&.\- ]{1,15})\)\s*$/);
  return m ? m[1].trim() : null;
}

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
  const [selected, setSelected] = useState<{ name: string; state: string; enrolled: number; abbr: string | null } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [clubs, setClubs] = useState<ClubLite[]>([]);
  const [studentCount, setStudentCount] = useState<number>(0);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [showDots, setShowDots] = useState(true);
  const [showClusters, setShowClusters] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showBorders, setShowBorders] = useState(true);
  const [activeOnly, setActiveOnly] = useState(false);

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
          const abbr = extractAbbr(name);
          // Hook to existing DB: try abbreviation first (e.g. "SNU"), then full name
          const enrolled = (abbr && enrolledMap[abbr]) || enrolledMap[name] || 0;
          flat.push({ name, state, lng, lat, enrolled, abbr });
          features.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [lng, lat] },
            properties: { name, state, idx: counter, enrolled, abbr: abbr || '' },
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
            'carto-lines': {
              type: 'raster',
              tiles: [
                'https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png',
                'https://b.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png',
              ],
              tileSize: 256,
            },
          },
          layers: [
            { id: 'bg', type: 'background', paint: { 'background-color': '#080014' } },
            { id: 'carto-dark', type: 'raster', source: 'carto-dark', paint: { 'raster-opacity': 0.55, 'raster-saturation': -0.4, 'raster-contrast': 0.35, 'raster-hue-rotate': 250 } },
            // Boundary emphasis: re-overlay base layer with high contrast & low opacity to lift admin lines
            { id: 'carto-borders', type: 'raster', source: 'carto-lines', paint: { 'raster-opacity': 0.45, 'raster-contrast': 0.9, 'raster-brightness-min': 0.15, 'raster-brightness-max': 1, 'raster-saturation': -1, 'raster-hue-rotate': 290 } },
            { id: 'carto-labels', type: 'raster', source: 'carto-labels', paint: { 'raster-opacity': 0.95, 'raster-contrast': 0.4, 'raster-brightness-min': 0.3 } },
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
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 5, 8, 9, 12, 14, 16, 20],
            'circle-color': ['case', ['>', ['get', 'enrolled'], 0], '#fde047', '#e879f9'],
            'circle-opacity': 0.12,
            'circle-blur': 1,
          },
        });
        map.addLayer({
          id: 'unis-core', type: 'circle', source: 'unis',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 1.6, 8, 3, 12, 5, 16, 8],
            'circle-color': ['case', ['>', ['get', 'enrolled'], 0], '#fde047', '#f0abfc'],
            'circle-opacity': ['case', ['>', ['get', 'enrolled'], 0], 0.95, 0.55],
            'circle-stroke-color': ['case', ['>', ['get', 'enrolled'], 0], '#fffbeb', '#fdf4ff'],
            'circle-stroke-width': 0.6,
            'circle-stroke-opacity': 0.5,
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
            abbr: f.properties.abbr || null,
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

  const openUni = async (u: { name: string; state: string; enrolled: number; abbr: string | null; lng: number; lat: number }) => {
    const map = mapRef.current;
    if (!map) return;
    setSelected({ name: u.name, state: u.state, enrolled: u.enrolled, abbr: u.abbr });
    setClubs([]);
    setStudentCount(u.enrolled);
    setDetailLoading(true);
    if (popupRef.current) popupRef.current.remove();
    map.flyTo({ center: [u.lng, u.lat], zoom: Math.max(map.getZoom(), 9), duration: 900 });

    // Fetch live data from DB — try abbreviation first, then full name
    const candidates = [u.abbr, u.name].filter(Boolean) as string[];
    try {
      const { count: sCount } = await supabase
        .from('profiles')
        .select('user_id', { count: 'exact', head: true })
        .in('university', candidates);
      const { data: clubRows } = await supabase
        .from('clubs_profiles')
        .select('id, club_name, category, member_count, logo_url')
        .in('university', candidates)
        .order('member_count', { ascending: false })
        .limit(50);
      setStudentCount(sCount || 0);
      setClubs((clubRows as ClubLite[]) || []);
    } catch (e) {
      console.error('Uni detail fetch failed', e);
    } finally {
      setDetailLoading(false);
    }
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

  // Layer visibility toggles
  useEffect(() => {
    const map = mapRef.current;
    if (!map || loading) return;
    const set = (id: string, vis: boolean) => {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', vis ? 'visible' : 'none');
    };
    set('unis-core', showDots);
    set('unis-glow', showDots);
    set('clusters', showClusters);
    set('clusters-glow', showClusters);
    set('cluster-count', showClusters);
    set('carto-labels', showLabels);
    set('carto-borders', showBorders);
  }, [showDots, showClusters, showLabels, showBorders, loading]);

  // Active-only filter
  useEffect(() => {
    const map = mapRef.current;
    if (!map || loading) return;
    if (map.getLayer('unis-core')) {
      map.setFilter('unis-core', activeOnly
        ? ['all', ['!', ['has', 'point_count']], ['>', ['get', 'enrolled'], 0]]
        : ['!', ['has', 'point_count']]);
    }
    if (map.getLayer('unis-glow')) {
      map.setFilter('unis-glow', activeOnly
        ? ['all', ['!', ['has', 'point_count']], ['>', ['get', 'enrolled'], 0]]
        : ['!', ['has', 'point_count']]);
    }
  }, [activeOnly, loading]);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full bg-[#03060d] overflow-hidden"
      style={{ height: fullscreen ? '100vh' : 'calc(100vh - 64px)' }}
    >
      {/* MAP */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Wireframe grid + vignette + corner brackets */}
      <div className="pointer-events-none absolute inset-0 z-10 sci-fi-grid" />
      <div className="pointer-events-none absolute inset-0 z-10 sci-fi-vignette" />
      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="absolute top-3 left-3 w-8 h-8 border-l border-t border-cyan-400/70" />
        <div className="absolute top-3 right-3 w-8 h-8 border-r border-t border-cyan-400/70" />
        <div className="absolute bottom-3 left-3 w-8 h-8 border-l border-b border-cyan-400/70" />
        <div className="absolute bottom-3 right-3 w-8 h-8 border-r border-b border-cyan-400/70" />
        {/* HUD ticks */}
        <div className="absolute left-1/2 top-2 -translate-x-1/2 flex items-center gap-1 text-cyan-300/70 font-mono text-[9px] tracking-[0.3em]">
          <span className="w-3 h-px bg-cyan-300/70" />SECTOR · IND-01<span className="w-3 h-px bg-cyan-300/70" />
        </div>
      </div>

      {/* Top HUD: title pill */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-sm bg-cyan-500/5 border border-cyan-400/40 backdrop-blur-md">
        <p className="text-[10px] uppercase tracking-[0.45em] text-cyan-200 font-mono">UNIGRAMM · NETWORK GRID</p>
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
        <button
          onClick={() => setPanelOpen(v => !v)}
          title="Controls"
          className={`w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition-colors ${panelOpen ? 'bg-fuchsia-500/20 border-fuchsia-400/60 text-fuchsia-100' : 'bg-black/40 border-fuchsia-400/30 text-fuchsia-300 hover:border-fuchsia-400/60'}`}
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      {/* Right-side full-height gradient sidebar */}
      <aside
        className={`absolute top-0 right-0 z-20 h-full w-[340px] flex flex-col transition-transform duration-300 ${panelOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{
          background: 'linear-gradient(180deg, rgba(20,3,40,0.92) 0%, rgba(40,7,80,0.85) 35%, rgba(15,2,30,0.92) 100%)',
          backdropFilter: 'blur(18px)',
          borderLeft: '1px solid rgba(217,70,239,0.35)',
          boxShadow: '-20px 0 60px rgba(217,70,239,0.18)',
        }}
      >
        {/* Pulse line on left edge */}
        <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-fuchsia-400/80 to-transparent" />

        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-fuchsia-400/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {selected && (
              <button onClick={() => { setSelected(null); popupRef.current?.remove(); }} className="text-fuchsia-300/70 hover:text-fuchsia-100 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <p className="text-[10px] uppercase tracking-[0.3em] font-mono text-fuchsia-300">
              {selected ? 'Campus Intel' : 'Grid Controls'}
            </p>
            <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse" />
          </div>
          <button
            onClick={() => setPanelOpen(false)}
            title="Collapse"
            className="text-fuchsia-300/60 hover:text-fuchsia-100"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto sci-fi-scroll">
          {!selected ? (
            <div className="flex flex-col">
              {/* Search */}
              <div className="px-4 pt-4">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/40 border border-fuchsia-400/30 focus-within:border-fuchsia-400/70 transition-colors">
                  <Search className="w-4 h-4 text-fuchsia-300 shrink-0" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search university or state…"
                    className="bg-transparent outline-none text-xs text-fuchsia-100 placeholder:text-fuchsia-300/40 flex-1"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="text-fuchsia-300/60 hover:text-fuchsia-200">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {results.length > 0 && (
                  <div className="mt-2 max-h-60 overflow-y-auto rounded-lg bg-black/30 border border-fuchsia-400/20">
                    {results.map((u, i) => (
                      <button
                        key={i}
                        onClick={() => openUni(u)}
                        className="w-full text-left px-3 py-2 hover:bg-fuchsia-500/10 border-b border-fuchsia-500/10 last:border-0 transition-colors"
                      >
                        <p className="text-[10px] uppercase tracking-widest text-fuchsia-300/70">{u.state}</p>
                        <p className="text-xs text-fuchsia-100 font-medium leading-tight">{u.name}</p>
                        {u.enrolled > 0 && <p className="text-[10px] text-yellow-300 mt-0.5">👥 {u.enrolled} enrolled</p>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Layer toggles */}
              <div className="px-4 pt-4 pb-2">
                <p className="text-[10px] uppercase tracking-[0.3em] font-mono text-fuchsia-300/70 mb-2">Layers</p>
                <div className="flex flex-col gap-1">
                  <ToggleRow icon={<MapPin className="w-3.5 h-3.5" />} label="University dots" on={showDots} onChange={setShowDots} />
                  <ToggleRow icon={<Hexagon className="w-3.5 h-3.5" />} label="Clusters" on={showClusters} onChange={setShowClusters} />
                  <ToggleRow icon={<Type className="w-3.5 h-3.5" />} label="Place labels" on={showLabels} onChange={setShowLabels} />
                  <ToggleRow icon={<Globe2 className="w-3.5 h-3.5" />} label="State borders" on={showBorders} onChange={setShowBorders} />
                  <ToggleRow icon={<Star className="w-3.5 h-3.5" />} label="Active campuses only" on={activeOnly} onChange={setActiveOnly} accent />
                </div>
              </div>

              {/* Legend */}
              <div className="px-4 pt-3 pb-4 border-t border-fuchsia-400/15 mt-2">
                <p className="text-[10px] uppercase tracking-[0.3em] font-mono text-fuchsia-300/70 mb-2">Legend</p>
                <div className="flex flex-col gap-1.5 text-[11px] text-fuchsia-100/80">
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-yellow-300 shadow-[0_0_8px_#fde047]" />Active (has students)</div>
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-fuchsia-300/70 shadow-[0_0_6px_#e879f9]" />Listed university</div>
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-fuchsia-500" />Cluster (zoom in)</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Hero */}
              <div className="px-5 pt-5 pb-4 border-b border-fuchsia-400/20 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-fuchsia-500/20 blur-3xl pointer-events-none" />
                <Badge variant="outline" className="border-fuchsia-400/40 text-fuchsia-200 text-[10px] mb-2">{selected.state}</Badge>
                <h2 className="text-base font-bold text-fuchsia-50 leading-tight">{selected.name}</h2>
                {selected.abbr && (
                  <p className="text-[10px] uppercase tracking-[0.25em] text-fuchsia-300/70 font-mono mt-1">ID · {selected.abbr}</p>
                )}

                {/* Stat tiles */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="p-2.5 rounded-lg bg-gradient-to-br from-yellow-500/15 to-yellow-500/5 border border-yellow-400/30">
                    <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-yellow-300/80">
                      <Users className="w-3 h-3" /> Students
                    </div>
                    <p className="text-lg font-bold text-yellow-200 font-mono mt-0.5">{studentCount}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gradient-to-br from-fuchsia-500/15 to-fuchsia-500/5 border border-fuchsia-400/30">
                    <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-fuchsia-300/80">
                      <Building2 className="w-3 h-3" /> Clubs
                    </div>
                    <p className="text-lg font-bold text-fuchsia-100 font-mono mt-0.5">{clubs.length}</p>
                  </div>
                </div>
              </div>

              {/* Clubs list */}
              <div className="px-5 pt-4 pb-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] uppercase tracking-[0.3em] font-mono text-fuchsia-300/70">Registered Clubs</p>
                  {detailLoading && <Loader2 className="w-3 h-3 animate-spin text-fuchsia-300" />}
                </div>
                {!detailLoading && clubs.length === 0 && (
                  <div className="text-center py-8 px-3 rounded-lg border border-dashed border-fuchsia-400/20 text-[11px] text-fuchsia-300/50">
                    No clubs registered yet for this campus.
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  {clubs.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-black/30 border border-fuchsia-400/15 hover:border-fuchsia-400/40 hover:bg-fuchsia-500/5 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-md bg-gradient-to-br from-fuchsia-500/30 to-purple-700/30 border border-fuchsia-400/30 flex items-center justify-center overflow-hidden shrink-0">
                        {c.logo_url ? (
                          <img src={c.logo_url} alt="" className="w-full h-full object-cover" onError={(e) => ((e.target as HTMLImageElement).src = '/default-avatar.png')} />
                        ) : (
                          <Building2 className="w-4 h-4 text-fuchsia-200" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-fuchsia-50 truncate">{c.club_name}</p>
                        <p className="text-[10px] text-fuchsia-300/70 truncate">
                          {c.category || 'General'} · {c.member_count || 0} members
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer ribbon */}
        <div className="px-5 py-2.5 border-t border-fuchsia-400/20 flex items-center justify-between text-[9px] font-mono text-fuchsia-300/60 shrink-0">
          <span>UNIGRAMM · LIVE</span>
          <span className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" /> SYNCED
          </span>
        </div>
      </aside>

      {/* Collapsed re-open tab */}
      {!panelOpen && (
        <button
          onClick={() => setPanelOpen(true)}
          className="absolute top-1/2 right-0 -translate-y-1/2 z-20 h-16 w-7 rounded-l-lg bg-fuchsia-500/20 backdrop-blur-md border border-r-0 border-fuchsia-400/40 flex items-center justify-center text-fuchsia-200 hover:bg-fuchsia-500/30 transition-colors"
          title="Open panel"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
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
        .sci-fi-scroll::-webkit-scrollbar { width: 6px; }
        .sci-fi-scroll::-webkit-scrollbar-track { background: transparent; }
        .sci-fi-scroll::-webkit-scrollbar-thumb { background: rgba(217,70,239,0.3); border-radius: 3px; }
        .sci-fi-scroll::-webkit-scrollbar-thumb:hover { background: rgba(217,70,239,0.5); }
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

const ToggleRow: React.FC<{ icon: React.ReactNode; label: string; on: boolean; onChange: (v: boolean) => void; accent?: boolean }> = ({ icon, label, on, onChange, accent }) => (
  <button
    onClick={() => onChange(!on)}
    className={`group w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border transition-all ${on ? (accent ? 'bg-yellow-500/10 border-yellow-400/40' : 'bg-fuchsia-500/10 border-fuchsia-400/40') : 'bg-transparent border-transparent hover:bg-fuchsia-500/5 hover:border-fuchsia-400/20'}`}
  >
    <div className="flex items-center gap-2 min-w-0">
      <span className={on ? (accent ? 'text-yellow-300' : 'text-fuchsia-200') : 'text-fuchsia-300/50'}>{icon}</span>
      <span className={`text-xs truncate ${on ? (accent ? 'text-yellow-100' : 'text-fuchsia-100') : 'text-fuchsia-300/60'}`}>{label}</span>
    </div>
    <span className={`relative w-8 h-4 rounded-full transition-colors ${on ? (accent ? 'bg-yellow-400/70' : 'bg-fuchsia-400/70') : 'bg-fuchsia-300/15'}`}>
      <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-[0_0_8px_rgba(255,255,255,0.5)] ${on ? 'left-[18px]' : 'left-0.5'}`} />
    </span>
  </button>
);

export default AdminUniversityMap;
