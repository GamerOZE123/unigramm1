
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import CompanyProfileSetup from './CompanyProfileSetup';
import CreateJobModal from './CreateJobModal';
import JobsListView from './JobsListView';

export default function CompanyJobsView() {
  const { user } = useAuth();
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateJob, setShowCreateJob] = useState(false);

  useEffect(() => {
    checkCompanyProfile();
  }, [user]);

  const checkCompanyProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('company_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setHasProfile(!!data);
    } catch (error) {
      console.error('Error checking company profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!hasProfile) {
    return <CompanyProfileSetup onComplete={() => setHasProfile(true)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">Your Job Postings</h2>
        <Button onClick={() => setShowCreateJob(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Post New Job
        </Button>
      </div>

      <JobsListView />

      <CreateJobModal 
        open={showCreateJob} 
        onOpenChange={setShowCreateJob}
      />
    </div>
  );
}
