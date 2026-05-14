import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, Popup } from 'react-leaflet';
import { MapPin, RefreshCw, Search, Users, TrendingUp, Route } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

type LocationRow = {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  location_name: string | null;
  recorded_at: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  university: string | null;
};

const RANGE_OPTIONS = [
  { label: 'Last 24h', value: 24 },
  { label: 'Last 7 days', value: 24 * 7 },
  { label: 'Last 30 days', value: 24 * 30 },
  { label: 'All time', value: 0 },
];

const AdminLocationHistory: React.FC = () => {
  const [rows, setRows] = useState<LocationRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(false);
  const [hours, setHours] = useState<number>(24 * 7);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      let q = supabase
        .from('user_location_history')
        .select('id, user_id, latitude, longitude, location_name, recorded_at')
        .order('recorded_at', { ascending: false })
        .limit(5000);
      if (hours > 0) {
        const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
        q = q.gte('recorded_at', since);
      }
      const { data, error } = await q;
      if (error) throw error;
      const list = (data || []) as LocationRow[];
      setRows(list);

      const ids = Array.from(new Set(list.map(r => r.user_id)));
      if (ids.length) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, university')
          .in('id', ids);
        const map: Record<string, Profile> = {};
        (profs || []).forEach((p: any) => { map[p.id] = p; });
        setProfiles(map);
      } else {
        setProfiles({});
      }
    } catch (e: any) {
      console.error('[AdminLocationHistory]', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [hours]);

  const filteredRows = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r => {
      const p = profiles[r.user_id];
      return (
        (p?.full_name || '').toLowerCase().includes(s) ||
        (p?.username || '').toLowerCase().includes(s) ||
        (p?.university || '').toLowerCase().includes(s) ||
        (r.location_name || '').toLowerCase().includes(s)
      );
    });
  }, [rows, profiles, search]);

  // Popular locations
  const popularLocations = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredRows.forEach(r => {
      const k = r.location_name || 'Unknown';
      counts[k] = (counts[k] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
  }, [filteredRows]);

  // Per-user stats
  const userStats = useMemo(() => {
    const m: Record<string, { count: number; last: string }> = {};
    filteredRows.forEach(r => {
      if (!m[r.user_id]) m[r.user_id] = { count: 0, last: r.recorded_at };
      m[r.user_id].count += 1;
      if (r.recorded_at > m[r.user_id].last) m[r.user_id].last = r.recorded_at;
    });
    return Object.entries(m).sort((a, b) => b[1].count - a[1].count);
  }, [filteredRows]);

  // Map center: average of points
  const mapCenter = useMemo<[number, number]>(() => {
    if (!filteredRows.length) return [20.5937, 78.9629]; // India fallback
    const lat = filteredRows.reduce((s, r) => s + r.latitude, 0) / filteredRows.length;
    const lng = filteredRows.reduce((s, r) => s + r.longitude, 0) / filteredRows.length;
    return [lat, lng];
  }, [filteredRows]);

  // Trail for selected user (sorted asc by time)
  const selectedTrail = useMemo(() => {
    if (!selectedUser) return [];
    return filteredRows
      .filter(r => r.user_id === selectedUser)
      .slice()
      .sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));
  }, [filteredRows, selectedUser]);

  // Heat density buckets — color a marker by how many points share its rounded coord
  const densityMap = useMemo(() => {
    const m = new Map<string, number>();
    filteredRows.forEach(r => {
      const k = `${r.latitude.toFixed(4)}_${r.longitude.toFixed(4)}`;
      m.set(k, (m.get(k) || 0) + 1);
    });
    return m;
  }, [filteredRows]);

  const maxDensity = useMemo(() => {
    let max = 1;
    densityMap.forEach(v => { if (v > max) max = v; });
    return max;
  }, [densityMap]);

  const colorFor = (n: number) => {
    const t = Math.min(1, n / maxDensity);
    // blue -> cyan -> orange -> red
    if (t < 0.33) return '#4f8eff';
    if (t < 0.66) return '#22d3ee';
    if (t < 0.9) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Location History</h2>
          <Badge variant="secondary">{filteredRows.length.toLocaleString()} logs</Badge>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          {RANGE_OPTIONS.map(opt => (
            <Button
              key={opt.value}
              size="sm"
              variant={hours === opt.value ? 'default' : 'outline'}
              onClick={() => setHours(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by student name, username, university, or location…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabs defaultValue="map">
        <TabsList>
          <TabsTrigger value="map">Heatmap</TabsTrigger>
          <TabsTrigger value="trails">Student Trails</TabsTrigger>
          <TabsTrigger value="popular">Popular Zones</TabsTrigger>
          <TabsTrigger value="logs">Raw Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-3">
          <Card>
            <CardContent className="p-0">
              <div style={{ height: 560, width: '100%' }}>
                <MapContainer
                  center={mapCenter}
                  zoom={filteredRows.length ? 17 : 5}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {filteredRows.map(r => {
                    const k = `${r.latitude.toFixed(4)}_${r.longitude.toFixed(4)}`;
                    const d = densityMap.get(k) || 1;
                    return (
                      <CircleMarker
                        key={r.id}
                        center={[r.latitude, r.longitude]}
                        radius={Math.min(14, 4 + Math.log2(d + 1) * 2)}
                        pathOptions={{ color: colorFor(d), fillColor: colorFor(d), fillOpacity: 0.5, weight: 1 }}
                      >
                        <Popup>
                          <div className="text-xs">
                            <div className="font-semibold">{profiles[r.user_id]?.full_name || profiles[r.user_id]?.username || 'Unknown'}</div>
                            <div>{r.location_name || '—'}</div>
                            <div className="text-muted-foreground">{new Date(r.recorded_at).toLocaleString()}</div>
                            <div className="text-muted-foreground">{d} log{d > 1 ? 's' : ''} here</div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    );
                  })}
                </MapContainer>
              </div>
            </CardContent>
          </Card>
          <div className="text-xs text-muted-foreground flex items-center gap-3">
            <span>Density:</span>
            <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: '#4f8eff' }} /> low</span>
            <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: '#22d3ee' }} /> mid</span>
            <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: '#f59e0b' }} /> high</span>
            <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }} /> hotspot</span>
          </div>
        </TabsContent>

        <TabsContent value="trails" className="space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4" /> Students</CardTitle>
              </CardHeader>
              <CardContent className="p-0 max-h-[500px] overflow-y-auto">
                {userStats.length === 0 && (
                  <div className="p-4 text-sm text-muted-foreground">No data.</div>
                )}
                {userStats.map(([uid, s]) => {
                  const p = profiles[uid];
                  const active = uid === selectedUser;
                  return (
                    <button
                      key={uid}
                      onClick={() => setSelectedUser(uid)}
                      className={`w-full text-left px-3 py-2 border-b border-border/40 hover:bg-muted/40 ${active ? 'bg-muted/60' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{p?.full_name || p?.username || uid.slice(0, 8)}</div>
                          <div className="text-xs text-muted-foreground truncate">{p?.university || '—'}</div>
                        </div>
                        <Badge variant="outline">{s.count}</Badge>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">last: {new Date(s.last).toLocaleString()}</div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><Route className="w-4 h-4" /> Trail</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div style={{ height: 500 }}>
                  <MapContainer
                    key={selectedUser || 'none'}
                    center={selectedTrail.length ? [selectedTrail[0].latitude, selectedTrail[0].longitude] : mapCenter}
                    zoom={selectedTrail.length ? 17 : 5}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {selectedTrail.length > 1 && (
                      <Polyline
                        positions={selectedTrail.map(r => [r.latitude, r.longitude]) as any}
                        pathOptions={{ color: '#4f8eff', weight: 3, opacity: 0.7 }}
                      />
                    )}
                    {selectedTrail.map((r, i) => (
                      <CircleMarker
                        key={r.id}
                        center={[r.latitude, r.longitude]}
                        radius={i === 0 || i === selectedTrail.length - 1 ? 8 : 5}
                        pathOptions={{
                          color: i === selectedTrail.length - 1 ? '#22c55e' : i === 0 ? '#ef4444' : '#4f8eff',
                          fillOpacity: 0.8,
                        }}
                      >
                        <Tooltip>
                          <div className="text-xs">
                            <div>{r.location_name || '—'}</div>
                            <div>{new Date(r.recorded_at).toLocaleString()}</div>
                          </div>
                        </Tooltip>
                      </CircleMarker>
                    ))}
                  </MapContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="popular">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Popular Zones</CardTitle>
            </CardHeader>
            <CardContent>
              {popularLocations.length === 0 ? (
                <div className="text-sm text-muted-foreground">No data.</div>
              ) : (
                <div className="space-y-2">
                  {popularLocations.map(([name, n]) => {
                    const max = popularLocations[0][1];
                    const pct = (n / max) * 100;
                    return (
                      <div key={name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{name}</span>
                          <span className="text-muted-foreground">{n} logs</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>University</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Coordinates</TableHead>
                    <TableHead>Recorded At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.slice(0, 500).map(r => {
                    const p = profiles[r.user_id];
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{p?.full_name || p?.username || r.user_id.slice(0, 8)}</TableCell>
                        <TableCell className="text-muted-foreground">{p?.university || '—'}</TableCell>
                        <TableCell>{r.location_name || '—'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.latitude.toFixed(5)}, {r.longitude.toFixed(5)}</TableCell>
                        <TableCell className="text-xs">{new Date(r.recorded_at).toLocaleString()}</TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredRows.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No logs found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              {filteredRows.length > 500 && (
                <div className="p-3 text-xs text-muted-foreground text-center border-t border-border/40">
                  Showing first 500 of {filteredRows.length.toLocaleString()} logs. Narrow the time range or search to see more.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminLocationHistory;