import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Users, RefreshCw, Search, Trash2, Smartphone, Send } from 'lucide-react';
import UserDetailModal from './UserDetailModal';

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
  android_tester_email?: string | null;
  android_tester_status?: string | null;
}

interface Props {
  password: string;
}

const AdminUserManagement: React.FC<Props> = ({ password }) => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);
  const [sendingAndroid, setSendingAndroid] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showAndroidOnly, setShowAndroidOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'all' | 'student' | 'clubs' | 'business'>('all');
  const [androidTesters, setAndroidTesters] = useState<Record<string, { email: string; status: string }>>({});
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

  const fetchAndroidTesters = async () => {
    const { data } = await supabase
      .from('android_testers' as any)
      .select('*') as any;
    if (data) {
      const map: Record<string, { email: string; status: string }> = {};
      data.forEach((t: any) => {
        map[t.email.toLowerCase()] = { email: t.email, status: t.status };
      });
      setAndroidTesters(map);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'fetch_users' },
    });
    if (error || !data?.valid) {
      toast.error('Failed to fetch users');
    } else {
      setUsers(data.users || []);
      setFetched(true);
    }
    await fetchAndroidTesters();
    setLoading(false);
  };

  const toggleApproval = async (user_id: string, current: boolean) => {
    setActioning(user_id);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'set_approved', user_id, approved: !current },
    });
    if (error || !data?.success) {
      toast.error('Failed to update approval');
    } else {
      setUsers(prev => prev.map(u => u.user_id === user_id ? { ...u, approved: !current } : u));
      toast.success(!current ? 'User approved' : 'User approval revoked');
    }
    setActioning(null);
  };

  const toggleEmailConfirm = async (user_id: string, currentlyConfirmed: boolean) => {
    if (currentlyConfirmed) return;
    setActioning(user_id);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'confirm_email', user_id },
    });
    if (error || !data?.success) {
      toast.error(data?.error || 'Failed to confirm email');
    } else {
      setUsers(prev => prev.map(u => u.user_id === user_id ? { ...u, email_confirmed: true } : u));
      toast.success('Email confirmed');
    }
    setActioning(null);
  };

  const handleDeleteUser = async (user_id: string, name: string | null) => {
    if (!confirm(`Permanently delete ${name || 'this user'}? Cannot be undone.`)) return;
    setActioning(user_id);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'delete_user', user_id },
    });
    if (error || !data?.success) {
      toast.error(data?.error || 'Failed to delete user');
    } else {
      setUsers(prev => prev.filter(u => u.user_id !== user_id));
      toast.success('User permanently deleted');
    }
    setActioning(null);
  };

  const sendAndroidInvite = async (user: UserRow) => {
    if (!user.email) {
      toast.error('User has no email');
      return;
    }
    setSendingAndroid(user.user_id);
    try {
      const { data, error } = await supabase.functions.invoke('send-android-invite', {
        body: { email: user.email },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Android download link sent to ${user.email}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send Android invite');
    } finally {
      setSendingAndroid(null);
    }
  };

  const getAndroidInfo = (user: UserRow) => {
    if (!user.email) return null;
    return androidTesters[user.email.toLowerCase()] || null;
  };

  const filtered = users.filter(u => {
    const androidInfo = getAndroidInfo(u);
    if (showAndroidOnly && !androidInfo) return false;
    if (typeFilter !== 'all' && u.user_type !== typeFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.university || '').toLowerCase().includes(q)
    );
  });

  const approvedCount = users.filter(u => u.approved).length;
  const pendingCount = users.filter(u => !u.approved).length;
  const emailConfirmedCount = users.filter(u => u.email_confirmed).length;
  const androidTesterCount = users.filter(u => getAndroidInfo(u)).length;

  if (!fetched) {
    return (
      <Card>
        <CardContent className="pt-6 flex flex-col items-center gap-3">
          <Users className="w-8 h-8 text-muted-foreground" />
          <p className="text-muted-foreground">Load registered users from database</p>
          <Button onClick={fetchUsers} disabled={loading}>
            {loading ? 'Loading…' : 'Load Users'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          <Badge variant="secondary">{users.length} total</Badge>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{approvedCount} approved</Badge>
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">{pendingCount} pending</Badge>
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">{emailConfirmedCount} email confirmed</Badge>
          <button onClick={() => setShowAndroidOnly(!showAndroidOnly)}>
            <Badge className={`cursor-pointer border ${showAndroidOnly ? 'bg-primary/20 text-primary border-primary/30' : 'bg-muted text-muted-foreground border-muted'}`}>
              <Smartphone className="w-3 h-3 mr-1" /> {androidTesterCount} android testers
            </Badge>
          </button>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Search users…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-9 w-[220px]"
            />
          </div>
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Play Store Email</TableHead>
                <TableHead>University</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-center">Email Verified</TableHead>
                <TableHead className="text-center">Approved</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(u => {
                const androidInfo = getAndroidInfo(u);
                return (
                  <TableRow key={u.user_id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedUser(u)}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{u.full_name || '—'}</p>
                        <p className="text-xs text-muted-foreground">@{u.username || '—'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{u.email || '—'}</TableCell>
                    <TableCell className="text-sm">
                      {androidInfo ? (
                        <div className="flex flex-col gap-1">
                          <span>{androidInfo.email}</span>
                          <Badge variant="outline" className="text-xs w-fit">{androidInfo.status}</Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{u.university || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{u.user_type || '—'}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </TableCell>
                    <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={u.email_confirmed}
                          disabled={u.email_confirmed || actioning === u.user_id}
                          onCheckedChange={() => toggleEmailConfirm(u.user_id, u.email_confirmed)}
                        />
                        <span className={`text-xs ${u.email_confirmed ? 'text-green-500' : 'text-muted-foreground'}`}>
                          {u.email_confirmed ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={u.approved}
                          disabled={actioning === u.user_id}
                          onCheckedChange={() => toggleApproval(u.user_id, u.approved)}
                        />
                        <span className={`text-xs ${u.approved ? 'text-green-500' : 'text-muted-foreground'}`}>
                          {u.approved ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end" onClick={e => e.stopPropagation()}>
                        {androidInfo && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={sendingAndroid === u.user_id}
                            onClick={() => sendAndroidInvite(u)}
                          >
                            <Smartphone className="w-3 h-3 mr-1" />
                            {sendingAndroid === u.user_id ? 'Sending…' : 'Send Android Link'}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={actioning === u.user_id}
                          onClick={() => handleDeleteUser(u.user_id, u.full_name)}
                        >
                          <Trash2 className="w-3 h-3 mr-1" /> Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {search ? 'No users match your search' : showAndroidOnly ? 'No android testers found' : 'No users found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <UserDetailModal
        user={selectedUser}
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        password={password}
        onUserUpdated={(userId, updates) => {
          setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, ...updates } : u));
          setSelectedUser(prev => prev && prev.user_id === userId ? { ...prev, ...updates } : prev);
        }}
      />
    </div>
  );
};

export default AdminUserManagement;
