import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Users, RefreshCw, Search, CheckCircle, XCircle, Trash2 } from 'lucide-react';

interface UserRow {
  user_id: string;
  username: string | null;
  full_name: string | null;
  email: string | null;
  university: string | null;
  user_type: string | null;
  approved: boolean;
  created_at: string | null;
}

interface Props {
  password: string;
}

const AdminUserManagement: React.FC<Props> = ({ password }) => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState('');

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
    setLoading(false);
  };

  const toggleApproval = async (user_id: string, current: boolean) => {
    setToggling(user_id);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'set_approved', user_id, approved: !current },
    });
    if (error || !data?.success) {
      toast.error('Failed to update approval');
    } else {
      setUsers(prev => prev.map(u => u.user_id === user_id ? { ...u, approved: !current } : u));
      toast.success(!current ? 'User approved' : 'User approval revoked');
    }
    setToggling(null);
  };

  const handleDeleteUser = async (user_id: string, name: string | null) => {
    if (!confirm(`Permanently delete ${name || 'this user'}? This removes their profile and auth account. Cannot be undone.`)) return;
    setDeleting(user_id);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'delete_user', user_id },
    });
    if (error || !data?.success) {
      toast.error(data?.error || 'Failed to delete user');
    } else {
      setUsers(prev => prev.filter(u => u.user_id !== user_id));
      toast.success('User permanently deleted');
    }
    setDeleting(null);
  };

  const filtered = users.filter(u => {
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
        <div className="flex gap-3">
          <Badge variant="secondary">{users.length} total</Badge>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{approvedCount} approved</Badge>
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">{pendingCount} pending</Badge>
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
                <TableHead>University</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Approved</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(u => (
                <TableRow key={u.user_id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{u.full_name || '—'}</p>
                      <p className="text-xs text-muted-foreground">@{u.username || '—'}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{u.email || '—'}</TableCell>
                  <TableCell className="text-sm">{u.university || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{u.user_type || '—'}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {u.created_at
                      ? new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant={u.approved ? 'default' : 'outline'}
                        disabled={toggling === u.user_id || deleting === u.user_id}
                        onClick={() => toggleApproval(u.user_id, u.approved)}
                        className={u.approved ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                      >
                        {toggling === u.user_id ? '…' : u.approved ? (
                          <><CheckCircle className="w-3 h-3 mr-1" /> Approved</>
                        ) : (
                          <><XCircle className="w-3 h-3 mr-1" /> Approve</>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={toggling === u.user_id || deleting === u.user_id}
                        onClick={() => handleDeleteUser(u.user_id, u.full_name)}
                      >
                        {deleting === u.user_id ? '…' : <><Trash2 className="w-3 h-3 mr-1" /> Delete</>}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {search ? 'No users match your search' : 'No users found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUserManagement;
