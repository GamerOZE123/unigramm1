
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import StudentProfileSetup from './StudentProfileSetup';
import JobSwipeCard from './JobSwipeCard';

interface Job {
  job_id: string;
  title: string;
  description: string;
  company_name: string;
  location: string;
  salary_range: string;
  job_type: string;
  skills_required: string[];
  company_logo: string;
}

export default function StudentJobsView() {
  const { user } = useAuth();
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);

  useEffect(() => {
    checkStudentProfile();
  }, [user]);

  useEffect(() => {
    if (hasProfile) {
      fetchJobs();
    }
  }, [hasProfile]);

  const checkStudentProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setHasProfile(!!data);
    } catch (error) {
      console.error('Error checking student profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_unswiped_jobs_for_student', {
        student_user_id: user.id
      });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!user || currentJobIndex >= jobs.length) return;

    const currentJob = jobs[currentJobIndex];

    try {
      const { error } = await supabase
        .from('job_swipes')
        .insert({
          job_id: currentJob.job_id,
          student_id: user.id,
          swipe_direction: direction
        });

      if (error) throw error;

      // If swiped right, create job application
      if (direction === 'right') {
        const { error: applicationError } = await supabase
          .from('job_applications')
          .insert({
            job_id: currentJob.job_id,
            student_id: user.id
          });

        if (applicationError) {
          console.error('Error creating job application:', applicationError);
        }
      }

      setCurrentJobIndex(prev => prev + 1);
    } catch (error) {
      console.error('Error recording swipe:', error);
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
    return <StudentProfileSetup onComplete={() => setHasProfile(true)} />;
  }

  if (jobs.length === 0 || currentJobIndex >= jobs.length) {
    return (
      <div className="post-card text-center py-12">
        <h3 className="text-xl font-semibold text-foreground mb-2">No More Jobs</h3>
        <p className="text-muted-foreground">
          You've seen all available jobs! Check back later for new opportunities.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <JobSwipeCard 
        job={jobs[currentJobIndex]} 
        onSwipe={handleSwipe}
        remaining={jobs.length - currentJobIndex}
      />
    </div>
  );
}
