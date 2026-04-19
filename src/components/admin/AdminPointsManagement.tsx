import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Coins, Gift, Plus, Search, Check, X, RefreshCw, Eye, EyeOff } from 'lucide-react';

interface Props { password: string }

const ACTION_TYPES = [
  'profile_completed',
  'first_post',
  'post_created',
  'like_given',
  'comment_given',
  'follow_given',
  'club_joined',
  'event_attended',
  'startup_created',
  'mission_completed',
  'manual_admin_award',
];

interface Reward {
  id: string;
  title: string;
  description: string | null;
  points_required: number;
  reward_type: string | null;
  image_url: string | null;
  stock: number | null;
  is_active: boolean;
}

interface Redemption {
  id: string;
  user_id: string;
  reward_id: string;
  status: string;
  redeemed_at: string;
  username?: string;
  full_name?: string;
  reward_title?: string;
  points_required?: number;
}

interface UserSearchResult {
  user_id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

const AdminPointsManagement: React.FC<Props> = ({ password }) => {
  // Show points toggle
  const [showPoints, setShowPoints] = useState<boolean | null>(null);
  const [togglingShow, setTogglingShow] = useState(false);

  // Award form
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [pointsAmount, setPointsAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('manual_admin_award');
  const [awarding, setAwarding] = useState(false);

  // Rewards
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [newReward, setNewReward] = useState({
    title: '', description: '', points_required: 0, reward_type: 'voucher', image_url: '', stock: 0,
  });
  const [creatingReward, setCreatingReward] = useState(false);

  // Redemptions
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loadingRedemptions, setLoadingRedemptions] = useState(false);
  const [processingRedemption, setProcessingRedemption] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    loadShowPoints();
    loadRewards();
    loadRedemptions();
  }, []);

  const loadShowPoints = async () => {
    const { data } = await supabase.from('app_config').select('value').eq('key', 'show_points').maybeSingle();
    setShowPoints(data?.value === 'true');
  };

  const toggleShowPoints = async () => {
    if (showPoints === null) return;
    setTogglingShow(true);
    const newVal = !showPoints;
    const { error } = await supabase
      .from('app_config')
      .update({ value: String(newVal), updated_at: new Date().toISOString() } as any)
      .eq('key', 'show_points');
    if (error) {
      toast.error('Failed to update setting');
    } else {
      setShowPoints(newVal);
      toast.success(newVal ? 'Points now visible on profiles' : 'Points hidden from profiles');
    }
    setTogglingShow(false);
  };

  // User search (debounced)
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from('profiles')
        .select('user_id, username, full_name, avatar_url')
        .ilike('username', `%${searchQuery.trim()}%`)
        .limit(10);
      setSearchResults((data as any) || []);
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleAwardPoints = async () => {
    if (!selectedUser || !pointsAmount || isNaN(Number(pointsAmount))) {
      toast.error('Select a user and enter a valid points amount'); return;
    }
    const pts = parseInt(pointsAmount, 10);
    setAwarding(true);
    try {
      // Insert ledger entry
      const { error: ledgerErr } = await supabase.from('points_ledger').insert({
        user_id: selectedUser.user_id,
        action_type: reason,
        points: pts,
        metadata: { source: 'admin_panel' },
      } as any);
      if (ledgerErr) throw ledgerErr;

      // Upsert user_points (add to total)
      const { data: existing } = await supabase
        .from('user_points').select('total_points').eq('user_id', selectedUser.user_id).maybeSingle();
      const newTotal = (existing?.total_points || 0) + pts;
      const { error: upsertErr } = await supabase
        .from('user_points')
        .upsert({ user_id: selectedUser.user_id, total_points: newTotal, updated_at: new Date().toISOString() } as any, { onConflict: 'user_id' });
      if (upsertErr) throw upsertErr;

      toast.success(`Awarded ${pts} pts to @${selectedUser.username}`);
      setSelectedUser(null);
      setSearchQuery('');
      setPointsAmount('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to award points');
    }
    setAwarding(false);
  };

  // Rewards
  const loadRewards = async () => {
    setLoadingRewards(true);
    const { data } = await supabase.from('rewards').select('*').order('created_at', { ascending: false });
    setRewards((data as any) || []);
    setLoadingRewards(false);
  };

  const getPwd = () => password;

  const toggleRewardActive = async (id: string, current: boolean) => {
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password: getPwd(), action: 'toggle_reward_active', id, is_active: !current },
    });
    if (error || (data as any)?.error) toast.error('Failed to toggle');
    else {
      setRewards(prev => prev.map(r => r.id === id ? { ...r, is_active: !current } : r));
      toast.success(!current ? 'Reward activated' : 'Reward deactivated');
    }
  };

  const handleCreateReward = async () => {
    if (!newReward.title || newReward.points_required <= 0) {
      toast.error('Title and points required must be set'); return;
    }
    setCreatingReward(true);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: {
        password: getPwd(),
        action: 'create_reward',
        reward: {
          title: newReward.title,
          description: newReward.description || null,
          points_required: newReward.points_required,
          reward_type: newReward.reward_type,
          image_url: newReward.image_url || null,
          stock: newReward.stock,
          is_active: true,
        },
      },
    });
    const errMsg = (error as any)?.message || (data as any)?.error;
    if (errMsg) toast.error(errMsg);
    else {
      toast.success('Reward created');
      setShowRewardModal(false);
      setNewReward({ title: '', description: '', points_required: 0, reward_type: 'voucher', image_url: '', stock: 0 });
      loadRewards();
    }
    setCreatingReward(false);
  };

  // Redemptions
  const loadRedemptions = async () => {
    setLoadingRedemptions(true);
    const { data: reds } = await supabase
      .from('reward_redemptions')
      .select('id, user_id, reward_id, status, redeemed_at')
      .eq('status', 'pending')
      .order('redeemed_at', { ascending: false });

    if (!reds || reds.length === 0) {
      setRedemptions([]);
      setLoadingRedemptions(false);
      return;
    }

    const userIds = [...new Set(reds.map((r: any) => r.user_id))];
    const rewardIds = [...new Set(reds.map((r: any) => r.reward_id))];

    const [{ data: profs }, { data: rews }] = await Promise.all([
      supabase.from('profiles').select('user_id, username, full_name').in('user_id', userIds),
      supabase.from('rewards').select('id, title, points_required').in('id', rewardIds),
    ]);

    const profMap = new Map((profs || []).map((p: any) => [p.user_id, p]));
    const rewMap = new Map((rews || []).map((r: any) => [r.id, r]));

    setRedemptions(
      reds.map((r: any) => ({
        ...r,
        username: profMap.get(r.user_id)?.username,
        full_name: profMap.get(r.user_id)?.full_name,
        reward_title: rewMap.get(r.reward_id)?.title,
        points_required: rewMap.get(r.reward_id)?.points_required,
      }))
    );
    setLoadingRedemptions(false);
  };

  const handleFulfill = async (red: Redemption) => {
    setProcessingRedemption(red.id);
    const { error } = await supabase
      .from('reward_redemptions')
      .update({ status: 'fulfilled' } as any)
      .eq('id', red.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Marked fulfilled for @${red.username}`);
      setRedemptions(prev => prev.filter(r => r.id !== red.id));
    }
    setProcessingRedemption(null);
  };

  const handleCancel = async (red: Redemption) => {
    if (!confirm(`Cancel redemption and refund ${red.points_required} points to @${red.username}?`)) return;
    setProcessingRedemption(red.id);
    try {
      // Update status
      const { error: updErr } = await supabase
        .from('reward_redemptions')
        .update({ status: 'cancelled' } as any)
        .eq('id', red.id);
      if (updErr) throw updErr;

      // Refund: insert positive ledger entry
      const refundPts = red.points_required || 0;
      await supabase.from('points_ledger').insert({
        user_id: red.user_id,
        action_type: 'redemption_refund',
        points: refundPts,
        metadata: { redemption_id: red.id, reward_id: red.reward_id },
      } as any);

      // Add back to user_points
      const { data: existing } = await supabase
        .from('user_points').select('total_points').eq('user_id', red.user_id).maybeSingle();
      const newTotal = (existing?.total_points || 0) + refundPts;
      await supabase
        .from('user_points')
        .upsert({ user_id: red.user_id, total_points: newTotal, updated_at: new Date().toISOString() } as any, { onConflict: 'user_id' });

      toast.success(`Refunded ${refundPts} pts to @${red.username}`);
      setRedemptions(prev => prev.filter(r => r.id !== red.id));
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel');
    }
    setProcessingRedemption(null);
  };

  return (
    <div className="space-y-6">
      {/* Show Points Toggle */}
      <Card>
        <CardContent className="pt-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showPoints ? <Eye className="w-5 h-5 text-primary" /> : <EyeOff className="w-5 h-5 text-muted-foreground" />}
            <div>
              <p className="font-semibold">Show Points on Profiles</p>
              <p className="text-sm text-muted-foreground">
                {showPoints ? 'Points card is visible on user profiles' : 'Points card is hidden from all profiles'}
              </p>
            </div>
          </div>
          <Switch checked={!!showPoints} onCheckedChange={toggleShowPoints} disabled={togglingShow || showPoints === null} />
        </CardContent>
      </Card>

      <Tabs defaultValue="award" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="award"><Coins className="w-4 h-4 mr-1" />Award Points</TabsTrigger>
          <TabsTrigger value="rewards"><Gift className="w-4 h-4 mr-1" />Rewards</TabsTrigger>
          <TabsTrigger value="redemptions">
            Redemptions {redemptions.length > 0 && <Badge className="ml-2">{redemptions.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* AWARD POINTS */}
        <TabsContent value="award">
          <Card>
            <CardHeader><CardTitle>Manual Point Award</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Search user by username</Label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Type username..."
                    value={selectedUser ? `@${selectedUser.username}` : searchQuery}
                    onChange={(e) => { setSelectedUser(null); setSearchQuery(e.target.value); }}
                    className="pl-9"
                  />
                </div>
                {!selectedUser && searchResults.length > 0 && (
                  <div className="border border-border rounded-md max-h-60 overflow-y-auto">
                    {searchResults.map(u => (
                      <button
                        key={u.user_id}
                        onClick={() => { setSelectedUser(u); setSearchQuery(''); setSearchResults([]); }}
                        className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2"
                      >
                        <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex-shrink-0">
                          {u.avatar_url && <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">@{u.username}</p>
                          {u.full_name && <p className="text-xs text-muted-foreground">{u.full_name}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {searching && <p className="text-xs text-muted-foreground">Searching...</p>}
              </div>

              <div className="space-y-2">
                <Label>Points amount (use negative to deduct)</Label>
                <Input type="number" value={pointsAmount} onChange={e => setPointsAmount(e.target.value)} placeholder="e.g. 100" />
              </div>

              <div className="space-y-2">
                <Label>Reason</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleAwardPoints} disabled={awarding || !selectedUser || !pointsAmount} className="w-full">
                {awarding ? 'Awarding...' : 'Award Points'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REWARDS */}
        <TabsContent value="rewards">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Rewards Catalog</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={loadRewards}><RefreshCw className="w-4 h-4" /></Button>
                <Button size="sm" onClick={() => setShowRewardModal(true)}><Plus className="w-4 h-4 mr-1" />Add Reward</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="text-right">Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingRewards ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : rewards.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No rewards yet</TableCell></TableRow>
                  ) : rewards.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium">{r.title}</div>
                        {r.description && <div className="text-xs text-muted-foreground line-clamp-1">{r.description}</div>}
                      </TableCell>
                      <TableCell><Badge variant="outline">{r.reward_type || '—'}</Badge></TableCell>
                      <TableCell>{r.points_required}</TableCell>
                      <TableCell>{r.stock ?? '∞'}</TableCell>
                      <TableCell className="text-right">
                        <Switch checked={r.is_active} onCheckedChange={() => toggleRewardActive(r.id, r.is_active)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REDEMPTIONS */}
        <TabsContent value="redemptions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pending Redemptions</CardTitle>
              <Button variant="outline" size="sm" onClick={loadRedemptions}><RefreshCw className="w-4 h-4" /></Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Reward</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Redeemed At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingRedemptions ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : redemptions.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No pending redemptions</TableCell></TableRow>
                  ) : redemptions.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium">@{r.username || '—'}</div>
                        {r.full_name && <div className="text-xs text-muted-foreground">{r.full_name}</div>}
                      </TableCell>
                      <TableCell>{r.reward_title || '—'}</TableCell>
                      <TableCell>{r.points_required ?? '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(r.redeemed_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" onClick={() => handleFulfill(r)} disabled={processingRedemption === r.id}>
                          <Check className="w-3 h-3 mr-1" />Fulfill
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleCancel(r)} disabled={processingRedemption === r.id}>
                          <X className="w-3 h-3 mr-1" />Cancel
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Reward Modal */}
      <Dialog open={showRewardModal} onOpenChange={setShowRewardModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Reward</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title *</Label>
              <Input value={newReward.title} onChange={e => setNewReward({ ...newReward, title: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={newReward.description} onChange={e => setNewReward({ ...newReward, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Points Required *</Label>
                <Input type="number" value={newReward.points_required} onChange={e => setNewReward({ ...newReward, points_required: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Stock (0 = unlimited)</Label>
                <Input type="number" value={newReward.stock} onChange={e => setNewReward({ ...newReward, stock: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div>
              <Label>Reward Type</Label>
              <Select value={newReward.reward_type} onValueChange={v => setNewReward({ ...newReward, reward_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="voucher">Voucher</SelectItem>
                  <SelectItem value="merch">Merchandise</SelectItem>
                  <SelectItem value="discount">Discount</SelectItem>
                  <SelectItem value="badge">Badge</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Image URL</Label>
              <Input value={newReward.image_url} onChange={e => setNewReward({ ...newReward, image_url: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRewardModal(false)}>Cancel</Button>
            <Button onClick={handleCreateReward} disabled={creatingReward}>{creatingReward ? 'Creating...' : 'Create Reward'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPointsManagement;
