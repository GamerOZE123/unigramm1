import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Check, Users, Mail, Clock, Smartphone, Trash2, RotateCw, Calendar, Plus, Pencil, X, Save } from 'lucide-react';

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

interface Props {
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
  onEdit?: (id: string, data: { full_name: string; email: string; university: string }) => Promise<void>;
}

type DateFilter = 'all' | 'today' | '1day';

const AdminWaitlistSection: React.FC<Props> = ({
  signups, loading, inviting, reInviting, sendingAndroid, deleting,
  onRefresh, onInvite, onReInvite, onSendAndroid, onDelete, onAdd, onEdit,
}) => {
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ full_name: '', email: '', university: '' });
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ full_name: '', email: '', university: '' });
  const [saving, setSaving] = useState(false);

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
    setEditForm({ full_name: s.full_name || '', email: s.email, university: s.university || '' });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !onEdit || !editForm.email.trim()) return;
    setSaving(true);
    await onEdit(editingId, editForm);
    setEditingId(null);
    setSaving(false);
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSignups.map(s => (
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
                        <span className="text-muted-foreground text-xs">{s.android_email || '—'}</span>
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
              ))}
              {filteredSignups.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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

export default AdminWaitlistSection;
