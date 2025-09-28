
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, DollarSign, Clock, X, Heart } from 'lucide-react';

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

interface JobSwipeCardProps {
  job: Job;
  onSwipe: (direction: 'left' | 'right') => void;
  remaining: number;
}

export default function JobSwipeCard({ job, onSwipe, remaining }: JobSwipeCardProps) {
  return (
    <div className="relative">
      <Card className="p-6 space-y-4 max-w-sm mx-auto shadow-lg">
        <div className="text-center mb-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
            {job.company_logo ? (
              <img 
                src={job.company_logo} 
                alt={job.company_name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <Building2 className="w-8 h-8 text-white" />
            )}
          </div>
          <h3 className="text-xl font-bold text-foreground">{job.title}</h3>
          <p className="text-lg text-primary font-semibold">{job.company_name}</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{job.location || 'Location not specified'}</span>
          </div>

          {job.salary_range && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">{job.salary_range}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <Badge variant="secondary" className="text-xs">
              {job.job_type?.replace('-', ' ').toUpperCase() || 'Full-time'}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-foreground">Description</h4>
          <p className="text-sm text-muted-foreground line-clamp-4">
            {job.description || 'No description available.'}
          </p>
        </div>

        {job.skills_required && job.skills_required.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground">Required Skills</h4>
            <div className="flex flex-wrap gap-1">
              {job.skills_required.slice(0, 6).map((skill, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {job.skills_required.length > 6 && (
                <Badge variant="outline" className="text-xs">
                  +{job.skills_required.length - 6} more
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => onSwipe('left')}
            className="flex-1 mr-2 border-red-200 hover:bg-red-50 hover:border-red-300"
          >
            <X className="w-5 h-5 text-red-500 mr-2" />
            Pass
          </Button>
          <Button
            size="lg"
            onClick={() => onSwipe('right')}
            className="flex-1 ml-2 bg-green-500 hover:bg-green-600 border-green-500"
          >
            <Heart className="w-5 h-5 mr-2" />
            Apply
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          {remaining} jobs remaining
        </div>
      </Card>
    </div>
  );
}
