import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Settings, MessageCircle, Sparkles, Database } from 'lucide-react';
import AdminDatingControlPanel from './AdminDatingControlPanel';
import AdminDatingIcebreakers from './AdminDatingIcebreakers';
import AdminDatingPrompts from './AdminDatingPrompts';
import AdminDatingPreferences from './AdminDatingPreferences';

type DatingTab = 'control' | 'icebreakers' | 'prompts' | 'preferences';

interface Props {
  password: string;
}

const tabs: { key: DatingTab; label: string; icon: React.ElementType }[] = [
  { key: 'control', label: 'Control Panel', icon: Settings },
  { key: 'icebreakers', label: 'Ice-breakers', icon: MessageCircle },
  { key: 'prompts', label: 'Profile Prompts', icon: Sparkles },
  { key: 'preferences', label: 'User Preferences', icon: Database },
];

const AdminDatingModule: React.FC<Props> = ({ password }) => {
  const [tab, setTab] = useState<DatingTab>('control');

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex gap-1 flex-wrap border-b border-border/40 pb-0">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              tab === t.key
                ? 'border-pink-500 text-pink-500'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'control' && <AdminDatingControlPanel password={password} />}
      {tab === 'icebreakers' && <AdminDatingIcebreakers password={password} />}
      {tab === 'prompts' && <AdminDatingPrompts password={password} />}
      {tab === 'preferences' && <AdminDatingPreferences password={password} />}
    </div>
  );
};

export default AdminDatingModule;
