
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, Lock, Users, Mail, Clock } from 'lucide-react';
import { toast } from 'sonner';

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

  const fetchAccessConfig = async () => {
    const { data, error } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'restricted_access')
      .single();
    if (!error && data) {
      setRestrictedAccess(data.value === 'true');
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
    if (!signup) {
      toast.error('Signup not found');
      setInviting(null);
      return;
    }

    // 1. Flip invited = true via edge function (bypasses RLS)
    const { data, error: updateError } = await supabase.functions.invoke('verify-admin', {
      body: { password: storedPassword, action: 'invite', id },
    });

    if (updateError || !data?.success) {
      toast.error('Failed to update signup status');
      setInviting(null);
      return;
    }

    // 2. Send invite email via send-invite edge function
    const { error: invokeError } = await supabase.functions.invoke('send-invite', {
      body: { email: signup.email, name: signup.full_name || '' },
    });

    if (invokeError) {
      toast.error('Invited but email failed to send: ' + invokeError.message);
    } else {
      toast.success('Invite sent to ' + signup.email);
    }

    setSignups(prev =>
      prev.map(s => (s.id === id ? { ...s, invited: true } : s))
    );
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
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Waitlist Admin</h1>
          <Button variant="outline" size="sm" onClick={fetchSignups} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold text-foreground">{signups.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold text-foreground">{invitedCount}</p>
                <p className="text-sm text-muted-foreground">Invited</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-center py-12">Loading…</p>
        ) : (
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
                          ? new Date(s.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {s.invited ? (
                          <Badge variant="secondary" className="gap-1">
                            <Check className="w-3 h-3" />
                            Invited
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleInvite(s.id)}
                            disabled={inviting === s.id}
                          >
                            {inviting === s.id ? 'Inviting…' : 'Invite'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {signups.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No signups yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Admin;
