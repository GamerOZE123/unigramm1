import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Check, Lock, Users, Mail, Clock, Shield, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import AdminFeatureFlags from '@/components/admin/AdminFeatureFlags';
import AdminAppConfig from '@/components/admin/AdminAppConfig';
import AdminUserManagement from '@/components/admin/AdminUserManagement';

interface SignupRow {
  id: string;
  full_name: string | null;
  email: string;
  university: string | null;
  created_at: string | null;
  invited: boolean;
}

const Admin: React.FC = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [signups, setSignups] = useState<SignupRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const [storedPassword, setStoredPassword] = useState('');

  // Access control state
  const [restrictedAccess, setRestrictedAccess] = useState<boolean | null>(null);
  const [togglingAccess, setTogglingAccess] = useState(false);

  // University features state
  const UNIVERSITY_FEATURES = [
    { key: 'university_feature_clubs', label: 'Clubs & Organizations' },
    { key: 'university_feature_startups', label: 'Startups & Ideas' },
    { key: 'university_feature_confessions', label: 'Confessions' },
    { key: 'university_feature_groups', label: 'Groups' },
    { key: 'university_feature_events', label: 'Events' },
    { key: 'university_feature_marketplace', label: 'Marketplace' },
  ] as const;
  const [universityFeatures, setUniversityFeatures] = useState<Record<string, boolean>>({});
  const [togglingFeature, setTogglingFeature] = useState<string | null>(null);

  const fetchAccessConfig = async () => {
    const { data, error } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'restricted_access')
      .single();
    if (!error && data) {
      setRestrictedAccess(data.value === 'true');
    }

    // Fetch university features
    const { data: featureData } = await supabase
      .from('app_config')
      .select('key, value')
      .like('key', 'university_feature_%');
    if (featureData) {
      const featureMap: Record<string, boolean> = {};
      featureData.forEach((f) => { featureMap[f.key] = f.value === 'true'; });
      setUniversityFeatures(featureMap);
    }
  };

  const toggleAccess = async () => {
    setTogglingAccess(true);
    const newValue = !restrictedAccess;
    const { error } = await supabase
      .from('app_config')
      .update({ value: String(newValue), updated_at: new Date().toISOString() })
      .eq('key', 'restricted_access');
    if (error) {
      toast.error('Failed to update access setting');
    } else {
      setRestrictedAccess(newValue);
      toast.success(newValue ? 'Access restricted to approved users' : 'Access opened to everyone');
    }
    setTogglingAccess(false);
  };

  const toggleUniversityFeature = async (key: string) => {
    setTogglingFeature(key);
    const newValue = !universityFeatures[key];
    const { error } = await supabase
      .from('app_config')
      .update({ value: String(newValue), updated_at: new Date().toISOString() })
      .eq('key', key);
    if (error) {
      toast.error('Failed to update feature');
    } else {
      setUniversityFeatures(prev => ({ ...prev, [key]: newValue }));
      const label = UNIVERSITY_FEATURES.find(f => f.key === key)?.label || key;
      toast.success(`${label} ${newValue ? 'enabled' : 'disabled'}`);
    }
    setTogglingFeature(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-admin', {
        body: { password, action: 'fetch' },
      });
      if (error || !data?.valid) {
        toast.error('Invalid password');
      } else {
        setAuthenticated(true);
        setStoredPassword(password);
        setSignups(data.signups || []);
        fetchAccessConfig();
      }
    } catch {
      toast.error('Failed to verify');
    }
    setVerifying(false);
  };

  const fetchSignups = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-admin', {
        body: { password: storedPassword, action: 'fetch' },
      });
      if (error || !data?.valid) {
        toast.error('Failed to fetch signups');
      } else {
        setSignups(data.signups || []);
      }
    } catch {
      toast.error('Failed to fetch signups');
    }
    setLoading(false);
  };

  const handleInvite = async (id: string) => {
    setInviting(id);
    const signup = signups.find(s => s.id === id);
    if (!signup) { setInviting(null); return; }

    const { data, error: updateError } = await supabase.functions.invoke('verify-admin', {
      body: { password: storedPassword, action: 'invite', id },
    });
    if (updateError || !data?.success) {
      toast.error('Failed to update signup status');
      setInviting(null);
      return;
    }

    const { error: invokeError } = await supabase.functions.invoke('send-invite', {
      body: { email: signup.email, name: signup.full_name || '' },
    });
    if (invokeError) {
      toast.error('Invited but email failed to send');
    } else {
      toast.success('Invite sent to ' + signup.email);
    }

    setSignups(prev => prev.map(s => (s.id === id ? { ...s, invited: true } : s)));
    setInviting(null);
  };

  const pendingCount = signups.filter(s => !s.invited).length;
  const invitedCount = signups.filter(s => s.invited).length;

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <CardTitle className="text-lg">Admin Access</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
              />
              <Button type="submit" className="w-full" disabled={verifying}>
                {verifying ? 'Verifying…' : 'Unlock'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>

        {/* Access Control Banner */}
        {restrictedAccess !== null && (
          <Card className={restrictedAccess ? 'border-destructive/50' : 'border-green-500/50'}>
            <CardContent className="pt-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {restrictedAccess ? (
                  <Shield className="w-5 h-5 text-destructive" />
                ) : (
                  <ShieldOff className="w-5 h-5 text-green-500" />
                )}
                <div>
                  <p className="font-semibold text-foreground">Access Control</p>
                  {restrictedAccess ? (
                    <Badge variant="destructive" className="mt-1">Restricted — only approved users</Badge>
                  ) : (
                    <Badge className="mt-1 bg-green-500 hover:bg-green-600 text-white border-transparent">Open — all users</Badge>
                  )}
                </div>
              </div>
              <Button
                variant={restrictedAccess ? 'default' : 'destructive'}
                size="sm"
                onClick={toggleAccess}
                disabled={togglingAccess}
              >
                {togglingAccess ? 'Updating…' : restrictedAccess ? 'Open to everyone' : 'Restrict access'}
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="waitlist" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="flags">Feature Flags</TabsTrigger>
            <TabsTrigger value="config">App Config</TabsTrigger>
          </TabsList>

          {/* Waitlist Tab */}
          <TabsContent value="waitlist" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <Badge variant="secondary"><Users className="w-3 h-3 mr-1" /> {signups.length} total</Badge>
                <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> {pendingCount} pending</Badge>
                <Badge variant="secondary"><Mail className="w-3 h-3 mr-1" /> {invitedCount} invited</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={fetchSignups} disabled={loading}>
                {loading ? 'Refreshing…' : 'Refresh'}
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>University</TableHead>
                      <TableHead>Signed Up</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {signups.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.full_name || '—'}</TableCell>
                        <TableCell>{s.email}</TableCell>
                        <TableCell>{s.university || '—'}</TableCell>
                        <TableCell>
                          {s.created_at
                            ? new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {s.invited ? (
                            <Badge variant="secondary" className="gap-1"><Check className="w-3 h-3" /> Invited</Badge>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => handleInvite(s.id)} disabled={inviting === s.id}>
                              {inviting === s.id ? 'Inviting…' : 'Invite'}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {signups.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No signups yet</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <AdminUserManagement password={storedPassword} />
          </TabsContent>

          {/* Feature Flags Tab */}
          <TabsContent value="flags">
            <AdminFeatureFlags password={storedPassword} />
          </TabsContent>

          {/* App Config Tab */}
          <TabsContent value="config">
            <AdminAppConfig password={storedPassword} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
