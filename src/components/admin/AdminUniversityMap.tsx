import React, { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { Map as MLMap, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { STATE_COORDS, STATE_RADIUS } from '@/data/indianStateCoords';
import {
  Loader2, Search, Maximize2, Minimize2, X, ChevronRight, ChevronLeft,
  ArrowLeft, Users, Building2, Crosshair, Radio, Activity, Database, Layers,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type UniMap = Record<string, string[]>;
type Univ = { name: string; state: string; lng: number; lat: number; enrolled: number; abbr: string | null };
type ClubLite = { id: string; club_name: string; category: string | null; member_count: number | null; logo_url: string | null };

function extractAbbr(name: string): string | null {
  const m = name.match(/\(([A-Z][A-Z0-9&.\- ]{1,15})\)\s*$/);
  return m ? m[1].trim() : null;
}
function seeded(i: number) {
  const x = Math.sin(i * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}
function fmtCoord(lat: number, lng: number) {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(3)}°${ns}  ${Math.abs(lng).toFixed(3)}°${ew}`;
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
  const [selected, setSelected] = useState<{ name: string; state: string; enrolled: number; abbr: string | null; lng: number; lat: number } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [clubs, setClubs] = useState<ClubLite[]>([]);
  const [studentCount, setStudentCount] = useState<number>(0);
  const [search, setSearch] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const [intelOpen, setIntelOpen] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());

  // animated counter for "uniques pinned"
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // count up animation when stats arrive
  useEffect(() => {
    if (!stats.universities) return;
    let raf = 0;
    const start = performance.now();
    const dur = 1200;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setCounter(Math.floor(stats.universities * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stats.universities]);

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
      let total = 0, c = 0;
      Object.entries(data).forEach(([state, list]) => {
        const center = STATE_COORDS[state];
        const radius = STATE_RADIUS[state] || 1.2;
        if (!center) return;
        list.forEach((name) => {
          const r1 = seeded(c * 2);
          const r2 = seeded(c * 2 + 1);
          const angle = r1 * Math.PI * 2;
          const dist = Math.sqrt(r2) * radius;
          const lng = center.lng + Math.cos(angle) * dist;
          const lat = center.lat + Math.sin(angle) * dist * 0.85;
          c++; total++;
          const abbr = extractAbbr(name);
          const enrolled = (abbr && enrolledMap[abbr]) || enrolledMap[name] || 0;
          flat.push({ name, state, lng, lat, enrolled, abbr });
          features.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [lng, lat] },
            properties: { name, state, enrolled, abbr: abbr || '' },
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
                'https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png',
                'https://b.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png',
                'https://c.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png',
                'https://d.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png',
              ],
              tileSize: 256,
              attribution: '© OSM © CARTO',
            },
            'carto-labels': {
              type: 'raster',
              tiles: [
                'https://a.basemaps.cartocdn.com/rastertiles/dark_only_labels/{z}/{x}/{y}@2x.png',
                'https://b.basemaps.cartocdn.com/rastertiles/dark_only_labels/{z}/{x}/{y}@2x.png',
                'https://c.basemaps.cartocdn.com/rastertiles/dark_only_labels/{z}/{x}/{y}@2x.png',
              ],
              tileSize: 256,
            },
          },
          layers: [
            { id: 'bg', type: 'background', paint: { 'background-color': '#080c12' } },
            { id: 'carto-dark', type: 'raster', source: 'carto-dark', paint: { 'raster-opacity': 0.85, 'raster-saturation': -0.3, 'raster-contrast': 0.15, 'raster-hue-rotate': 190, 'raster-brightness-min': 0.05, 'raster-brightness-max': 0.85 } },
            { id: 'carto-labels', type: 'raster', source: 'carto-labels', paint: { 'raster-opacity': 0.9, 'raster-contrast': 0.3, 'raster-brightness-min': 0.5, 'raster-brightness-max': 1, 'raster-hue-rotate': 190, 'raster-saturation': -0.4 } },
          ],
        },
        center: [82.5, 22.5],
        zoom: 4.2,
        minZoom: 2,
        maxZoom: 16,
        attributionControl: false,
        pitch: 0,
      });
      mapRef.current = map;

      map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'bottom-right');
      map.addControl(new maplibregl.AttributionControl({ compact: true }));

      // Build amber diamond SVG marker
      const buildDiamond = (size = 64) => {
        const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">
          <defs>
            <radialGradient id="g" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#f5c518" stop-opacity="0.55"/>
              <stop offset="60%" stop-color="#f5c518" stop-opacity="0.05"/>
              <stop offset="100%" stop-color="#f5c518" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <circle cx="32" cy="32" r="28" fill="url(#g)"/>
          <g transform="translate(32 32) rotate(45)">
            <rect x="-9" y="-9" width="18" height="18" fill="none" stroke="#f5c518" stroke-width="1.5"/>
            <rect x="-4" y="-4" width="8" height="8" fill="#f5c518"/>
          </g>
        </svg>`;
        return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
      };

      map.on('load', async () => {
        if (!map) return;

        // load amber marker images
        await new Promise<void>((res) => {
          const img = new Image(64, 64);
          img.onload = () => { if (!map!.hasImage('amber-diamond')) map!.addImage('amber-diamond', img as any); res(); };
          img.onerror = () => res();
          img.src = buildDiamond(64);
        });
        await new Promise<void>((res) => {
          const img = new Image(64, 64);
          img.onload = () => { if (!map!.hasImage('amber-diamond-active')) map!.addImage('amber-diamond-active', img as any); res(); };
          img.onerror = () => res();
          img.src = buildDiamond(80);
        });

        map.addSource('unis', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features },
          cluster: true,
          clusterMaxZoom: 8,
          clusterRadius: 45,
        });

        // Pulsing glow halo behind every pin (animated via paint updates)
        map.addLayer({
          id: 'unis-pulse', type: 'circle', source: 'unis',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-radius': 14,
            'circle-color': '#f5c518',
            'circle-opacity': 0.0,
            'circle-blur': 0.9,
          },
        });
        map.addLayer({
          id: 'unis-glow', type: 'circle', source: 'unis',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-radius': 9,
            'circle-color': '#f5c518',
            'circle-opacity': 0.18,
            'circle-blur': 0.6,
          },
        });

        // Cluster halo (cyan)
        map.addLayer({
          id: 'clusters-glow', type: 'circle', source: 'unis',
          filter: ['has', 'point_count'],
          paint: {
            'circle-radius': ['step', ['get', 'point_count'], 26, 50, 36, 200, 48, 1000, 64],
            'circle-color': '#00c8ff',
            'circle-opacity': 0.08,
            'circle-blur': 1,
          },
        });
        map.addLayer({
          id: 'clusters', type: 'circle', source: 'unis',
          filter: ['has', 'point_count'],
          paint: {
            'circle-radius': ['step', ['get', 'point_count'], 14, 50, 18, 200, 24, 1000, 32],
            'circle-color': '#0a1822',
            'circle-stroke-color': '#00c8ff',
            'circle-stroke-width': 1,
            'circle-opacity': 0.85,
          },
        });
        map.addLayer({
          id: 'cluster-count', type: 'symbol', source: 'unis',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-size': 11,
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-letter-spacing': 0.1,
          },
          paint: { 'text-color': '#00c8ff' },
        });

        // Diamond markers
        map.addLayer({
          id: 'unis-pins', type: 'symbol', source: 'unis',
          filter: ['!', ['has', 'point_count']],
          layout: {
            'icon-image': 'amber-diamond',
            'icon-size': ['interpolate', ['linear'], ['zoom'], 4, 0.35, 8, 0.55, 12, 0.8, 16, 1.1],
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
          },
          paint: {
            'icon-opacity': ['case', ['>', ['get', 'enrolled'], 0], 1, 0.75],
          },
        });

        // Animate the pulse ring (radius + opacity sine)
        let pulseRaf = 0;
        const startPulse = (t0: number) => {
          const tick = (t: number) => {
            const p = ((t - t0) % 1800) / 1800; // 1.8s loop
            const r = 10 + p * 26;
            const o = 0.45 * (1 - p);
            if (map && map.getLayer('unis-pulse')) {
              map.setPaintProperty('unis-pulse', 'circle-radius', r);
              map.setPaintProperty('unis-pulse', 'circle-opacity', o);
            }
            pulseRaf = requestAnimationFrame(tick);
          };
          pulseRaf = requestAnimationFrame(tick);
        };
        startPulse(performance.now());
        (map as any).__pulseRaf = () => cancelAnimationFrame(pulseRaf);

        const setPointer = () => (map!.getCanvas().style.cursor = 'crosshair');
        const resetPointer = () => (map!.getCanvas().style.cursor = '');
        map.on('mouseenter', 'clusters', setPointer);
        map.on('mouseleave', 'clusters', resetPointer);
        map.on('mouseenter', 'unis-pins', () => {
          setPointer();
          if (map!.getLayer('unis-glow')) {
            map!.setPaintProperty('unis-glow', 'circle-radius', 14);
            map!.setPaintProperty('unis-glow', 'circle-opacity', 0.32);
          }
        });
        map.on('mouseleave', 'unis-pins', () => {
          resetPointer();
          if (map!.getLayer('unis-glow')) {
            map!.setPaintProperty('unis-glow', 'circle-radius', 9);
            map!.setPaintProperty('unis-glow', 'circle-opacity', 0.18);
          }
        });

        // Hover HUD card
        const hoverPopup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 16, className: 'hud-popup' });
        map.on('mouseenter', 'unis-pins', (e) => {
          const f = e.features?.[0] as any; if (!f) return;
          const [lng, lat] = f.geometry.coordinates;
          const html = `
            <div class="hud-card">
              <div class="hud-card-bracket tl"></div><div class="hud-card-bracket tr"></div>
              <div class="hud-card-bracket bl"></div><div class="hud-card-bracket br"></div>
              <div class="hud-card-row">
                <span class="hud-card-label">// TARGET</span>
                <span class="hud-card-status">● STATUS: ACTIVE</span>
              </div>
              <div class="hud-card-name">${escapeHtml(f.properties.name)}</div>
              <div class="hud-card-meta">${escapeHtml(f.properties.state)}${f.properties.abbr ? ' · ID ' + escapeHtml(f.properties.abbr) : ''}</div>
              <div class="hud-card-coord">${fmtCoord(lat, lng)}</div>
              <div class="hud-card-row">
                <span class="hud-card-stat">ENROLL <b>${f.properties.enrolled || 0}</b></span>
                <span class="hud-card-stat">SECTOR <b>IND-01</b></span>
              </div>
            </div>`;
          hoverPopup.setLngLat([lng, lat]).setHTML(html).addTo(map!);
        });
        map.on('mouseleave', 'unis-pins', () => hoverPopup.remove());

        map.on('click', 'clusters', (e) => {
          const f = e.features?.[0] as any; if (!f) return;
          (map!.getSource('unis') as any).getClusterExpansionZoom(f.properties.cluster_id, (err: any, zoom: number) => {
            if (err) return;
            map!.easeTo({ center: f.geometry.coordinates, zoom });
          });
        });

        map.on('click', 'unis-pins', (e) => {
          const f = e.features?.[0] as any; if (!f) return;
          const [lng, lat] = f.geometry.coordinates;
          const html = `
            <div class="hud-card hud-card-anchored">
              <div class="hud-card-bracket tl"></div><div class="hud-card-bracket tr"></div>
              <div class="hud-card-bracket bl"></div><div class="hud-card-bracket br"></div>
              <div class="hud-card-row">
                <span class="hud-card-label">// LOCKED</span>
                <span class="hud-card-status">● STATUS: ACTIVE</span>
              </div>
              <div class="hud-card-name">${escapeHtml(f.properties.name)}</div>
              <div class="hud-card-meta">${escapeHtml(f.properties.state)}${f.properties.abbr ? ' · ID ' + escapeHtml(f.properties.abbr) : ''}</div>
              <div class="hud-card-coord">${fmtCoord(lat, lng)}</div>
              <div class="hud-card-row">
                <span class="hud-card-stat">ENROLL <b>${f.properties.enrolled || 0}</b></span>
                <span class="hud-card-stat">SECTOR <b>IND-01</b></span>
              </div>
            </div>`;
          if (popupRef.current) popupRef.current.remove();
          popupRef.current = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 18, className: 'hud-popup' })
            .setLngLat([lng, lat]).setHTML(html).addTo(map!);
          openUni({
            name: f.properties.name,
            state: f.properties.state,
            enrolled: Number(f.properties.enrolled || 0),
            abbr: f.properties.abbr || null,
            lng, lat,
          });
        });

        setLoading(false);
      });
    })();

    return () => {
      mounted = false;
      if (popupRef.current) popupRef.current.remove();
      if (map) { try { (map as any).__pulseRaf?.(); } catch {} map.remove(); }
    };
  }, []);

  const openUni = async (u: { name: string; state: string; enrolled: number; abbr: string | null; lng: number; lat: number }) => {
    const map = mapRef.current; if (!map) return;
    setSelected(u);
    setDetailOpen(true);
    setClubs([]);
    setStudentCount(u.enrolled);
    setDetailLoading(true);
    map.flyTo({ center: [u.lng, u.lat], zoom: Math.max(map.getZoom(), 9), duration: 900 });

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
    const el = wrapperRef.current; if (!el) return;
    if (!document.fullscreenElement) { await el.requestFullscreen?.(); setFullscreen(true); }
    else { await document.exitFullscreen?.(); setFullscreen(false); }
  };

  useEffect(() => {
    const onFs = () => {
      setFullscreen(!!document.fullscreenElement);
      setTimeout(() => mapRef.current?.resize(), 250);
    };
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  useEffect(() => {
    const onResize = () => mapRef.current?.resize();
    window.addEventListener('resize', onResize);
    const t = setTimeout(onResize, 300);
    return () => { window.removeEventListener('resize', onResize); clearTimeout(t); };
  }, [intelOpen, detailOpen]);

  const totalEnrolled = Object.values(enrolledByUniv).reduce((a, b) => a + b, 0);
  const ts = now.toISOString().replace('T', ' ').slice(0, 19) + 'Z';

  return (
    <div
      ref={wrapperRef}
      className="hud-root relative w-full overflow-hidden"
      style={{ height: fullscreen ? '100vh' : 'calc(100vh - 64px)', background: '#080c12' }}
    >
      {/* TOP BAR */}
      <div className="hud-topbar absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 h-11">
        <div className="flex items-center gap-3 min-w-0">
          <Crosshair className="w-3.5 h-3.5 text-[#00c8ff]" />
          <span className="hud-mono text-[11px] text-[#7fb6c8] truncate">
            MAP_VIEW <span className="text-[#00c8ff]/50">&gt;</span> UNIVERSITIES <span className="text-[#00c8ff]/50">&gt;</span> <span className="text-[#c8d8e8]">GLOBAL</span>
          </span>
        </div>
        <div className="hud-title hidden md:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
          <span className="text-[#f5c518] text-[13px] font-bold tracking-[0.18em]" style={{ fontFamily: 'Rajdhani, sans-serif' }}>UNIGRAMM</span>
          <span className="text-[#00c8ff]/40">//</span>
          <span className="text-[#c8d8e8] text-[13px] font-semibold tracking-[0.18em]" style={{ fontFamily: 'Rajdhani, sans-serif' }}>CAMPUS NETWORK INTELLIGENCE</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hud-mono text-[10px] text-[#7fb6c8] hidden sm:inline">{ts}</span>
          <span className="flex items-center gap-1.5">
            <span className="hud-blink w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_8px_#00ff88]" />
            <span className="hud-mono text-[10px] text-[#00ff88]">SYSTEM ONLINE</span>
          </span>
        </div>
        <div className="hud-scanline" />
      </div>

      {/* MAP */}
      <div ref={containerRef} className="absolute inset-0" style={{ top: 44 }} />

      {/* Overlays */}
      <div className="pointer-events-none absolute inset-0 z-[5] hud-globe" style={{ top: 44 }} aria-hidden="true">
        <svg viewBox="-200 -200 400 400" preserveAspectRatio="xMidYMid meet" className="w-full h-full opacity-60">
          <defs>
            <radialGradient id="globeFade" cx="50%" cy="50%" r="50%">
              <stop offset="55%" stopColor="rgba(0,200,255,0.35)" />
              <stop offset="100%" stopColor="rgba(0,200,255,0)" />
            </radialGradient>
            <mask id="globeMask"><circle cx="0" cy="0" r="180" fill="url(#globeFade)" /></mask>
          </defs>
          <g mask="url(#globeMask)" fill="none" stroke="#00c8ff" strokeWidth="0.5" opacity="0.55">
            <circle cx="0" cy="0" r="180" />
            {/* Latitude lines (ellipses) */}
            {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((y) => (
              <line key={'lat'+y} x1="-180" y1={y} x2="180" y2={y} />
            ))}
            {/* Longitude lines (vertical ellipses) */}
            {[20, 50, 80, 110, 140, 170].map((rx) => (
              <g key={'lng'+rx}>
                <ellipse cx="0" cy="0" rx={rx} ry="180" />
              </g>
            ))}
            {/* Equator emphasis */}
            <line x1="-180" y1="0" x2="180" y2="0" stroke="#00c8ff" strokeWidth="0.8" opacity="0.7" />
            <ellipse cx="0" cy="0" rx="180" ry="180" stroke="#00c8ff" strokeWidth="0.8" opacity="0.7" />
          </g>
        </svg>
      </div>
      <div className="pointer-events-none absolute inset-0 z-10 hud-grid" style={{ top: 44 }} />
      <div className="pointer-events-none fixed inset-0 z-[60] hud-crt" />

      {/* Corner brackets on map */}
      <div className="pointer-events-none absolute z-20" style={{ top: 56, left: 12, right: 12, bottom: 12 }}>
        <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-[#00c8ff]" />
        <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-[#00c8ff]" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-[#00c8ff]" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-[#00c8ff]" />
      </div>

      {/* LEFT INTEL SIDEBAR */}
      <aside
        className={`hud-panel absolute left-0 z-20 flex flex-col transition-transform duration-300 ${intelOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ top: 44, bottom: 0, width: 300 }}
      >
        <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-[#00c8ff]/20">
          <span className="hud-mono text-[10px] text-[#00c8ff] tracking-[0.2em]">// INTEL OVERVIEW</span>
          <button onClick={() => setIntelOpen(false)} className="text-[#7fb6c8] hover:text-[#00c8ff]">
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hud-scroll">
          {/* Search */}
          <div className="px-4 pt-3">
            <div className="hud-input flex items-center gap-2 px-2.5 py-1.5">
              <Search className="w-3.5 h-3.5 text-[#00c8ff]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="QUERY UNIVERSITY..."
                className="bg-transparent outline-none text-[11px] text-[#c8d8e8] placeholder:text-[#7fb6c8]/50 flex-1 hud-mono uppercase tracking-wider"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-[#7fb6c8] hover:text-[#00c8ff]"><X className="w-3 h-3" /></button>
              )}
            </div>
            {results.length > 0 && (
              <div className="mt-2 max-h-56 overflow-y-auto hud-scroll border border-[#00c8ff]/20 bg-black/40">
                {results.map((u, i) => (
                  <button
                    key={i}
                    onClick={() => openUni(u)}
                    className="w-full text-left px-2.5 py-1.5 border-b border-[#00c8ff]/10 last:border-0 hover:bg-[#00c8ff]/5 transition-colors"
                  >
                    <p className="hud-mono text-[9px] text-[#7fb6c8] tracking-widest uppercase">{u.state}</p>
                    <p className="text-[11px] text-[#c8d8e8] leading-tight" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>{u.name}</p>
                    {u.enrolled > 0 && <p className="hud-mono text-[9px] text-[#f5c518] mt-0.5">ENROLL · {u.enrolled}</p>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="px-4 pt-4 flex flex-col gap-2">
            <StatRow icon={<Database className="w-3 h-3" />} label="UNIVERSITIES PINNED" value={counter.toLocaleString()} />
            <StatRow icon={<Layers className="w-3 h-3" />} label="REGIONS COVERED" value={String(stats.states)} />
            <StatRow icon={<Users className="w-3 h-3" />} label="ACTIVE CAMPUSES" value={String(Object.keys(enrolledByUniv).length)} />
            <StatRow icon={<Activity className="w-3 h-3" />} label="TOTAL ENROLLED" value={totalEnrolled.toLocaleString()} />
            <StatRow icon={<Radio className="w-3 h-3" />} label="LAST SYNC" value={ts.slice(11)} small />
          </div>

          {/* Legend */}
          <div className="px-4 pt-5 pb-4">
            <p className="hud-mono text-[10px] text-[#7fb6c8] tracking-[0.2em] mb-2">// LEGEND</p>
            <div className="flex flex-col gap-1.5 text-[10px] text-[#c8d8e8] hud-mono">
              <div className="flex items-center gap-2"><Diamond color="#f5c518" />UNIVERSITY · TARGET</div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_6px_#00ff88]" />ACTIVE · ENROLLED</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border border-[#00c8ff]" />CLUSTER · ZOOM IN</div>
            </div>
          </div>
        </div>

        <div className="px-4 py-2 border-t border-[#00c8ff]/20 flex items-center justify-between">
          <span className="hud-mono text-[9px] text-[#7fb6c8]">UNIGRAMM · TACTICAL</span>
          <span className="hud-mono text-[9px] text-[#00ff88] flex items-center gap-1">
            <span className="hud-blink w-1 h-1 rounded-full bg-[#00ff88]" /> LIVE
          </span>
        </div>
      </aside>

      {!intelOpen && (
        <button
          onClick={() => setIntelOpen(true)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 h-16 w-7 bg-[#080e1a]/90 border border-l-0 border-[#00c8ff]/40 flex items-center justify-center text-[#00c8ff] hover:bg-[#0a1828]"
          style={{ borderRadius: '0 4px 4px 0' }}
          title="Open intel"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* TOP-RIGHT: search + fullscreen quick actions */}
      <div className="absolute z-30 flex items-center gap-2" style={{ top: 56, right: 28 }}>
        <button
          onClick={toggleFullscreen}
          title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          className="w-9 h-9 bg-[#080e1a]/85 border border-[#00c8ff]/30 hover:border-[#00c8ff]/70 text-[#00c8ff] flex items-center justify-center"
          style={{ borderRadius: 4 }}
        >
          {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* RIGHT DETAIL PANEL */}
      <aside
        className={`hud-panel absolute right-0 z-20 flex flex-col transition-transform duration-300 ${detailOpen && selected ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ top: 44, bottom: 0, width: 340 }}
      >
        {selected && (
          <>
            <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-[#00c8ff]/20">
              <div className="flex items-center gap-2">
                <button onClick={() => setDetailOpen(false)} className="text-[#7fb6c8] hover:text-[#00c8ff]">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="hud-mono text-[10px] text-[#00c8ff] tracking-[0.2em]">// CAMPUS DOSSIER</span>
              </div>
              <span className="hud-blink w-1.5 h-1.5 rounded-full bg-[#00ff88]" />
            </div>

            <div className="flex-1 overflow-y-auto hud-scroll">
              <div className="px-5 pt-4 pb-3 border-b border-[#00c8ff]/15">
                <p className="hud-mono text-[9px] text-[#7fb6c8] tracking-widest uppercase mb-1">{selected.state}</p>
                <h2 className="text-[#f5c518] leading-tight text-base" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, textShadow: '0 0 8px rgba(245,197,24,0.4)' }}>
                  {selected.name}
                </h2>
                {selected.abbr && (
                  <p className="hud-mono text-[10px] text-[#00c8ff]/80 mt-1">ID · {selected.abbr}</p>
                )}
                <p className="hud-mono text-[10px] text-[#7fb6c8] mt-1">{fmtCoord(selected.lat, selected.lng)}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 border border-[#00ff88]/40 bg-[#00ff88]/5">
                  <span className="hud-blink w-1.5 h-1.5 rounded-full bg-[#00ff88]" />
                  <span className="hud-mono text-[9px] text-[#00ff88]">STATUS: ACTIVE</span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <DataTile label="STUDENTS" value={String(studentCount)} />
                  <DataTile label="CLUBS" value={String(clubs.length)} />
                </div>
              </div>

              <div className="px-5 pt-3 pb-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="hud-mono text-[10px] text-[#7fb6c8] tracking-[0.2em]">// REGISTERED CLUBS</p>
                  {detailLoading && <Loader2 className="w-3 h-3 animate-spin text-[#00c8ff]" />}
                </div>
                {!detailLoading && clubs.length === 0 && (
                  <div className="text-center py-6 px-3 border border-dashed border-[#00c8ff]/20">
                    <p className="hud-mono text-[10px] text-[#7fb6c8]">NO CLUBS · NO SIGNAL</p>
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  {clubs.map((c) => (
                    <div key={c.id} className="flex items-center gap-2.5 p-2 bg-black/30 border border-[#00c8ff]/15 hover:border-[#00c8ff]/40 transition-colors" style={{ borderRadius: 3 }}>
                      <div className="w-8 h-8 bg-[#0a1828] border border-[#00c8ff]/30 flex items-center justify-center overflow-hidden shrink-0" style={{ borderRadius: 2 }}>
                        {c.logo_url ? (
                          <img src={c.logo_url} alt="" className="w-full h-full object-cover" onError={(e) => ((e.target as HTMLImageElement).src = '/default-avatar.png')} />
                        ) : (
                          <Building2 className="w-4 h-4 text-[#00c8ff]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] text-[#c8d8e8] truncate" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>{c.club_name}</p>
                        <p className="hud-mono text-[9px] text-[#7fb6c8] truncate uppercase">
                          {c.category || 'GENERAL'} · {c.member_count || 0} MBR
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </aside>

      {/* Loading */}
      {loading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center" style={{ background: 'rgba(8,12,18,0.92)' }}>
          <div className="flex items-center gap-2 hud-mono text-[#00c8ff] text-xs">
            <Loader2 className="w-4 h-4 animate-spin" />
            ACQUIRING SIGNAL<span className="hud-cursor">_</span>
          </div>
        </div>
      )}

      <style>{`
        .hud-root { font-family: 'Rajdhani', system-ui, sans-serif; color: #c8d8e8; }
        .hud-mono { font-family: 'Share Tech Mono', ui-monospace, monospace; }
        .hud-topbar {
          background: rgba(8, 14, 26, 0.92);
          border-bottom: 1px solid rgba(0, 200, 255, 0.25);
          box-shadow: 0 0 20px rgba(0, 200, 255, 0.08);
          overflow: hidden;
        }
        .hud-scanline {
          position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(90deg, transparent 0%, rgba(0,200,255,0.18) 50%, transparent 100%);
          width: 30%; animation: hudScan 6s linear infinite;
        }
        @keyframes hudScan { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }

        .hud-panel {
          background: rgba(8, 14, 26, 0.85);
          border-right: 1px solid rgba(0, 200, 255, 0.25);
          box-shadow: 0 0 20px rgba(0, 200, 255, 0.1);
          backdrop-filter: blur(10px);
        }
        .hud-panel:last-of-type, .hud-panel + .hud-panel { border-right: none; border-left: 1px solid rgba(0, 200, 255, 0.25); }

        .hud-input {
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(0, 200, 255, 0.3);
          border-radius: 3px;
        }
        .hud-input:focus-within { border-color: rgba(0, 200, 255, 0.7); box-shadow: 0 0 8px rgba(0,200,255,0.2); }

        .hud-grid {
          background-image:
            linear-gradient(rgba(0,200,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,200,255,0.05) 1px, transparent 1px);
          background-size: 40px 40px;
          mask-image: radial-gradient(ellipse at center, rgba(0,0,0,0.85) 30%, transparent 95%);
        }
        .hud-crt {
          background: repeating-linear-gradient(
            to bottom,
            rgba(0, 200, 255, 0.02) 0px,
            rgba(0, 200, 255, 0.02) 1px,
            transparent 1px,
            transparent 3px
          );
        }
        .hud-blink { animation: hudBlink 1.4s steps(2) infinite; }
        @keyframes hudBlink { 0%,49% { opacity: 1; } 50%,100% { opacity: 0.25; } }

        .hud-cursor { animation: hudCursor 1s steps(2) infinite; margin-left: 2px; }
        @keyframes hudCursor { 50% { opacity: 0; } }

        .hud-scroll::-webkit-scrollbar { width: 5px; }
        .hud-scroll::-webkit-scrollbar-track { background: transparent; }
        .hud-scroll::-webkit-scrollbar-thumb { background: rgba(0,200,255,0.3); }
        .hud-scroll::-webkit-scrollbar-thumb:hover { background: rgba(0,200,255,0.6); }

        /* MapLibre overrides */
        .maplibregl-popup.hud-popup .maplibregl-popup-content {
          background: transparent !important; padding: 0 !important; box-shadow: none !important;
        }
        .maplibregl-popup.hud-popup .maplibregl-popup-tip { display: none !important; }
        .hud-globe { mix-blend-mode: screen; }
        .hud-card {
          position: relative;
          min-width: 220px;
          background: rgba(8, 14, 26, 0.92);
          border: 1px solid rgba(0, 200, 255, 0.45);
          box-shadow: 0 0 20px rgba(0, 200, 255, 0.18);
          padding: 10px 12px;
          color: #c8d8e8;
          border-radius: 3px;
          animation: hudFlick 80ms steps(4) both;
        }
        @keyframes hudFlick {
          0% { opacity: 0; transform: translateY(2px); }
          25% { opacity: 0.3; }
          50% { opacity: 0.85; }
          75% { opacity: 0.45; }
          100% { opacity: 1; }
        }
        .hud-card-bracket { position: absolute; width: 8px; height: 8px; border-color: #00c8ff; }
        .hud-card-bracket.tl { top: -1px; left: -1px; border-top: 1px solid; border-left: 1px solid; }
        .hud-card-bracket.tr { top: -1px; right: -1px; border-top: 1px solid; border-right: 1px solid; }
        .hud-card-bracket.bl { bottom: -1px; left: -1px; border-bottom: 1px solid; border-left: 1px solid; }
        .hud-card-bracket.br { bottom: -1px; right: -1px; border-bottom: 1px solid; border-right: 1px solid; }
        .hud-card-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
        .hud-card-label { font-family: 'Share Tech Mono', monospace; font-size: 9px; color: rgba(0,200,255,0.7); letter-spacing: 0.15em; }
        .hud-card-status { font-family: 'Share Tech Mono', monospace; font-size: 9px; color: #00ff88; letter-spacing: 0.1em; }
        .hud-card-name { font-family: 'Rajdhani', sans-serif; font-weight: 700; font-size: 14px; color: #f5c518; line-height: 1.15; margin-top: 4px; text-shadow: 0 0 6px rgba(245,197,24,0.4); }
        .hud-card-meta { font-family: 'Share Tech Mono', monospace; font-size: 9px; color: rgba(127,182,200,0.85); letter-spacing: 0.1em; margin-top: 2px; text-transform: uppercase; }
        .hud-card-coord { font-family: 'Share Tech Mono', monospace; font-size: 10px; color: #00c8ff; opacity: 0.85; margin-top: 6px; }
        .hud-card-stat { font-family: 'Share Tech Mono', monospace; font-size: 9px; color: rgba(127,182,200,0.85); letter-spacing: 0.1em; margin-top: 6px; }
        .hud-card-stat b { color: #f5c518; font-weight: 400; margin-left: 4px; }

        .maplibregl-ctrl-attrib { background: rgba(8,14,26,0.6) !important; color: #7fb6c8 !important; font-size: 9px !important; font-family: 'Share Tech Mono', monospace !important; }
        .maplibregl-ctrl-attrib a { color: #00c8ff !important; }
        .maplibregl-ctrl-group { background: rgba(8,14,26,0.85) !important; border: 1px solid rgba(0,200,255,0.4) !important; border-radius: 3px !important; backdrop-filter: blur(8px); }
        .maplibregl-ctrl-group button { background: transparent !important; }
        .maplibregl-ctrl-group button span { filter: invert(1) hue-rotate(160deg) brightness(1.4); }
      `}</style>
    </div>
  );
};

const StatRow: React.FC<{ icon: React.ReactNode; label: string; value: string; small?: boolean }> = ({ icon, label, value, small }) => (
  <div className="flex items-center justify-between gap-2 pl-2.5 pr-3 py-2 bg-black/25 border border-[#00c8ff]/15" style={{ borderLeft: '3px solid #f5c518', borderRadius: 2 }}>
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-[#f5c518]">{icon}</span>
      <span className="hud-mono text-[9px] tracking-[0.18em] text-[#7fb6c8] truncate">{label}</span>
    </div>
    <span
      className={`hud-mono ${small ? 'text-[10px]' : 'text-[13px]'} text-[#f5c518]`}
      style={{ textShadow: '0 0 8px rgba(245, 197, 24, 0.6)' }}
    >
      {value}
    </span>
  </div>
);

const DataTile: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="px-2.5 py-2 bg-black/30 border border-[#00c8ff]/25" style={{ borderRadius: 3 }}>
    <p className="hud-mono text-[9px] tracking-[0.2em] text-[#7fb6c8]">{label}</p>
    <p className="hud-mono text-lg text-[#f5c518] mt-0.5" style={{ textShadow: '0 0 8px rgba(245,197,24,0.55)' }}>{value}</p>
  </div>
);

const Diamond: React.FC<{ color: string }> = ({ color }) => (
  <span className="inline-block w-2.5 h-2.5 rotate-45 border" style={{ borderColor: color, boxShadow: `0 0 6px ${color}` }} />
);

function escapeHtml(s: string) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

export default AdminUniversityMap;
