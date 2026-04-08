import React from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, Clock, ShieldCheck, Flag, Settings,
  Bell, BarChart3, GraduationCap, UserCheck, X, Users2, BookOpen, Mail, Heart, Megaphone, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export type AdminSection =
  | 'overview'
  | 'pending'
  | 'waitlist'
  | 'users'
  | 'auth'
  | 'flags'
  | 'config'
  | 'university'
  | 'courses'
  | 'broadcast'
  | 'analytics'
  | 'emails'
  | 'dating'
  | 'announcements'
  | 'overflow'
  | 'team';

interface Props {
  current: AdminSection;
  onChange: (s: AdminSection) => void;
  open: boolean;
  onClose: () => void;
  allowedSections?: string[] | null; // null = admin (all access)
}

const nav: { key: AdminSection; label: string; icon: React.ElementType; group?: string; adminOnly?: boolean }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard, group: 'General' },
  { key: 'analytics', label: 'Analytics', icon: BarChart3, group: 'General' },
  { key: 'pending', label: 'Pending Accounts', icon: UserCheck, group: 'Users' },
  { key: 'waitlist', label: 'Waitlist', icon: Clock, group: 'Users' },
  { key: 'users', label: 'User Management', icon: Users, group: 'Users' },
  { key: 'auth', label: 'Authenticated', icon: ShieldCheck, group: 'Users' },
  { key: 'university', label: 'University Features', icon: GraduationCap, group: 'Config' },
  { key: 'courses', label: 'Course Listing', icon: BookOpen, group: 'Config' },
  { key: 'flags', label: 'Feature Flags', icon: Flag, group: 'Config' },
  { key: 'config', label: 'App Config', icon: Settings, group: 'Config' },
  { key: 'dating', label: 'Dating Module', icon: Heart, group: 'Features' },
  { key: 'announcements', label: 'Announcements', icon: Megaphone, group: 'Features' },
  { key: 'broadcast', label: 'Broadcast', icon: Bell, group: 'Notifications' },
  { key: 'emails', label: 'Email Templates', icon: Mail, group: 'Notifications' },
  { key: 'team', label: 'Team Members', icon: Users2, group: 'Admin', adminOnly: true },
];

const AdminSidebar: React.FC<Props> = ({ current, onChange, open, onClose, allowedSections }) => {
  let lastGroup = '';

  const filteredNav = nav.filter(item => {
    // Admin-only items (like team management) only show for main admin
    if (item.adminOnly && allowedSections !== null) return false;
    // If allowedSections is null, user is main admin — show everything
    if (allowedSections === null) return true;
    // Otherwise filter by allowed sections
    return allowedSections.includes(item.key);
  });

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 border-r border-border/40 bg-[hsl(var(--card))] flex flex-col transition-transform duration-200 lg:relative lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-primary" />
            </div>
            <div>
              <span className="font-bold text-foreground text-base tracking-tight">Admin Panel</span>
              {allowedSections !== null && (
                <p className="text-[10px] text-muted-foreground">Team Access</p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {filteredNav.map((item) => {
            const showGroup = item.group && item.group !== lastGroup;
            if (item.group) lastGroup = item.group;
            return (
              <React.Fragment key={item.key}>
                {showGroup && (
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold px-3 pt-4 pb-1">
                    {item.group}
                  </p>
                )}
                <button
                  onClick={() => { onChange(item.key); onClose(); }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    current === item.key
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </button>
              </React.Fragment>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default AdminSidebar;
