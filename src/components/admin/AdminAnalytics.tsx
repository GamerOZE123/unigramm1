import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Clock, Home, Compass, GraduationCap, MessageCircle, User } from 'lucide-react';

type DateRange = '1' | '7' | '30' | 'all';

interface OverviewData {
  home: number;
  explore: number;
  university: number;
  chat: number;
  profile: number;
  total: number;
  activeUsers: number;
}

interface UserRow {
  user_id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  home_sec: number;
  explore_sec: number;
  university_sec: number;
  chat_sec: number;
  profile_sec: number;
  total_sec: number;
  last_date: string;
}

const AdminAnalytics: React.FC<{ password: string }> = ({ password }) => {
  const [range, setRange] = useState<DateRange>('7');
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const getDateFilter = () => {
    if (range === 'all') return undefined;
    const d = new Date();
    d.setDate(d.getDate() - parseInt(range));
    return d.toISOString().split('T')[0];
  };

  const fetchData = async () => {
    setLoading(true);
    const dateFilter = getDateFilter();

    // Fetch overview
    let query = supabase
      .from('user_page_analytics')
      .select('home_sec, explore_sec, university_sec, chat_sec, profile_sec, total_sec, user_id');
    
    if (dateFilter) {
      query = query.gte('date', dateFilter);
    }

    const { data: raw } = await query;
    
    if (raw && raw.length > 0) {
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
    } else {
      setOverview({ home: 0, explore: 0, university: 0, chat: 0, profile: 0, total: 0, activeUsers: 0 });
    }

    // Fetch per-user aggregates
    // We aggregate client-side since we can't do GROUP BY via Supabase REST easily
    let userQuery = supabase
      .from('user_page_analytics')
      .select('user_id, home_sec, explore_sec, university_sec, chat_sec, profile_sec, total_sec, date');
    
    if (dateFilter) {
      userQuery = userQuery.gte('date', dateFilter);
    }

    const { data: userData } = await userQuery;

    if (userData && userData.length > 0) {
      const userMap = new Map<string, { home: number; explore: number; university: number; chat: number; profile: number; total: number; lastDate: string }>();
      
      for (const row of userData) {
        const existing = userMap.get(row.user_id) || { home: 0, explore: 0, university: 0, chat: 0, profile: 0, total: 0, lastDate: '' };
        existing.home += row.home_sec || 0;
        existing.explore += row.explore_sec || 0;
        existing.university += row.university_sec || 0;
        existing.chat += row.chat_sec || 0;
        existing.profile += row.profile_sec || 0;
        existing.total += row.total_sec || 0;
        if (row.date > existing.lastDate) existing.lastDate = row.date;
        userMap.set(row.user_id, existing);
      }

      // Fetch profile info for these users
      const userIds = Array.from(userMap.keys());
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      const userRows: UserRow[] = Array.from(userMap.entries()).map(([uid, data]) => {
        const prof = profileMap.get(uid);
        return {
          user_id: uid,
          full_name: prof?.full_name || 'Unknown',
          username: prof?.username || '—',
          avatar_url: prof?.avatar_url || null,
          home_sec: data.home,
          explore_sec: data.explore,
          university_sec: data.university,
          chat_sec: data.chat,
          profile_sec: data.profile,
          total_sec: data.total,
          last_date: data.lastDate,
        };
      });

      userRows.sort((a, b) => b.total_sec - a.total_sec);
      setUsers(userRows);
    } else {
      setUsers([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [range]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  const pct = (val: number, total: number) => total > 0 ? `${Math.round((val / total) * 100)}%` : '0%';

  const tabCards = overview ? [
    { label: 'Home', value: overview.home, icon: Home, color: 'text-blue-400' },
    { label: 'Explore', value: overview.explore, icon: Compass, color: 'text-green-400' },
    { label: 'University', value: overview.university, icon: GraduationCap, color: 'text-purple-400' },
    { label: 'Chat', value: overview.chat, icon: MessageCircle, color: 'text-amber-400' },
    { label: 'Profile', value: overview.profile, icon: User, color: 'text-pink-400' },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Date Range Picker */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground mr-2">Date range:</span>
        {([['1', 'Today'], ['7', 'Last 7 days'], ['30', 'Last 30 days'], ['all', 'All time']] as const).map(([val, label]) => (
          <Button
            key={val}
            variant={range === val ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRange(val)}
          >
            {label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading analytics…</div>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <Card>
              <CardContent className="pt-4 text-center">
                <BarChart3 className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Active Users</p>
                <p className="text-xl font-bold">{overview?.activeUsers ?? 0}</p>
              </CardContent>
            </Card>
            {tabCards.map((c) => (
              <Card key={c.label}>
                <CardContent className="pt-4 text-center">
                  <c.icon className={`w-5 h-5 mx-auto mb-1 ${c.color}`} />
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className="text-xl font-bold">{formatTime(c.value)}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stacked Bar Visualization */}
          {overview && overview.total > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 rounded-full overflow-hidden flex">
                  {[
                    { val: overview.home, color: 'bg-blue-500', label: 'Home' },
                    { val: overview.explore, color: 'bg-green-500', label: 'Explore' },
                    { val: overview.university, color: 'bg-purple-500', label: 'University' },
                    { val: overview.chat, color: 'bg-amber-500', label: 'Chat' },
                    { val: overview.profile, color: 'bg-pink-500', label: 'Profile' },
                  ].filter(s => s.val > 0).map((seg) => (
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
                  ].map((l) => (
                    <div key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
                      {l.label}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Per-User Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Per-User Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Home</TableHead>
                    <TableHead className="text-right">Explore</TableHead>
                    <TableHead className="text-right">University</TableHead>
                    <TableHead className="text-right">Chat</TableHead>
                    <TableHead className="text-right">Profile</TableHead>
                    <TableHead className="text-right">Last Seen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No analytics data yet. Data will appear once users start using the mobile app.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((u) => (
                      <TableRow key={u.user_id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {u.avatar_url ? (
                              <img src={u.avatar_url} className="w-7 h-7 rounded-full object-cover" alt="" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs">
                                {u.full_name?.[0] || '?'}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium">{u.full_name}</p>
                              <p className="text-xs text-muted-foreground">@{u.username}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatTime(u.total_sec)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{pct(u.home_sec, u.total_sec)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{pct(u.explore_sec, u.total_sec)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{pct(u.university_sec, u.total_sec)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{pct(u.chat_sec, u.total_sec)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{pct(u.profile_sec, u.total_sec)}</TableCell>
                        <TableCell className="text-right text-xs">
                          {u.last_date ? new Date(u.last_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AdminAnalytics;
