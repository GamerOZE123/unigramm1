import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart3, Clock, Home, Compass, GraduationCap, MessageCircle, User,
  Search, Download, ChevronUp, ChevronDown, Filter, X, FileText
} from 'lucide-react';

type DateRange = '1' | '7' | '30' | '90' | 'all';
type SortField = 'total' | 'home' | 'explore' | 'university' | 'chat' | 'profile' | 'last_date';
type SortDir = 'asc' | 'desc';

interface UserRow {
  user_id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  university: string | null;
  home_sec: number;
  explore_sec: number;
  university_sec: number;
  chat_sec: number;
  profile_sec: number;
  total_sec: number;
  last_date: string;
  days: Map<string, { home: number; explore: number; university: number; chat: number; profile: number; total: number }>;
}

interface OverviewData {
  home: number; explore: number; university: number; chat: number; profile: number;
  total: number; activeUsers: number;
}

const PAGE_SIZE = 25;

const AdminAnalyticsPage: React.FC<{ password: string }> = ({ password }) => {
  const [range, setRange] = useState<DateRange>('7');
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('total');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [uniFilter, setUniFilter] = useState<string>('all');
  const [minMinutes, setMinMinutes] = useState<string>('');

  const getDateFilter = () => {
    if (range === 'all') return undefined;
    const d = new Date();
    d.setDate(d.getDate() - parseInt(range));
    return d.toISOString().split('T')[0];
  };

  const fetchData = async () => {
    setLoading(true);
    const dateFilter = getDateFilter();

    let query = supabase
      .from('user_page_analytics')
      .select('user_id, home_sec, explore_sec, university_sec, chat_sec, profile_sec, total_sec, date');
    if (dateFilter) query = query.gte('date', dateFilter);

    const { data: raw } = await query;

    if (!raw || raw.length === 0) {
      setOverview({ home: 0, explore: 0, university: 0, chat: 0, profile: 0, total: 0, activeUsers: 0 });
      setUsers([]);
      setLoading(false);
      return;
    }

    const uniqueUsers = new Set(raw.map(r => r.user_id));
    setOverview({
      home: raw.reduce((s, r) => s + (r.home_sec || 0), 0),
      explore: raw.reduce((s, r) => s + (r.explore_sec || 0), 0),
      university: raw.reduce((s, r) => s + (r.university_sec || 0), 0),
      chat: raw.reduce((s, r) => s + (r.chat_sec || 0), 0),
      profile: raw.reduce((s, r) => s + (r.profile_sec || 0), 0),
      total: raw.reduce((s, r) => s + (r.total_sec || 0), 0),
      activeUsers: uniqueUsers.size,
    });

    // Per-user aggregation
    const userMap = new Map<string, UserRow>();
    for (const row of raw) {
      let u = userMap.get(row.user_id);
      if (!u) {
        u = {
          user_id: row.user_id, full_name: '', username: '', avatar_url: null, university: null,
          home_sec: 0, explore_sec: 0, university_sec: 0, chat_sec: 0, profile_sec: 0, total_sec: 0,
          last_date: '', days: new Map()
        };
        userMap.set(row.user_id, u);
      }
      u.home_sec += row.home_sec || 0;
      u.explore_sec += row.explore_sec || 0;
      u.university_sec += row.university_sec || 0;
      u.chat_sec += row.chat_sec || 0;
      u.profile_sec += row.profile_sec || 0;
      u.total_sec += row.total_sec || 0;
      if (row.date > u.last_date) u.last_date = row.date;
      u.days.set(row.date, {
        home: row.home_sec || 0, explore: row.explore_sec || 0,
        university: row.university_sec || 0, chat: row.chat_sec || 0,
        profile: row.profile_sec || 0, total: row.total_sec || 0,
      });
    }

    const userIds = Array.from(userMap.keys());
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, username, avatar_url, university')
      .in('user_id', userIds);

    for (const p of profiles || []) {
      const u = userMap.get(p.user_id);
      if (u) {
        u.full_name = p.full_name || 'Unknown';
        u.username = p.username || '—';
        u.avatar_url = p.avatar_url || null;
        u.university = p.university || null;
      }
    }

    setUsers(Array.from(userMap.values()));
    setPage(0);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [range]);

  // Derived data
  const universities = useMemo(() => {
    const set = new Set(users.map(u => u.university).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [users]);

  const filteredUsers = useMemo(() => {
    let list = [...users];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(u => u.full_name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q));
    }
    if (uniFilter !== 'all') {
      list = list.filter(u => u.university === uniFilter);
    }
    if (minMinutes) {
      const minSec = parseFloat(minMinutes) * 60;
      list = list.filter(u => u.total_sec >= minSec);
    }
    list.sort((a, b) => {
      let av: number | string, bv: number | string;
      switch (sortField) {
        case 'home': av = a.home_sec; bv = b.home_sec; break;
        case 'explore': av = a.explore_sec; bv = b.explore_sec; break;
        case 'university': av = a.university_sec; bv = b.university_sec; break;
        case 'chat': av = a.chat_sec; bv = b.chat_sec; break;
        case 'profile': av = a.profile_sec; bv = b.profile_sec; break;
        case 'last_date': av = a.last_date; bv = b.last_date; break;
        default: av = a.total_sec; bv = b.total_sec;
      }
      if (sortDir === 'asc') return av < bv ? -1 : av > bv ? 1 : 0;
      return av > bv ? -1 : av < bv ? 1 : 0;
    });
    return list;
  }, [users, search, sortField, sortDir, uniFilter, minMinutes]);

  const paged = filteredUsers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);

  const formatTime = (s: number) => {
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.round(s / 60)}m`;
    return `${(s / 3600).toFixed(1)}h`;
  };
  const pct = (v: number, t: number) => t > 0 ? `${Math.round((v / t) * 100)}%` : '0%';

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'desc' ? <ChevronDown className="w-3 h-3 inline ml-0.5" /> : <ChevronUp className="w-3 h-3 inline ml-0.5" />;
  };

  const exportCSV = () => {
    const headers = ['Name', 'Username', 'University', 'Total(s)', 'Home(s)', 'Explore(s)', 'University(s)', 'Chat(s)', 'Profile(s)', 'Last Seen'];
    const rows = filteredUsers.map(u => [
      u.full_name, u.username, u.university || '', u.total_sec, u.home_sec, u.explore_sec,
      u.university_sec, u.chat_sec, u.profile_sec, u.last_date
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `analytics_${range}_days.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const tabCards = overview ? [
    { label: 'Home', value: overview.home, icon: Home, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Explore', value: overview.explore, icon: Compass, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'University', value: overview.university, icon: GraduationCap, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Chat', value: overview.chat, icon: MessageCircle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Profile', value: overview.profile, icon: User, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  ] : [];

  const hasActiveFilters = search || uniFilter !== 'all' || minMinutes;

  return (
    <div className="space-y-6">
      {/* Date Range */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground mr-1">Range:</span>
        {([['1', 'Today'], ['7', '7 days'], ['30', '30 days'], ['90', '90 days'], ['all', 'All time']] as const).map(([val, label]) => (
          <Button key={val} variant={range === val ? 'default' : 'outline'} size="sm" onClick={() => setRange(val)}>
            {label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading analytics…</div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card className="border-border/40">
              <CardContent className="pt-4 text-center">
                <div className="mx-auto w-9 h-9 rounded-lg bg-muted flex items-center justify-center mb-2">
                  <BarChart3 className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{overview?.activeUsers ?? 0}</p>
              </CardContent>
            </Card>
            {tabCards.map(c => (
              <Card key={c.label} className="border-border/40">
                <CardContent className="pt-4 text-center">
                  <div className={`mx-auto w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center mb-2`}>
                    <c.icon className={`w-4 h-4 ${c.color}`} />
                  </div>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className="text-2xl font-bold">{formatTime(c.value)}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Distribution Bar */}
          {overview && overview.total > 0 && (
            <Card className="border-border/40">
              <CardHeader className="pb-3"><CardTitle className="text-sm">Time Distribution</CardTitle></CardHeader>
              <CardContent>
                <div className="h-8 rounded-full overflow-hidden flex">
                  {[
                    { val: overview.home, color: 'bg-blue-500', label: 'Home' },
                    { val: overview.explore, color: 'bg-green-500', label: 'Explore' },
                    { val: overview.university, color: 'bg-purple-500', label: 'University' },
                    { val: overview.chat, color: 'bg-amber-500', label: 'Chat' },
                    { val: overview.profile, color: 'bg-pink-500', label: 'Profile' },
                  ].filter(s => s.val > 0).map(seg => (
                    <div
                      key={seg.label}
                      className={`${seg.color} flex items-center justify-center text-xs font-medium text-white`}
                      style={{ width: `${(seg.val / overview.total) * 100}%` }}
                      title={`${seg.label}: ${formatTime(seg.val)} (${pct(seg.val, overview.total)})`}
                    >
                      {(seg.val / overview.total) > 0.08 ? seg.label : ''}
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 mt-3 flex-wrap">
                  {[
                    { label: 'Home', color: 'bg-blue-500' },
                    { label: 'Explore', color: 'bg-green-500' },
                    { label: 'University', color: 'bg-purple-500' },
                    { label: 'Chat', color: 'bg-amber-500' },
                    { label: 'Profile', color: 'bg-pink-500' },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
                      {l.label}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters + Actions */}
          <Card className="border-border/40">
            <CardContent className="pt-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or username…"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(0); }}
                    className="pl-9"
                  />
                </div>
                <Select value={uniFilter} onValueChange={v => { setUniFilter(v); setPage(0); }}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="University" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Universities</SelectItem>
                    {universities.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Min minutes"
                  value={minMinutes}
                  onChange={e => { setMinMinutes(e.target.value); setPage(0); }}
                  className="w-[120px]"
                />
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setUniFilter('all'); setMinMinutes(''); setPage(0); }}>
                    <X className="w-3.5 h-3.5 mr-1" /> Clear
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={exportCSV}>
                  <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{filteredUsers.length} users found</p>
            </CardContent>
          </Card>

          {/* Per-User Table */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Per-User Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="cursor-pointer text-right" onClick={() => handleSort('total')}>
                      Total <SortIcon field="total" />
                    </TableHead>
                    <TableHead className="cursor-pointer text-right" onClick={() => handleSort('home')}>
                      Home <SortIcon field="home" />
                    </TableHead>
                    <TableHead className="cursor-pointer text-right" onClick={() => handleSort('explore')}>
                      Explore <SortIcon field="explore" />
                    </TableHead>
                    <TableHead className="cursor-pointer text-right" onClick={() => handleSort('university')}>
                      Uni <SortIcon field="university" />
                    </TableHead>
                    <TableHead className="cursor-pointer text-right" onClick={() => handleSort('chat')}>
                      Chat <SortIcon field="chat" />
                    </TableHead>
                    <TableHead className="cursor-pointer text-right" onClick={() => handleSort('profile')}>
                      Profile <SortIcon field="profile" />
                    </TableHead>
                    <TableHead className="cursor-pointer text-right" onClick={() => handleSort('last_date')}>
                      Last Seen <SortIcon field="last_date" />
                    </TableHead>
                    <TableHead className="text-right">Report</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No analytics data found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paged.map(u => (
                      <TableRow key={u.user_id} className="cursor-pointer hover:bg-muted/40">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {u.avatar_url ? (
                              <img src={u.avatar_url} className="w-7 h-7 rounded-full object-cover" alt="" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                                {u.full_name?.[0] || '?'}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium">{u.full_name}</p>
                              <p className="text-xs text-muted-foreground">@{u.username}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">{formatTime(u.total_sec)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatTime(u.home_sec)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatTime(u.explore_sec)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatTime(u.university_sec)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatTime(u.chat_sec)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatTime(u.profile_sec)}</TableCell>
                        <TableCell className="text-right text-xs">
                          {u.last_date ? new Date(u.last_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => setSelectedUser(u)}>
                            <FileText className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border/40">
                  <p className="text-xs text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </p>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</Button>
                    <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* User Report Modal */}
      <Dialog open={!!selectedUser} onOpenChange={open => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedUser && <UserReportContent user={selectedUser} formatTime={formatTime} pct={pct} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const UserReportContent: React.FC<{
  user: UserRow;
  formatTime: (s: number) => string;
  pct: (v: number, t: number) => string;
}> = ({ user, formatTime, pct }) => {
  const sortedDays = Array.from(user.days.entries()).sort((a, b) => b[0].localeCompare(a[0]));

  const sections = [
    { label: 'Home', sec: user.home_sec, color: 'bg-blue-500' },
    { label: 'Explore', sec: user.explore_sec, color: 'bg-green-500' },
    { label: 'University', sec: user.university_sec, color: 'bg-purple-500' },
    { label: 'Chat', sec: user.chat_sec, color: 'bg-amber-500' },
    { label: 'Profile', sec: user.profile_sec, color: 'bg-pink-500' },
  ];

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3">
          {user.avatar_url ? (
            <img src={user.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold">
              {user.full_name?.[0] || '?'}
            </div>
          )}
          <div>
            <p>{user.full_name}</p>
            <p className="text-sm font-normal text-muted-foreground">@{user.username} {user.university && `• ${user.university}`}</p>
          </div>
        </DialogTitle>
      </DialogHeader>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="text-center p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground">Total Time</p>
          <p className="text-lg font-bold">{formatTime(user.total_sec)}</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground">Active Days</p>
          <p className="text-lg font-bold">{user.days.size}</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground">Last Seen</p>
          <p className="text-lg font-bold">
            {user.last_date ? new Date(user.last_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
          </p>
        </div>
      </div>

      {/* Section Breakdown */}
      <div className="space-y-2 mt-4">
        <p className="text-sm font-medium text-foreground">Section Breakdown</p>
        {sections.map(s => (
          <div key={s.label} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-16">{s.label}</span>
            <div className="flex-1 h-5 rounded-full bg-muted overflow-hidden">
              <div
                className={`${s.color} h-full rounded-full transition-all`}
                style={{ width: user.total_sec > 0 ? `${(s.sec / user.total_sec) * 100}%` : '0%' }}
              />
            </div>
            <span className="text-xs font-medium w-14 text-right">{formatTime(s.sec)}</span>
            <span className="text-xs text-muted-foreground w-10 text-right">{pct(s.sec, user.total_sec)}</span>
          </div>
        ))}
      </div>

      {/* Day-by-Day Table */}
      <div className="mt-4">
        <p className="text-sm font-medium text-foreground mb-2">Day-by-Day Activity</p>
        <div className="max-h-60 overflow-y-auto rounded-lg border border-border/40">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Home</TableHead>
                <TableHead className="text-right">Explore</TableHead>
                <TableHead className="text-right">Uni</TableHead>
                <TableHead className="text-right">Chat</TableHead>
                <TableHead className="text-right">Profile</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedDays.map(([date, d]) => (
                <TableRow key={date}>
                  <TableCell className="text-xs">
                    {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </TableCell>
                  <TableCell className="text-right text-xs font-medium">{formatTime(d.total)}</TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">{formatTime(d.home)}</TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">{formatTime(d.explore)}</TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">{formatTime(d.university)}</TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">{formatTime(d.chat)}</TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">{formatTime(d.profile)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
};

export default AdminAnalyticsPage;
