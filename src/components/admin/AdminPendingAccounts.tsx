import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Trash2, RefreshCw, Building2, Users } from 'lucide-react';

interface PendingAccount {
  user_id: string;
  username: string | null;
  full_name: string | null;
  email: string | null;
  university: string | null;
  user_type: string | null;
  approved: boolean | null;
  created_at: string | null;
}

interface Props {
  password: string;
}

const AdminPendingAccounts: React.FC<Props> = ({ password }) => {
  const [accounts, setAccounts] = useState<PendingAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'fetch_pending_accounts' },
    });
    if (error || !data?.valid) {
      toast.error('Failed to fetch pending accounts');
    } else {
      setAccounts(data.accounts || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (password) fetchPending();
  }, [password]);

  const handleApprove = async (user_id: string) => {
    setActioning(user_id);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'set_approved', user_id, approved: true },
    });
    if (error || !data?.success) {
      toast.error('Failed to approve account');
    } else {
      setAccounts(prev => prev.filter(a => a.user_id !== user_id));
      toast.success('Account approved — user will be redirected automatically');
    }
    setActioning(null);
  };

  const handleDelete = async (user_id: string, name: string | null) => {
    if (!confirm(`Permanently delete ${name || 'this user'}? This cannot be undone.`)) return;
    setActioning(user_id);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'delete_user', user_id },
    });
    if (error || !data?.success) {
      toast.error(data?.error || 'Failed to delete user');
    } else {
      setAccounts(prev => prev.filter(a => a.user_id !== user_id));
      toast.success('User permanently deleted');
    }
    setActioning(null);
  };

  const typeIcon = (type: string | null) => {
    if (type === 'business') return <Building2 className="w-3.5 h-3.5" />;
    if (type === 'clubs') return <Users className="w-3.5 h-3.5" />;
    return null;
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">Pending Accounts</h3>
            <Badge variant="secondary">{accounts.length}</Badge>
          </div>
          <Button variant="outline" size="sm" onClick={fetchPending} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-1" /> {loading ? 'Loading…' : 'Refresh'}
          </Button>
        </div>

        {accounts.length === 0 && !loading ? (
          <p className="text-sm text-muted-foreground text-center py-6">No pending business or club accounts</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>University</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map(a => (
                <TableRow key={a.user_id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{a.full_name || '—'}</p>
                      <p className="text-xs text-muted-foreground">@{a.username || '—'}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{a.email || '—'}</TableCell>
                  <TableCell className="text-sm">{a.university || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs gap-1">
                      {typeIcon(a.user_type)} {a.user_type || '—'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {a.created_at
                      ? new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(a.user_id)}
                        disabled={actioning === a.user_id}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {actioning === a.user_id ? '…' : <><CheckCircle className="w-3 h-3 mr-1" /> Approve</>}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(a.user_id, a.full_name)}
                        disabled={actioning === a.user_id}
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminPendingAccounts;
