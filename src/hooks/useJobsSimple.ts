import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SimpleJob {
  id: string;
  job_title: string;
  description: string;
  location: string;
  salary_range: string;
  job_type: string;
  user_id: string;
  created_at: string;
}

export const useJobsSimple = () => {
  const [jobs, setJobs] = useState<SimpleJob[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const transformedData = (data || []).map((job: any) => ({
        id: job.id,
        job_title: job.job_title || 'Job Title',
        description: job.description || '',
        location: job.location || '',
        salary_range: job.salary_range || '',
        job_type: job.job_type || '',
        user_id: job.user_id,
        created_at: job.created_at
      }));
      
      setJobs(transformedData);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  return { jobs, loading, refetch: fetchJobs };
};