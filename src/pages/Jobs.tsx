
import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import StudentJobsView from '@/components/jobs/StudentJobsView';
import CompanyJobsView from '@/components/jobs/CompanyJobsView';

export default function Jobs() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userType, setUserType] = useState<'student' | 'company'>('student');
  const [loading, setLoading] = useState(true);

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
          setUserType(data.user_type || 'student');
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

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/university')}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">
            {userType === 'student' ? 'Jobs & Internships' : 'Manage Jobs'}
          </h1>
        </div>

        {userType === 'student' ? <StudentJobsView /> : <CompanyJobsView />}
      </div>
    </Layout>
  );
}
