import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Trash2, Info, ArrowUpCircle, AlertTriangle, RefreshCw, Eye, X } from 'lucide-react';
import { format } from 'date-fns';

interface Announcement {
  id: string;
  type: string;
  title: string;
  message: string | null;
  button_label: string | null;
  button_action: string | null;
  button_target: string | null;
  min_version_code: number | null;
  target_audience: string | null;
  show_once: boolean | null;
  is_active: boolean | null;
  expires_at: string | null;
  target_user_id: string | null;
  created_at: string | null;
}

interface UserOption {
  user_id: string;
  username: string;
  full_name: string;
}

const TYPES = [
  { value: 'info', label: 'Info Message' },
  { value: 'soft_update', label: 'Soft Update Reminder' },
  { value: 'forced_update', label: 'Forced Update' },
];

const AUDIENCES = [
  { value: 'all', label: 'All' },
  { value: 'students', label: 'Students' },
  { value: 'clubs', label: 'Clubs' },
  { value: 'businesses', label: 'Businesses' },
];

const BUTTON_ACTIONS = [
  { value: 'none', label: 'None' },
  { value: 'navigate', label: 'Navigate to Screen' },
  { value: 'open_store', label: 'Open Store' },
];

const EXPIRES_PRESETS = [
  { value: 'custom', label: 'Custom Date/Time' },
  { value: '1h', label: 'In 1 Hour' },
  { value: '6h', label: 'In 6 Hours' },
  { value: '12h', label: 'In 12 Hours' },
  { value: '24h', label: 'In 24 Hours' },
  { value: '48h', label: 'In 48 Hours' },
  { value: '7d', label: 'In 7 Days' },
  { value: 'none', label: 'Never' },
];

const typeIcon = (type: string) => {
  switch (type) {
    case 'info': return <Info className="w-4 h-4 text-blue-400" />;
    case 'soft_update': return <ArrowUpCircle className="w-4 h-4 text-yellow-400" />;
    case 'forced_update': return <AlertTriangle className="w-4 h-4 text-red-400" />;
    default: return <Info className="w-4 h-4" />;
  }
};

const MobilePreview: React.FC<{
  type: string;
  title: string;
  message: string;
  buttonLabel: string;
  buttonAction: string;
}> = ({ type, title, message, buttonLabel, buttonAction }) => {
  const isForcedUpdate = type === 'forced_update';
  return (
    <div className="w-[280px] mx-auto">
      <div className="bg-black rounded-[28px] p-2 shadow-2xl">
        <div className="bg-background rounded-[22px] overflow-hidden relative" style={{ height: 480 }}>
          {/* Status bar */}
          <div className="h-8 bg-muted/30 flex items-center justify-between px-4">
            <span className="text-[10px] text-muted-foreground">9:41</span>
            <div className="flex gap-1">
              <div className="w-3 h-2 bg-muted-foreground/50 rounded-sm" />
              <div className="w-3 h-2 bg-muted-foreground/50 rounded-sm" />
            </div>
          </div>
          {/* App content behind */}
          <div className="p-3 space-y-2 opacity-30">
            <div className="h-3 bg-muted rounded w-3/4" />
            <div className="h-20 bg-muted rounded" />
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="h-16 bg-muted rounded" />
          </div>
          {/* Modal overlay */}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl p-5 w-full shadow-xl border border-border space-y-3">
              <div className="flex items-center gap-2">
                {typeIcon(type)}
                <span className="font-semibold text-sm text-foreground">
                  {title || 'Announcement Title'}
                </span>
              </div>
              {(message || !title) && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {message || 'Your announcement message will appear here...'}
                </p>
              )}
              <div className="flex gap-2 pt-1">
                {buttonLabel && buttonAction !== 'none' && (
                  <button className="flex-1 bg-primary text-primary-foreground text-xs font-medium py-2 rounded-lg">
                    {buttonLabel}
                  </button>
                )}
                {!isForcedUpdate && (
                  <button className="flex-1 bg-muted text-muted-foreground text-xs font-medium py-2 rounded-lg">
                    {isForcedUpdate ? '' : 'Dismiss'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // Form state
  const [type, setType] = useState('info');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [buttonLabel, setButtonLabel] = useState('');
  const [buttonAction, setButtonAction] = useState('none');
  const [buttonTarget, setButtonTarget] = useState('');
  const [minVersionCode, setMinVersionCode] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');
  const [showOnce, setShowOnce] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [expiresPreset, setExpiresPreset] = useState('none');
  const [expiresAt, setExpiresAt] = useState('');
  const [targetUserId, setTargetUserId] = useState('');

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('app_announcements')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setAnnouncements(data);
    else toast.error('Failed to load announcements');
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('user_id, username, full_name')
      .order('created_at', { ascending: false });
    if (data) setUsers(data.map(u => ({ user_id: u.user_id, username: u.username || '', full_name: u.full_name || '' })));
  };

  useEffect(() => { fetchAnnouncements(); fetchUsers(); }, []);

  const resetForm = () => {
    setType('info');
    setTitle('');
    setMessage('');
    setButtonLabel('');
    setButtonAction('none');
    setButtonTarget('');
    setMinVersionCode('');
    setTargetAudience('all');
    setShowOnce(true);
    setIsActive(true);
    setExpiresPreset('none');
    setExpiresAt('');
    setTargetUserId('');
  };

  const computeExpiresAt = (): string | null => {
    if (expiresPreset === 'none') return null;
    if (expiresPreset === 'custom') return expiresAt || null;
    const hours: Record<string, number> = { '1h': 1, '6h': 6, '12h': 12, '24h': 24, '48h': 48, '7d': 168 };
    const h = hours[expiresPreset];
    if (!h) return null;
    return new Date(Date.now() + h * 60 * 60 * 1000).toISOString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Title is required'); return; }
    setSubmitting(true);

    const payload: any = {
      type,
      title: title.trim(),
      message: message.trim() || null,
      button_label: buttonLabel.trim() || null,
      button_action: buttonAction === 'none' ? null : buttonAction,
      button_target: (buttonAction !== 'none' && buttonTarget.trim()) ? buttonTarget.trim() : null,
      min_version_code: (type === 'soft_update' || type === 'forced_update') && minVersionCode ? Number(minVersionCode) : null,
      target_audience: targetAudience,
      show_once: showOnce,
      is_active: isActive,
      expires_at: computeExpiresAt(),
      target_user_id: targetUserId || null,
    };

    const { error } = await supabase.from('app_announcements').insert(payload);
    if (error) {
      console.error('Announcement insert error:', error);
      toast.error('Failed to create announcement: ' + error.message);
    } else {
      toast.success('Announcement created');
      resetForm();
      setShowForm(false);
      fetchAnnouncements();
    }
    setSubmitting(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('app_announcements')
      .update({ is_active: !current })
      .eq('id', id);
    if (error) toast.error('Failed to update');
    else setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, is_active: !current } : a));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    const { error } = await supabase.from('app_announcements').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else {
      toast.success('Deleted');
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }
  };

  const isUpdateType = type === 'soft_update' || type === 'forced_update';
  const showButtonTarget = buttonAction === 'navigate' || buttonAction === 'open_store';

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.full_name.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Announcements</h2>
          <p className="text-sm text-muted-foreground">Manage in-app announcements for mobile users</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAnnouncements} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}>
            <Plus className="w-4 h-4 mr-1" />
            {showForm ? 'Cancel' : 'Create'}
          </Button>
        </div>
      </div>

      {/* Create Form + Preview */}
      {showForm && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="border-primary/30 lg:col-span-2">
            <CardHeader><CardTitle className="text-base">New Announcement</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Target Audience</Label>
                  <Select value={targetAudience} onValueChange={setTargetAudience}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {AUDIENCES.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label>Title *</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Announcement title" required />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label>Message</Label>
                  <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Announcement body text" rows={3} />
                </div>

                <div className="space-y-1.5">
                  <Label>Button Label</Label>
                  <Input value={buttonLabel} onChange={e => setButtonLabel(e.target.value)} placeholder='e.g. "Update Now"' />
                </div>

                <div className="space-y-1.5">
                  <Label>Button Action</Label>
                  <Select value={buttonAction} onValueChange={setButtonAction}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BUTTON_ACTIONS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {showButtonTarget && (
                  <div className="space-y-1.5 md:col-span-2">
                    <Label>Button Target</Label>
                    <Input
                      value={buttonTarget}
                      onChange={e => setButtonTarget(e.target.value)}
                      placeholder={buttonAction === 'navigate' ? 'e.g. Home, DatingDiscover, SettingsScreen' : 'playstore or appstore'}
                    />
                  </div>
                )}

                {isUpdateType && (
                  <div className="space-y-1.5">
                    <Label>Min Version Code</Label>
                    <Input
                      type="number"
                      value={minVersionCode}
                      onChange={e => setMinVersionCode(e.target.value)}
                      placeholder="Show to users on this version or below"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>Expires</Label>
                  <Select value={expiresPreset} onValueChange={(v) => { setExpiresPreset(v); if (v !== 'custom') setExpiresAt(''); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EXPIRES_PRESETS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {expiresPreset === 'custom' && (
                  <div className="space-y-1.5">
                    <Label>Custom Expiry</Label>
                    <Input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
                  </div>
                )}

                <div className="space-y-1.5 md:col-span-2">
                  <Label>Target Specific User (optional)</Label>
                  <Select value={targetUserId || 'all_users'} onValueChange={v => setTargetUserId(v === 'all_users' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Users" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="px-2 pb-2">
                        <Input
                          placeholder="Search users..."
                          value={userSearch}
                          onChange={e => setUserSearch(e.target.value)}
                          className="h-8 text-xs"
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                      <SelectItem value="all_users">All Users</SelectItem>
                      {filteredUsers.map(u => (
                        <SelectItem key={u.user_id} value={u.user_id}>
                          {u.full_name} (@{u.username})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-6 md:col-span-2">
                  <div className="flex items-center gap-2">
                    <Switch checked={showOnce} onCheckedChange={setShowOnce} id="show-once" />
                    <Label htmlFor="show-once" className="cursor-pointer text-sm">Show Once</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={isActive} onCheckedChange={setIsActive} id="is-active" />
                    <Label htmlFor="is-active" className="cursor-pointer text-sm">Active</Label>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Button type="submit" disabled={submitting} className="w-full md:w-auto">
                    {submitting ? 'Creating…' : 'Create Announcement'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Live Preview */}
          <Card className="border-border/40">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="w-4 h-4" /> Mobile Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MobilePreview
                type={type}
                title={title}
                message={message}
                buttonLabel={buttonLabel}
                buttonAction={buttonAction}
              />
              <p className="text-[10px] text-muted-foreground text-center mt-3">
                Live preview of how it appears in the app
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Announcements List */}
      <Card className="border-border/40">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
              ) : announcements.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No announcements yet</TableCell></TableRow>
              ) : announcements.map(a => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {typeIcon(a.type)}
                      <span className="text-xs capitalize">{a.type.replace('_', ' ')}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">{a.title}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs capitalize">{a.target_audience || 'all'}</Badge>
                      {a.target_user_id && <Badge className="text-xs bg-purple-600">Targeted</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={!!a.is_active}
                      onCheckedChange={() => toggleActive(a.id, !!a.is_active)}
                    />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {a.created_at ? format(new Date(a.created_at), 'MMM d, yyyy') : '—'}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnnouncements;
