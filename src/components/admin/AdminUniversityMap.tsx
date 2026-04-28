import React, { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { Map as MLMap, Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { STATE_COORDS, STATE_RADIUS } from "@/data/indianStateCoords";
import {
  Loader2,
  Search,
  Maximize2,
  Minimize2,
  X,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Users,
  Building2,
  Crosshair,
  Radio,
  Activity,
  Database,
  Layers,
  Filter,
  Zap,
  Shield,
  Eye,
  Globe,
  Wifi,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type UniMap = Record<string, string[]>;
type Univ = { name: string; state: string; lng: number; lat: number; enrolled: number; abbr: string | null };
type ClubLite = {
  id: string;
  club_name: string;
  category: string | null;
  member_count: number | null;
  logo_url: string | null;
};
type StudentLite = {
  user_id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  major: string | null;
  university: string | null;
};
type StudentDetail = StudentLite & {
  bio?: string | null;
  email?: string | null;
  country?: string | null;
  state?: string | null;
  area?: string | null;
  followers_count?: number | null;
  following_count?: number | null;
  campus_year?: string | null;
  interests?: string[] | null;
  status_message?: string | null;
  created_at?: string | null;
};
type ClubMemberLite = {
  user_id: string;
  role: string | null;
  joined_at: string | null;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  major: string | null;
};

function extractAbbr(name: string): string | null {
  const m = name.match(/\(([A-Z][A-Z0-9&.\- ]{1,15})\)\s*$/);
  return m ? m[1].trim() : null;
}
function seeded(i: number) {
  const x = Math.sin(i * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}
function fmtCoord(lat: number, lng: number) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}°${ns}  ${Math.abs(lng).toFixed(4)}°${ew}`;
}

const TIER1_KEYWORDS: string[] = [
  "shiv nadar",
  "amity",
  "jindal",
  "o.p. jindal",
  "op jindal",
  "ashoka",
  "krea",
  "plaksha",
  "flame",
  "manipal",
  "srm",
  "vit",
  "vellore institute",
  "symbiosis",
  "bits ",
  "birla institute of technology and science",
  "iit ",
  "indian institute of technology",
  "iim ",
  "indian institute of management",
  "iiit",
  "indian institute of information technology",
  "nit ",
  "national institute of technology",
  "iisc",
  "indian institute of science",
  "iiser",
  "aiims",
  "thapar",
  "lpu",
  "lovely professional",
  "chandigarh university",
  "christ university",
  "xavier",
  "xlri",
  "mdi",
  "iift",
  "isb",
  "snu",
  "pes university",
  "reva",
  "nmims",
  "mit-wpu",
  "mit world peace",
  "bennett",
  "bml munjal",
  "galgotias",
  "sharda",
  "ansal",
  "jamia millia",
  "jawaharlal nehru university",
  "bhu",
  "banaras hindu",
  "delhi university",
  "university of delhi",
  "du ",
  "icfai",
  "great lakes",
  "spjain",
  "s.p. jain",
  "iim-",
];

function isTier1(name: string): boolean {
  const n = name.toLowerCase();
  return TIER1_KEYWORDS.some((k) => n.includes(k));
}

const TIER1_COORDS: Array<{ match: string; lat: number; lng: number }> = [
  { match: "shiv nadar", lat: 28.5237, lng: 77.574 },
  { match: "ashoka", lat: 28.945, lng: 77.1015 },
  { match: "plaksha", lat: 30.6595, lng: 76.7406 },
  { match: "krea", lat: 13.628, lng: 79.568 },
  { match: "flame", lat: 18.529, lng: 73.727 },
  { match: "o.p. jindal", lat: 28.798, lng: 76.644 },
  { match: "op jindal", lat: 28.798, lng: 76.644 },
  { match: "jindal", lat: 28.798, lng: 76.644 },
  { match: "amity", lat: 28.5447, lng: 77.332 },
  { match: "bennett", lat: 28.4503, lng: 77.584 },
  { match: "bml munjal", lat: 28.376, lng: 76.897 },
  { match: "galgotias", lat: 28.4506, lng: 77.5856 },
  { match: "sharda", lat: 28.473, lng: 77.482 },
  { match: "manipal", lat: 13.3525, lng: 74.7869 },
  { match: "srm", lat: 12.823, lng: 80.0444 },
  { match: "vellore institute", lat: 12.9692, lng: 79.1559 },
  { match: "vit", lat: 12.9692, lng: 79.1559 },
  { match: "symbiosis", lat: 18.4575, lng: 73.85 },
  { match: "thapar", lat: 30.354, lng: 76.3625 },
  { match: "lovely professional", lat: 31.2553, lng: 75.705 },
  { match: "lpu", lat: 31.2553, lng: 75.705 },
  { match: "chandigarh university", lat: 30.77, lng: 76.576 },
  { match: "christ university", lat: 12.9344, lng: 77.6062 },
  { match: "nmims", lat: 19.1075, lng: 72.837 },
  { match: "pes university", lat: 12.9352, lng: 77.5354 },
  { match: "reva", lat: 13.118, lng: 77.663 },
  { match: "mit-wpu", lat: 18.5089, lng: 73.8128 },
  { match: "mit world peace", lat: 18.5089, lng: 73.8128 },
  { match: "snu", lat: 28.5237, lng: 77.574 },
  { match: "birla institute of technology and science", lat: 28.364, lng: 75.587 },
  { match: "bits ", lat: 28.364, lng: 75.587 },
  { match: "iit bombay", lat: 19.1334, lng: 72.9133 },
  { match: "iit delhi", lat: 28.545, lng: 77.1926 },
  { match: "iit madras", lat: 12.9915, lng: 80.2336 },
  { match: "iit kanpur", lat: 26.5123, lng: 80.2329 },
  { match: "iit kharagpur", lat: 22.3149, lng: 87.3105 },
  { match: "iit roorkee", lat: 29.865, lng: 77.8964 },
  { match: "iit guwahati", lat: 26.19, lng: 91.6991 },
  { match: "iit hyderabad", lat: 17.597, lng: 78.1242 },
  { match: "iit indore", lat: 22.5208, lng: 75.9216 },
  { match: "iit bombay", lat: 19.1334, lng: 72.9133 },
  { match: "iisc", lat: 13.0218, lng: 77.566 },
  { match: "indian institute of science", lat: 13.0218, lng: 77.566 },
  { match: "iiser pune", lat: 18.547, lng: 73.807 },
  { match: "aiims", lat: 28.5672, lng: 77.21 },
  { match: "nit trichy", lat: 10.759, lng: 78.814 },
  { match: "nit warangal", lat: 17.9817, lng: 79.531 },
  { match: "nit surathkal", lat: 13.009, lng: 74.794 },
  { match: "iiit hyderabad", lat: 17.445, lng: 78.349 },
  { match: "iiit delhi", lat: 28.545, lng: 77.273 },
  { match: "iim ahmedabad", lat: 23.032, lng: 72.531 },
  { match: "iim bangalore", lat: 12.917, lng: 77.597 },
  { match: "iim calcutta", lat: 22.457, lng: 88.312 },
  { match: "iim lucknow", lat: 26.897, lng: 81.005 },
  { match: "iim kozhikode", lat: 11.329, lng: 75.843 },
  { match: "iim indore", lat: 22.735, lng: 75.877 },
  { match: "jamia millia", lat: 28.5621, lng: 77.281 },
  { match: "jawaharlal nehru university", lat: 28.54, lng: 77.165 },
  { match: "banaras hindu", lat: 25.267, lng: 82.9907 },
  { match: "bhu", lat: 25.267, lng: 82.9907 },
  { match: "university of delhi", lat: 28.689, lng: 77.209 },
  { match: "xlri", lat: 22.778, lng: 86.186 },
  { match: "isb", lat: 17.4204, lng: 78.347 },
];

function tier1Coord(name: string): { lat: number; lng: number } | null {
  const n = name.toLowerCase();
  for (const c of TIER1_COORDS) if (n.includes(c.match)) return { lat: c.lat, lng: c.lng };
  return null;
}

const AdminUniversityMap: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const allUniv = useRef<Univ[]>([]);
  const featuresRef = useRef<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadPhase, setLoadPhase] = useState(0);
  const [stats, setStats] = useState({ states: 0, universities: 0 });
  const [enrolledByUniv, setEnrolledByUniv] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<{
    name: string;
    state: string;
    enrolled: number;
    abbr: string | null;
    lng: number;
    lat: number;
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [clubs, setClubs] = useState<ClubLite[]>([]);
  const [studentCount, setStudentCount] = useState<number>(0);
  const [students, setStudents] = useState<
    Array<{
      user_id: string;
      full_name: string | null;
      username: string | null;
      avatar_url: string | null;
      major: string | null;
      university: string | null;
    }>
  >([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<"clubs" | "students">("clubs");
  // Sub-panel (left of the right sidebar) state
  const [subPanel, setSubPanel] = useState<"student" | "club" | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null);
  const [selectedClub, setSelectedClub] = useState<ClubLite | null>(null);
  const [clubMembers, setClubMembers] = useState<ClubMemberLite[]>([]);
  const [subPanelLoading, setSubPanelLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [intelOpen, setIntelOpen] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [tier1Only, setTier1Only] = useState(true);
  const [counter, setCounter] = useState(0);
  const [mapTilt, setMapTilt] = useState(false);
  const [signalStrength, setSignalStrength] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Animated signal strength bars
  useEffect(() => {
    const id = setInterval(() => {
      setSignalStrength(Math.floor(Math.random() * 3) + 3);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!stats.universities) return;
    let raf = 0;
    const start = performance.now();
    const dur = 1800;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const ease = 1 - Math.pow(1 - p, 4);
      setCounter(Math.floor(stats.universities * ease));
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
      if (tier1Only && !isTier1(u.name)) continue;
      if (u.name.toLowerCase().includes(q) || u.state.toLowerCase().includes(q)) {
        out.push(u);
        if (out.length >= 12) break;
      }
    }
    return out;
  }, [search, tier1Only]);

  useEffect(() => {
    let mounted = true;
    let map: MLMap | null = null;

    (async () => {
      setLoadPhase(1);
      const data = (await import("@/data/universities.json")).default as UniMap;
      setLoadPhase(2);
      let enrolledMap: Record<string, number> = {};
      try {
        const { data: profs } = await supabase
          .from("profiles")
          .select("university")
          .not("university", "is", null)
          .limit(10000);
        (profs || []).forEach((p: any) => {
          if (p.university) enrolledMap[p.university] = (enrolledMap[p.university] || 0) + 1;
        });
      } catch {}
      if (!mounted) return;
      setEnrolledByUniv(enrolledMap);
      setLoadPhase(3);

      const features: any[] = [];
      const flat: Univ[] = [];
      let total = 0,
        c = 0;
      Object.entries(data).forEach(([state, list]) => {
        const center = STATE_COORDS[state];
        const radius = STATE_RADIUS[state] || 1.2;
        if (!center) return;
        list.forEach((name) => {
          const real = tier1Coord(name);
          let lng: number, lat: number;
          if (real) {
            const j = (seeded(c * 7 + 3) - 0.5) * 0.02;
            const k = (seeded(c * 11 + 5) - 0.5) * 0.02;
            lng = real.lng + j;
            lat = real.lat + k;
          } else {
            const r1 = seeded(c * 2);
            const r2 = seeded(c * 2 + 1);
            const angle = r1 * Math.PI * 2;
            const dist = Math.sqrt(r2) * radius;
            lng = center.lng + Math.cos(angle) * dist;
            lat = center.lat + Math.sin(angle) * dist * 0.85;
          }
          c++;
          total++;
          const abbr = extractAbbr(name);
          const enrolled = (abbr && enrolledMap[abbr]) || enrolledMap[name] || 0;
          flat.push({ name, state, lng, lat, enrolled, abbr });
          features.push({
            type: "Feature",
            geometry: { type: "Point", coordinates: [lng, lat] },
            properties: { name, state, enrolled, abbr: abbr || "", tier1: isTier1(name) ? 1 : 0 },
          });
        });
      });
      allUniv.current = flat;
      featuresRef.current = features;
      setStats({ states: Object.keys(data).length, universities: total });
      setLoadPhase(4);

      if (!containerRef.current) return;

      map = new maplibregl.Map({
        container: containerRef.current,
        style: {
          version: 8,
          glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
          sources: {
            "carto-dark": {
              type: "raster",
              tiles: [
                "https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png",
                "https://b.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png",
                "https://c.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png",
              ],
              tileSize: 256,
              attribution: "© OSM © CARTO",
            },
          },
          layers: [
            { id: "bg", type: "background", paint: { "background-color": "#030508" } },
            {
              id: "carto-dark",
              type: "raster",
              source: "carto-dark",
              paint: {
                "raster-opacity": 0.85,
                "raster-saturation": -1,
                "raster-contrast": 0.3,
                "raster-brightness-min": 0.02,
                "raster-brightness-max": 0.85,
                "raster-hue-rotate": 200,
              },
            },
          ],
        },
        center: [82.5, 22.5],
        zoom: 4.2,
        pitch: 45,
        bearing: -10,
        minZoom: 2,
        maxZoom: 16,
        attributionControl: false,
      });
      mapRef.current = map;

      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");
      map.addControl(new maplibregl.AttributionControl({ compact: true }));

      // Compute college counts per state from loaded data (for popups)
      const collegeCountByState: Record<string, number> = {};
      const tier1CountByState: Record<string, number> = {};
      flat.forEach((u) => {
        collegeCountByState[u.state] = (collegeCountByState[u.state] || 0) + 1;
        if (isTier1(u.name)) tier1CountByState[u.state] = (tier1CountByState[u.state] || 0) + 1;
      });

      // Normalize state name for matching with GeoJSON ST_NM property
      const normState = (s: string) =>
        s
          .toLowerCase()
          .replace(/&/g, "and")
          .replace(/[^a-z]+/g, "")
          .trim();
      const countsByNorm: Record<string, { total: number; tier1: number; raw: string }> = {};
      Object.keys(collegeCountByState).forEach((s) => {
        countsByNorm[normState(s)] = {
          total: collegeCountByState[s],
          tier1: tier1CountByState[s] || 0,
          raw: s,
        };
      });

      // Holographic hexagon marker
      const buildHex = (size = 80, color = "#00ffe7", selected = false) => {
        const outerR = selected ? 24 : 14;
        const innerR = selected ? 10 : 5;
        const ringR = selected ? 32 : 20;
        const pulseR = selected ? 40 : 0;
        const hex = (r: number, cx = 0, cy = 0) => {
          const pts = Array.from({ length: 6 }, (_, i) => {
            const a = (Math.PI / 180) * (60 * i - 30);
            return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
          }).join(" ");
          return pts;
        };

        const glowId = `g${Math.random().toString(36).slice(2, 6)}`;
        const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="-${size / 2} -${size / 2} ${size} ${size}" width="${size}" height="${size}">
          <defs>
            <filter id="${glowId}" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="${selected ? 4 : 2.5}" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          ${pulseR > 0 ? `<circle cx="0" cy="0" r="${pulseR}" fill="none" stroke="${color}" stroke-width="1" opacity="0.3"/>` : ""}
          <polygon points="${hex(ringR)}" fill="none" stroke="${color}" stroke-width="${selected ? 1.5 : 1}" opacity="${selected ? 0.6 : 0.35}" filter="url(#${glowId})"/>
          <polygon points="${hex(outerR)}" fill="${color}18" stroke="${color}" stroke-width="${selected ? 2 : 1.5}" opacity="${selected ? 1 : 0.9}" filter="url(#${glowId})"/>
          <polygon points="${hex(innerR)}" fill="${color}" opacity="${selected ? 1 : 0.95}" filter="url(#${glowId})"/>
          ${selected ? `<circle cx="0" cy="0" r="3" fill="#fff" opacity="0.95"/>` : ""}
        </svg>`;
        return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
      };

      map.on("load", async () => {
        if (!map) return;

        // ---- INDIA STATE BOUNDARIES (lines + click-for-info) ----
        try {
          const statesUrl =
            "https://raw.githubusercontent.com/geohacker/india/master/state/india_telengana.geojson";
          const res = await fetch(statesUrl);
          if (res.ok) {
            const geo = await res.json();
            // Annotate each feature with college count for fill-step coloring
            (geo.features || []).forEach((f: any) => {
              const nm: string = f.properties?.NAME_1 || f.properties?.ST_NM || f.properties?.name || "";
              const c = countsByNorm[normState(nm)];
              f.properties.__college_count = c?.total || 0;
              f.properties.__tier1_count = c?.tier1 || 0;
              f.properties.__display_name = nm;
            });

            map.addSource("india-states", { type: "geojson", data: geo });

            // Subtle fill — shaded by college density, used for click hit-testing
            map.addLayer(
              {
                id: "india-states-fill",
                type: "fill",
                source: "india-states",
                paint: {
                  "fill-color": [
                    "interpolate",
                    ["linear"],
                    ["coalesce", ["get", "__college_count"], 0],
                    0, "rgba(0,255,231,0.02)",
                    20, "rgba(0,255,231,0.06)",
                    100, "rgba(0,255,231,0.12)",
                    400, "rgba(245,197,24,0.18)",
                  ],
                  "fill-opacity": 0.85,
                },
              },
              "unis-dots"
            );

            // Hover highlight
            map.addLayer(
              {
                id: "india-states-fill-hover",
                type: "fill",
                source: "india-states",
                filter: ["==", ["get", "__display_name"], ""],
                paint: { "fill-color": "rgba(0,255,231,0.18)", "fill-opacity": 0.9 },
              },
              "unis-dots"
            );

            // White-ish glowing borders
            map.addLayer(
              {
                id: "india-states-line",
                type: "line",
                source: "india-states",
                paint: {
                  "line-color": "rgba(255,255,255,0.85)",
                  "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0.6, 6, 1.1, 10, 1.6],
                  "line-opacity": 0.75,
                },
              },
              "unis-dots"
            );

            // Click on state -> popup with counts
            const statePopup = new maplibregl.Popup({
              closeButton: true,
              closeOnClick: true,
              offset: 8,
              className: "holo-popup",
            });

            map.on("mousemove", "india-states-fill", (e) => {
              const f = e.features?.[0] as any;
              if (!f) return;
              map!.getCanvas().style.cursor = "pointer";
              map!.setFilter("india-states-fill-hover", [
                "==",
                ["get", "__display_name"],
                f.properties.__display_name,
              ]);
            });
            map.on("mouseleave", "india-states-fill", () => {
              map!.getCanvas().style.cursor = "";
              map!.setFilter("india-states-fill-hover", ["==", ["get", "__display_name"], ""]);
            });

            map.on("click", "india-states-fill", (e) => {
              // Skip if a pin was clicked instead
              const pinHits = map!.queryRenderedFeatures(e.point, { layers: ["unis-pins"] });
              if (pinHits.length) return;
              const f = e.features?.[0] as any;
              if (!f) return;
              const name: string = f.properties.__display_name || "STATE";
              const total = Number(f.properties.__college_count || 0);
              const tier1 = Number(f.properties.__tier1_count || 0);
              const html = `
                <div class="holo-card">
                  <div class="holo-card-header">
                    <span class="holo-tag">REGION</span>
                    <span class="holo-live">◉ SCAN</span>
                  </div>
                  <div class="holo-card-name">${escapeHtml(name)}</div>
                  <div class="holo-card-sub">INDIA · STATE SECTOR</div>
                  <div class="holo-card-footer">
                    <span>COLLEGES <b>${total}</b></span>
                    <span>TIER-1 <b>${tier1}</b></span>
                  </div>
                </div>`;
              statePopup.setLngLat(e.lngLat).setHTML(html).addTo(map!);
            });
          }
        } catch (err) {
          console.warn("Failed to load India state boundaries", err);
        }
        // ---- END STATE BOUNDARIES ----

        const loadImg = (name: string, src: string, w = 80, h = 80) =>
          new Promise<void>((res) => {
            const img = new Image(w, h);
            img.onload = () => {
              if (!map!.hasImage(name)) map!.addImage(name, img as any);
              res();
            };
            img.onerror = () => res();
            img.src = src;
          });

        await Promise.all([
          loadImg("hex-cyan", buildHex(80, "#00ffe7")),
          loadImg("hex-selected", buildHex(100, "#ff6b35", true), 100, 100),
          loadImg("hex-amber", buildHex(80, "#f5c518")),
        ]);

        map.addSource("unis", {
          type: "geojson",
          data: { type: "FeatureCollection", features },
          cluster: false,
        });

        // Non-tier1 dim dots
        map.addLayer({
          id: "unis-dots",
          type: "circle",
          source: "unis",
          filter: ["==", ["get", "tier1"], 0],
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 3, 1.5, 8, 3, 12, 5],
            "circle-color": "#1a4a6b",
            "circle-opacity": 0.5,
          },
        });

        // Tier1 hex pins
        map.addLayer({
          id: "unis-pins",
          type: "symbol",
          source: "unis",
          filter: ["==", ["get", "tier1"], 1],
          layout: {
            "icon-image": [
              "case",
              ["==", ["get", "selected"], 1],
              "hex-selected",
              [">", ["get", "enrolled"], 0],
              "hex-amber",
              "hex-cyan",
            ],
            "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.28, 5, 0.42, 8, 0.58, 12, 0.78, 16, 1.0],
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
            "text-field": ["coalesce", ["get", "abbr"], ""],
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            "text-size": ["interpolate", ["linear"], ["zoom"], 5, 0, 6.5, 8, 10, 10, 14, 12],
            "text-offset": [0, 1.4],
            "text-anchor": "top",
            "text-letter-spacing": 0.12,
            "text-allow-overlap": false,
            "text-optional": true,
          },
          paint: {
            "icon-opacity": 1,
            "text-color": ["case", ["==", ["get", "selected"], 1], "#ff6b35", "#00ffe7"],
            "text-halo-color": "#000814",
            "text-halo-width": 1.5,
          },
        });

        // Hover glow popup
        const hoverPopup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 20,
          className: "holo-popup",
        });
        map.on("mouseenter", "unis-pins", (e) => {
          map!.getCanvas().style.cursor = "crosshair";
          const f = e.features?.[0] as any;
          if (!f) return;
          const [lng, lat] = f.geometry.coordinates;
          const enrolled = f.properties.enrolled || 0;
          const html = `
            <div class="holo-card">
              <div class="holo-card-header">
                <span class="holo-tag">ACQUIRE</span>
                <span class="holo-live">◉ LOCK</span>
              </div>
              <div class="holo-card-name">${escapeHtml(f.properties.name)}</div>
              <div class="holo-card-sub">${escapeHtml(f.properties.state)}${f.properties.abbr ? ` · ${escapeHtml(f.properties.abbr)}` : ""}</div>
              <div class="holo-card-coord">${fmtCoord(lat, lng)}</div>
              <div class="holo-card-footer">
                <span>STUDENTS <b>${enrolled}</b></span>
                <span>SECTOR <b>EDU-01</b></span>
              </div>
            </div>`;
          hoverPopup.setLngLat([lng, lat]).setHTML(html).addTo(map!);
        });
        map.on("mouseleave", "unis-pins", () => {
          map!.getCanvas().style.cursor = "";
          hoverPopup.remove();
        });

        map.on("click", "unis-pins", (e) => {
          const f = e.features?.[0] as any;
          if (!f) return;
          const [lng, lat] = f.geometry.coordinates;
          if (popupRef.current) popupRef.current.remove();
          openUni({
            name: f.properties.name,
            state: f.properties.state,
            enrolled: Number(f.properties.enrolled || 0),
            abbr: f.properties.abbr || null,
            lng,
            lat,
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

  const toggleTilt = () => {
    const map = mapRef.current;
    if (!map) return;
    const newTilt = !mapTilt;
    setMapTilt(newTilt);
    map.easeTo({ pitch: newTilt ? 60 : 0, bearing: newTilt ? -15 : 0, duration: 1200 });
  };

  const openUni = async (u: {
    name: string;
    state: string;
    enrolled: number;
    abbr: string | null;
    lng: number;
    lat: number;
  }) => {
    const map = mapRef.current;
    if (!map) return;
    setSelected(u);
    setDetailOpen(true);
    setClubs([]);
    setStudents([]);
    setDetailTab("clubs");
    setStudentCount(u.enrolled);
    setDetailLoading(true);
    map.flyTo({ center: [u.lng, u.lat], zoom: Math.max(map.getZoom(), 9), pitch: 55, bearing: -12, duration: 1200 });

    const candidates = [u.abbr, u.name].filter(Boolean) as string[];
    try {
      const { count: sCount } = await supabase
        .from("profiles")
        .select("user_id", { count: "exact", head: true })
        .in("university", candidates);
      const { data: clubRows } = await supabase
        .from("clubs_profiles")
        .select("id, club_name, category, member_count, logo_url")
        .in("university", candidates)
        .order("member_count", { ascending: false })
        .limit(50);
      setStudentCount(sCount || 0);
      setClubs((clubRows as ClubLite[]) || []);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  const loadStudents = async (u: { name: string; abbr: string | null }) => {
    setStudentsLoading(true);
    try {
      const candidates = [u.abbr, u.name].filter(Boolean) as string[];
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url, major, university")
        .in("university", candidates)
        .eq("user_type", "student")
        .limit(200);
      setStudents((data as any[]) || []);
    } catch (e) {
      console.error(e);
    } finally {
      setStudentsLoading(false);
    }
  };

  const openStudentPanel = async (s: StudentLite) => {
    setSubPanel("student");
    setSelectedClub(null);
    setClubMembers([]);
    setSelectedStudent({ ...s });
    setSubPanelLoading(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select(
          "user_id, full_name, username, avatar_url, major, university, bio, country, state, area, followers_count, following_count, campus_year, interests, status_message, created_at"
        )
        .eq("user_id", s.user_id)
        .maybeSingle();
      if (data) setSelectedStudent({ ...(data as any) });
    } catch (e) {
      console.error(e);
    } finally {
      setSubPanelLoading(false);
    }
  };

  const openClubPanel = async (c: ClubLite) => {
    setSubPanel("club");
    setSelectedStudent(null);
    setSelectedClub(c);
    setClubMembers([]);
    setSubPanelLoading(true);
    try {
      const { data: memberships } = await supabase
        .from("club_memberships")
        .select("user_id, role, joined_at")
        .eq("club_id", c.id)
        .order("joined_at", { ascending: false })
        .limit(200);
      const ids = (memberships || []).map((m: any) => m.user_id);
      let profilesMap = new Map<string, any>();
      if (ids.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, username, avatar_url, major")
          .in("user_id", ids);
        (profiles || []).forEach((p: any) => profilesMap.set(p.user_id, p));
      }
      const merged: ClubMemberLite[] = (memberships || []).map((m: any) => ({
        user_id: m.user_id,
        role: m.role,
        joined_at: m.joined_at,
        full_name: profilesMap.get(m.user_id)?.full_name ?? null,
        username: profilesMap.get(m.user_id)?.username ?? null,
        avatar_url: profilesMap.get(m.user_id)?.avatar_url ?? null,
        major: profilesMap.get(m.user_id)?.major ?? null,
      }));
      setClubMembers(merged);
    } catch (e) {
      console.error(e);
    } finally {
      setSubPanelLoading(false);
    }
  };

  const closeSubPanel = () => {
    setSubPanel(null);
    setSelectedStudent(null);
    setSelectedClub(null);
    setClubMembers([]);
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
      setTimeout(() => mapRef.current?.resize(), 250);
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    const onResize = () => mapRef.current?.resize();
    window.addEventListener("resize", onResize);
    const t = setTimeout(onResize, 300);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(t);
    };
  }, [intelOpen, detailOpen]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      if (!map.getLayer("unis-pins")) return;
      map.setFilter("unis-pins", tier1Only ? ["==", ["get", "tier1"], 1] : (null as any));
    };
    if (map.isStyleLoaded()) apply();
    else map.once("idle", apply);
  }, [tier1Only]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const src = map.getSource("unis") as any;
      if (!src || !featuresRef.current.length) return;
      const selKey = selected ? `${selected.name}|${selected.state}` : "";
      featuresRef.current.forEach((f) => {
        const key = `${f.properties.name}|${f.properties.state}`;
        f.properties.selected = key === selKey ? 1 : 0;
      });
      src.setData({ type: "FeatureCollection", features: featuresRef.current });
    };
    if (map.isStyleLoaded()) apply();
    else map.once("idle", apply);
  }, [selected]);

  const visibleCount = useMemo(() => {
    if (!tier1Only) return allUniv.current.length;
    return allUniv.current.filter((u) => isTier1(u.name)).length;
  }, [tier1Only, stats.universities]);

  const totalEnrolled = Object.values(enrolledByUniv).reduce((a, b) => a + b, 0);
  const ts = now.toISOString().replace("T", " ").slice(0, 19) + " UTC";

  const loadMessages = [
    "INITIALIZING NEURAL GRID...",
    "CALIBRATING SENSORS...",
    "LOADING GEODATA...",
    "BUILDING HOLONET...",
  ];

  return (
    <div
      ref={wrapperRef}
      style={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
        height: fullscreen ? "100vh" : "calc(100vh - 64px)",
        background: "#030508",
        fontFamily: "'Space Mono', ui-monospace, monospace",
      }}
    >
      {/* Atmospheric background layers */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        {/* Deep space gradient */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 30% 40%, rgba(0,40,80,0.6) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(0,20,60,0.4) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(0,10,30,0.8) 0%, #030508 80%)",
          }}
        />
        {/* Vignette */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,2,10,0.9) 100%)",
          }}
        />
      </div>

      {/* TOP NAVIGATION BAR */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          height: 48,
          background: "linear-gradient(180deg, rgba(0,255,231,0.06) 0%, rgba(0,0,0,0) 100%)",
          borderBottom: "1px solid rgba(0,255,231,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Left: breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{ width: 6, height: 6, background: "#00ffe7", borderRadius: "50%", boxShadow: "0 0 8px #00ffe7" }}
              className="pulse-dot"
            />
            <span style={{ fontSize: 9, color: "#00ffe7", letterSpacing: "0.25em", opacity: 0.7 }}>UNIGRAMM</span>
          </div>
          <span style={{ color: "rgba(0,255,231,0.3)", fontSize: 10 }}>›</span>
          <span style={{ fontSize: 9, color: "rgba(0,255,231,0.5)", letterSpacing: "0.2em" }}>GEOINT</span>
          <span style={{ color: "rgba(0,255,231,0.3)", fontSize: 10 }}>›</span>
          <span style={{ fontSize: 9, color: "#fff", letterSpacing: "0.2em" }}>UNIVERSITY MESH</span>
        </div>

        {/* Center: title */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.5em",
              color: "#00ffe7",
              textShadow: "0 0 20px rgba(0,255,231,0.8)",
              fontFamily: "'Rajdhani', sans-serif",
            }}
          >
            CAMPUS INTELLIGENCE NETWORK
          </div>
          <div style={{ fontSize: 8, color: "rgba(0,255,231,0.4)", letterSpacing: "0.3em" }}>
            HOLOGRAPHIC GEODISPLAY v4.2
          </div>
        </div>

        {/* Right: status */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Signal bars */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 16 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{
                  width: 3,
                  height: 4 + i * 2,
                  background: i <= signalStrength ? "#00ffe7" : "rgba(0,255,231,0.15)",
                  borderRadius: 1,
                  boxShadow: i <= signalStrength ? "0 0 4px #00ffe7" : "none",
                  transition: "all 0.3s",
                }}
              />
            ))}
          </div>
          <span
            style={{
              fontSize: 9,
              color: "rgba(0,255,231,0.5)",
              letterSpacing: "0.15em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {ts}
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "3px 10px",
              border: "1px solid rgba(0,255,100,0.4)",
              background: "rgba(0,255,100,0.05)",
              borderRadius: 3,
            }}
          >
            <div
              style={{ width: 5, height: 5, borderRadius: "50%", background: "#00ff88", boxShadow: "0 0 6px #00ff88" }}
              className="pulse-dot"
            />
            <span style={{ fontSize: 8, color: "#00ff88", letterSpacing: "0.2em" }}>SYS ONLINE</span>
          </div>
          <button
            onClick={toggleFullscreen}
            style={{
              width: 32,
              height: 32,
              background: "rgba(0,255,231,0.06)",
              border: "1px solid rgba(0,255,231,0.2)",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#00ffe7",
              cursor: "pointer",
            }}
          >
            {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* MAP CONTAINER */}
      <div ref={containerRef} style={{ position: "absolute", top: 48, left: 0, right: 0, bottom: 0 }} />

      {/* Holographic grid overlay */}
      <div
        style={{
          position: "absolute",
          top: 48,
          inset: 0,
          zIndex: 4,
          pointerEvents: "none",
          backgroundImage: `
          linear-gradient(rgba(0,255,231,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,255,231,0.04) 1px, transparent 1px)
        `,
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at 50% 60%, rgba(0,0,0,0.7) 20%, transparent 80%)",
        }}
      />

      {/* CRT scan-line */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 60,
          pointerEvents: "none",
          background:
            "repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(0,255,231,0.012) 2px, rgba(0,255,231,0.012) 3px)",
        }}
      />

      {/* Corner HUD brackets */}
      {[
        { top: 56, left: 16 },
        { top: 56, right: 16 },
        { bottom: 16, left: 16 },
        { bottom: 16, right: 16 },
      ].map((pos, i) => (
        <div key={i} style={{ position: "absolute", ...pos, width: 24, height: 24, zIndex: 20, pointerEvents: "none" }}>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              borderTop: i < 2 ? "1.5px solid rgba(0,255,231,0.5)" : "none",
              borderBottom: i >= 2 ? "1.5px solid rgba(0,255,231,0.5)" : "none",
              borderLeft: i % 2 === 0 ? "1.5px solid rgba(0,255,231,0.5)" : "none",
              borderRight: i % 2 === 1 ? "1.5px solid rgba(0,255,231,0.5)" : "none",
            }}
          />
        </div>
      ))}

      {/* TILT TOGGLE BUTTON */}
      <button
        onClick={toggleTilt}
        title="Toggle 3D pitch"
        style={{
          position: "absolute",
          top: 64,
          right: 56,
          zIndex: 25,
          width: 36,
          height: 36,
          background: mapTilt ? "rgba(0,255,231,0.15)" : "rgba(0,8,20,0.85)",
          border: `1px solid ${mapTilt ? "rgba(0,255,231,0.7)" : "rgba(0,255,231,0.25)"}`,
          borderRadius: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: mapTilt ? "#00ffe7" : "rgba(0,255,231,0.5)",
          cursor: "pointer",
          boxShadow: mapTilt ? "0 0 12px rgba(0,255,231,0.3)" : "none",
          transition: "all 0.3s",
        }}
      >
        <Globe size={15} />
      </button>

      {/* LEFT INTEL PANEL */}
      <aside
        style={{
          position: "absolute",
          left: 0,
          top: 48,
          bottom: 0,
          width: 300,
          zIndex: 20,
          background: "linear-gradient(135deg, rgba(0,8,20,0.95) 0%, rgba(0,4,12,0.9) 100%)",
          borderRight: "1px solid rgba(0,255,231,0.15)",
          display: "flex",
          flexDirection: "column",
          transform: intelOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
          backdropFilter: "blur(24px)",
        }}
      >
        {/* Panel header */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid rgba(0,255,231,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(0,255,231,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Eye size={12} color="#00ffe7" />
            <span style={{ fontSize: 9, color: "#00ffe7", letterSpacing: "0.3em" }}>INTEL OVERVIEW</span>
          </div>
          <button
            onClick={() => setIntelOpen(false)}
            style={{
              background: "none",
              border: "none",
              color: "rgba(0,255,231,0.4)",
              cursor: "pointer",
              display: "flex",
              padding: 2,
            }}
          >
            <ChevronLeft size={14} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "thin" }}>
          {/* Search */}
          <div style={{ padding: "12px 16px 0" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                background: "rgba(0,255,231,0.04)",
                border: "1px solid rgba(0,255,231,0.2)",
                borderRadius: 4,
              }}
            >
              <Search size={12} color="#00ffe7" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="QUERY UNIVERSITY..."
                style={{
                  background: "none",
                  border: "none",
                  outline: "none",
                  flex: 1,
                  fontSize: 10,
                  color: "#c8e8f0",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  fontFamily: "inherit",
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(0,255,231,0.4)",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {results.length > 0 && (
              <div
                style={{
                  marginTop: 6,
                  maxHeight: 220,
                  overflowY: "auto",
                  border: "1px solid rgba(0,255,231,0.15)",
                  background: "rgba(0,4,12,0.95)",
                  borderRadius: 4,
                }}
              >
                {results.map((u, i) => (
                  <button
                    key={i}
                    onClick={() => openUni(u)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 12px",
                      borderBottom: "1px solid rgba(0,255,231,0.08)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      display: "block",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,255,231,0.06)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    <p
                      style={{
                        fontSize: 8,
                        color: "rgba(0,255,231,0.5)",
                        letterSpacing: "0.2em",
                        margin: 0,
                        textTransform: "uppercase",
                      }}
                    >
                      {u.state}
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color: "#c8e8f0",
                        margin: "2px 0 0",
                        fontFamily: "'Rajdhani', sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      {u.name}
                    </p>
                    {u.enrolled > 0 && (
                      <p style={{ fontSize: 8, color: "#f5c518", margin: "2px 0 0", letterSpacing: "0.1em" }}>
                        ENROLLED · {u.enrolled}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter toggle */}
          <div style={{ padding: "12px 16px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Filter size={10} color="rgba(0,255,231,0.5)" />
              <span style={{ fontSize: 8, color: "rgba(0,255,231,0.5)", letterSpacing: "0.25em" }}>FILTER MODE</span>
            </div>
            <div
              style={{
                display: "flex",
                gap: 6,
                padding: 6,
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(0,255,231,0.12)",
                borderRadius: 4,
              }}
            >
              {[
                { v: true, label: "TIER-1" },
                { v: false, label: "ALL" },
              ].map(({ v, label }) => (
                <button
                  key={label}
                  onClick={() => setTier1Only(v)}
                  style={{
                    flex: 1,
                    padding: "6px 8px",
                    border: "1px solid",
                    borderColor:
                      tier1Only === v ? (v ? "rgba(245,197,24,0.6)" : "rgba(0,255,231,0.6)") : "rgba(0,255,231,0.12)",
                    background: tier1Only === v ? (v ? "rgba(245,197,24,0.1)" : "rgba(0,255,231,0.1)") : "transparent",
                    color: tier1Only === v ? (v ? "#f5c518" : "#00ffe7") : "rgba(0,255,231,0.4)",
                    fontSize: 9,
                    letterSpacing: "0.2em",
                    cursor: "pointer",
                    borderRadius: 3,
                    boxShadow:
                      tier1Only === v ? `0 0 10px ${v ? "rgba(245,197,24,0.2)" : "rgba(0,255,231,0.2)"}` : "none",
                    transition: "all 0.25s",
                    fontFamily: "inherit",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 8, color: "rgba(0,255,231,0.35)", margin: "6px 0 0", letterSpacing: "0.15em" }}>
              NODES ACTIVE <span style={{ color: "#f5c518" }}>{visibleCount.toLocaleString()}</span> /{" "}
              {stats.universities.toLocaleString()}
            </p>
          </div>

          {/* Stats */}
          <div style={{ padding: "14px 16px 0", display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              {
                icon: <Database size={11} />,
                label: "UNIVERSITIES MAPPED",
                value: counter.toLocaleString(),
                glow: true,
              },
              { icon: <Layers size={11} />, label: "REGIONS ONLINE", value: String(stats.states) },
              {
                icon: <Users size={11} />,
                label: "ACTIVE CAMPUSES",
                value: String(Object.keys(enrolledByUniv).length),
              },
              { icon: <Activity size={11} />, label: "TOTAL ENROLLED", value: totalEnrolled.toLocaleString() },
              { icon: <Wifi size={11} />, label: "LAST SYNC", value: ts.slice(11) },
            ].map(({ icon, label, value, glow }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  background: "rgba(0,0,0,0.25)",
                  borderLeft: "2px solid rgba(0,255,231,0.4)",
                  borderTop: "1px solid rgba(0,255,231,0.08)",
                  borderRight: "1px solid rgba(0,255,231,0.06)",
                  borderBottom: "1px solid rgba(0,255,231,0.06)",
                  borderRadius: "0 3px 3px 0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "rgba(0,255,231,0.6)" }}>{icon}</span>
                  <span style={{ fontSize: 8, color: "rgba(0,255,231,0.45)", letterSpacing: "0.18em" }}>{label}</span>
                </div>
                <span
                  style={{
                    fontSize: glow ? 14 : 11,
                    color: "#f5c518",
                    letterSpacing: "0.05em",
                    fontVariantNumeric: "tabular-nums",
                    textShadow: glow ? "0 0 10px rgba(245,197,24,0.6)" : "none",
                  }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ padding: "16px 16px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <Zap size={10} color="rgba(0,255,231,0.5)" />
              <span style={{ fontSize: 8, color: "rgba(0,255,231,0.5)", letterSpacing: "0.25em" }}>NODE LEGEND</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { color: "#f5c518", label: "TIER-1 · ENROLLED", shape: "hex" },
                { color: "#00ffe7", label: "TIER-1 · NO DATA", shape: "hex" },
                { color: "#ff6b35", label: "SELECTED TARGET", shape: "hex" },
                { color: "#1a4a6b", label: "GENERAL UNIVERSITY", shape: "dot" },
              ].map(({ color, label, shape }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 9,
                    color: "rgba(0,255,231,0.6)",
                    letterSpacing: "0.1em",
                  }}
                >
                  {shape === "hex" ? (
                    <svg width="14" height="14" viewBox="-7 -7 14 14">
                      <polygon
                        points="5,0 2.5,4.33 -2.5,4.33 -5,0 -2.5,-4.33 2.5,-4.33"
                        fill={color + "30"}
                        stroke={color}
                        strokeWidth="1.5"
                      />
                      <polygon points="2.5,0 1.25,2.17 -1.25,2.17 -2.5,0 -1.25,-2.17 1.25,-2.17" fill={color} />
                    </svg>
                  ) : (
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, opacity: 0.7 }} />
                  )}
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panel footer */}
        <div
          style={{
            padding: "8px 16px",
            borderTop: "1px solid rgba(0,255,231,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(0,255,231,0.02)",
          }}
        >
          <span style={{ fontSize: 8, color: "rgba(0,255,231,0.3)", letterSpacing: "0.15em" }}>
            UNIGRAMM GEOINT · v4.2
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div
              style={{ width: 4, height: 4, borderRadius: "50%", background: "#00ff88", boxShadow: "0 0 4px #00ff88" }}
              className="pulse-dot"
            />
            <span style={{ fontSize: 8, color: "#00ff88", letterSpacing: "0.15em" }}>LIVE</span>
          </div>
        </div>
      </aside>

      {/* Left panel toggle */}
      {!intelOpen && (
        <button
          onClick={() => setIntelOpen(true)}
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 25,
            height: 64,
            width: 24,
            background: "rgba(0,8,20,0.9)",
            cursor: "pointer",
            border: "1px solid rgba(0,255,231,0.3)",
            borderLeft: "none",
            borderRadius: "0 6px 6px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#00ffe7",
          }}
        >
          <ChevronRight size={14} />
        </button>
      )}

      {/* RIGHT DETAIL PANEL */}
      <aside
        style={{
          position: "absolute",
          right: 0,
          top: 48,
          bottom: 0,
          width: 340,
          zIndex: 20,
          background: "linear-gradient(225deg, rgba(0,8,20,0.97) 0%, rgba(0,4,12,0.92) 100%)",
          borderLeft: "1px solid rgba(0,255,231,0.15)",
          display: "flex",
          flexDirection: "column",
          transform: detailOpen && selected ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
          backdropFilter: "blur(24px)",
        }}
      >
        {selected && (
          <>
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid rgba(0,255,231,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(0,255,231,0.03)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => setDetailOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(0,255,231,0.5)",
                    cursor: "pointer",
                    padding: 2,
                  }}
                >
                  <ArrowLeft size={14} />
                </button>
                <Shield size={11} color="#00ffe7" />
                <span style={{ fontSize: 9, color: "#00ffe7", letterSpacing: "0.3em" }}>CAMPUS DOSSIER</span>
              </div>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#00ff88",
                  boxShadow: "0 0 6px #00ff88",
                }}
                className="pulse-dot"
              />
            </div>

            <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "thin" }}>
              {/* University identity block */}
              <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,255,231,0.1)" }}>
                <p
                  style={{
                    fontSize: 8,
                    color: "rgba(0,255,231,0.4)",
                    letterSpacing: "0.3em",
                    margin: "0 0 4px",
                    textTransform: "uppercase",
                  }}
                >
                  {selected.state}
                </p>
                <h2
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#f5c518",
                    margin: "0 0 4px",
                    lineHeight: 1.2,
                    textShadow: "0 0 15px rgba(245,197,24,0.5)",
                    fontFamily: "'Rajdhani', sans-serif",
                  }}
                >
                  {selected.name}
                </h2>
                {selected.abbr && (
                  <p style={{ fontSize: 9, color: "#00ffe7", margin: "4px 0 0", letterSpacing: "0.2em", opacity: 0.8 }}>
                    CALLSIGN · {selected.abbr}
                  </p>
                )}
                <p style={{ fontSize: 9, color: "rgba(0,255,231,0.4)", margin: "6px 0 0", letterSpacing: "0.12em" }}>
                  {fmtCoord(selected.lat, selected.lng)}
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 10,
                    padding: "4px 8px",
                    border: "1px solid rgba(0,255,100,0.35)",
                    background: "rgba(0,255,100,0.05)",
                    borderRadius: 3,
                    width: "fit-content",
                  }}
                >
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "#00ff88",
                      boxShadow: "0 0 5px #00ff88",
                    }}
                    className="pulse-dot"
                  />
                  <span style={{ fontSize: 8, color: "#00ff88", letterSpacing: "0.2em" }}>STATUS: ACTIVE</span>
                </div>

                {/* Data tiles */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
                  {[
                    { label: "STUDENTS", value: String(studentCount), tab: "students" as const },
                    { label: "CLUBS", value: String(clubs.length), tab: "clubs" as const },
                  ].map(({ label, value, tab }) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setDetailTab(tab);
                        if (tab === "students" && selected && students.length === 0 && !studentsLoading)
                          loadStudents(selected);
                      }}
                      style={{
                        padding: "10px 12px",
                        textAlign: "left",
                        cursor: "pointer",
                        background: detailTab === tab ? "rgba(245,197,24,0.08)" : "rgba(0,255,231,0.03)",
                        border: `1px solid ${detailTab === tab ? "rgba(245,197,24,0.5)" : "rgba(0,255,231,0.15)"}`,
                        borderRadius: 4,
                        transition: "all 0.2s",
                        boxShadow: detailTab === tab ? "0 0 12px rgba(245,197,24,0.15)" : "none",
                        fontFamily: "inherit",
                      }}
                    >
                      <p style={{ fontSize: 8, color: "rgba(0,255,231,0.5)", letterSpacing: "0.2em", margin: 0 }}>
                        {label}
                      </p>
                      <p
                        style={{
                          fontSize: 22,
                          color: "#f5c518",
                          margin: "4px 0 0",
                          textShadow: "0 0 8px rgba(245,197,24,0.5)",
                        }}
                      >
                        {value}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tabs: Clubs */}
              {detailTab === "clubs" && (
                <div style={{ padding: "12px 16px" }}>
                  <div
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Building2 size={10} color="rgba(0,255,231,0.5)" />
                      <span style={{ fontSize: 8, color: "rgba(0,255,231,0.5)", letterSpacing: "0.25em" }}>
                        REGISTERED CLUBS
                      </span>
                    </div>
                    {detailLoading && <Loader2 size={12} color="#00ffe7" className="spin" />}
                  </div>
                  {!detailLoading && clubs.length === 0 && (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "24px",
                        border: "1px dashed rgba(0,255,231,0.15)",
                        borderRadius: 4,
                      }}
                    >
                      <p style={{ fontSize: 9, color: "rgba(0,255,231,0.35)", letterSpacing: "0.15em", margin: 0 }}>
                        NO CLUBS · NO SIGNAL
                      </p>
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {clubs.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 10px",
                          background: "rgba(0,0,0,0.3)",
                          border: "1px solid rgba(0,255,231,0.1)",
                          borderRadius: 4,
                          transition: "border-color 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(0,255,231,0.35)")}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(0,255,231,0.1)")}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            background: "rgba(0,255,231,0.06)",
                            border: "1px solid rgba(0,255,231,0.2)",
                            borderRadius: 3,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            flexShrink: 0,
                          }}
                        >
                          {c.logo_url ? (
                            <img
                              src={c.logo_url}
                              alt=""
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <Building2 size={14} color="#00ffe7" />
                          )}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p
                            style={{
                              fontSize: 12,
                              color: "#c8e8f0",
                              margin: 0,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              fontFamily: "'Rajdhani', sans-serif",
                              fontWeight: 600,
                            }}
                          >
                            {c.club_name}
                          </p>
                          <p
                            style={{
                              fontSize: 8,
                              color: "rgba(0,255,231,0.4)",
                              margin: "2px 0 0",
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                            }}
                          >
                            {c.category || "GENERAL"} · {c.member_count || 0} MBR
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabs: Students */}
              {detailTab === "students" && (
                <div style={{ padding: "12px 16px" }}>
                  <div
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Users size={10} color="rgba(0,255,231,0.5)" />
                      <span style={{ fontSize: 8, color: "rgba(0,255,231,0.5)", letterSpacing: "0.25em" }}>
                        ENROLLED AGENTS
                      </span>
                    </div>
                    {studentsLoading && <Loader2 size={12} color="#00ffe7" className="spin" />}
                  </div>
                  {!studentsLoading && students.length === 0 && (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "24px",
                        border: "1px dashed rgba(0,255,231,0.15)",
                        borderRadius: 4,
                      }}
                    >
                      <p style={{ fontSize: 9, color: "rgba(0,255,231,0.35)", letterSpacing: "0.15em", margin: 0 }}>
                        NO STUDENTS · NO SIGNAL
                      </p>
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {students.map((s) => (
                      <div
                        key={s.user_id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 10px",
                          background: "rgba(0,0,0,0.3)",
                          border: "1px solid rgba(0,255,231,0.1)",
                          borderRadius: 4,
                          transition: "border-color 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(0,255,231,0.35)")}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(0,255,231,0.1)")}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 3,
                            overflow: "hidden",
                            flexShrink: 0,
                            border: "1px solid rgba(0,255,231,0.2)",
                          }}
                        >
                          <img
                            src={s.avatar_url || "/default-avatar.png"}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => ((e.target as HTMLImageElement).src = "/default-avatar.png")}
                          />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p
                            style={{
                              fontSize: 12,
                              color: "#c8e8f0",
                              margin: 0,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              fontFamily: "'Rajdhani', sans-serif",
                              fontWeight: 600,
                            }}
                          >
                            {s.full_name || s.username || "Unknown"}
                          </p>
                          <p
                            style={{
                              fontSize: 8,
                              color: "rgba(0,255,231,0.4)",
                              margin: "2px 0 0",
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                            }}
                          >
                            {s.username ? "@" + s.username : "—"}
                            {s.major ? " · " + s.major : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </aside>

      {/* LOADING OVERLAY */}
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 50,
            background: "rgba(3,5,8,0.96)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            backdropFilter: "blur(10px)",
          }}
        >
          {/* Holographic circle */}
          <div style={{ position: "relative", width: 120, height: 120 }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: "1px solid rgba(0,255,231,0.3)",
                animation: "spin 3s linear infinite",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 12,
                borderRadius: "50%",
                border: "2px solid rgba(0,255,231,0.15)",
                borderTopColor: "#00ffe7",
                animation: "spin 1.5s linear infinite reverse",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 28,
                borderRadius: "50%",
                border: "1px solid rgba(0,255,231,0.4)",
                animation: "spin 2s linear infinite",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: "50%",
                width: 12,
                height: 12,
                transform: "translate(-50%,-50%)",
                background: "#00ffe7",
                borderRadius: "50%",
                boxShadow: "0 0 20px #00ffe7, 0 0 40px rgba(0,255,231,0.5)",
              }}
            />
          </div>

          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 9, color: "#00ffe7", letterSpacing: "0.4em", margin: "0 0 8px" }}>
              {loadMessages[Math.min(loadPhase, loadMessages.length - 1)]}
            </p>
            {/* Progress bar */}
            <div
              style={{ width: 200, height: 2, background: "rgba(0,255,231,0.15)", borderRadius: 2, overflow: "hidden" }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(loadPhase / 4) * 100}%`,
                  background: "linear-gradient(90deg, #00ffe7, #00a8ff)",
                  transition: "width 0.5s ease",
                  boxShadow: "0 0 8px #00ffe7",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 3 }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: loadPhase > i ? "#00ffe7" : "rgba(0,255,231,0.2)",
                  boxShadow: loadPhase > i ? "0 0 6px #00ffe7" : "none",
                  transition: "all 0.3s",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Holographic popup styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Rajdhani:wght@500;600;700&display=swap');

        .maplibregl-popup.holo-popup .maplibregl-popup-content {
          background: transparent !important; padding: 0 !important; box-shadow: none !important; border-radius: 0 !important;
        }
        .maplibregl-popup.holo-popup .maplibregl-popup-tip { display: none !important; }

        .holo-card {
          min-width: 230px;
          background: linear-gradient(135deg, rgba(0,8,20,0.97) 0%, rgba(0,4,14,0.95) 100%);
          border: 1px solid rgba(0,255,231,0.4);
          box-shadow: 0 0 30px rgba(0,255,231,0.15), inset 0 0 20px rgba(0,255,231,0.02);
          padding: 12px 14px;
          font-family: 'Space Mono', monospace;
          animation: holoIn 120ms ease-out both;
          position: relative;
          overflow: hidden;
        }
        .holo-card::before {
          content: '';
          position: absolute;
          top: 0; left: -100%; width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0,255,231,0.04), transparent);
          animation: shimmer 3s linear infinite;
        }
        @keyframes shimmer { to { left: 200%; } }
        @keyframes holoIn {
          0% { opacity: 0; transform: translateY(-4px) scale(0.98); }
          60% { opacity: 0.8; }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .holo-card-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
        .holo-tag { font-size: 8px; color: rgba(0,255,231,0.6); letter-spacing: 0.25em; }
        .holo-live { font-size: 8px; color: #ff6b35; letter-spacing: 0.15em; }
        .holo-card-name { font-family: 'Rajdhani', sans-serif; font-weight: 700; font-size: 14px; color: #f5c518; line-height: 1.2; margin: 4px 0 3px; text-shadow: 0 0 8px rgba(245,197,24,0.4); }
        .holo-card-sub { font-size: 8px; color: rgba(0,255,231,0.45); letter-spacing: 0.12em; text-transform: uppercase; }
        .holo-card-coord { font-size: 9px; color: rgba(0,255,231,0.7); margin: 6px 0; letter-spacing: 0.1em; }
        .holo-card-footer { display: flex; justify-content: space-between; font-size: 8px; color: rgba(0,255,231,0.5); letter-spacing: 0.1em; margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(0,255,231,0.12); }
        .holo-card-footer b { color: #f5c518; font-weight: 400; margin-left: 4px; }

        .pulse-dot { animation: pulseDot 2s ease-in-out infinite; }
        @keyframes pulseDot { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .maplibregl-ctrl-group {
          background: rgba(0,8,20,0.9) !important;
          border: 1px solid rgba(0,255,231,0.3) !important;
          border-radius: 4px !important;
          backdrop-filter: blur(10px) !important;
        }
        .maplibregl-ctrl-group button { background: transparent !important; color: rgba(0,255,231,0.7) !important; }
        .maplibregl-ctrl-group button span { filter: invert(1) hue-rotate(140deg) brightness(1.5) saturate(2); }
        .maplibregl-ctrl-attrib {
          background: rgba(0,8,20,0.75) !important;
          color: rgba(0,255,231,0.35) !important;
          font-size: 8px !important;
          font-family: 'Space Mono', monospace !important;
          border: 1px solid rgba(0,255,231,0.1) !important;
        }
        .maplibregl-ctrl-attrib a { color: rgba(0,255,231,0.5) !important; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,255,231,0.2); border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,255,231,0.4); }
      `}</style>
    </div>
  );
};

function escapeHtml(s: string) {
  return String(s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

export default AdminUniversityMap;
