import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Settings, RefreshCw, Save, Upload, Image } from 'lucide-react';
import browserImageCompression from 'browser-image-compression';

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

const isBooleanValue = (val: string | null) => {
  return val === 'true' || val === 'false';
};

const isImageKey = (key: string) => {
  return key.toLowerCase().includes('image') || key.toLowerCase().includes('logo') || key.toLowerCase().includes('banner');
};

const AdminAppConfig: React.FC<Props> = ({ password }) => {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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

  const handleImageUpload = async (key: string, file: File) => {
    setUploading(key);
    try {
      const compressed = await browserImageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });

      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `config/${key}_${Date.now()}.${ext}`;
      
      // Convert blob to File object explicitly
      const uploadFile = new File([compressed], `${key}.${ext}`, { 
        type: compressed.type || 'image/jpeg' 
      });

      const formData = new FormData();
      formData.append('password', password);
      formData.append('path', path);
      formData.append('file', uploadFile);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sdqmiwsvplykgsxrthfp.supabase.co';
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkcW1pd3N2cGx5a2dzeHJ0aGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NjEwMzcsImV4cCI6MjA3MDEzNzAzN30.LbDPf7wuvAoqFHPmUnGz9kgA4dGFCO8OoowMi6szm90';

      console.log('Uploading to edge function:', path);

      const response = await fetch(`${supabaseUrl}/functions/v1/verify-admin`, {
        method: 'POST',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
        },
        body: formData,
      });

      const responseText = await response.text();
      console.log('Upload response:', response.status, responseText);
      
      let uploadData;
      try {
        uploadData = JSON.parse(responseText);
      } catch {
        toast.error('Upload failed: Invalid response');
        setUploading(null);
        return;
      }

      if (!response.ok || !uploadData?.url) {
        toast.error('Upload failed: ' + (uploadData?.error || 'Unknown error'));
        setUploading(null);
        return;
      }

      const url = uploadData.url;
      setEditValues(prev => ({ ...prev, [key]: url }));

      // Auto-save after upload
      const { data, error } = await supabase.functions.invoke('verify-admin', {
        body: { password, action: 'update_config', key, value: url },
      });
      if (error || !data?.success) {
        toast.error('Uploaded but failed to save config');
      } else {
        setConfigs(prev => prev.map(c => c.key === key ? { ...c, value: url } : c));
        toast.success(`${key} image updated`);
      }
    } catch (err) {
      toast.error('Upload failed');
    }
    setUploading(null);
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
              {configs.map(c => {
                const currentVal = editValues[c.key] || '';
                const isBool = isBooleanValue(c.value);
                const isImg = isImageKey(c.key);

                return (
                  <TableRow key={c.key}>
                    <TableCell className="font-mono text-sm">{c.key}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                      {c.description || '—'}
                    </TableCell>
                    <TableCell>
                      {isBool ? (
                        <Select
                          value={currentVal}
                          onValueChange={(val) => setEditValues(prev => ({ ...prev, [c.key]: val }))}
                        >
                          <SelectTrigger className="max-w-[140px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">true</SelectItem>
                            <SelectItem value="false">false</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : isImg ? (
                        <div className="flex flex-col gap-2 max-w-[320px]">
                          {currentVal && (
                            <img
                              src={currentVal}
                              alt={c.key}
                              className="w-full h-20 object-cover rounded border border-border"
                            />
                          )}
                          <div className="flex gap-2">
                            <Input
                              value={currentVal}
                              onChange={e => setEditValues(prev => ({ ...prev, [c.key]: e.target.value }))}
                              className="h-8 text-xs"
                              placeholder="Image URL…"
                            />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              ref={el => { fileInputRefs.current[c.key] = el; }}
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(c.key, file);
                              }}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 shrink-0"
                              disabled={uploading === c.key}
                              onClick={() => fileInputRefs.current[c.key]?.click()}
                            >
                              {uploading === c.key ? '…' : <Upload className="w-3 h-3" />}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Input
                          value={currentVal}
                          onChange={e => setEditValues(prev => ({ ...prev, [c.key]: e.target.value }))}
                          className="max-w-[300px] h-8"
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={saving === c.key || currentVal === (c.value || '')}
                        onClick={() => saveConfig(c.key)}
                      >
                        {saving === c.key ? 'Saving…' : <><Save className="w-3 h-3 mr-1" /> Save</>}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
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
