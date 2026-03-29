import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Crown, Shield, User, Building2, Users2, Loader2, X, GraduationCap } from 'lucide-react';

interface UserRow {
  user_id: string;
  username: string | null;
  full_name: string | null;
  email: string | null;
  university: string | null;
  user_type: string | null;
  approved: boolean;
  email_confirmed: boolean;
  created_at: string | null;
}

interface Subscription {
  id: string;
  name: string;
  price_monthly: number;
  monthly_post_limit: number;
  targeting_enabled: boolean;
  analytics_tier: string;
}

interface UserSubscription {
  id: string;
  subscription_id: string;
  status: string;
  started_at: string;
  expires_at: string;
  subscriptions: Subscription;
}

interface Props {
  user: UserRow | null;
  open: boolean;
  onClose: () => void;
  password: string;
  onUserUpdated: (userId: string, updates: Partial<UserRow>) => void;
}

const UserDetailModal: React.FC<Props> = ({ user, open, onClose, password, onUserUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [changingRole, setChangingRole] = useState(false);
  const [changingUniversity, setChangingUniversity] = useState(false);
  const [universities, setUniversities] = useState<{ abbreviation: string; name: string }[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [userSubs, setUserSubs] = useState<UserSubscription[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [settingSub, setSettingSub] = useState(false);
  const [selectedSubId, setSelectedSubId] = useState<string>('');

  useEffect(() => {
    if (open && user) {
      fetchSubscriptions();
      fetchUserSubscription();
      fetchUniversities();
    }
  }, [open, user?.user_id]);

  const fetchUniversities = async () => {
    const { data } = await supabase.from('universities').select('abbreviation, name').order('name');
    if (data) setUniversities(data);
  };

  const handleChangeUniversity = async (newUniversity: string) => {
    if (!user) return;
    setChangingUniversity(true);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'change_university', user_id: user.user_id, new_university: newUniversity },
    });
    if (error || !data?.success) {
      toast.error(data?.error || 'Failed to change university');
    } else {
      toast.success(`University changed to ${newUniversity}`);
      onUserUpdated(user.user_id, { university: newUniversity });
    }
    setChangingUniversity(false);
  };

  const fetchSubscriptions = async () => {
    const { data } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'fetch_subscriptions' },
    });
    if (data?.subscriptions) setSubscriptions(data.subscriptions);
  };

  const fetchUserSubscription = async () => {
    if (!user) return;
    setLoadingSubs(true);
    const { data } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'fetch_user_subscription', user_id: user.user_id },
    });
    if (data?.user_subscriptions) setUserSubs(data.user_subscriptions);
    setLoadingSubs(false);
  };

  const handleChangeRole = async (newRole: string) => {
    if (!user) return;
    setChangingRole(true);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'change_user_role', user_id: user.user_id, new_role: newRole },
    });
    if (error || !data?.success) {
      toast.error(data?.error || 'Failed to change role');
    } else {
      toast.success(`Role changed to ${newRole}`);
      onUserUpdated(user.user_id, { user_type: newRole });
    }
    setChangingRole(false);
  };

  const handleSetSubscription = async () => {
    if (!user || !selectedSubId) return;
    setSettingSub(true);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: {
        password,
        action: 'set_user_subscription',
        user_id: user.user_id,
        subscription_id: selectedSubId,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
    if (error || !data?.success) {
      toast.error(data?.error || 'Failed to set subscription');
    } else {
      toast.success('Subscription updated');
      fetchUserSubscription();
    }
    setSettingSub(false);
  };

  const handleCancelSubscription = async () => {
    if (!user) return;
    if (!confirm('Cancel active subscription for this user?')) return;
    setSettingSub(true);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'cancel_user_subscription', user_id: user.user_id },
    });
    if (error || !data?.success) {
      toast.error(data?.error || 'Failed to cancel subscription');
    } else {
      toast.success('Subscription cancelled');
      fetchUserSubscription();
    }
    setSettingSub(false);
  };

  if (!user) return null;

  const activeSub = userSubs.find(s => s.status === 'active');
  const roleIcon = user.user_type === 'business' ? Building2 : user.user_type === 'clubs' ? Users2 : User;
  const RoleIcon = roleIcon;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RoleIcon className="w-5 h-5" />
            {user.full_name || user.username || 'User Details'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info */}
          <Card>
            <CardContent className="pt-4 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Username</span>
                <span>@{user.username || '—'}</span>
                <span className="text-muted-foreground">Email</span>
                <span className="truncate">{user.email || '—'}</span>
                <span className="text-muted-foreground">University</span>
                <span>{user.university || '—'}</span>
                <span className="text-muted-foreground">Joined</span>
                <span>{user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                <span className="text-muted-foreground">Status</span>
                <div className="flex gap-1">
                  <Badge variant={user.approved ? 'default' : 'secondary'} className="text-xs">
                    {user.approved ? 'Approved' : 'Pending'}
                  </Badge>
                  <Badge variant={user.email_confirmed ? 'default' : 'secondary'} className="text-xs">
                    {user.email_confirmed ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role Management */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="w-4 h-4" /> User Role
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">{user.user_type || 'student'}</Badge>
                <span className="text-xs text-muted-foreground">Current role</span>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={user.user_type || 'student'}
                  onValueChange={handleChangeRole}
                  disabled={changingRole}
                >
                  <SelectTrigger className="w-[160px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">
                      <span className="flex items-center gap-2"><User className="w-3 h-3" /> Student</span>
                    </SelectItem>
                    <SelectItem value="business">
                      <span className="flex items-center gap-2"><Building2 className="w-3 h-3" /> Business</span>
                    </SelectItem>
                    <SelectItem value="clubs">
                      <span className="flex items-center gap-2"><Users2 className="w-3 h-3" /> Club</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {changingRole && <Loader2 className="w-4 h-4 animate-spin" />}
              </div>
            </CardContent>
          </Card>

          {/* University Management */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <GraduationCap className="w-4 h-4" /> University
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{user.university || 'Not set'}</Badge>
                <span className="text-xs text-muted-foreground">Current university</span>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={user.university || ''}
                  onValueChange={handleChangeUniversity}
                  disabled={changingUniversity}
                >
                  <SelectTrigger className="w-[200px] h-8">
                    <SelectValue placeholder="Select university" />
                  </SelectTrigger>
                  <SelectContent>
                    {universities.map(u => (
                      <SelectItem key={u.abbreviation} value={u.abbreviation}>
                        {u.name} ({u.abbreviation})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {changingUniversity && <Loader2 className="w-4 h-4 animate-spin" />}
              </div>
            </CardContent>
          </Card>

          {/* Subscription Management */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Crown className="w-4 h-4" /> Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingSubs ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
              ) : (
                <>
                  {activeSub ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary/20 text-primary border-primary/30">
                          {activeSub.subscriptions?.name || 'Active'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Expires: {new Date(activeSub.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <Button size="sm" variant="destructive" onClick={handleCancelSubscription} disabled={settingSub}>
                        {settingSub ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <X className="w-3 h-3 mr-1" />}
                        Cancel Subscription
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No active subscription</p>
                  )}

                  {userSubs.filter(s => s.status !== 'active').length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">History</p>
                      {userSubs.filter(s => s.status !== 'active').map(s => (
                        <div key={s.id} className="flex items-center gap-2 text-xs">
                          <Badge variant="outline" className="text-xs">{s.subscriptions?.name}</Badge>
                          <span className="text-muted-foreground capitalize">{s.status}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t pt-3 space-y-2">
                    <p className="text-xs font-medium">Assign Subscription</p>
                    <div className="flex items-center gap-2">
                      <Select value={selectedSubId} onValueChange={setSelectedSubId}>
                        <SelectTrigger className="w-[160px] h-8">
                          <SelectValue placeholder="Select plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {subscriptions.map(s => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name} — ₹{(s.price_monthly / 100).toFixed(0)}/mo
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" onClick={handleSetSubscription} disabled={!selectedSubId || settingSub}>
                        {settingSub ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                        Assign
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailModal;
