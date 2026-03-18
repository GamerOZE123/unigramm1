import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Settings, RefreshCw, Save } from 'lucide-react';

interface Config {
  id: number;
  key: string;
  value: string | null;
  description: string | null;
  updated_at: string | null;
}

interface Props {
  password: string;
}

const AdminAppConfig: React.FC<Props> = ({ password }) => {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const fetchConfigs = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'fetch_configs' },
    });
    if (error || !data?.valid) {
      toast.error('Failed to fetch configs');
    } else {
      setConfigs(data.configs || []);
      const vals: Record<string, string> = {};
      (data.configs || []).forEach((c: Config) => { vals[c.key] = c.value || ''; });
      setEditValues(vals);
      setFetched(true);
    }
    setLoading(false);
  };

  const saveConfig = async (key: string) => {
    setSaving(key);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'update_config', key, value: editValues[key] },
    });
    if (error || !data?.success) {
      toast.error('Failed to update config');
    } else {
      setConfigs(prev => prev.map(c => c.key === key ? { ...c, value: editValues[key] } : c));
      toast.success(`${key} updated`);
    }
    setSaving(null);
  };

  if (!fetched) {
    return (
      <Card>
        <CardContent className="pt-6 flex flex-col items-center gap-3">
          <Settings className="w-8 h-8 text-muted-foreground" />
          <p className="text-muted-foreground">Load app configuration from database</p>
          <Button onClick={fetchConfigs} disabled={loading}>
            {loading ? 'Loading…' : 'Load App Config'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={fetchConfigs} disabled={loading}>
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configs.map(c => (
                <TableRow key={c.key}>
                  <TableCell className="font-mono text-sm">{c.key}</TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                    {c.description || '—'}
                  </TableCell>
                  <TableCell>
                    <Input
                      value={editValues[c.key] || ''}
                      onChange={e => setEditValues(prev => ({ ...prev, [c.key]: e.target.value }))}
                      className="max-w-[300px] h-8"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={saving === c.key || editValues[c.key] === (c.value || '')}
                      onClick={() => saveConfig(c.key)}
                    >
                      {saving === c.key ? 'Saving…' : <><Save className="w-3 h-3 mr-1" /> Save</>}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {configs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No config entries found
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

export default AdminAppConfig;
