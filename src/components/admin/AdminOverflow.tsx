import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Users, RefreshCw, Search, Smartphone, Send, Bell, Layers, Mail, RotateCw } from 'lucide-react';

interface OverflowUser {
  user_id: string;
  username: string | null;
  full_name: string | null;
  email: string | null;
  university: string | null;
  user_type: string | null;
  approved: boolean;
  email_confirmed: boolean;
  profile_completed: boolean;
  created_at: string | null;
}

interface Props {
  password: string;
}

const AdminOverflow: React.FC<Props> = ({ password }) => {
  const [users, setUsers] = useState<OverflowUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'student' | 'clubs' | 'business'>('all');
  const [androidTesters, setAndroidTesters] = useState<Record<string, { email: string; status: string }>>({});
  const [sendingAndroid, setSendingAndroid] = useState<string | null>(null);
  const [editingUniversity, setEditingUniversity] = useState<string | null>(null);
  const [universityDraft, setUniversityDraft] = useState('');

  const fetchAndroidTesters = async () => {
    const { data } = await supabase
      .from('android_testers' as any)
      .select('*') as any;
    if (data) {
      const map: Record<string, { email: string; status: string }> = {};
      data.forEach((t: any) => {
        map[t.email.toLowerCase()] = { email: t.email, status: t.status };
      });
      setAndroidTesters(map);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'fetch_users' },
    });
    if (error || !data?.valid) {
      toast.error('Failed to fetch users');
    } else {
      setUsers(data.users || []);
      setFetched(true);
    }
    await fetchAndroidTesters();
    setLoading(false);
  };

  const getAndroidInfo = (user: OverflowUser) => {
    if (!user.email) return null;
    return androidTesters[user.email.toLowerCase()] || null;
  };

  const toggleEmailConfirm = async (user_id: string, currentlyConfirmed: boolean) => {
    if (currentlyConfirmed) return;
    setActioning(user_id);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'confirm_email', user_id },
    });
    if (error || !data?.success) {
      toast.error(data?.error || 'Failed to confirm email');
    } else {
      setUsers(prev => prev.map(u => u.user_id === user_id ? { ...u, email_confirmed: true } : u));
      toast.success('Email confirmed');
    }
    setActioning(null);
  };

  const toggleProfileCompleted = async (user_id: string, current: boolean) => {
    setActioning(user_id);
    const newVal = !current;
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'set_profile_completed', user_id, profile_completed: newVal },
    });
    if (error || !data?.success) {
      toast.error('Failed to update profile status');
    } else {
      setUsers(prev => prev.map(u => u.user_id === user_id ? { ...u, profile_completed: newVal } : u));
      toast.success(newVal ? 'Profile approved' : 'Profile unapproved');
    }
    setActioning(null);
  };

  const toggleApproval = async (user_id: string, current: boolean) => {
    setActioning(user_id);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'set_approved', user_id, approved: !current },
    });
    if (error || !data?.success) {
      toast.error('Failed to update approval');
    } else {
      setUsers(prev => prev.map(u => u.user_id === user_id ? { ...u, approved: !current } : u));
      toast.success(!current ? 'User approved' : 'User placed on waitlist');
    }
    setActioning(null);
  };

  const sendAndroidInvite = async (user: OverflowUser) => {
    if (!user.email) { toast.error('User has no email'); return; }
    setSendingAndroid(user.user_id);
    try {
      const { data, error } = await supabase.functions.invoke('send-android-invite', {
        body: { email: user.email },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Android link sent to ${user.email}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send Android invite');
    } finally {
      setSendingAndroid(null);
    }
  };

  const saveUniversity = async (user_id: string) => {
    setActioning(user_id);
    const { error } = await supabase
      .from('profiles')
      .update({ university: universityDraft } as any)
      .eq('user_id', user_id);
    if (error) {
      toast.error('Failed to update university');
    } else {
      setUsers(prev => prev.map(u => u.user_id === user_id ? { ...u, university: universityDraft } : u));
      toast.success('University updated');
    }
    setEditingUniversity(null);
    setActioning(null);
  };

  const filtered = users.filter(u => {
    if (typeFilter !== 'all' && u.user_type !== typeFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.university || '').toLowerCase().includes(q)
    );
  });

  if (!fetched) {
    return (
      <Card>
        <CardContent className="pt-6 flex flex-col items-center gap-3">
          <Layers className="w-8 h-8 text-muted-foreground" />
          <p className="text-muted-foreground">Load all user data for the Overflow view</p>
          <Button onClick={fetchUsers} disabled={loading}>
            {loading ? 'Loading…' : 'Load Overflow Data'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary">{users.length} total</Badge>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              {users.filter(u => u.approved).length} approved
            </Badge>
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              {users.filter(u => !u.approved).length} waitlisted
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, university…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {(['all', 'student', 'clubs', 'business'] as const).map(t => (
              <Button
                key={t}
                size="sm"
                variant={typeFilter === t ? 'default' : 'outline'}
                onClick={() => setTypeFilter(t)}
                className="capitalize text-xs"
              >
                {t === 'all' ? 'All' : t}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile card view */}
      <div className="block lg:hidden space-y-3">
        {filtered.map(u => {
          const androidInfo = getAndroidInfo(u);
          return (
            <Card key={u.user_id} className="border-border/40">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">{u.full_name || '—'}</p>
                    <p className="text-xs text-muted-foreground">{u.email || '—'}</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{u.user_type || '—'}</Badge>
                </div>

                {/* University - editable */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-20 shrink-0">University:</span>
                  {editingUniversity === u.user_id ? (
                    <div className="flex gap-1 flex-1">
                      <Input
                        className="h-7 text-xs flex-1"
                        value={universityDraft}
                        onChange={e => setUniversityDraft(e.target.value)}
                      />
                      <Button size="sm" className="h-7 text-xs px-2" onClick={() => saveUniversity(u.user_id)} disabled={actioning === u.user_id}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setEditingUniversity(null)}>
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <button
                      className="text-xs text-foreground hover:underline text-left"
                      onClick={() => { setEditingUniversity(u.user_id); setUniversityDraft(u.university || ''); }}
                    >
                      {u.university || '—'}
                    </button>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  Joined: {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Email Verified</span>
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={u.email_confirmed}
                        disabled={u.email_confirmed || actioning === u.user_id}
                        onCheckedChange={() => toggleEmailConfirm(u.user_id, u.email_confirmed)}
                      />
                      <span className={`text-xs ${u.email_confirmed ? 'text-green-500' : 'text-muted-foreground'}`}>
                        {u.email_confirmed ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Profile Approved</span>
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={u.profile_completed ?? false}
                        disabled={actioning === u.user_id}
                        onCheckedChange={() => toggleProfileCompleted(u.user_id, u.profile_completed)}
                      />
                      <span className={`text-xs ${u.profile_completed ? 'text-green-500' : 'text-muted-foreground'}`}>
                        {u.profile_completed ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">On Waitlist</span>
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={!u.approved}
                        disabled={actioning === u.user_id}
                        onCheckedChange={() => toggleApproval(u.user_id, u.approved)}
                      />
                      <span className={`text-xs ${!u.approved ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                        {u.approved ? 'No' : 'Yes'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Android info & actions */}
                {androidInfo && (
                  <div className="pt-2 border-t border-border/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Android Email</p>
                        <p className="text-xs font-medium">{androidInfo.email}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{androidInfo.status}</Badge>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs h-8"
                    disabled={sendingAndroid === u.user_id}
                    onClick={() => sendAndroidInvite(u)}
                  >
                    <Smartphone className="w-3 h-3 mr-1" />
                    {sendingAndroid === u.user_id ? 'Sending…' : 'Android Link'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              {search ? 'No users match your search' : 'No users found'}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Desktop table view */}
      <div className="hidden lg:block">
        <Card className="border-border/40">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>University</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-center">Email Verified</TableHead>
                  <TableHead className="text-center">Profile Approved</TableHead>
                  <TableHead className="text-center">On Waitlist</TableHead>
                  <TableHead>Android Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(u => {
                  const androidInfo = getAndroidInfo(u);
                  return (
                    <TableRow key={u.user_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{u.full_name || '—'}</p>
                          <p className="text-xs text-muted-foreground">@{u.username || '—'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{u.email || '—'}</TableCell>
                      <TableCell>
                        {editingUniversity === u.user_id ? (
                          <div className="flex gap-1 items-center">
                            <Input
                              className="h-7 text-xs w-32"
                              value={universityDraft}
                              onChange={e => setUniversityDraft(e.target.value)}
                            />
                            <Button size="sm" className="h-7 text-xs px-2" onClick={() => saveUniversity(u.user_id)} disabled={actioning === u.user_id}>✓</Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs px-1" onClick={() => setEditingUniversity(null)}>✕</Button>
                          </div>
                        ) : (
                          <button
                            className="text-sm hover:underline text-left"
                            onClick={() => { setEditingUniversity(u.user_id); setUniversityDraft(u.university || ''); }}
                          >
                            {u.university || '—'}
                          </button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{u.user_type || '—'}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Switch
                            checked={u.email_confirmed}
                            disabled={u.email_confirmed || actioning === u.user_id}
                            onCheckedChange={() => toggleEmailConfirm(u.user_id, u.email_confirmed)}
                          />
                          <span className={`text-xs ${u.email_confirmed ? 'text-green-500' : 'text-muted-foreground'}`}>
                            {u.email_confirmed ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Switch
                            checked={u.profile_completed ?? false}
                            disabled={actioning === u.user_id}
                            onCheckedChange={() => toggleProfileCompleted(u.user_id, u.profile_completed)}
                          />
                          <span className={`text-xs ${u.profile_completed ? 'text-green-500' : 'text-muted-foreground'}`}>
                            {u.profile_completed ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Switch
                            checked={!u.approved}
                            disabled={actioning === u.user_id}
                            onCheckedChange={() => toggleApproval(u.user_id, u.approved)}
                          />
                          <span className={`text-xs ${!u.approved ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                            {u.approved ? 'No' : 'Yes'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {androidInfo ? androidInfo.email : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {androidInfo ? (
                          <Badge variant="outline" className="text-xs">{androidInfo.status}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={sendingAndroid === u.user_id}
                          onClick={() => sendAndroidInvite(u)}
                        >
                          <Smartphone className="w-3 h-3 mr-1" />
                          {sendingAndroid === u.user_id ? '…' : 'Android'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      {search ? 'No users match your search' : 'No users found'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverflow;
