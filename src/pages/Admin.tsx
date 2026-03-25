import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Check, Lock, Users, Mail, Clock, Shield, ShieldOff, ShieldCheck, Smartphone, Send, Trash2, Bell } from 'lucide-react';
import { toast } from 'sonner';
import AdminFeatureFlags from '@/components/admin/AdminFeatureFlags';
import AdminAppConfig from '@/components/admin/AdminAppConfig';
import AdminUserManagement from '@/components/admin/AdminUserManagement';
import AdminUniversityFeatures from '@/components/admin/AdminUniversityFeatures';
import AdminPendingAccounts from '@/components/admin/AdminPendingAccounts';
import AdminBroadcastNotifications from '@/components/admin/AdminBroadcastNotifications';
import AdminAuthenticatedUsers from '@/components/admin/AdminAuthenticatedUsers';

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

const Admin: React.FC = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [signups, setSignups] = useState<SignupRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const [storedPassword, setStoredPassword] = useState('');
  const [sendingAndroid, setSendingAndroid] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Access control state
  const [restrictedAccess, setRestrictedAccess] = useState<boolean | null>(null);
  const [togglingAccess, setTogglingAccess] = useState(false);

  // Maintenance mode state
  const [maintenanceMode, setMaintenanceMode] = useState<boolean | null>(null);
  const [togglingMaintenance, setTogglingMaintenance] = useState(false);

  const fetchAccessConfig = async () => {
    const { data, error } = await supabase
      .from('app_config')
      .select('key, value')
      .in('key', ['restricted_access', 'maintenance_mode']);
    if (!error && data) {
      const restricted = data.find(d => d.key === 'restricted_access');
      const maintenance = data.find(d => d.key === 'maintenance_mode');
      if (restricted) setRestrictedAccess(restricted.value === 'true');
      if (maintenance) setMaintenanceMode(maintenance.value === 'true');
    }
  };

  const toggleAccess = async () => {
    setTogglingAccess(true);
    const newValue = !restrictedAccess;
    const { error } = await supabase
      .from('app_config')
      .update({ value: String(newValue), updated_at: new Date().toISOString() } as any)
      .eq('key', 'restricted_access');
    if (error) {
      toast.error('Failed to update access setting');
    } else {
      setRestrictedAccess(newValue);
      toast.success(newValue ? 'Access restricted to approved users' : 'Access opened to everyone');
    }
    setTogglingAccess(false);
  };

  const toggleMaintenance = async () => {
    setTogglingMaintenance(true);
    const newValue = !maintenanceMode;
    const { error } = await supabase
      .from('app_config')
      .update({ value: String(newValue), updated_at: new Date().toISOString() } as any)
      .eq('key', 'maintenance_mode');
    if (error) {
      toast.error('Failed to update maintenance mode');
    } else {
      setMaintenanceMode(newValue);
      toast.success(newValue ? 'Maintenance mode enabled' : 'Maintenance mode disabled');
    }
    setTogglingMaintenance(false);
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

  const handleSendAndroidLink = async (signup: SignupRow) => {
    setSendingAndroid(signup.id);
    try {
      const { data, error } = await supabase.functions.invoke('send-android-invite', {
        body: { email: signup.email },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSignups(prev => prev.map(s => s.id === signup.id ? { ...s, android_sent: true } : s));
      toast.success(`Android link sent to ${signup.email}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send Android link');
    }
    setSendingAndroid(null);
  };

  const handleDeleteWaitlistEntry = async (signup: SignupRow) => {
    if (!confirm(`Delete ${signup.email} from the waitlist?`)) return;
    setDeleting(signup.id);
    try {
      const { data, error } = await supabase.functions.invoke('verify-admin', {
        body: { password: storedPassword, action: 'delete_waitlist_entry', id: signup.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSignups(prev => prev.filter(s => s.id !== signup.id));
      toast.success(`Deleted ${signup.email} from waitlist`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
    setDeleting(null);
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

        {/* University Features */}
        <AdminUniversityFeatures />

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="w-full justify-start flex-wrap">
            <TabsTrigger value="pending">Pending Accounts</TabsTrigger>
            <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="auth"><ShieldCheck className="w-3 h-3 mr-1" /> Authenticated</TabsTrigger>
            <TabsTrigger value="flags">Feature Flags</TabsTrigger>
            <TabsTrigger value="config">App Config</TabsTrigger>
            <TabsTrigger value="broadcast"><Bell className="w-3 h-3 mr-1" /> Broadcast</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <AdminPendingAccounts password={storedPassword} />
          </TabsContent>

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
                      <TableHead>Android Email</TableHead>
                      <TableHead>University</TableHead>
                      <TableHead>Signed Up</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Android</TableHead>
                      <TableHead className="text-right">Delete</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {signups.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.full_name || '—'}</TableCell>
                        <TableCell>{s.email}</TableCell>
                        <TableCell>
                          {s.android_email ? (
                            <span className="text-sm">{s.android_email}</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell>{s.university || '—'}</TableCell>
                        <TableCell>
                          {s.created_at
                            ? new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '—'}
                        </TableCell>
                        <TableCell>
                          {s.invited ? (
                            <Badge variant="secondary" className="gap-1"><Check className="w-3 h-3" /> Invited</Badge>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => handleInvite(s.id)} disabled={inviting === s.id}>
                              {inviting === s.id ? 'Inviting…' : 'Invite'}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {s.android_sent ? (
                            <Badge variant="secondary" className="gap-1"><Smartphone className="w-3 h-3" /> Sent</Badge>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => handleSendAndroidLink(s)} disabled={sendingAndroid === s.id}>
                              <Smartphone className="w-3 h-3 mr-1" />
                              {sendingAndroid === s.id ? 'Sending…' : 'Send'}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteWaitlistEntry(s)}
                            disabled={deleting === s.id}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {signups.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No signups yet</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <AdminUserManagement password={storedPassword} />
          </TabsContent>

          <TabsContent value="auth">
            <AdminAuthenticatedUsers password={storedPassword} />
          </TabsContent>

          <TabsContent value="flags">
            <AdminFeatureFlags password={storedPassword} />
          </TabsContent>

          <TabsContent value="config">
            <AdminAppConfig password={storedPassword} />
          </TabsContent>

          <TabsContent value="broadcast">
            <AdminBroadcastNotifications password={storedPassword} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
