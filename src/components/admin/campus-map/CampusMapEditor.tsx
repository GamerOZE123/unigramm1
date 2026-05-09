import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, CircleMarker, ImageOverlay, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Building2, Hexagon, Minus, Diamond, Square, MousePointer2, Trash2, Eye, EyeOff,
  Image as ImageIcon, Download, Copy, Save, Eye as PreviewIcon, MoveUp, MoveDown,
} from 'lucide-react';
import {
  buildSvg, DEFAULT_STYLES, COLOR_PRESETS,
  type Shape, type ShapeType, type LatLng, type ShapeStyle,
} from './geoToSvg';

type Tool = 'select' | ShapeType | 'boundary';

const TOOLS: { id: Tool; label: string; icon: React.ElementType }[] = [
  { id: 'select', label: 'Select', icon: MousePointer2 },
  { id: 'building', label: 'Building', icon: Hexagon },
  { id: 'zone', label: 'Zone', icon: Building2 },
  { id: 'path', label: 'Path', icon: Minus },
  { id: 'landmark', label: 'Landmark', icon: Diamond },
  { id: 'restricted', label: 'Restricted', icon: Square },
];

const DEFAULT_CENTER: [number, number] = [28.4595, 77.4977]; // SNU

function genId() { return crypto.randomUUID(); }

function CoordTooltip({ onMove }: { onMove: (ll: L.LatLng) => void }) {
  useMapEvents({ mousemove: (e) => onMove(e.latlng) });
  return null;
}

function MapClickHandler({
  tool, drafting, onClick, onDblClick,
}: {
  tool: Tool;
  drafting: LatLng[];
  onClick: (ll: L.LatLng) => void;
  onDblClick: () => void;
}) {
  useMapEvents({
    click: (e) => onClick(e.latlng),
    dblclick: () => onDblClick(),
  });
  // Disable native double-click zoom while drawing polygons
  const map = useMap();
  useEffect(() => {
    if (tool !== 'select') map.doubleClickZoom.disable();
    else map.doubleClickZoom.enable();
  }, [tool, map]);
  return null;
}

function MapCenterer({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom); }, [center, zoom, map]);
  return null;
}

const CampusMapEditor: React.FC = () => {
  // Universities
  const [universities, setUniversities] = useState<{ id: string; name: string; abbreviation: string | null }[]>([]);
  const [selectedUni, setSelectedUni] = useState<string>('');

  // Map state
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [zoom, setZoom] = useState<number>(17);

  // Shapes & history
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [boundary, setBoundary] = useState<LatLng[] | null>(null);
  const [history, setHistory] = useState<{ shapes: Shape[]; boundary: LatLng[] | null }[]>([]);
  const [future, setFuture] = useState<{ shapes: Shape[]; boundary: LatLng[] | null }[]>([]);

  const pushHistory = useCallback(() => {
    setHistory((h) => [...h.slice(-49), { shapes: structuredClone(shapes), boundary: boundary ? structuredClone(boundary) : null }]);
    setFuture([]);
  }, [shapes, boundary]);

  // Tool & selection
  const [tool, setTool] = useState<Tool>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drafting, setDrafting] = useState<LatLng[]>([]);

  // Reference image
  const [refImageUrl, setRefImageUrl] = useState<string | null>(null);
  const [refOpacity, setRefOpacity] = useState<number>(50);
  const [refBounds, setRefBounds] = useState<L.LatLngBoundsExpression | null>(null);
  const [cornerStage, setCornerStage] = useState<0 | 1 | 2>(0); // 0 idle, 1 set NW, 2 set SE
  const [refNW, setRefNW] = useState<L.LatLng | null>(null);

  // Coord tooltip
  const [hoverLL, setHoverLL] = useState<L.LatLng | null>(null);

  // Last edit info
  const [lastEdit, setLastEdit] = useState<{ at: string; by: string } | null>(null);

  // Preview modal
  const [previewOpen, setPreviewOpen] = useState(false);

  // Mobile warning
  const [mobileWarn, setMobileWarn] = useState(false);
  useEffect(() => {
    const check = () => setMobileWarn(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Load universities
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('universities')
        .select('id, name, abbreviation')
        .order('name');
      if (data) setUniversities(data as any);
    })();
  }, []);

  // Load existing campus map data
  useEffect(() => {
    if (!selectedUni) return;
    (async () => {
      const { data } = await supabase
        .from('campus_svg_data' as any)
        .select('shapes, boundary_coordinates, center_lat, center_lng, zoom_level, last_edited_at, last_edited_by')
        .eq('university_id', selectedUni)
        .maybeSingle();
      if (data) {
        const d: any = data;
        setShapes((d.shapes as Shape[]) ?? []);
        setBoundary((d.boundary_coordinates as LatLng[]) ?? null);
        if (d.center_lat && d.center_lng) setCenter([Number(d.center_lat), Number(d.center_lng)]);
        if (d.zoom_level) setZoom(d.zoom_level);
        if (d.last_edited_at) setLastEdit({ at: d.last_edited_at, by: d.last_edited_by ?? 'unknown' });
      } else {
        setShapes([]); setBoundary(null); setLastEdit(null);
      }
      setSelectedId(null);
      setHistory([]); setFuture([]);
    })();
  }, [selectedUni]);

  // ----- Drawing -----
  const finishDraft = useCallback(() => {
    if (!drafting.length) return;
    if (tool === 'boundary') {
      if (drafting.length < 3) { setDrafting([]); return; }
      if (boundary && !window.confirm('Replace existing campus boundary?')) {
        setDrafting([]); return;
      }
      pushHistory();
      setBoundary(drafting);
      setDrafting([]);
      setTool('select');
      return;
    }
    if (tool === 'select' || tool === 'landmark') return;
    const min = tool === 'path' ? 2 : 3;
    if (drafting.length < min) { setDrafting([]); return; }
    pushHistory();
    const newShape: Shape = {
      id: genId(),
      type: tool as ShapeType,
      label: '',
      coordinates: drafting,
      style: { ...DEFAULT_STYLES[tool as ShapeType] },
      order: shapes.length,
    };
    setShapes((prev) => [...prev, newShape]);
    setSelectedId(newShape.id);
    setDrafting([]);
    setTool('select');
  }, [tool, drafting, shapes.length, boundary, pushHistory]);

  const onMapClick = useCallback((ll: L.LatLng) => {
    // Reference image corner placement
    if (cornerStage === 1) {
      setRefNW(ll); setCornerStage(2); toast.info('Now click the SE corner');
      return;
    }
    if (cornerStage === 2 && refNW) {
      const nw = refNW;
      const se = ll;
      setRefBounds([[Math.min(nw.lat, se.lat), Math.min(nw.lng, se.lng)] as any, [Math.max(nw.lat, se.lat), Math.max(nw.lng, se.lng)] as any]);
      setCornerStage(0); setRefNW(null);
      toast.success('Reference image placed');
      return;
    }

    if (tool === 'select') return;
    if (tool === 'landmark') {
      pushHistory();
      const newShape: Shape = {
        id: genId(),
        type: 'landmark',
        label: '',
        coordinates: [[ll.lat, ll.lng]],
        style: { ...DEFAULT_STYLES.landmark },
        order: shapes.length,
      };
      setShapes((p) => [...p, newShape]);
      setSelectedId(newShape.id);
      setTool('select');
      return;
    }
    setDrafting((d) => [...d, [ll.lat, ll.lng]]);
  }, [tool, cornerStage, refNW, shapes.length, pushHistory]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'Escape') { setDrafting([]); setSelectedId(null); setTool('select'); return; }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          pushHistory();
          setShapes((s) => s.filter((x) => x.id !== selectedId));
          setSelectedId(null);
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        setHistory((h) => {
          if (!h.length) return h;
          const last = h[h.length - 1];
          setFuture((f) => [...f, { shapes: structuredClone(shapes), boundary: boundary ? structuredClone(boundary) : null }]);
          setShapes(last.shapes); setBoundary(last.boundary);
          return h.slice(0, -1);
        });
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        setFuture((f) => {
          if (!f.length) return f;
          const next = f[f.length - 1];
          setHistory((h) => [...h, { shapes: structuredClone(shapes), boundary: boundary ? structuredClone(boundary) : null }]);
          setShapes(next.shapes); setBoundary(next.boundary);
          return f.slice(0, -1);
        });
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault(); save();
        return;
      }
      const map: Record<string, Tool> = { v: 'select', b: 'building', z: 'zone', p: 'path', l: 'landmark', r: 'restricted' };
      if (map[e.key.toLowerCase()]) { setTool(map[e.key.toLowerCase()]); setDrafting([]); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, shapes, boundary]);

  const selectedShape = shapes.find((s) => s.id === selectedId) || null;

  const updateSelected = (patch: Partial<Shape>) => {
    if (!selectedShape) return;
    pushHistory();
    setShapes((s) => s.map((x) => x.id === selectedShape.id ? { ...x, ...patch } : x));
  };
  const updateSelectedStyle = (patch: Partial<ShapeStyle>) => {
    if (!selectedShape) return;
    pushHistory();
    setShapes((s) => s.map((x) => x.id === selectedShape.id ? { ...x, style: { ...x.style, ...patch } } : x));
  };

  const deleteShape = (id: string) => {
    pushHistory();
    setShapes((s) => s.filter((x) => x.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const reorder = (id: string, dir: -1 | 1) => {
    setShapes((s) => {
      const idx = s.findIndex((x) => x.id === id);
      const j = idx + dir;
      if (idx < 0 || j < 0 || j >= s.length) return s;
      const next = [...s];
      [next[idx], next[j]] = [next[j], next[idx]];
      return next.map((x, i) => ({ ...x, order: i }));
    });
  };

  const toggleHidden = (id: string) => {
    setShapes((s) => s.map((x) => x.id === id ? { ...x, hidden: !x.hidden } : x));
  };

  // ----- Export -----
  const svgString = useMemo(() => buildSvg({ shapes, boundary }), [shapes, boundary]);

  const copySvg = async () => {
    await navigator.clipboard.writeText(svgString);
    toast.success('SVG copied to clipboard');
  };

  const downloadSvg = () => {
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const uni = universities.find((u) => u.id === selectedUni);
    a.download = `${(uni?.abbreviation || 'campus').toLowerCase()}-map.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const save = useCallback(async () => {
    if (!selectedUni) { toast.error('Select a university first'); return; }
    const uni = universities.find((u) => u.id === selectedUni);
    const { data: { user } } = await supabase.auth.getUser();
    const editor = user?.email || 'admin';
    const payload = {
      university_id: selectedUni,
      svg_content: svgString,
      shapes: shapes as any,
      boundary_coordinates: boundary as any,
      center_lat: center[0],
      center_lng: center[1],
      zoom_level: zoom,
      last_edited_by: editor,
      last_edited_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from('campus_svg_data' as any)
      .upsert(payload, { onConflict: 'university_id' });
    if (error) {
      toast.error('Save failed: ' + error.message);
      return;
    }
    setLastEdit({ at: payload.last_edited_at, by: editor });
    toast.success(`Campus map saved for ${uni?.name || 'university'}`);
    // Best-effort activity log (ignore failures)
    try {
      await supabase.from('admin_activity_log' as any).insert({
        action: 'campus_map_updated',
        details: `Campus map updated for ${uni?.name || selectedUni} by ${editor}`,
        actor: editor,
      } as any);
    } catch { /* ignore */ }
  }, [selectedUni, universities, svgString, shapes, boundary, center, zoom]);

  // ----- Reference image upload -----
  const onPickRefImage = (file: File) => {
    const url = URL.createObjectURL(file);
    setRefImageUrl(url);
    setRefBounds(null);
    toast.info('Click "Set NW corner" then click the map to anchor.');
  };

  const cursorClass = tool === 'select' ? '' : 'cursor-crosshair';

  return (
    <div className="flex h-[calc(100vh-60px)] w-full overflow-hidden bg-background">
      {/* LEFT SIDEBAR */}
      <aside className="w-[280px] shrink-0 border-r border-border/40 bg-[hsl(var(--card))] overflow-y-auto p-4 space-y-5">
        <div>
          <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Campus Map Editor</h2>
          <Select value={selectedUni} onValueChange={setSelectedUni}>
            <SelectTrigger><SelectValue placeholder="Select university" /></SelectTrigger>
            <SelectContent>
              {universities.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name}{u.abbreviation ? ` (${u.abbreviation})` : ''}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {lastEdit && (
            <p className="text-[10px] text-muted-foreground mt-2 font-mono">
              Last edited {new Date(lastEdit.at).toLocaleString()} by {lastEdit.by}
            </p>
          )}
        </div>

        {/* Draw tools */}
        <Section title="Draw Tools">
          <div className="grid grid-cols-2 gap-2">
            {TOOLS.map((t) => {
              const Icon = t.icon;
              const active = tool === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => { setTool(t.id); setDrafting([]); }}
                  className={`flex items-center gap-2 px-2 py-2 rounded-md text-xs font-medium border transition-colors ${active ? 'border-[#4f8eff] bg-[#4f8eff]/10 text-[#4f8eff]' : 'border-border/40 text-muted-foreground hover:bg-muted'}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => { setTool('boundary'); setDrafting([]); }}
            className={`mt-2 w-full px-2 py-2 rounded-md text-xs font-medium border transition-colors ${tool === 'boundary' ? 'border-[#4f8eff] bg-[#4f8eff]/10 text-[#4f8eff]' : 'border-dashed border-border/60 text-muted-foreground hover:bg-muted'}`}
          >
            Set Campus Boundary
          </button>
          {tool !== 'select' && tool !== 'landmark' && drafting.length > 0 && (
            <div className="mt-2 flex gap-2">
              <Button size="sm" className="flex-1" onClick={finishDraft}>Finish ({drafting.length})</Button>
              <Button size="sm" variant="ghost" onClick={() => setDrafting([])}>Cancel</Button>
            </div>
          )}
        </Section>

        {/* Reference image */}
        <Section title="Reference Image">
          <label className="block">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onPickRefImage(e.target.files[0])}
            />
            <span className="flex items-center justify-center gap-2 px-2 py-2 rounded-md text-xs font-medium border border-border/40 cursor-pointer hover:bg-muted">
              <ImageIcon className="w-3.5 h-3.5" /> Upload Reference Image
            </span>
          </label>
          {refImageUrl && (
            <>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => { setCornerStage(1); toast.info('Click the NW corner on the map'); }}>
                  Place corners
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setRefImageUrl(null); setRefBounds(null); }}>Remove</Button>
              </div>
              <div className="mt-2">
                <Label className="text-[10px] uppercase tracking-wider">Opacity {refOpacity}%</Label>
                <Slider value={[refOpacity]} onValueChange={(v) => setRefOpacity(v[0])} min={0} max={100} step={1} />
              </div>
            </>
          )}
        </Section>

        {/* Selected shape */}
        {selectedShape && (
          <Section title="Selected Shape">
            <Label className="text-[10px] uppercase tracking-wider">Label</Label>
            <Input
              value={selectedShape.label}
              onChange={(e) => updateSelected({ label: e.target.value })}
              placeholder="e.g. Main Block"
            />
            <Label className="text-[10px] uppercase tracking-wider mt-2">Type</Label>
            <Select value={selectedShape.type} onValueChange={(v) => updateSelected({ type: v as ShapeType, style: { ...DEFAULT_STYLES[v as ShapeType] } })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(['building','zone','path','landmark','restricted'] as ShapeType[]).map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label className="text-[10px] uppercase tracking-wider mt-2">Fill opacity {Math.round(selectedShape.style.fillOpacity * 100)}%</Label>
            <Slider value={[selectedShape.style.fillOpacity * 100]} onValueChange={(v) => updateSelectedStyle({ fillOpacity: v[0] / 100 })} min={0} max={100} step={1} />
            <Label className="text-[10px] uppercase tracking-wider mt-2">Stroke opacity {Math.round(selectedShape.style.strokeOpacity * 100)}%</Label>
            <Slider value={[selectedShape.style.strokeOpacity * 100]} onValueChange={(v) => updateSelectedStyle({ strokeOpacity: v[0] / 100 })} min={0} max={100} step={1} />
            <Label className="text-[10px] uppercase tracking-wider mt-2">Color</Label>
            <div className="flex gap-2">
              {COLOR_PRESETS.map((p) => (
                <button
                  key={p.color}
                  onClick={() => updateSelectedStyle({ strokeColor: p.color, fillColor: selectedShape.type === 'building' ? selectedShape.style.fillColor : p.color })}
                  title={p.name}
                  className="w-6 h-6 rounded-full border border-border/40"
                  style={{ background: p.color }}
                />
              ))}
            </div>
            <Button size="sm" variant="destructive" className="mt-3 w-full" onClick={() => deleteShape(selectedShape.id)}>
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete shape
            </Button>
          </Section>
        )}

        {/* Layers */}
        <Section title={`Layers (${shapes.length})`}>
          <div className="space-y-1 max-h-56 overflow-y-auto">
            {shapes.map((s) => {
              const active = s.id === selectedId;
              return (
                <div key={s.id} className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs ${active ? 'bg-[#4f8eff]/10 text-[#4f8eff]' : 'hover:bg-muted text-foreground'}`}>
                  <button onClick={() => setSelectedId(s.id)} className="flex-1 text-left truncate">
                    <span className="font-mono opacity-60 mr-1">{s.type[0].toUpperCase()}</span>
                    {s.label || <em className="opacity-50">untitled</em>}
                  </button>
                  <button onClick={() => reorder(s.id, -1)} className="opacity-60 hover:opacity-100"><MoveUp className="w-3 h-3" /></button>
                  <button onClick={() => reorder(s.id, 1)} className="opacity-60 hover:opacity-100"><MoveDown className="w-3 h-3" /></button>
                  <button onClick={() => toggleHidden(s.id)} className="opacity-60 hover:opacity-100">
                    {s.hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>
              );
            })}
            {!shapes.length && <p className="text-xs text-muted-foreground italic px-2">No shapes drawn yet.</p>}
          </div>
        </Section>

        {/* Export */}
        <Section title="Export">
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" onClick={() => setPreviewOpen(true)}><PreviewIcon className="w-3.5 h-3.5 mr-1" /> Preview</Button>
            <Button size="sm" variant="outline" onClick={copySvg}><Copy className="w-3.5 h-3.5 mr-1" /> Copy</Button>
            <Button size="sm" variant="outline" onClick={downloadSvg}><Download className="w-3.5 h-3.5 mr-1" /> .svg</Button>
            <Button size="sm" onClick={save}><Save className="w-3.5 h-3.5 mr-1" /> Save</Button>
          </div>
        </Section>
      </aside>

      {/* MAP */}
      <div className={`flex-1 relative ${cursorClass}`}>
        {mobileWarn && (
          <div className="absolute top-0 inset-x-0 z-[1000] bg-amber-500/15 border-b border-amber-500/40 text-amber-200 text-xs text-center py-1.5 px-2">
            Campus Map Editor works best on desktop. Some drawing tools may not work on mobile.
          </div>
        )}
        <MapContainer
          center={center}
          zoom={zoom}
          className="absolute inset-0"
          style={{ background: '#080c17' }}
          zoomControl
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <MapCenterer center={center} zoom={zoom} />
          <CoordTooltip onMove={setHoverLL} />
          <MapClickHandler tool={tool} drafting={drafting} onClick={onMapClick} onDblClick={finishDraft} />

          {refImageUrl && refBounds && (
            <ImageOverlay url={refImageUrl} bounds={refBounds as L.LatLngBoundsExpression} opacity={refOpacity / 100} />
          )}

          {/* Boundary */}
          {boundary && boundary.length >= 3 && (
            <Polygon
              positions={boundary as any}
              pathOptions={{ color: '#4f8eff', weight: 1.5, dashArray: '4 4', fillOpacity: 0 }}
            />
          )}

          {/* Shapes */}
          {shapes.filter((s) => !s.hidden).map((s) => {
            const isSel = s.id === selectedId;
            const opts: L.PathOptions = {
              color: s.style.strokeColor,
              weight: isSel ? s.style.strokeWidth + 1.5 : s.style.strokeWidth,
              opacity: s.style.strokeOpacity,
              fillColor: s.style.fillColor,
              fillOpacity: s.style.fillOpacity,
              dashArray: s.style.strokeDash ? '3 3' : undefined,
            };
            const onClick = (e: L.LeafletMouseEvent) => {
              L.DomEvent.stopPropagation(e);
              setSelectedId(s.id);
            };
            if (s.type === 'path') {
              return <Polyline key={s.id} positions={s.coordinates as any} pathOptions={opts} eventHandlers={{ click: onClick }} />;
            }
            if (s.type === 'landmark') {
              const c = s.coordinates[0];
              if (!c) return null;
              return (
                <CircleMarker
                  key={s.id}
                  center={c as any}
                  radius={isSel ? 8 : 6}
                  pathOptions={{ color: s.style.strokeColor, fillColor: s.style.fillColor, fillOpacity: s.style.fillOpacity, weight: 2 }}
                  eventHandlers={{ click: onClick }}
                />
              );
            }
            return <Polygon key={s.id} positions={s.coordinates as any} pathOptions={opts} eventHandlers={{ click: onClick }} />;
          })}

          {/* Drafting preview */}
          {drafting.length > 0 && tool !== 'select' && tool !== 'landmark' && (
            <Polyline positions={drafting as any} pathOptions={{ color: '#8dcfff', dashArray: '2 4', weight: 2 }} />
          )}
          {drafting.map((d, i) => (
            <CircleMarker key={i} center={d as any} radius={3} pathOptions={{ color: '#8dcfff', fillColor: '#8dcfff', fillOpacity: 1 }} />
          ))}
        </MapContainer>

        {/* Coord pill */}
        {hoverLL && (
          <div className="absolute bottom-2 left-2 z-[1000] px-2 py-1 rounded bg-black/60 text-[10px] font-mono text-cyan-200">
            {hoverLL.lat.toFixed(5)}° N {hoverLL.lng.toFixed(5)}° E
          </div>
        )}
        {tool !== 'select' && (
          <div className="absolute top-2 right-2 z-[1000] px-2 py-1 rounded bg-[#4f8eff]/20 border border-[#4f8eff]/40 text-[10px] font-mono text-[#cfe1ff]">
            Drawing: {tool} {tool !== 'landmark' ? '(double-click or "Finish" to close)' : ''}
          </div>
        )}
      </div>

      {/* PREVIEW */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>SVG Preview</DialogTitle></DialogHeader>
          <div className="relative bg-[#080c17] rounded-md overflow-hidden">
            <div className="aspect-square w-full" dangerouslySetInnerHTML={{ __html: svgString }} />
            {/* Sample pin overlays */}
            <svg viewBox="0 0 800 800" className="absolute inset-0 w-full h-full pointer-events-none">
              <circle cx="380" cy="420" r="10" fill="#22d3ee" stroke="#fff" strokeWidth="2" />
              <circle cx="500" cy="350" r="10" fill="#f59e0b" stroke="#fff" strokeWidth="2" />
              <circle cx="450" cy="500" r="14" fill="#4f8eff" stroke="#fff" strokeWidth="3" />
            </svg>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPreviewOpen(false)}>Back to editing</Button>
            <Button onClick={() => { setPreviewOpen(false); save(); }}>Looks good → Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-mono font-semibold mb-2">{title}</h3>
    <div className="space-y-1.5">{children}</div>
  </div>
);

export default CampusMapEditor;