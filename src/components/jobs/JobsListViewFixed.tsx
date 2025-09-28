import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Users, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SimpleJob } from '@/types/simplified';

export default function JobsListViewFixed() {
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

  if (loading) {
    return <div className="text-center py-8">Loading jobs...</div>;
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <Card key={job.id}>
          <CardHeader>
            <CardTitle className="text-xl">{job.job_title}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                <MapPin className="w-3 h-3 mr-1" />
                {job.location}
              </Badge>
              <Badge variant="outline">
                <Briefcase className="w-3 h-3 mr-1" />
                {job.job_type}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{job.description}</p>
            {job.salary_range && (
              <p className="font-semibold mb-4">Salary: {job.salary_range}</p>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 inline mr-1" />
                Posted {new Date(job.created_at).toLocaleDateString()}
              </span>
              <Button>Apply Now</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}