
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, Lock, Users, Mail, Clock } from 'lucide-react';
import { toast } from 'sonner';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || '';

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
  const [signups, setSignups] = useState<SignupRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD && ADMIN_PASSWORD !== '') {
      setAuthenticated(true);
      fetchSignups();
    } else {
      toast.error('Invalid password');
    }
  };

  const fetchSignups = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('early_access_signups')
      .select('id, full_name, email, university, created_at, invited')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch signups');
    } else {
      setSignups(data || []);
    }
    setLoading(false);
  };

  const handleInvite = async (id: string) => {
    setInviting(id);
    const { error } = await supabase
      .from('early_access_signups')
      .update({ invited: true })
      .eq('id', id);

    if (error) {
      toast.error('Failed to invite user');
    } else {
      toast.success('User invited!');
      setSignups(prev =>
        prev.map(s => (s.id === id ? { ...s, invited: true } : s))
      );
    }
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
              <Button type="submit" className="w-full">
                Unlock
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
        <h1 className="text-2xl font-bold text-foreground">Waitlist Admin</h1>

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
              <Clock className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <Mail className="w-5 h-5 text-green-500" />
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
                          <Badge className="bg-green-500/15 text-green-600 border-green-500/30 hover:bg-green-500/15">
                            <Check className="w-3 h-3 mr-1" />
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
