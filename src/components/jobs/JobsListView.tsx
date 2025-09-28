
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, DollarSign, Users, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  salary_range: string;
  job_type: string;
  experience_level: string;
  skills_required: string[];
  is_active: boolean;
  application_deadline: string;
  created_at: string;
  applications_count?: number;
}

export default function JobsListView() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, [user]);

  const fetchJobs = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch jobs posted by this company
      const { data: jobsData, error } = await supabase
        .from('jobs')
        .select(`
          *,
          job_applications!inner(count)
        `)
        .eq('company_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching jobs:', error);
        toast.error('Failed to load jobs');
        return;
      }

      // Process the data to include application counts
      const processedJobs = await Promise.all(
        (jobsData || []).map(async (job) => {
          const { count } = await supabase
            .from('job_applications')
            .select('*', { count: 'exact', head: true })
            .eq('job_id', job.id);

          return {
            ...job,
            applications_count: count || 0
          };
        })
      );

      setJobs(processedJobs);
      console.log('Fetched jobs:', processedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const toggleJobStatus = async (jobId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ is_active: !currentStatus })
        .eq('id', jobId)
        .eq('company_id', user?.id); // Ensure user can only update their own jobs

      if (error) {
        console.error('Error updating job status:', error);
        toast.error('Failed to update job status');
        return;
      }

      toast.success(currentStatus ? 'Job deactivated' : 'Job activated');
      fetchJobs(); // Refresh the list
    } catch (error) {
      console.error('Error updating job status:', error);
      toast.error('Failed to update job status');
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId)
        .eq('company_id', user?.id); // Ensure user can only delete their own jobs

      if (error) {
        console.error('Error deleting job:', error);
        toast.error('Failed to delete job');
        return;
      }

      toast.success('Job deleted successfully');
      fetchJobs(); // Refresh the list
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete job');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="post-card text-center py-12">
        <h3 className="text-xl font-semibold text-foreground mb-2">No Jobs Posted Yet</h3>
        <p className="text-muted-foreground">
          Start by posting your first job to attract talented candidates.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <Card key={job.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  {job.title}
                  <Badge variant={job.is_active ? "default" : "secondary"}>
                    {job.is_active ? "Active" : "Inactive"}
                  </Badge>
                </CardTitle>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                  {job.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {job.location}
                    </div>
                  )}
                  {job.salary_range && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {job.salary_range}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {job.applications_count || 0} applications
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Posted {new Date(job.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleJobStatus(job.id, job.is_active)}
                >
                  {job.is_active ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-1" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-1" />
                      Activate
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteJob(job.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <p className="text-foreground line-clamp-3">{job.description}</p>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{job.job_type}</Badge>
                {job.experience_level && (
                  <Badge variant="outline">{job.experience_level}</Badge>
                )}
              </div>

              {job.skills_required && job.skills_required.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {job.skills_required.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}

              {job.application_deadline && (
                <div className="text-sm text-muted-foreground">
                  Application deadline: {new Date(job.application_deadline).toLocaleDateString()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
