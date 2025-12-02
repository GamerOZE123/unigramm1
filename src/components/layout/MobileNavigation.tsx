
import React, { useState, useEffect } from 'react';
import { Home, MessageCircle, User, Search, GraduationCap } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const baseNavigation = [
  { name: 'Home', href: '/home', icon: Home },
  { name: 'Explore', href: '/explore', icon: Search },
  { name: 'University', href: '/university', icon: GraduationCap },
  { name: 'Chat', href: '/chat', icon: MessageCircle },
];

export default function MobileNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsername = async () => {
      if (!user) return;
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', user.id)
        .single();
      
      if (profileData?.username) {
        setUsername(profileData.username);
      }
    };

    fetchUsername();
  }, [user]);

  const profileHref = username ? `/${username}` : '/home';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
      <div className="grid grid-cols-5 h-16">
        {baseNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={(e) => {
                if (isActive) {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-colors',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn('w-5 h-5', isActive && 'text-primary')} />
              <span className="text-xs font-medium">{item.name}</span>
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
              )}
            </NavLink>
          );
        })}
        {/* Profile link with dynamic username */}
        <NavLink
          to={profileHref}
          onClick={(e) => {
            if (location.pathname === profileHref) {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className={cn(
            'flex flex-col items-center justify-center gap-1 transition-colors',
            location.pathname === profileHref
              ? 'text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <User className={cn('w-5 h-5', location.pathname === profileHref && 'text-primary')} />
          <span className="text-xs font-medium">Profile</span>
          {location.pathname === profileHref && (
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
          )}
        </NavLink>
      </div>
    </nav>
  );
}
