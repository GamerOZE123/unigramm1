import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  RefreshCw, Database, Info, ArrowLeft, Save, Trash2, Search,
  ChevronRight, UserPlus, User, Heart, Sparkles, X, Plus, Upload, Image as ImageIcon
} from 'lucide-react';

interface UserPref {
  id: string;
  user_id: string;
  places: any;
  music: any;
  interests: any;
  travel: any;
  raw_signals: any;
  updated_at: string;
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
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'fetch_dating_preferences' },
    });
    if (error || !data?.valid) toast.error('Failed to load preferences');
    else setPrefs(data.preferences || []);
    setLoading(false);
  };

  useEffect(() => { fetchPrefs(); }, []);

  const jsonCount = (val: any): number => {
    if (Array.isArray(val)) return val.length;
    if (typeof val === 'object' && val !== null) return Object.keys(val).length;
    return 0;
  };

  if (editingUserId) {
    return (
      <UserDetailsEditor
        password={password}
        userId={editingUserId}
        onBack={() => { setEditingUserId(null); fetchPrefs(); }}
      />
    );
  }

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
              <Button variant="ghost" size="icon" onClick={fetchPrefs}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-300/80">
              Click any row to view & edit the user's full profile, dating profile, and preference data.
            </p>
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground py-6">Loading…</p>
          ) : (
            <div className="rounded-lg border border-border/40 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>University</TableHead>
                    <TableHead className="w-20 text-center">Places</TableHead>
                    <TableHead className="w-20 text-center">Music</TableHead>
                    <TableHead className="w-24 text-center">Interests</TableHead>
                    <TableHead className="w-20 text-center">Travel</TableHead>
                    <TableHead className="w-32">Last Updated</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prefs.map(p => (
                    <TableRow
                      key={p.id}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => setEditingUserId(p.user_id)}
                    >
                      <TableCell className="font-medium text-sm">
                        {p.full_name || p.username || p.user_id.slice(0, 8)}
                        {p.username && <span className="text-muted-foreground"> · @{p.username}</span>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.university || '—'}</TableCell>
                      <TableCell className="text-center"><Badge variant="secondary">{jsonCount(p.places)}</Badge></TableCell>
                      <TableCell className="text-center"><Badge variant="secondary">{jsonCount(p.music)}</Badge></TableCell>
                      <TableCell className="text-center"><Badge variant="secondary">{jsonCount(p.interests)}</Badge></TableCell>
                      <TableCell className="text-center"><Badge variant="secondary">{jsonCount(p.travel)}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell><ChevronRight className="w-4 h-4 text-muted-foreground" /></TableCell>
                    </TableRow>
                  ))}
                  {prefs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
                        No preference data collected yet
                      </TableCell>
                    </TableRow>
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
        onPick={(uid) => { setAddOpen(false); setEditingUserId(uid); }}
      />
    </div>
  );
};

export default AdminDatingPreferences;

// ─────────────── Add User Dialog (search OR create synthetic) ───────────────
interface AddUserProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  password: string;
  onPick: (userId: string) => void;
}

const AddUserDialog: React.FC<AddUserProps> = ({ open, onOpenChange, password, onPick }) => {
  const [tab, setTab] = useState<'search' | 'create'>('search');
  // search
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  // create
  const [form, setForm] = useState({ username: '', full_name: '', university: '', age: '', gender: '', bio: '', avatar_url: '' });
  const [creating, setCreating] = useState(false);

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
    if (!open || tab !== 'search') return;
    const t = setTimeout(() => search(query), 250);
    return () => clearTimeout(t);
  }, [query, open, tab]);

  const create = async () => {
    if (!form.username.trim()) { toast.error('Username is required'); return; }
    setCreating(true);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: {
        password, action: 'create_synthetic_profile',
        username: form.username.trim(),
        full_name: form.full_name || null,
        university: form.university || null,
        age: form.age ? parseInt(form.age, 10) : null,
        gender: form.gender || null,
        bio: form.bio || null,
        avatar_url: form.avatar_url || null,
      },
    });
    setCreating(false);
    if (error || !data?.valid || data.error) {
      toast.error(data?.error || 'Failed to create profile');
      return;
    }
    toast.success('Profile created');
    setForm({ username: '', full_name: '', university: '', age: '', gender: '', bio: '', avatar_url: '' });
    onPick(data.user_id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Add User
          </DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="search">Existing User</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-3 mt-3">
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
            <ScrollArea className="max-h-[45vh]">
              <div className="space-y-1">
                {searching && <p className="text-xs text-muted-foreground text-center py-3">Searching…</p>}
                {!searching && results.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-3">No users found</p>
                )}
                {results.map(u => (
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
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="create" className="space-y-3 mt-3">
            <p className="text-xs text-muted-foreground">
              Creates a synthetic profile (no auth account). You'll be taken to the editor next.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">Username *</Label>
                <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="e.g. jane_doe" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Full Name</Label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">University</Label>
                <Input value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Age</Label>
                <Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Gender</Label>
                <Input value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Avatar URL</Label>
                <Input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Bio</Label>
                <Textarea rows={2} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
              </div>
            </div>
            <Button onClick={create} disabled={creating} className="w-full gap-1.5">
              <UserPlus className="w-4 h-4" /> {creating ? 'Creating…' : 'Create & Edit'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

// ─────────────── Full User Details Editor ───────────────
interface EditorProps {
  password: string;
  userId: string;
  onBack: () => void;
}

const PREF_FIELDS: Array<'places' | 'music' | 'interests' | 'travel' | 'raw_signals'> = [
  'places', 'music', 'interests', 'travel', 'raw_signals'
];

const UserDetailsEditor: React.FC<EditorProps> = ({ password, userId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingDating, setSavingDating] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [profile, setProfile] = useState<any>({});
  const [dating, setDating] = useState<any>({});
  const [prefDrafts, setPrefDrafts] = useState<Record<string, string>>({});
  const [prefErrors, setPrefErrors] = useState<Record<string, string>>({});
  const [hasPref, setHasPref] = useState(false);
  const [hasDating, setHasDating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'fetch_user_full_details', user_id: userId },
    });
    if (error || !data?.valid) { toast.error('Failed to load'); setLoading(false); return; }
    setProfile(data.profile || { user_id: userId });
    setDating(data.dating || { user_id: userId });
    setHasDating(!!data.dating);
    setHasPref(!!data.preference);
    const next: Record<string, string> = {};
    for (const f of PREF_FIELDS) {
      const v = data.preference?.[f];
      next[f] = v ? JSON.stringify(v, null, 2) : '[]';
    }
    setPrefDrafts(next);
    setLoading(false);
  };

  useEffect(() => { load(); }, [userId]);

  const setP = (k: string, v: any) => setProfile((p: any) => ({ ...p, [k]: v }));
  const setD = (k: string, v: any) => setDating((p: any) => ({ ...p, [k]: v }));

  const saveProfile = async () => {
    setSavingProfile(true);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: {
        password, action: 'update_profile_fields', user_id: userId,
        updates: {
          username: profile.username, full_name: profile.full_name, bio: profile.bio,
          avatar_url: profile.avatar_url, university: profile.university, major: profile.major,
          country: profile.country, state: profile.state, area: profile.area,
          campus_year: profile.campus_year, status_message: profile.status_message,
          linkedin_url: profile.linkedin_url, instagram_url: profile.instagram_url,
          twitter_url: profile.twitter_url, website_url: profile.website_url,
          age: profile.age ? parseInt(profile.age as any, 10) : null,
          gender: profile.gender, academic_year: profile.academic_year,
          degree_level: profile.degree_level, personal_email: profile.personal_email,
        },
      },
    });
    setSavingProfile(false);
    if (error || !data?.valid || data.error) { toast.error(data?.error || 'Save failed'); return; }
    toast.success('Profile saved');
  };

  const saveDating = async () => {
    setSavingDating(true);
    const fields: any = { ...dating };
    delete fields.id; delete fields.user_id; delete fields.created_at; delete fields.updated_at; delete fields.last_active;
    // Coerce hobbies / places_visited if string
    if (typeof fields.hobbies === 'string') fields.hobbies = fields.hobbies.split(',').map((s: string) => s.trim()).filter(Boolean);
    if (typeof fields.places_visited === 'string') fields.places_visited = fields.places_visited.split(',').map((s: string) => s.trim()).filter(Boolean);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'upsert_dating_profile', user_id: userId, fields },
    });
    setSavingDating(false);
    if (error || !data?.valid || data.error) { toast.error(data?.error || 'Save failed'); return; }
    toast.success('Dating profile saved');
    setHasDating(true);
  };

  const savePrefs = async () => {
    const parsed: any = { user_id: userId };
    const errs: Record<string, string> = {};
    for (const f of PREF_FIELDS) {
      try { parsed[f] = prefDrafts[f]?.trim() ? JSON.parse(prefDrafts[f]) : []; }
      catch { errs[f] = 'Invalid JSON'; }
    }
    setPrefErrors(errs);
    if (Object.keys(errs).length) { toast.error('Fix JSON errors'); return; }
    setSavingPrefs(true);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'upsert_dating_preference', ...parsed },
    });
    setSavingPrefs(false);
    if (error || !data?.valid || data.error) { toast.error(data?.error || 'Save failed'); return; }
    toast.success('Preferences saved');
    setHasPref(true);
  };

  const removePrefs = async () => {
    if (!confirm('Delete this user\'s preference data?')) return;
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'delete_dating_preference', user_id: userId },
    });
    if (error || !data?.valid) { toast.error('Delete failed'); return; }
    toast.success('Preferences deleted');
    setHasPref(false);
    for (const f of PREF_FIELDS) prefDrafts[f] = '[]';
    setPrefDrafts({ ...prefDrafts });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <p className="text-center text-muted-foreground py-10">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted overflow-hidden">
              {profile.avatar_url && <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />}
            </div>
            <div>
              <p className="text-sm font-semibold">{profile.full_name || profile.username || userId.slice(0, 8)}</p>
              <p className="text-xs text-muted-foreground">@{profile.username || '—'} · {profile.university || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile" className="gap-1.5"><User className="w-3.5 h-3.5" /> Profile</TabsTrigger>
          <TabsTrigger value="dating" className="gap-1.5"><Heart className="w-3.5 h-3.5" /> Dating Profile</TabsTrigger>
          <TabsTrigger value="prefs" className="gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Preferences</TabsTrigger>
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile">
          <Card className="border-border/40">
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold">User Profile Details</CardTitle>
              <Button size="sm" onClick={saveProfile} disabled={savingProfile} className="gap-1.5">
                <Save className="w-3.5 h-3.5" /> {savingProfile ? 'Saving…' : 'Save Profile'}
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {[
                ['username','Username'], ['full_name','Full Name'],
                ['university','University'], ['major','Major'],
                ['age','Age'], ['gender','Gender'],
                ['country','Country'], ['state','State'],
                ['area','Area'], ['campus_year','Campus Year'],
                ['academic_year','Academic Year'], ['degree_level','Degree Level'],
                ['personal_email','Personal Email'], ['avatar_url','Avatar URL'],
                ['linkedin_url','LinkedIn URL'], ['instagram_url','Instagram URL'],
                ['twitter_url','Twitter URL'], ['website_url','Website URL'],
              ].map(([k, label]) => (
                <div key={k}>
                  <Label className="text-xs">{label}</Label>
                  <Input value={profile[k] ?? ''} onChange={(e) => setP(k, e.target.value)} />
                </div>
              ))}
              <div className="col-span-2">
                <Label className="text-xs">Status Message</Label>
                <Input value={profile.status_message ?? ''} onChange={(e) => setP('status_message', e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Bio</Label>
                <Textarea rows={3} value={profile.bio ?? ''} onChange={(e) => setP('bio', e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DATING PROFILE TAB */}
        <TabsContent value="dating">
          <Card className="border-border/40">
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                Dating Profile {!hasDating && <Badge variant="outline" className="text-[10px]">new</Badge>}
              </CardTitle>
              <Button size="sm" onClick={saveDating} disabled={savingDating} className="gap-1.5">
                <Save className="w-3.5 h-3.5" /> {savingDating ? 'Saving…' : 'Save Dating'}
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {[
                ['gender','Gender'], ['interested_in','Interested In'],
                ['looking_for','Looking For'], ['hometown','Hometown'],
                ['height','Height'], ['zodiac','Zodiac'],
                ['smoke','Smoke'], ['drink','Drink'],
                ['fav_song','Favorite Song'], ['fav_artist','Favorite Artist'],
                ['subscription_tier','Subscription Tier'],
              ].map(([k, label]) => (
                <div key={k}>
                  <Label className="text-xs">{label}</Label>
                  <Input value={dating[k] ?? ''} onChange={(e) => setD(k, e.target.value)} />
                </div>
              ))}
              <div className="col-span-2">
                <Label className="text-xs">Bio</Label>
                <Textarea rows={3} value={dating.bio ?? ''} onChange={(e) => setD('bio', e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Hobbies (comma-separated)</Label>
                <Input
                  value={Array.isArray(dating.hobbies) ? dating.hobbies.join(', ') : (dating.hobbies ?? '')}
                  onChange={(e) => setD('hobbies', e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Places Visited (comma-separated)</Label>
                <Input
                  value={Array.isArray(dating.places_visited) ? dating.places_visited.join(', ') : (dating.places_visited ?? '')}
                  onChange={(e) => setD('places_visited', e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs mb-2 block">Photos</Label>
                <ImageGridEditor
                  images={Array.isArray(dating.images_json) ? dating.images_json : []}
                  onChange={(imgs) => setD('images_json', imgs)}
                  userId={userId}
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Prompts (JSON)</Label>
                <Textarea
                  rows={4}
                  className="font-mono text-xs"
                  value={JSON.stringify(dating.prompts_json ?? [], null, 2)}
                  onChange={(e) => { try { setD('prompts_json', JSON.parse(e.target.value)); } catch { /* ignore */ } }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PREFERENCES TAB */}
        <TabsContent value="prefs">
          <Card className="border-border/40">
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                Preference Data {!hasPref && <Badge variant="outline" className="text-[10px]">new</Badge>}
              </CardTitle>
              <div className="flex gap-2">
                {hasPref && (
                  <Button variant="outline" size="sm" onClick={removePrefs} className="gap-1.5 text-destructive">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </Button>
                )}
                <Button size="sm" onClick={savePrefs} disabled={savingPrefs} className="gap-1.5">
                  <Save className="w-3.5 h-3.5" /> {savingPrefs ? 'Saving…' : 'Save Preferences'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-300/80">
                  Each field accepts JSON (array or object). Invalid JSON will block save.
                </p>
              </div>
              {PREF_FIELDS.map(f => (
                <div key={f} className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wide capitalize">{f.replace('_', ' ')}</Label>
                  <Textarea
                    value={prefDrafts[f] || ''}
                    onChange={(e) => setPrefDrafts(d => ({ ...d, [f]: e.target.value }))}
                    rows={5}
                    className="font-mono text-xs"
                    spellCheck={false}
                  />
                  {prefErrors[f] && <p className="text-xs text-destructive">{prefErrors[f]}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
