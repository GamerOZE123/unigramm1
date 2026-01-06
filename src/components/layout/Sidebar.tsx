
import React, { useState, useEffect } from 'react';
import { Home, MessageCircle, User, GraduationCap, LogOut, Search, Bell, Settings } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

const baseNavigation = [
  { name: 'Home', href: '/home', icon: Home },
  { name: 'Explore', href: '/explore', icon: Search },
  { name: 'University', href: '/university', icon: GraduationCap },
  { name: 'Chat', href: '/chat', icon: MessageCircle },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [userType, setUserType] = useState<string>('Student');
  const [profile, setProfile] = useState<any>(null);
  const { unreadCount } = useUnreadMessages();

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_type, username, avatar_url')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      
      setProfile(data);
      
      if (data?.user_type === 'clubs') {
        setUserType('Club');
      } else if (data?.user_type === 'company') {
        setUserType('Company');
      } else {
        setUserType('Student');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border hidden md:block">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 university-gradient rounded-2xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Unigramm
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4">
          <ul className="space-y-2">
            {baseNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              const showBadge = item.name === 'Chat' && unreadCount > 0;
              return (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    onClick={(e) => {
                      if (isActive) {
                        e.preventDefault();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className={cn(
                      'nav-item relative',
                      isActive && 'active'
                    )}
                  >
                    <div className="relative">
                      <item.icon className="w-5 h-5" />
                      {showBadge && (
                        <div className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center px-1">
                          <span className="text-[10px] text-white font-bold">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="font-medium">{item.name}</span>
                  </NavLink>
                </li>
              );
            })}
            {/* Profile link with dynamic username */}
            <li>
              <NavLink
                to={profile?.username ? `/${profile.username}` : '/home'}
                onClick={(e) => {
                  const profilePath = profile?.username ? `/${profile.username}` : '/home';
                  if (location.pathname === profilePath) {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className={cn(
                  'nav-item relative',
                  (profile?.username && location.pathname === `/${profile.username}`) && 'active'
                )}
              >
                <User className="w-5 h-5" />
                <span className="font-medium">Profile</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* User Profile at Bottom */}
        <div className="p-4 border-t border-border space-y-2">
          <Button
            variant="ghost" 
            onClick={() => {
              if (location.pathname === '/notifications') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                navigate('/notifications');
              }
            }}
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <Bell className="w-4 h-4 mr-2" />
            <span className="text-sm">Notifications</span>
          </Button>
          <Button 
            variant="ghost"
            onClick={() => navigate('/settings')}
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <Settings className="w-4 h-4 mr-2" />
            <span className="text-sm">Settings</span>
          </Button>
          
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface transition-colors cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username || 'User'} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-white">
                  {profile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {profile?.username || user?.email || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">{userType}</p>
            </div>
          </div>
          <Button 
            onClick={handleSignOut}
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span className="text-sm">Sign Out</span>
          </Button>
        </div>
      </div>
    </aside>
  );
}
