import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RefreshCw, Database, Info, ArrowLeft, Plus, Save, Trash2, Search, ChevronRight, UserPlus } from 'lucide-react';

interface UserPref {
  id: string;
  user_id: string;
  places: any[];
  music: any[];
  interests: any[];
  travel: any[];
  raw_signals: any[];
  updated_at: string;
  // joined
  username?: string;
  full_name?: string;
  university?: string;
}

interface Props {
  password: string;
}

const AdminDatingPreferences: React.FC<Props> = ({ password }) => {
  const [prefs, setPrefs] = useState<UserPref[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const fetchPrefs = async () => {
    setLoading(true);
    // We need to join with profiles — use the edge function for service-role access
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'fetch_dating_preferences' },
    });
    if (error || !data?.valid) {
      toast.error('Failed to load preferences');
    } else {
      setPrefs(data.preferences || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPrefs(); }, []);

  if (editingUserId) {
    return (
      <PreferenceEditor
        password={password}
        userId={editingUserId}
        onBack={() => { setEditingUserId(null); fetchPrefs(); }}
      />
    );
  }

  const jsonCount = (val: any): number => {
    if (Array.isArray(val)) return val.length;
    if (typeof val === 'object' && val !== null) return Object.keys(val).length;
    return 0;
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" /> User Preference Data
              <Badge variant="secondary" className="ml-2">{prefs.length}</Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5">
                <UserPlus className="w-3.5 h-3.5" /> Add User
              </Button>
              <Button variant="ghost" size="icon" onClick={fetchPrefs}><RefreshCw className="w-4 h-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-300/80">
              This data is collected passively from likes, post engagement, and dating profile answers across the app.
            </p>
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground py-6">Loading…</p>
          ) : (
            <div className="rounded-lg border border-border/40 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>University</TableHead>
                    <TableHead className="w-20 text-center">Places</TableHead>
                    <TableHead className="w-20 text-center">Music</TableHead>
                    <TableHead className="w-24 text-center">Interests</TableHead>
                    <TableHead className="w-20 text-center">Travel</TableHead>
                    <TableHead className="w-32">Last Updated</TableHead>
                    <TableHead className="w-16">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prefs.map(p => (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setEditingUserId(p.user_id)}>
                      <TableCell className="font-medium text-sm">{p.username || p.full_name || p.user_id.slice(0, 8)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.university || '—'}</TableCell>
                      <TableCell className="text-center"><Badge variant="secondary">{jsonCount(p.places)}</Badge></TableCell>
                      <TableCell className="text-center"><Badge variant="secondary">{jsonCount(p.music)}</Badge></TableCell>
                      <TableCell className="text-center"><Badge variant="secondary">{jsonCount(p.interests)}</Badge></TableCell>
                      <TableCell className="text-center"><Badge variant="secondary">{jsonCount(p.travel)}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                  {prefs.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">No preference data collected yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddUserDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        password={password}
        existingUserIds={new Set(prefs.map(p => p.user_id))}
        onPick={(uid) => { setAddOpen(false); setEditingUserId(uid); }}
      />
    </div>
  );
};

export default AdminDatingPreferences;

// ─────────────── Add User Dialog ───────────────
interface AddUserProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  password: string;
  existingUserIds: Set<string>;
  onPick: (userId: string) => void;
}

const AddUserDialog: React.FC<AddUserProps> = ({ open, onOpenChange, password, existingUserIds, onPick }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const search = async (q: string) => {
    setSearching(true);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'search_profiles_for_dating_prefs', query: q },
    });
    if (error || !data?.valid) toast.error('Search failed');
    else setResults(data.profiles || []);
    setSearching(false);
  };

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => search(query), 250);
    return () => clearTimeout(t);
  }, [query, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Add User Preferences
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username, name or email…"
              className="pl-9"
              autoFocus
            />
          </div>
          <ScrollArea className="max-h-[50vh]">
            <div className="space-y-1">
              {searching && <p className="text-xs text-muted-foreground text-center py-3">Searching…</p>}
              {!searching && results.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">No users found</p>
              )}
              {results.map(u => {
                const exists = existingUserIds.has(u.user_id);
                return (
                  <button
                    key={u.user_id}
                    onClick={() => onPick(u.user_id)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted text-left transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-muted overflow-hidden shrink-0">
                      {u.avatar_url && <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.full_name || u.username || u.user_id.slice(0,8)}</p>
                      <p className="text-xs text-muted-foreground truncate">@{u.username || '—'} · {u.university || '—'}</p>
                    </div>
                    {exists && <Badge variant="secondary" className="text-[10px]">existing</Badge>}
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─────────────── Dedicated Editor ───────────────
interface EditorProps {
  password: string;
  userId: string;
  onBack: () => void;
}

const FIELDS: Array<'places' | 'music' | 'interests' | 'travel' | 'raw_signals'> = [
  'places', 'music', 'interests', 'travel', 'raw_signals'
];

const PreferenceEditor: React.FC<EditorProps> = ({ password, userId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [pref, setPref] = useState<any>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'fetch_dating_preference_one', user_id: userId },
    });
    if (error || !data?.valid) { toast.error('Failed to load'); setLoading(false); return; }
    setProfile(data.profile);
    setPref(data.preference);
    const next: Record<string, string> = {};
    for (const f of FIELDS) {
      const v = data.preference?.[f];
      next[f] = v ? JSON.stringify(v, null, 2) : '[]';
    }
    setDrafts(next);
    setLoading(false);
  };

  useEffect(() => { load(); }, [userId]);

  const save = async () => {
    const parsed: any = { user_id: userId };
    const errs: Record<string, string> = {};
    for (const f of FIELDS) {
      try { parsed[f] = drafts[f]?.trim() ? JSON.parse(drafts[f]) : []; }
      catch (e: any) { errs[f] = 'Invalid JSON'; }
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) { toast.error('Fix JSON errors before saving'); return; }

    setSaving(true);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'upsert_dating_preference', ...parsed },
    });
    setSaving(false);
    if (error || !data?.valid || data.error) { toast.error(data?.error || 'Save failed'); return; }
    toast.success('Preferences saved');
    setPref(data.preference);
  };

  const remove = async () => {
    if (!confirm('Delete this user\'s preference data? This cannot be undone.')) return;
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'delete_dating_preference', user_id: userId },
    });
    if (error || !data?.valid) { toast.error('Delete failed'); return; }
    toast.success('Preferences deleted');
    onBack();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted overflow-hidden">
              {profile?.avatar_url && <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />}
            </div>
            <div>
              <p className="text-sm font-semibold">{profile?.full_name || profile?.username || userId.slice(0, 8)}</p>
              <p className="text-xs text-muted-foreground">@{profile?.username || '—'} · {profile?.university || '—'}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pref && (
            <Button variant="outline" size="sm" onClick={remove} className="gap-1.5 text-destructive">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          )}
          <Button size="sm" onClick={save} disabled={saving || loading} className="gap-1.5">
            <Save className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-10">Loading…</p>
      ) : (
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" /> Preference Data
              {!pref && <Badge variant="outline" className="text-[10px]">new</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-300/80">
                Each field accepts a JSON array (e.g. <code>["pop", "rock"]</code>) or object. Edit carefully — invalid JSON will block save.
              </p>
            </div>
            {FIELDS.map(f => (
              <div key={f} className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide capitalize">{f.replace('_', ' ')}</Label>
                <Textarea
                  value={drafts[f] || ''}
                  onChange={(e) => setDrafts(d => ({ ...d, [f]: e.target.value }))}
                  rows={6}
                  className="font-mono text-xs"
                  spellCheck={false}
                />
                {errors[f] && <p className="text-xs text-destructive">{errors[f]}</p>}
              </div>
            ))}
            {pref?.updated_at && (
              <p className="text-xs text-muted-foreground">Last updated: {new Date(pref.updated_at).toLocaleString()}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
