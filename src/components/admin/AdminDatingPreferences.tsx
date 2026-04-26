import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  RefreshCw, Database, Info, ArrowLeft, Save, Trash2,
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
  const [creatingNew, setCreatingNew] = useState(false);

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

  if (creatingNew) {
    return (
      <CreateProfilePage
        password={password}
        onBack={() => setCreatingNew(false)}
        onCreated={(uid) => { setCreatingNew(false); setEditingUserId(uid); }}
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
              <Button size="sm" onClick={() => setCreatingNew(true)} className="gap-1.5">
                <UserPlus className="w-3.5 h-3.5" /> Create Profile
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
    </div>
  );
};

export default AdminDatingPreferences;

// ─────────────── Dedicated Create Profile Page ───────────────
interface CreateProfilePageProps {
  password: string;
  onBack: () => void;
  onCreated: (userId: string) => void;
}

const GENDER_OPTS = ['Male', 'Female', 'Non-binary', 'Other'];
const INTERESTED_OPTS = ['Male', 'Female', 'Everyone'];
const LOOKING_OPTS = ['Relationship', 'Casual', 'Friendship', 'Not Sure'];
const SMOKE_OPTS = ['Never', 'Socially', 'Regularly', 'Trying to Quit'];
const DRINK_OPTS = ['Never', 'Socially', 'Regularly'];
const ZODIAC_OPTS = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'
];

const CreateProfilePage: React.FC<CreateProfilePageProps> = ({ password, onBack, onCreated }) => {
  const [form, setForm] = useState({
    username: '', full_name: '', university: '', age: '', avatar_url: '',
    gender: '', interested_in: '', looking_for: '', bio: '',
    hometown: '', height: '', zodiac: '', smoke: '', drink: '',
    fav_song: '', fav_artist: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

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
        avatar_url: form.avatar_url || images[0] || null,
        dating: {
          gender: form.gender || null,
          interested_in: form.interested_in || null,
          looking_for: form.looking_for || null,
          bio: form.bio || null,
          hometown: form.hometown || null,
          height: form.height || null,
          zodiac: form.zodiac || null,
          smoke: form.smoke || null,
          drink: form.drink || null,
          fav_song: form.fav_song || null,
          fav_artist: form.fav_artist || null,
          images_json: images,
        },
      },
    });
    setCreating(false);
    if (error || !data?.valid || data.error) {
      toast.error(data?.error || 'Failed to create profile');
      return;
    }
    toast.success('Dating profile created');
    onCreated(data.user_id);
  };

  // Temp upload bucket path uses a synthetic id (final move handled by storage RLS for admin)
  const tempId = React.useMemo(() => `admin-create-${Date.now()}`, []);

  const SelectField = ({ label, value, onChange, options, placeholder }: {
    label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder?: string;
  }) => (
    <div>
      <Label className="text-xs">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder={placeholder || `Select ${label.toLowerCase()}`} /></SelectTrigger>
        <SelectContent>
          {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Button onClick={create} disabled={creating} className="gap-1.5">
          <UserPlus className="w-4 h-4" /> {creating ? 'Creating…' : 'Create & Edit'}
        </Button>
      </div>

      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-pink-500" /> Create Dating Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Photos */}
          <div>
            <Label className="text-xs uppercase tracking-wide mb-2 block">Photos</Label>
            <DragDropImageGrid
              images={images}
              onChange={setImages}
              userId={tempId}
            />
          </div>

          {/* Basic info */}
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Account</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">Username *</Label>
                <Input value={form.username} onChange={e => set('username', e.target.value)} placeholder="e.g. jane_doe" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Full Name</Label>
                <Input value={form.full_name} onChange={e => set('full_name', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">University</Label>
                <Input value={form.university} onChange={e => set('university', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Age</Label>
                <Input type="number" value={form.age} onChange={e => set('age', e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Avatar URL (optional — first photo used if blank)</Label>
                <Input value={form.avatar_url} onChange={e => set('avatar_url', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Dating fields */}
          <div className="space-y-2 pt-2 border-t border-border/40">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Dating Profile</p>
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Gender" value={form.gender} onChange={v => set('gender', v)} options={GENDER_OPTS} />
              <SelectField label="Interested In" value={form.interested_in} onChange={v => set('interested_in', v)} options={INTERESTED_OPTS} />
              <SelectField label="Looking For" value={form.looking_for} onChange={v => set('looking_for', v)} options={LOOKING_OPTS} />
              <SelectField label="Zodiac" value={form.zodiac} onChange={v => set('zodiac', v)} options={ZODIAC_OPTS} />
              <SelectField label="Smoke" value={form.smoke} onChange={v => set('smoke', v)} options={SMOKE_OPTS} />
              <SelectField label="Drink" value={form.drink} onChange={v => set('drink', v)} options={DRINK_OPTS} />
              <div>
                <Label className="text-xs">Hometown</Label>
                <Input value={form.hometown} onChange={e => set('hometown', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Height</Label>
                <Input value={form.height} onChange={e => set('height', e.target.value)} placeholder={`e.g. 5'9"`} />
              </div>
              <div>
                <Label className="text-xs">Favorite Song</Label>
                <Input value={form.fav_song} onChange={e => set('fav_song', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Favorite Artist</Label>
                <Input value={form.fav_artist} onChange={e => set('fav_artist', e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Bio</Label>
                <Textarea rows={3} value={form.bio} onChange={e => set('bio', e.target.value)} placeholder="Tell people about this profile…" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={create} disabled={creating} className="gap-1.5">
              <UserPlus className="w-4 h-4" /> {creating ? 'Creating…' : 'Create & Edit'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ─────────────── Drag & Drop Image Grid (for create page) ───────────────
const DragDropImageGrid: React.FC<{
  images: string[];
  onChange: (imgs: string[]) => void;
  userId: string;
}> = ({ images, onChange, userId }) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[] | null) => {
    if (!files) return;
    const arr = Array.from(files);
    if (arr.length === 0) return;
    setUploading(true);
    const next = [...images];
    try {
      for (const file of arr) {
        if (!file.type.startsWith('image/')) continue;
        const ext = file.name.split('.').pop();
        const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('post-images').upload(path, file, { upsert: true });
        if (error) throw error;
        const { data } = supabase.storage.from('post-images').getPublicUrl(path);
        next.push(data.publicUrl);
      }
      onChange(next);
      toast.success(`${arr.length} image(s) uploaded`);
    } catch (e: any) {
      toast.error(e.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const addUrl = () => {
    const u = urlInput.trim();
    if (!u) return;
    onChange([...images, u]);
    setUrlInput('');
  };

  const remove = (i: number) => onChange(images.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`rounded-xl border-2 border-dashed transition-colors p-4 ${
          dragOver ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'
        }`}
      >
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {images.map((url, i) => (
            <div key={i} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-border bg-muted group">
              <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.opacity = '0.3')} />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1 right-1 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-white" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[10px] text-white px-1.5 py-0.5">
                {i + 1}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="aspect-[3/4] rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
          >
            {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span className="text-[10px]">{uploading ? 'Uploading' : 'Add'}</span>
          </button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-3 flex items-center justify-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5" />
          {dragOver ? 'Drop images to upload' : 'Drag & drop images here, or click "Add"'}
        </p>
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
      <div className="flex gap-2">
        <Input
          placeholder="Or paste image URL…"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
          className="text-xs"
        />
        <Button type="button" size="sm" variant="outline" onClick={addUrl} className="gap-1">
          <Plus className="w-3.5 h-3.5" /> Add URL
        </Button>
      </div>
    </div>
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
            <CardContent className="space-y-5">
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-300/80">
                  Add tags for each preference category. Use the JSON view for advanced raw signals.
                </p>
              </div>
              {(['places','music','interests','travel'] as const).map(f => (
                <TagListEditor
                  key={f}
                  label={f}
                  draft={prefDrafts[f] || '[]'}
                  onDraftChange={(v) => setPrefDrafts(d => ({ ...d, [f]: v }))}
                  error={prefErrors[f]}
                />
              ))}
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide">Raw Signals (JSON)</Label>
                <Textarea
                  value={prefDrafts.raw_signals || ''}
                  onChange={(e) => setPrefDrafts(d => ({ ...d, raw_signals: e.target.value }))}
                  rows={5}
                  className="font-mono text-xs"
                  spellCheck={false}
                />
                {prefErrors.raw_signals && <p className="text-xs text-destructive">{prefErrors.raw_signals}</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ─────────────── Image Grid Editor ───────────────
const ImageGridEditor: React.FC<{
  images: string[];
  onChange: (imgs: string[]) => void;
  userId: string;
}> = ({ images, onChange, userId }) => {
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const next = [...images];
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop();
        const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('post-images').upload(path, file, { upsert: true });
        if (error) throw error;
        const { data } = supabase.storage.from('post-images').getPublicUrl(path);
        next.push(data.publicUrl);
      }
      onChange(next);
      toast.success('Image(s) uploaded');
    } catch (e: any) {
      toast.error(e.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const addUrl = () => {
    const u = urlInput.trim();
    if (!u) return;
    onChange([...images, u]);
    setUrlInput('');
  };

  const remove = (i: number) => onChange(images.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {images.map((url, i) => (
          <div key={i} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-border bg-muted group">
            <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.opacity = '0.3')} />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-1 right-1 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3 text-white" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[10px] text-white px-1.5 py-0.5 truncate">
              {i + 1}
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="aspect-[3/4] rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
        >
          {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          <span className="text-[10px]">{uploading ? 'Uploading' : 'Upload'}</span>
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
      <div className="flex gap-2">
        <Input
          placeholder="Or paste image URL…"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
          className="text-xs"
        />
        <Button type="button" size="sm" variant="outline" onClick={addUrl} className="gap-1">
          <Plus className="w-3.5 h-3.5" /> Add URL
        </Button>
      </div>
      {images.length === 0 && (
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5" /> No photos yet
        </div>
      )}
    </div>
  );
};

// ─────────────── Tag List Editor (chips for preference arrays) ───────────────
const TagListEditor: React.FC<{
  label: string;
  draft: string;
  onDraftChange: (v: string) => void;
  error?: string;
}> = ({ label, draft, onDraftChange, error }) => {
  // Parse current draft into array of strings (best-effort)
  let items: any[] = [];
  let isObjectArray = false;
  try {
    const parsed = JSON.parse(draft || '[]');
    if (Array.isArray(parsed)) {
      items = parsed;
      isObjectArray = parsed.some((x) => typeof x === 'object' && x !== null);
    }
  } catch { /* keep empty */ }

  const [input, setInput] = useState('');

  const commit = (next: any[]) => onDraftChange(JSON.stringify(next, null, 2));

  const add = () => {
    const v = input.trim();
    if (!v) return;
    commit([...items, v]);
    setInput('');
  };

  const remove = (i: number) => commit(items.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wide capitalize">{label}</Label>
      {isObjectArray ? (
        <Textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          rows={4}
          className="font-mono text-xs"
          spellCheck={false}
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded-md border border-border/40 bg-muted/30">
            {items.length === 0 && <span className="text-xs text-muted-foreground">No items</span>}
            {items.map((it, i) => (
              <Badge key={i} variant="secondary" className="gap-1 pr-1">
                <span className="text-xs">{String(it)}</span>
                <button onClick={() => remove(i)} className="hover:bg-background/50 rounded-full p-0.5">
                  <X className="w-2.5 h-2.5" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
              placeholder={`Add ${label}…`}
              className="text-xs"
            />
            <Button type="button" size="sm" variant="outline" onClick={add} className="gap-1">
              <Plus className="w-3.5 h-3.5" /> Add
            </Button>
          </div>
        </>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};
