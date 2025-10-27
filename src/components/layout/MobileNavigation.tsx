
import React, { useState, useEffect } from 'react';
import { Home, MessageCircle, User, Search, GraduationCap } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const navigation = [
  { name: 'Home', href: '/home', icon: Home },
  { name: 'Explore', href: '/explore', icon: Search },
  { name: 'University', href: '/university', icon: GraduationCap },
  { name: 'Chat', href: '/chat', icon: MessageCircle },
  { name: 'Profile', href: '/profile', icon: User },
];

export default function MobileNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userType, setUserType] = useState<string>('student');

  useEffect(() => {
    const fetchUserType = async () => {
      if (!user) return;
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('user_id', user.id)
        .single();
      
      if (profileData?.user_type) {
        setUserType(profileData.user_type);
      }
    };

    fetchUserType();
  }, [user]);

  const getProfileLink = () => {
    if (userType === 'company') return '/jobs';
    if (userType === 'clubs') return '/university';
    return '/profile';
  };

  const updatedNavigation = navigation.map(item => {
    if (item.name === 'Profile') {
      return { ...item, href: getProfileLink() };
    }
    return item;
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
      <div className="grid grid-cols-5 h-16">
        {updatedNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
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
      </div>
    </nav>
  );
}
