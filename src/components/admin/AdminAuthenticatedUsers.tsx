import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ShieldCheck, RefreshCw, Search, Trash2 } from 'lucide-react';

interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  provider: string;
}

interface Props {
  password: string;
}

const AdminAuthenticatedUsers: React.FC<Props> = ({ password }) => {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchAuthUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'fetch_auth_users' },
    });
    if (error || !data?.valid) {
      toast.error('Failed to fetch authenticated users');
    } else {
      setUsers(data.auth_users || []);
      setFetched(true);
    }
    setLoading(false);
  };

  const handleForceDelete = async (user: AuthUser) => {
    if (!confirm(`PERMANENTLY delete ${user.email || user.id}?\n\nThis will remove ALL data across every table and cannot be undone.`)) return;
    if (!confirm(`Are you absolutely sure? Type-check: this deletes the auth user and all associated data.`)) return;

    setDeleting(user.id);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'force_delete_auth_user', user_id: user.id },
    });
    if (error || !data?.success) {
      toast.error(data?.error || 'Failed to delete user');
    } else {
      setUsers(prev => prev.filter(u => u.id !== user.id));
      toast.success('User permanently deleted from all tables');
      if (data.cleanup_errors?.length) {
        console.warn('Cleanup errors:', data.cleanup_errors);
      }
    }
    setDeleting(null);
  };

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (u.email || '').toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q) ||
      (u.provider || '').toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (!fetched) fetchAuthUsers();
  }, []);

  if (!fetched && loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex flex-col items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading auth users…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          <Badge variant="secondary">{users.length} auth users</Badge>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            {users.filter(u => u.email_confirmed_at).length} confirmed
          </Badge>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Search by email or ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-9 w-[220px]"
            />
          </div>
          <Button variant="outline" size="sm" onClick={fetchAuthUsers} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Email Confirmed</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Sign In</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium text-sm">{u.email || '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono max-w-[120px] truncate">{u.id}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{u.provider}</Badge>
                  </TableCell>
                  <TableCell>
                    {u.email_confirmed_at ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Yes</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">No</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell className="text-sm">
                    {u.last_sign_in_at
                      ? new Date(u.last_sign_in_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={deleting === u.id}
                      onClick={() => handleForceDelete(u)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      {deleting === u.id ? 'Deleting…' : 'Force Delete'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {search ? 'No users match your search' : 'No auth users found'}
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

export default AdminAuthenticatedUsers;
