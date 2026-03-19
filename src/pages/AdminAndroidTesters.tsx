import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Send, RefreshCw } from 'lucide-react';

interface Tester {
  id: string;
  email: string;
  created_at: string;
  status: string;
}

const STATUS_OPTIONS = ['pending', 'added', 'link_sent'] as const;

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  added: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  link_sent: 'bg-green-500/20 text-green-400 border-green-500/30',
};

export default function AdminAndroidTesters() {
  const [testers, setTesters] = useState<Tester[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);

  const fetchTesters = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('android_testers' as any)
      .select('*')
      .order('created_at', { ascending: false }) as any;
    setTesters(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTesters(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase
      .from('android_testers' as any)
      .update({ status } as any)
      .eq('id', id);
    setTesters((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const cycleStatus = (tester: Tester) => {
    const idx = STATUS_OPTIONS.indexOf(tester.status as any);
    const next = STATUS_OPTIONS[(idx + 1) % STATUS_OPTIONS.length];
    updateStatus(tester.id, next);
  };

  const sendInvite = async (tester: Tester) => {
    setSending(tester.id);
    try {
      const { data, error } = await supabase.functions.invoke('send-android-invite', {
        body: { email: tester.email },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await updateStatus(tester.id, 'link_sent');
      toast.success(`Invite sent to ${tester.email}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send invite');
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ background: '#080c17', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#fff' }}>Android Beta Testers</h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {testers.length} submission{testers.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchTesters} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(79,142,255,0.15)', background: 'rgba(255,255,255,0.03)' }}>
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: 'rgba(79,142,255,0.1)' }}>
                <TableHead style={{ color: 'rgba(255,255,255,0.5)' }}>Email</TableHead>
                <TableHead style={{ color: 'rgba(255,255,255,0.5)' }}>Submitted At</TableHead>
                <TableHead style={{ color: 'rgba(255,255,255,0.5)' }}>Status</TableHead>
                <TableHead style={{ color: 'rgba(255,255,255,0.5)' }}>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {testers.map((t) => (
                <TableRow key={t.id} style={{ borderColor: 'rgba(79,142,255,0.08)' }}>
                  <TableCell style={{ color: '#fff' }}>{t.email}</TableCell>
                  <TableCell style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {new Date(t.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <button onClick={() => cycleStatus(t)}>
                      <Badge className={`cursor-pointer border ${statusColors[t.status] || statusColors.pending}`}>
                        {t.status}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      disabled={sending === t.id}
                      onClick={() => sendInvite(t)}
                      style={{ background: '#4f8eff', color: '#080c17' }}
                    >
                      <Send className="w-3 h-3 mr-1" />
                      {sending === t.id ? 'Sending...' : 'Send Link'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {testers.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    No submissions yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
