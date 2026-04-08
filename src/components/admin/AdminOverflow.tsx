import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Users, Clock, Mail, Calendar, Plus, Pencil, X, Save, Check,
  RotateCw, Smartphone, Trash2, RefreshCw, Layers,
} from 'lucide-react';

type DateFilter = 'all' | 'today' | '1day';

interface SignupRow {
  id: string;
  full_name: string | null;
  email: string;
  university: string | null;
  created_at: string | null;
  invited: boolean;
  android_sent?: boolean;
  android_email?: string | null;
  android_status?: string | null;
}

interface ProfileInfo {
  user_id: string;
  email_confirmed: boolean;
  profile_completed: boolean;
  approved: boolean;
}

interface Props {
  password: string;
}

const AdminOverflow: React.FC<Props> = ({ password }) => {
  const [signups, setSignups] = useState<SignupRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileInfo>>({});
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ full_name: '', email: '', university: '' });
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ full_name: '', email: '', university: '', android_email: '' });
  const [saving, setSaving] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const [reInviting, setReInviting] = useState<string | null>(null);
  const [sendingAndroid, setSendingAndroid] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    // Fetch waitlist signups via edge function (service_role bypasses RLS)
    const [waitlistRes, profileRes] = await Promise.all([
      supabase.functions.invoke('verify-admin', {
        body: { password, action: 'fetch' },
      }),
      supabase.functions.invoke('verify-admin', {
        body: { password, action: 'fetch_users' },
      }),
    ]);

    if (waitlistRes.data?.signups) {
      setSignups(waitlistRes.data.signups);
    }

    if (profileRes.data?.users) {
      const map: Record<string, ProfileInfo> = {};
      profileRes.data.users.forEach((u: any) => {
        if (u.email) {
          map[u.email.toLowerCase()] = {
            user_id: u.user_id,
            email_confirmed: u.email_confirmed,
            profile_completed: u.profile_completed,
            approved: u.approved,
          };
        }
      });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const getProfile = (email: string): ProfileInfo | null =>
    profiles[email.toLowerCase()] || null;

  // Date filtering
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const oneDayAgo = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);

  const filteredSignups = signups.filter(s => {
    if (dateFilter === 'all') return true;
    if (!s.created_at) return false;
    const created = new Date(s.created_at);
    if (dateFilter === 'today') return created >= startOfToday;
    if (dateFilter === '1day') return created >= oneDayAgo;
    return true;
  });

  const pendingCount = filteredSignups.filter(s => !s.invited).length;
  const invitedCount = filteredSignups.filter(s => s.invited).length;

  // CRUD handlers (same as waitlist)
  const handleAdd = async () => {
    if (!addForm.email.trim()) return;
    setAdding(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-admin', {
        body: { password, action: 'add_waitlist_entry', ...addForm },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast.success('User added to waitlist');
      setAddForm({ full_name: '', email: '', university: '' });
      setAddOpen(false);
      await fetchAll();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add');
    }
    setAdding(false);
  };

  const startEdit = (s: SignupRow) => {
    setEditingId(s.id);
    setEditForm({ full_name: s.full_name || '', email: s.email, university: s.university || '', android_email: s.android_email || '' });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editForm.email.trim()) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-admin', {
        body: { password, action: 'update_waitlist_entry', id: editingId, ...editForm },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      setSignups(prev => prev.map(s => s.id === editingId ? { ...s, ...editForm } : s));
      setEditingId(null);
      toast.success('Updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    }
    setSaving(false);
  };

  const handleInvite = async (s: SignupRow) => {
    setInviting(s.id);
    try {
      const { data, error } = await supabase.functions.invoke('verify-admin', {
        body: { password, action: 'invite', id: s.id },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      const { error: fnErr } = await supabase.functions.invoke('send-invite', {
        body: { email: s.email, name: s.full_name || '' },
      });
      if (fnErr) throw fnErr;
      setSignups(prev => prev.map(x => x.id === s.id ? { ...x, invited: true } : x));
      toast.success(`Invitation sent to ${s.email}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to invite');
    }
    setInviting(null);
  };

  const handleReInvite = async (s: SignupRow) => {
    setReInviting(s.id);
    try {
      const { error } = await supabase.functions.invoke('send-invite', {
        body: { email: s.email, name: s.full_name || '' },
      });
      if (error) throw error;
      toast.success(`Re-invitation sent to ${s.email}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to re-invite');
    }
    setReInviting(null);
  };

  const handleSendAndroid = async (s: SignupRow) => {
    setSendingAndroid(s.id);
    try {
      const { error } = await supabase.functions.invoke('send-android-invite', {
        body: { email: s.android_email || s.email },
      });
      if (error) throw error;
      setSignups(prev => prev.map(x => x.id === s.id ? { ...x, android_sent: true } : x));
      toast.success(`Android link sent`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send');
    }
    setSendingAndroid(null);
  };

  const handleDelete = async (s: SignupRow) => {
    setDeleting(s.id);
    try {
      const { data, error } = await supabase.functions.invoke('verify-admin', {
        body: { password, action: 'delete_waitlist_entry', id: s.id },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      setSignups(prev => prev.filter(x => x.id !== s.id));
      toast.success('Deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
    setDeleting(null);
  };

  // Profile toggle handlers
  const toggleEmailConfirm = async (userId: string, current: boolean) => {
    if (current) return;
    setActioning(userId);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'confirm_email', user_id: userId },
    });
    if (error || !data?.success) {
      toast.error('Failed to confirm email');
    } else {
      setProfiles(prev => {
        const updated = { ...prev };
        for (const key in updated) {
          if (updated[key].user_id === userId) updated[key] = { ...updated[key], email_confirmed: true };
        }
        return updated;
      });
      toast.success('Email confirmed');
    }
    setActioning(null);
  };

  const toggleProfileCompleted = async (userId: string, current: boolean) => {
    setActioning(userId);
    const newVal = !current;
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'set_profile_completed', user_id: userId, profile_completed: newVal },
    });
    if (error || !data?.success) {
      toast.error('Failed to update');
    } else {
      setProfiles(prev => {
        const updated = { ...prev };
        for (const key in updated) {
          if (updated[key].user_id === userId) updated[key] = { ...updated[key], profile_completed: newVal };
        }
        return updated;
      });
      toast.success(newVal ? 'Profile approved' : 'Profile unapproved');
    }
    setActioning(null);
  };

  const toggleApproval = async (userId: string, current: boolean) => {
    setActioning(userId);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'set_approved', user_id: userId, approved: !current },
    });
    if (error || !data?.success) {
      toast.error('Failed to update');
    } else {
      setProfiles(prev => {
        const updated = { ...prev };
        for (const key in updated) {
          if (updated[key].user_id === userId) updated[key] = { ...updated[key], approved: !current };
        }
        return updated;
      });
      toast.success(!current ? 'User approved' : 'User placed on waitlist');
    }
    setActioning(null);
  };

  if (loading && signups.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 flex flex-col items-center gap-3">
          <Layers className="w-8 h-8 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading overflow data…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top bar — same as waitlist */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-3 flex-wrap">
          <Badge variant="secondary"><Users className="w-3 h-3 mr-1" /> {filteredSignups.length} total</Badge>
          <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> {pendingCount} pending</Badge>
          <Badge variant="secondary"><Mail className="w-3 h-3 mr-1" /> {invitedCount} invited</Badge>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <div className="flex gap-1">
            {([
              { key: 'all' as DateFilter, label: 'All' },
              { key: 'today' as DateFilter, label: 'Today' },
              { key: '1day' as DateFilter, label: '1 Day Ago' },
            ]).map(f => (
              <Button
                key={f.key}
                size="sm"
                variant={dateFilter === f.key ? 'default' : 'outline'}
                onClick={() => setDateFilter(f.key)}
                className="text-xs"
              >
                <Calendar className="w-3 h-3 mr-1" />
                {f.label}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add User
          </Button>
          <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-1" />
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Add User Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Waitlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Full Name" value={addForm.full_name} onChange={e => setAddForm(p => ({ ...p, full_name: e.target.value }))} />
            <Input placeholder="Email *" type="email" value={addForm.email} onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))} />
            <Input placeholder="University" value={addForm.university} onChange={e => setAddForm(p => ({ ...p, university: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={adding || !addForm.email.trim()}>
              {adding ? 'Adding…' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile card view */}
      <div className="block lg:hidden space-y-3">
        {filteredSignups.map(s => {
          const profile = getProfile(s.email);
          return (
            <Card key={s.id} className="border-border/40">
              <CardContent className="p-4 space-y-3">
                {editingId === s.id ? (
                  <div className="space-y-2">
                    <Input className="h-8 text-sm" placeholder="Name" value={editForm.full_name} onChange={e => setEditForm(p => ({ ...p, full_name: e.target.value }))} />
                    <Input className="h-8 text-sm" placeholder="Email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
                    <Input className="h-8 text-sm" placeholder="Play Store Gmail" value={editForm.android_email} onChange={e => setEditForm(p => ({ ...p, android_email: e.target.value }))} />
                    <Input className="h-8 text-sm" placeholder="University" value={editForm.university} onChange={e => setEditForm(p => ({ ...p, university: e.target.value }))} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveEdit} disabled={saving} className="flex-1">
                        <Save className="w-3 h-3 mr-1" /> {saving ? '…' : 'Save'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm">{s.full_name || '—'}</p>
                        <p className="text-xs text-muted-foreground">{s.email}</p>
                      </div>
                      {s.invited ? (
                        <Badge variant="secondary" className="gap-1 shrink-0"><Check className="w-3 h-3" /> Invited</Badge>
                      ) : (
                        <Badge variant="outline" className="shrink-0">Pending</Badge>
                      )}
                    </div>

                    {s.android_email && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Android: </span>
                        <span>{s.android_email}</span>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      <span>University: {s.university || '—'}</span>
                      <span className="mx-2">•</span>
                      <span>Signed Up: {s.created_at ? new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                    </div>

                    {/* Profile toggles */}
                    {profile && (
                      <div className="grid grid-cols-1 gap-2 pt-2 border-t border-border/30">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Email Verified</span>
                          <div className="flex items-center gap-1.5">
                            <Switch
                              checked={profile.email_confirmed}
                              disabled={profile.email_confirmed || actioning === profile.user_id}
                              onCheckedChange={() => toggleEmailConfirm(profile.user_id, profile.email_confirmed)}
                            />
                            <span className={`text-xs ${profile.email_confirmed ? 'text-green-500' : 'text-muted-foreground'}`}>
                              {profile.email_confirmed ? 'Yes' : 'No'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Profile Approved</span>
                          <div className="flex items-center gap-1.5">
                            <Switch
                              checked={profile.profile_completed}
                              disabled={actioning === profile.user_id}
                              onCheckedChange={() => toggleProfileCompleted(profile.user_id, profile.profile_completed)}
                            />
                            <span className={`text-xs ${profile.profile_completed ? 'text-green-500' : 'text-muted-foreground'}`}>
                              {profile.profile_completed ? 'Yes' : 'No'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">On Waitlist</span>
                          <div className="flex items-center gap-1.5">
                            <Switch
                              checked={!profile.approved}
                              disabled={actioning === profile.user_id}
                              onCheckedChange={() => toggleApproval(profile.user_id, profile.approved)}
                            />
                            <span className={`text-xs ${!profile.approved ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                              {profile.approved ? 'No' : 'Yes'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-1.5 flex-wrap pt-1">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(s)} className="h-8 text-xs">
                        <Pencil className="w-3 h-3" />
                      </Button>
                      {s.invited ? (
                        <Button size="sm" variant="outline" onClick={() => handleReInvite(s)} disabled={reInviting === s.id} className="h-8 text-xs">
                          <RotateCw className={`w-3 h-3 mr-1 ${reInviting === s.id ? 'animate-spin' : ''}`} />
                          {reInviting === s.id ? '…' : 'Re-invite'}
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleInvite(s)} disabled={inviting === s.id} className="h-8 text-xs">
                          <Mail className="w-3 h-3 mr-1" />
                          {inviting === s.id ? '…' : 'Invite'}
                        </Button>
                      )}
                      {s.android_sent ? (
                        <Badge variant="secondary" className="gap-1 self-center"><Smartphone className="w-3 h-3" /> Sent</Badge>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleSendAndroid(s)} disabled={sendingAndroid === s.id} className="h-8 text-xs">
                          <Smartphone className="w-3 h-3 mr-1" />
                          {sendingAndroid === s.id ? '…' : 'Android'}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
                        onClick={() => handleDelete(s)}
                        disabled={deleting === s.id}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
        {filteredSignups.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              {dateFilter !== 'all' ? 'No signups in this time period' : 'No signups yet'}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Desktop table — waitlist table + 3 toggle columns */}
      <div className="hidden lg:block">
        <Card className="border-border/40">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Android Email</TableHead>
                  <TableHead>University</TableHead>
                  <TableHead>Signed Up</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Email Verified</TableHead>
                  <TableHead className="text-center">Profile Approved</TableHead>
                  <TableHead className="text-center">On Waitlist</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSignups.map(s => {
                  const profile = getProfile(s.email);
                  return (
                    <TableRow key={s.id}>
                      {editingId === s.id ? (
                        <>
                          <TableCell>
                            <Input className="h-8 text-sm" value={editForm.full_name} onChange={e => setEditForm(p => ({ ...p, full_name: e.target.value }))} />
                          </TableCell>
                          <TableCell>
                            <Input className="h-8 text-sm" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
                          </TableCell>
                          <TableCell>
                            <Input className="h-8 text-sm" placeholder="Play Store Gmail" value={editForm.android_email} onChange={e => setEditForm(p => ({ ...p, android_email: e.target.value }))} />
                          </TableCell>
                          <TableCell>
                            <Input className="h-8 text-sm" value={editForm.university} onChange={e => setEditForm(p => ({ ...p, university: e.target.value }))} />
                          </TableCell>
                          <TableCell className="text-sm">
                            {s.created_at ? new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          </TableCell>
                          <TableCell>
                            {s.invited ? <Badge variant="secondary" className="gap-1"><Check className="w-3 h-3" /> Invited</Badge> : <Badge variant="outline">Pending</Badge>}
                          </TableCell>
                          <TableCell />
                          <TableCell />
                          <TableCell />
                          <TableCell className="text-right">
                            <div className="flex gap-1.5 justify-end">
                              <Button size="sm" onClick={handleSaveEdit} disabled={saving}>
                                <Save className="w-3 h-3 mr-1" /> {saving ? '…' : 'Save'}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="font-medium">{s.full_name || '—'}</TableCell>
                          <TableCell className="text-sm">{s.email}</TableCell>
                          <TableCell>
                            {s.android_email ? (
                              <span className="text-sm">{s.android_email}</span>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">{s.university || '—'}</TableCell>
                          <TableCell className="text-sm">
                            {s.created_at ? new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          </TableCell>
                          <TableCell>
                            {s.invited ? (
                              <Badge variant="secondary" className="gap-1"><Check className="w-3 h-3" /> Invited</Badge>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => handleInvite(s)} disabled={inviting === s.id}>
                                {inviting === s.id ? 'Inviting…' : 'Invite'}
                              </Button>
                            )}
                          </TableCell>
                          {/* Three toggles from User Management */}
                          <TableCell className="text-center">
                            {profile ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <Switch
                                  checked={profile.email_confirmed}
                                  disabled={profile.email_confirmed || actioning === profile.user_id}
                                  onCheckedChange={() => toggleEmailConfirm(profile.user_id, profile.email_confirmed)}
                                />
                                <span className={`text-xs ${profile.email_confirmed ? 'text-green-500' : 'text-muted-foreground'}`}>
                                  {profile.email_confirmed ? 'Yes' : 'No'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {profile ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <Switch
                                  checked={profile.profile_completed}
                                  disabled={actioning === profile.user_id}
                                  onCheckedChange={() => toggleProfileCompleted(profile.user_id, profile.profile_completed)}
                                />
                                <span className={`text-xs ${profile.profile_completed ? 'text-green-500' : 'text-muted-foreground'}`}>
                                  {profile.profile_completed ? 'Yes' : 'No'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {profile ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <Switch
                                  checked={!profile.approved}
                                  disabled={actioning === profile.user_id}
                                  onCheckedChange={() => toggleApproval(profile.user_id, profile.approved)}
                                />
                                <span className={`text-xs ${!profile.approved ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                                  {profile.approved ? 'No' : 'Yes'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1.5 justify-end">
                              <Button size="sm" variant="ghost" onClick={() => startEdit(s)} title="Edit">
                                <Pencil className="w-3 h-3" />
                              </Button>
                              {s.invited && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReInvite(s)}
                                  disabled={reInviting === s.id}
                                  title="Re-send invitation email"
                                >
                                  <RotateCw className={`w-3 h-3 mr-1 ${reInviting === s.id ? 'animate-spin' : ''}`} />
                                  {reInviting === s.id ? '…' : 'Re-invite'}
                                </Button>
                              )}
                              {s.android_sent ? (
                                <Badge variant="secondary" className="gap-1"><Smartphone className="w-3 h-3" /> Sent</Badge>
                              ) : (
                                <Button size="sm" variant="outline" onClick={() => handleSendAndroid(s)} disabled={sendingAndroid === s.id}>
                                  <Smartphone className="w-3 h-3 mr-1" />
                                  {sendingAndroid === s.id ? '…' : 'Android'}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDelete(s)}
                                disabled={deleting === s.id}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  );
                })}
                {filteredSignups.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      {dateFilter !== 'all' ? 'No signups in this time period' : 'No signups yet'}
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
