import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ToggleLeft, RefreshCw } from 'lucide-react';

interface Flag {
  key: string;
  is_enabled: boolean;
  start_date: string | null;
  end_date: string | null;
  university: string | null;
}

interface Props {
  password: string;
}

const AdminFeatureFlags: React.FC<Props> = ({ password }) => {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const fetchFlags = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'fetch_flags' },
    });
    if (error || !data?.valid) {
      toast.error('Failed to fetch flags');
    } else {
      setFlags(data.flags || []);
      setFetched(true);
    }
    setLoading(false);
  };

  const toggleFlag = async (key: string, currentVal: boolean) => {
    setToggling(key);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'toggle_flag', key, is_enabled: !currentVal },
    });
    if (error || !data?.success) {
      toast.error('Failed to toggle flag');
    } else {
      setFlags(prev => prev.map(f => f.key === key ? { ...f, is_enabled: !currentVal } : f));
      toast.success(`${key} → ${!currentVal ? 'enabled' : 'disabled'}`);
    }
    setToggling(null);
  };

  if (!fetched) {
    return (
      <Card>
        <CardContent className="pt-6 flex flex-col items-center gap-3">
          <ToggleLeft className="w-8 h-8 text-muted-foreground" />
          <p className="text-muted-foreground">Load feature flags from database</p>
          <Button onClick={fetchFlags} disabled={loading}>
            {loading ? 'Loading…' : 'Load Feature Flags'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={fetchFlags} disabled={loading}>
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>University</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead className="text-right">Enabled</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flags.map(f => (
                <TableRow key={f.key}>
                  <TableCell className="font-mono text-sm">{f.key}</TableCell>
                  <TableCell>{f.university || '—'}</TableCell>
                  <TableCell>{f.start_date ? new Date(f.start_date).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>{f.end_date ? new Date(f.end_date).toLocaleDateString() : '—'}</TableCell>
                  <TableCell className="text-right">
                    <Switch
                      checked={f.is_enabled}
                      disabled={toggling === f.key}
                      onCheckedChange={() => toggleFlag(f.key, f.is_enabled)}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {flags.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No feature flags found
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

export default AdminFeatureFlags;
