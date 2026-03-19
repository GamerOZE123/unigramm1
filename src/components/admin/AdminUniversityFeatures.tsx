import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface UniversityFeature {
  id: string;
  key: string;
  display_name: string;
  icon: string;
  is_visible: boolean;
  is_locked: boolean;
  sort_order: number;
}

const AdminUniversityFeatures: React.FC = () => {
  const [features, setFeatures] = useState<UniversityFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    const { data, error } = await supabase
      .from('university_features')
      .select('*')
      .order('sort_order');
    if (error) {
      toast.error('Failed to load university features');
    } else {
      setFeatures((data as unknown as UniversityFeature[]) || []);
    }
    setLoading(false);
  };

  const toggleField = async (id: string, field: 'is_visible' | 'is_locked', currentValue: boolean) => {
    setUpdating(`${id}-${field}`);
    const { error } = await supabase
      .from('university_features')
      .update({ [field]: !currentValue } as any)
      .eq('id', id);
    if (error) {
      toast.error('Failed to update feature');
    } else {
      setFeatures(prev =>
        prev.map(f => (f.id === id ? { ...f, [field]: !currentValue } : f))
      );
      toast.success('Feature updated');
    }
    setUpdating(null);
  };

  const getStatusInfo = (f: UniversityFeature) => {
    if (!f.is_visible) return { color: 'bg-gray-500', label: 'Hidden' };
    if (f.is_locked) return { color: 'bg-amber-500', label: 'Coming Soon' };
    return { color: 'bg-green-500', label: 'Active' };
  };

  if (loading) {
    return (
      <Card style={{ background: '#111827', border: '1px solid rgba(79,142,255,0.1)' }}>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-sm">Loading features…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card style={{ background: '#111827', border: '1px solid rgba(79,142,255,0.1)' }}>
      <CardContent className="pt-6 space-y-4">
        <p className="font-semibold text-foreground">University Features</p>
        <div className="space-y-3">
          {features.map(f => {
            const status = getStatusInfo(f);
            return (
              <div key={f.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-foreground">
                    {f.icon} {f.display_name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-block w-2 h-2 rounded-full ${status.color}`} />
                    <span className="text-xs text-muted-foreground">{status.label}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">Visible</span>
                    <Switch
                      checked={f.is_visible}
                      onCheckedChange={() => toggleField(f.id, 'is_visible', f.is_visible)}
                      disabled={updating === `${f.id}-is_visible`}
                    />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">Locked</span>
                    <Switch
                      checked={f.is_locked}
                      onCheckedChange={() => toggleField(f.id, 'is_locked', f.is_locked)}
                      disabled={updating === `${f.id}-is_locked`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminUniversityFeatures;
