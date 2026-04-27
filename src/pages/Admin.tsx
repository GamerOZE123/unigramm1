import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Check, Lock, Users, Mail, Clock, Shield, ShieldOff, ShieldCheck, Smartphone, Send, Trash2, Bell, Wrench, Menu, RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import AdminFeatureFlags from '@/components/admin/AdminFeatureFlags';
import AdminAppConfig from '@/components/admin/AdminAppConfig';
import AdminUserManagement from '@/components/admin/AdminUserManagement';
import AdminUniversityFeatures from '@/components/admin/AdminUniversityFeatures';
import AdminPendingAccounts from '@/components/admin/AdminPendingAccounts';
import AdminBroadcastNotifications from '@/components/admin/AdminBroadcastNotifications';
import AdminAuthenticatedUsers from '@/components/admin/AdminAuthenticatedUsers';
import AdminOverviewStats from '@/components/admin/AdminOverviewStats';
import AdminNotes from '@/components/admin/AdminNotes';
import AdminAnalyticsPage from '@/components/admin/AdminAnalyticsPage';
import AdminTeamMembers from '@/components/admin/AdminTeamMembers';
import AdminSidebar, { type AdminSection } from '@/components/admin/AdminSidebar';
import AdminWaitlistSection from '@/components/admin/AdminWaitlistSection';
import { AdminCoursesContent } from '@/pages/AdminCourses';
import AdminEmailTemplates from '@/components/admin/AdminEmailTemplates';
import AdminDatingModule from '@/components/admin/AdminDatingModule';
import AdminAnnouncements from '@/components/admin/AdminAnnouncements';
import AdminOverflow from '@/components/admin/AdminOverflow';
import AdminOfficials from '@/components/admin/AdminOfficials';
import AdminPointsManagement from '@/components/admin/AdminPointsManagement';
import AdminApplicants from '@/components/admin/AdminApplicants';
import AdminUniversityMap from '@/components/admin/AdminUniversityMap';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

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
  const [reInviting, setReInviting] = useState<string | null>(null);

  const [adminRole, setAdminRole] = useState<'admin' | 'team'>('admin');
  const [allowedSections, setAllowedSections] = useState<string[] | null>(null);

  const [section, setSection] = useState<AdminSection>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Access control state
  const [restrictedAccess, setRestrictedAccess] = useState<boolean | null>(null);
  const [togglingAccess, setTogglingAccess] = useState(false);

  // Maintenance mode state
  const [maintenanceMode, setMaintenanceMode] = useState<boolean | null>(null);
  const [togglingMaintenance, setTogglingMaintenance] = useState(false);
  const [notifyOnMaintenanceOff, setNotifyOnMaintenanceOff] = useState(true);

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
    const valueStr = String(newValue);
    const now = new Date().toISOString();

    const [configResult, settingsResult] = await Promise.all([
      supabase
        .from('app_config')
        .update({ value: valueStr, updated_at: now } as any)
        .eq('key', 'maintenance_mode'),
      supabase
        .from('app_settings')
        .upsert({ key: 'maintenance_mode', value: valueStr, updated_at: now } as any, { onConflict: 'key' }),
    ]);

    if (configResult.error && settingsResult.error) {
      toast.error('Failed to update maintenance mode');
    } else {
      setMaintenanceMode(newValue);
      if (configResult.error) toast.warning('Updated mobile but web config failed');
      else if (settingsResult.error) toast.warning('Updated web but mobile config failed');
      else toast.success(newValue ? 'Maintenance mode enabled' : 'Maintenance mode disabled');

      // Send welcome-back notification to all approved users when maintenance is turned OFF
      if (!newValue && notifyOnMaintenanceOff) {
        try {
          const { data: idsData } = await supabase.functions.invoke('verify-admin', {
            body: { password: storedPassword, action: 'fetch_all_user_ids' },
          });
          if (idsData?.user_ids?.length) {
            const batchSize = 50;
            for (let i = 0; i < idsData.user_ids.length; i += batchSize) {
              const batch = idsData.user_ids.slice(i, i + batchSize);
              await supabase.functions.invoke('verify-admin', {
                body: {
                  password: storedPassword,
                  action: 'broadcast_batch',
                  user_ids: batch,
                  title: 'We\'re Back! 🚀',
                  message: 'Maintenance is complete — Unigramm is back online. Thanks for your patience!',
                  type: 'system',
                  log_broadcast: i === 0,
                  audience_type: 'all',
                  total_recipients: idsData.user_ids.length,
                },
              });
            }
            toast.success('Welcome-back notification sent to all users');
          }
        } catch {
          toast.error('Maintenance disabled but failed to send notifications');
        }
      }
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
        setAdminRole(data.role || 'admin');
        setAllowedSections(data.allowed_sections ?? null);
        if (data.role === 'team' && data.allowed_sections?.length > 0) {
          setSection(data.allowed_sections[0] as AdminSection);
        }
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

  // Auto-fetch signups when authenticated and on waitlist/overflow sections
  useEffect(() => {
    if (authenticated && storedPassword && (section === 'waitlist' || section === 'overflow')) {
      fetchSignups();
    }
  }, [authenticated, storedPassword, section]);

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

  const handleReInvite = async (signup: SignupRow) => {
    setReInviting(signup.id);
    try {
      const { error } = await supabase.functions.invoke('send-invite', {
        body: { email: signup.email, name: signup.full_name || '' },
      });
      if (error) throw error;
      toast.success(`Re-invite sent to ${signup.email}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to re-send invite');
    }
    setReInviting(null);
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

  const handleAddWaitlistEntry = async (formData: { full_name: string; email: string; university: string }) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-admin', {
        body: { password: storedPassword, action: 'add_waitlist_entry', ...formData },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.entry) {
        setSignups(prev => [data.entry, ...prev]);
      }
      toast.success(`Added ${formData.email} to waitlist`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add');
    }
  };

  const handleEditWaitlistEntry = async (id: string, formData: { full_name: string; email: string; university: string; android_email?: string }) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-admin', {
        body: { password: storedPassword, action: 'update_waitlist_entry', id, ...formData },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.entry) {
        setSignups(prev => prev.map(s => s.id === id ? { ...s, ...data.entry } : s));
      }
      toast.success('Waitlist entry updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    }
  };

  const pendingCount = signups.filter(s => !s.invited).length;
  const invitedCount = signups.filter(s => s.invited).length;
  const signedUpCount = signups.filter(s => s.invited).length;

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-sm border-border/40">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Admin Access</CardTitle>
            <p className="text-sm text-muted-foreground">Enter your password to continue</p>
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
                {verifying ? 'Verifying…' : 'Unlock Dashboard'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <AdminSidebar
        current={section}
        onChange={setSection}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        allowedSections={allowedSections}
      />

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/40 px-4 md:px-6 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground capitalize">
            {section === 'auth' ? 'Authenticated Users' : section === 'flags' ? 'Feature Flags' : section === 'config' ? 'App Config' : section === 'overflow' ? 'Overflow' : section.replace('_', ' ')}
          </h1>
        </div>

        <div className="p-4 md:p-6 space-y-6 max-w-[1400px]">
          {/* Overview Section */}
          {section === 'overview' && (
            <>
              <AdminOverviewStats />

              <AdminNotes password={storedPassword} />


              {restrictedAccess !== null && (
                <Card className={`border-border/40 ${restrictedAccess ? 'border-destructive/40' : 'border-green-500/30'}`}>
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {restrictedAccess ? <Shield className="w-5 h-5 text-destructive" /> : <ShieldOff className="w-5 h-5 text-green-500" />}
                      <div>
                        <p className="font-semibold text-foreground">Access Control</p>
                        {restrictedAccess ? (
                          <Badge variant="destructive" className="mt-1">Restricted — only approved users</Badge>
                        ) : (
                          <Badge className="mt-1 bg-green-500 hover:bg-green-600 text-white border-transparent">Open — all users</Badge>
                        )}
                      </div>
                    </div>
                    <Button variant={restrictedAccess ? 'default' : 'destructive'} size="sm" onClick={toggleAccess} disabled={togglingAccess}>
                      {togglingAccess ? 'Updating…' : restrictedAccess ? 'Open to everyone' : 'Restrict access'}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Maintenance Mode */}
              {maintenanceMode !== null && (
                <Card className={`border-border/40 ${maintenanceMode ? 'border-red-500/50 bg-red-950/10' : 'border-green-500/20'}`}>
                  <CardContent className="pt-6 space-y-4">
                    {maintenanceMode && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                        <span className="text-lg">⚠️</span>
                        App is currently in maintenance mode. All users see the maintenance screen.
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Wrench className={`w-6 h-6 ${maintenanceMode ? 'text-red-400' : 'text-green-400'}`} />
                        <div>
                          <p className="font-semibold text-lg text-foreground">Maintenance Mode</p>
                          <p className="text-sm text-muted-foreground">
                            {maintenanceMode ? 'App is under maintenance' : 'App is live and running'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-medium ${maintenanceMode ? 'text-red-400' : 'text-green-400'}`}>
                          {maintenanceMode ? 'ON' : 'OFF'}
                        </span>
                        {maintenanceMode ? (
                          <Switch
                            checked={maintenanceMode}
                            onCheckedChange={() => toggleMaintenance()}
                            disabled={togglingMaintenance}
                            className="data-[state=checked]:bg-red-500 scale-125"
                          />
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Switch checked={maintenanceMode} disabled={togglingMaintenance} className="scale-125" />
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Enable Maintenance Mode?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will show a maintenance screen to all users. They won't be able to use the app until you disable it.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => toggleMaintenance()} className="bg-red-500 hover:bg-red-600">
                                  Enable Maintenance
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                      <Switch
                        id="notify-maintenance-off"
                        checked={notifyOnMaintenanceOff}
                        onCheckedChange={setNotifyOnMaintenanceOff}
                      />
                      <label htmlFor="notify-maintenance-off" className="text-sm text-muted-foreground cursor-pointer">
                        Notify all users when maintenance ends ("We're Back!" notification)
                      </label>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Pending Accounts */}
          {section === 'pending' && <AdminPendingAccounts password={storedPassword} />}

          {/* Waitlist */}
          {section === 'waitlist' && (
            <AdminWaitlistSection
              signups={signups}
              loading={loading}
              inviting={inviting}
              reInviting={reInviting}
              sendingAndroid={sendingAndroid}
              deleting={deleting}
              onRefresh={fetchSignups}
              onInvite={handleInvite}
              onReInvite={handleReInvite}
              onSendAndroid={handleSendAndroidLink}
              onDelete={handleDeleteWaitlistEntry}
              onAdd={handleAddWaitlistEntry}
              onEdit={handleEditWaitlistEntry}
            />
          )}

          {/* Users */}
          {section === 'users' && <AdminUserManagement password={storedPassword} />}

          {/* Authenticated */}
          {section === 'auth' && <AdminAuthenticatedUsers password={storedPassword} />}

          {/* University Features */}
          {section === 'university' && <AdminUniversityFeatures />}

          {/* Course Listing */}
          {section === 'courses' && <AdminCoursesContent />}

          {/* Feature Flags */}
          {section === 'flags' && <AdminFeatureFlags password={storedPassword} />}

          {/* App Config */}
          {section === 'config' && <AdminAppConfig password={storedPassword} />}

          {/* Broadcast */}
          {section === 'broadcast' && <AdminBroadcastNotifications password={storedPassword} />}

          {/* Email Templates */}
          {section === 'emails' && <AdminEmailTemplates />}

          {/* Dating Module */}
          {section === 'dating' && <AdminDatingModule password={storedPassword} />}

          {/* Announcements */}
          {section === 'announcements' && <AdminAnnouncements />}

          {/* Analytics */}
          {section === 'analytics' && <AdminAnalyticsPage password={storedPassword} />}

          {/* Overflow */}
          {section === 'overflow' && (
            <AdminOverflow
              password={storedPassword}
              signups={signups}
              loading={loading}
              inviting={inviting}
              reInviting={reInviting}
              sendingAndroid={sendingAndroid}
              deleting={deleting}
              onRefresh={fetchSignups}
              onInvite={handleInvite}
              onReInvite={handleReInvite}
              onSendAndroid={handleSendAndroidLink}
              onDelete={handleDeleteWaitlistEntry}
              onAdd={handleAddWaitlistEntry}
              onEdit={handleEditWaitlistEntry}
            />
          )}

          {/* Officials */}
          {section === 'officials' && <AdminOfficials password={storedPassword} />}

          {/* Points & Rewards */}
          {section === 'points' && <AdminPointsManagement password={storedPassword} />}

          {/* Applicants */}
          {section === 'applicants' && <AdminApplicants password={storedPassword} />}

          {/* Team Members (admin only) */}
          {section === 'team' && adminRole === 'admin' && <AdminTeamMembers password={storedPassword} />}
        </div>
      </main>
    </div>
  );
};

export default Admin;
