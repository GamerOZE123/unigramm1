import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Calendar, Check, Clock, Mail, Pencil, Plus, RotateCw, Save, Smartphone, Trash2, Users, X } from 'lucide-react';

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
  signups: SignupRow[];
  loading: boolean;
  inviting: string | null;
  reInviting: string | null;
  sendingAndroid: string | null;
  deleting: string | null;
  onRefresh: () => void;
  onInvite: (id: string) => void;
  onReInvite: (signup: SignupRow) => void;
  onSendAndroid: (signup: SignupRow) => void;
  onDelete: (signup: SignupRow) => void;
  onAdd?: (data: { full_name: string; email: string; university: string }) => Promise<void>;
  onEdit?: (id: string, data: { full_name: string; email: string; university: string; android_email?: string }) => Promise<void>;
}

const AdminOverflow: React.FC<Props> = ({
  password,
  signups,
  loading,
  inviting,
  reInviting,
  sendingAndroid,
  deleting,
  onRefresh,
  onInvite,
  onReInvite,
  onSendAndroid,
  onDelete,
  onAdd,
  onEdit,
}) => {
  const [profiles, setProfiles] = useState<Record<string, ProfileInfo>>({});
  const [actioning, setActioning] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ full_name: '', email: '', university: '' });
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ full_name: '', email: '', university: '', android_email: '' });
  const [saving, setSaving] = useState(false);

  const fetchProfiles = async () => {
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'fetch_users' },
    });

    if (error || !data?.valid) {
      toast.error('Failed to fetch user status data');
      return;
    }

    const nextProfiles: Record<string, ProfileInfo> = {};
    for (const user of data.users || []) {
      if (user.email) {
        nextProfiles[user.email.toLowerCase()] = {
          user_id: user.user_id,
          email_confirmed: !!user.email_confirmed,
          profile_completed: !!user.profile_completed,
          approved: !!user.approved,
        };
      }
    }

    setProfiles(nextProfiles);
  };

  useEffect(() => {
    fetchProfiles();
  }, [password]);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const oneDayAgo = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);

  const filteredSignups = useMemo(() => signups.filter((s) => {
    if (dateFilter === 'all') return true;
    if (!s.created_at) return false;
    const created = new Date(s.created_at);
    if (dateFilter === 'today') return created >= startOfToday;
    if (dateFilter === '1day') return created >= oneDayAgo;
    return true;
  }), [dateFilter, oneDayAgo, signups, startOfToday]);

  const pendingCount = filteredSignups.filter(s => !s.invited).length;
  const invitedCount = filteredSignups.filter(s => s.invited).length;

  const getProfile = (email: string) => profiles[email.toLowerCase()] || null;

  const handleAdd = async () => {
    if (!addForm.email.trim() || !onAdd) return;
    setAdding(true);
    await onAdd(addForm);
    setAddForm({ full_name: '', email: '', university: '' });
    setAddOpen(false);
    setAdding(false);
  };

  const startEdit = (s: SignupRow) => {
    setEditingId(s.id);
    setEditForm({
      full_name: s.full_name || '',
      email: s.email,
      university: s.university || '',
      android_email: s.android_email || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !onEdit || !editForm.email.trim()) return;
    setSaving(true);
    await onEdit(editingId, editForm);
    setEditingId(null);
    setSaving(false);
  };

  const toggleEmailConfirm = async (userId: string, current: boolean) => {
    if (current) return;
    setActioning(userId);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'confirm_email', user_id: userId },
    });

    if (error || !data?.success) {
      toast.error(data?.error || 'Failed to confirm email');
    } else {
      setProfiles(prev => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          if (next[key].user_id === userId) next[key] = { ...next[key], email_confirmed: true };
        });
        return next;
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
      toast.error('Failed to update profile status');
    } else {
      setProfiles(prev => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          if (next[key].user_id === userId) next[key] = { ...next[key], profile_completed: newVal };
        });
        return next;
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
      toast.error('Failed to update approval');
    } else {
      setProfiles(prev => {
        const next = { ...prev };
        Object.keys(next).forEach((key) => {
          if (next[key].user_id === userId) next[key] = { ...next[key], approved: !current };
        });
        return next;
      });
      toast.success(!current ? 'User approved' : 'User placed on waitlist');
    }
    setActioning(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-3 flex-wrap">
          <Badge variant="secondary"><Users className="w-3 h-3 mr-1" /> {filteredSignups.length} total</Badge>
          <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> {pendingCount} pending</Badge>
          <Badge variant="secondary"><Mail className="w-3 h-3 mr-1" /> {invitedCount} invited</Badge>
        </div>
        <div className="flex gap-2 items-center">
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
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </div>

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
                          {s.created_at
                            ? new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '—'}
                        </TableCell>
                        <TableCell>
                          {s.invited ? (
                            <Badge variant="secondary" className="gap-1"><Check className="w-3 h-3" /> Invited</Badge>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => onInvite(s.id)} disabled={inviting === s.id}>
                              {inviting === s.id ? 'Inviting…' : 'Invite'}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {profile ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <Switch
                                checked={profile.email_confirmed}
                                disabled={profile.email_confirmed || actioning === profile.user_id}
                                onCheckedChange={() => toggleEmailConfirm(profile.user_id, profile.email_confirmed)}
                              />
                              <span className="text-xs text-muted-foreground">{profile.email_confirmed ? 'Yes' : 'No'}</span>
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
                              <span className="text-xs text-muted-foreground">{profile.profile_completed ? 'Yes' : 'No'}</span>
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
                              <span className="text-xs text-muted-foreground">{profile.approved ? 'No' : 'Yes'}</span>
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
                                onClick={() => onReInvite(s)}
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
                              <Button size="sm" variant="outline" onClick={() => onSendAndroid(s)} disabled={sendingAndroid === s.id}>
                                <Smartphone className="w-3 h-3 mr-1" />
                                {sendingAndroid === s.id ? '…' : 'Android'}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => onDelete(s)}
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
  );
};

export default AdminOverflow;
