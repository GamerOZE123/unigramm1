import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Eye, RefreshCw, Database, Info } from 'lucide-react';

interface UserPref {
  id: string;
  user_id: string;
  places: any[];
  music: any[];
  interests: any[];
  travel: any[];
  raw_signals: any[];
  updated_at: string;
  // joined
  username?: string;
  full_name?: string;
  university?: string;
}

interface Props {
  password: string;
}

const AdminDatingPreferences: React.FC<Props> = ({ password }) => {
  const [prefs, setPrefs] = useState<UserPref[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewItem, setViewItem] = useState<UserPref | null>(null);

  const fetchPrefs = async () => {
    setLoading(true);
    // We need to join with profiles — use the edge function for service-role access
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'fetch_dating_preferences' },
    });
    if (error || !data?.valid) {
      toast.error('Failed to load preferences');
    } else {
      setPrefs(data.preferences || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPrefs(); }, []);

  const jsonCount = (val: any): number => {
    if (Array.isArray(val)) return val.length;
    if (typeof val === 'object' && val !== null) return Object.keys(val).length;
    return 0;
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" /> User Preference Data
              <Badge variant="secondary" className="ml-2">{prefs.length}</Badge>
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={fetchPrefs}><RefreshCw className="w-4 h-4" /></Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-300/80">
              This data is collected passively from likes, post engagement, and dating profile answers across the app.
            </p>
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground py-6">Loading…</p>
          ) : (
            <div className="rounded-lg border border-border/40 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>University</TableHead>
                    <TableHead className="w-20 text-center">Places</TableHead>
                    <TableHead className="w-20 text-center">Music</TableHead>
                    <TableHead className="w-24 text-center">Interests</TableHead>
                    <TableHead className="w-20 text-center">Travel</TableHead>
                    <TableHead className="w-32">Last Updated</TableHead>
                    <TableHead className="w-16">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prefs.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-sm">{p.username || p.full_name || p.user_id.slice(0, 8)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.university || '—'}</TableCell>
                      <TableCell className="text-center"><Badge variant="secondary">{jsonCount(p.places)}</Badge></TableCell>
                      <TableCell className="text-center"><Badge variant="secondary">{jsonCount(p.music)}</Badge></TableCell>
                      <TableCell className="text-center"><Badge variant="secondary">{jsonCount(p.interests)}</Badge></TableCell>
                      <TableCell className="text-center"><Badge variant="secondary">{jsonCount(p.travel)}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewItem(p)}>
                          <Eye className="w-3 h-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {prefs.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">No preference data collected yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Modal */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {viewItem?.username || viewItem?.full_name || 'User'} — Preferences
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {viewItem && (
              <div className="space-y-4 p-1">
                {(['places', 'music', 'interests', 'travel', 'raw_signals'] as const).map(key => (
                  <div key={key}>
                    <h4 className="text-sm font-semibold capitalize text-foreground mb-1">{key.replace('_', ' ')}</h4>
                    <pre className="text-xs bg-muted/50 rounded-lg p-3 overflow-auto max-h-40 text-muted-foreground">
                      {JSON.stringify((viewItem as any)[key], null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDatingPreferences;
