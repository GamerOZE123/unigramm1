import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  PlusCircle,
  Target,
  UserCircle,
  Rocket
} from 'lucide-react';
import MobileHeader from '@/components/layout/MobileHeader';
// Re-importing to force refresh
import { useIsMobile } from '@/hooks/use-mobile';

const universityOptions = [
  {
    id: 'advertising',
    title: 'Advertising',
    description: 'Promote your business or services to students',
    icon: Target,
    path: '/advertising',
    color: 'bg-orange-500',
    allowedFor: ['business']
  },
  {
    id: 'clubs',
    title: 'Clubs & Organizations',
    description: 'Discover and join university clubs',
    icon: UserCircle,
    path: '/clubs',
    color: 'bg-indigo-500',
    allowedFor: ['student', 'clubs']
  },
  {
    id: 'startups',
    title: 'Startups & Ideas',
    description: 'Share your startup, find co-founders, and discover student innovations',
    icon: Rocket,
    path: '/startups',
    color: 'bg-cyan-500',
    allowedFor: ['student']
  }
];

export default function University() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userType, setUserType] = useState<'student' | 'business' | 'clubs'>('student');
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchUserType = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        if (data) {
          const uType = data.user_type === 'company' ? 'business' : (data.user_type || 'student');
          setUserType(uType as 'student' | 'business' | 'clubs');
        }
      } catch (error) {
        console.error('Error fetching user type:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserType();
  }, [user]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  // Filter options based on user type
  const filteredOptions = universityOptions.filter(option => 
    option.allowedFor.includes(userType)
  );

  return (
    <Layout>
      {/* Mobile Header */}
      {isMobile && <MobileHeader />}
      
      <div className="space-y-6 pt-6 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">University Hub</h1>
          <p className="text-muted-foreground">
            {userType === 'business' 
              ? 'Connect with students and promote your opportunities'
              : userType === 'clubs'
              ? 'Connect with your university community'
              : 'Everything you need for your university experience'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <div
                key={option.id}
                onClick={() => navigate(option.path)}
                className="post-card cursor-pointer hover:shadow-lg transition-all duration-200 group"
              >
                <div className="flex items-start space-x-4">
                  <div className={`${option.color} p-3 rounded-lg group-hover:scale-110 transition-transform duration-200`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {option.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {option.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {userType === 'student' && (
          <div className="post-card text-center py-8">
            <PlusCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Need something else?</h3>
            <p className="text-muted-foreground">
              Can't find what you're looking for? Let us know what other features would help your university experience.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
