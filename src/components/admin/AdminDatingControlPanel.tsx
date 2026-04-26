import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Heart, Play, Pause, Users, Timer, Eye, Clock, RefreshCw, Save, X, RotateCw } from 'lucide-react';

interface DatingConfig {
  id: string;
  is_enabled: boolean;
  is_paused: boolean;
  launch_at: string | null;
  waitlist_threshold: number;
  enrolled_count: number;
  show_timer_on_home: boolean;
  swipe_visibility: string;
}

interface Props {
  password: string;
}

const AdminDatingControlPanel: React.FC<Props> = ({ password }) => {
  const [config, setConfig] = useState<DatingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [threshold, setThreshold] = useState('50');
  const [launchAt, setLaunchAt] = useState('');
  const [syncing, setSyncing] = useState(false);

  const fetchConfig = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('dating_config')
      .select('*')
      .limit(1)
      .maybeSingle();
    if (error) {
      toast.error('Failed to load dating config');
    } else if (data) {
      const cfg = data as unknown as DatingConfig;
      setConfig(cfg);
      setThreshold(String(cfg.waitlist_threshold));
      setLaunchAt(cfg.launch_at ? cfg.launch_at.slice(0, 16) : '');
    }
    // Get enrolled count
    const { count } = await supabase
      .from('dating_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    setEnrolledCount(count || 0);
    setLoading(false);
  };

  const syncEnrolled = async () => {
    setSyncing(true);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'sync_dating_enrolled_count' },
    });
    setSyncing(false);
    if (error || !data?.valid) { toast.error('Sync failed'); return; }
    setEnrolledCount(data.enrolled_count || 0);
    toast.success(`Enrolled count synced: ${data.enrolled_count || 0}`);
    fetchConfig();
  };

  useEffect(() => { fetchConfig(); }, []);

  const updateConfig = async (updates: Partial<DatingConfig>) => {
    if (!config) return;
    setSaving(true);
    const { error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'update_dating_config', config_id: config.id, updates },
    });
    if (error) {
      toast.error('Failed to update config');
    } else {
      setConfig(prev => prev ? { ...prev, ...updates } : prev);
      toast.success('Dating config updated');
    }
    setSaving(false);
  };

  const getStatus = (): { label: string; color: string } => {
    if (!config) return { label: 'Loading', color: 'bg-muted text-muted-foreground' };
    if (config.launch_at && new Date(config.launch_at) > new Date()) return { label: 'Scheduled', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
    if (config.is_enabled && !config.is_paused) return { label: 'Live', color: 'bg-green-500/20 text-green-400 border-green-500/30' };
    if (config.is_enabled && config.is_paused) return { label: 'Paused', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    return { label: 'Waitlist Mode', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
  };

  const status = getStatus();

  if (loading) {
    return (
      <Card className="border-border/40">
        <CardContent className="py-12 text-center text-muted-foreground">Loading dating config…</CardContent>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card className="border-border/40">
        <CardContent className="py-12 text-center text-muted-foreground">No dating config found. Run the migration first.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <Card className="border-border/40">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center">
                <Heart className="w-6 h-6 text-pink-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Dating Module</h2>
                <Badge variant="outline" className={`mt-1 ${status.color}`}>{status.label}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-4 px-4 py-2 rounded-lg bg-muted/50">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{enrolledCount}</p>
                  <p className="text-xs text-muted-foreground">Enrolled</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={syncEnrolled} disabled={syncing} className="gap-1.5">
                <RotateCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} /> Sync
              </Button>
              <Button variant="ghost" size="icon" onClick={fetchConfig}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Launch / Pause Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Play className="w-4 h-4" /> Enable Dating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {config.is_enabled ? 'Dating module is enabled' : 'Dating module is disabled'}
              </p>
              <Switch
                checked={config.is_enabled}
                onCheckedChange={(v) => updateConfig({ is_enabled: v })}
                disabled={saving}
                className="data-[state=checked]:bg-green-500"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Pause className="w-4 h-4" /> Pause Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {config.is_paused ? 'Currently paused — users see a pause screen' : 'Not paused'}
              </p>
              <Switch
                checked={config.is_paused}
                onCheckedChange={(v) => updateConfig({ is_paused: v })}
                disabled={saving || !config.is_enabled}
                className="data-[state=checked]:bg-yellow-500"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Waitlist Threshold */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" /> Waitlist Threshold
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">Show counter until this many sign up</p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="w-24"
                min={0}
              />
              <Button
                size="sm"
                onClick={() => updateConfig({ waitlist_threshold: parseInt(threshold) || 50 })}
                disabled={saving}
              >
                <Save className="w-3 h-3 mr-1" /> Save
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Swipe Visibility */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="w-4 h-4" /> Swipe Visibility
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">How users see "people who liked you" count</p>
            <Select
              value={config.swipe_visibility}
              onValueChange={(v) => updateConfig({ swipe_visibility: v })}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exact">Exact number</SelectItem>
                <SelectItem value="bucketed">Bucketed (5+, 10+, 25+)</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Countdown Timer */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Timer className="w-4 h-4" /> Launch Countdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">Set a date/time for auto-launch. Users see a countdown.</p>
            <div className="flex items-center gap-2">
              <Input
                type="datetime-local"
                value={launchAt}
                onChange={(e) => setLaunchAt(e.target.value)}
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={() => updateConfig({ launch_at: launchAt ? new Date(launchAt).toISOString() : null })}
                disabled={saving}
              >
                <Save className="w-3 h-3 mr-1" /> Set
              </Button>
              {config.launch_at && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setLaunchAt(''); updateConfig({ launch_at: null }); }}
                  disabled={saving}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            {config.launch_at && new Date(config.launch_at) > new Date() && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm">
                <p className="text-blue-400 font-medium">⏰ Countdown active</p>
                <p className="text-blue-300/80 text-xs mt-1">
                  Launches on {new Date(config.launch_at).toLocaleString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Show Timer on Home */}
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" /> Home Screen Timer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Show countdown timer on the home screen</p>
              <Switch
                checked={config.show_timer_on_home}
                onCheckedChange={(v) => updateConfig({ show_timer_on_home: v })}
                disabled={saving}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDatingControlPanel;
