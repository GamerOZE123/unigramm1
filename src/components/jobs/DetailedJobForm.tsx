
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Building2, MapPin, Calendar, DollarSign, Clock, Users, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DetailedJobFormProps {
  onComplete: () => void;
  onCancel: () => void;
}

export default function DetailedJobForm({ onComplete, onCancel }: DetailedJobFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [benefits, setBenefits] = useState<string[]>([]);
  const [newBenefit, setNewBenefit] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    job_type: '',
    location: '',
    work_arrangement: '',
    experience_level: '',
    education_level: '',
    industry: '',
    department: '',
    description: '',
    requirements: '',
    responsibilities: '',
    salary_range: '',
    currency: 'USD',
    salary_type: '',
    application_deadline: '',
    start_date: '',
    duration: '',
    team_size: '',
    reporting_to: '',
    travel_required: '',
    security_clearance: '',
    visa_sponsorship: false,
    remote_work_percentage: '',
    company_culture: '',
    growth_opportunities: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const addBenefit = () => {
    if (newBenefit.trim() && !benefits.includes(newBenefit.trim())) {
      setBenefits([...benefits, newBenefit.trim()]);
      setNewBenefit('');
    }
  };

  const removeBenefit = (benefit: string) => {
    setBenefits(benefits.filter(b => b !== benefit));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('jobs')
        .insert({
          company_id: user.id,
          title: formData.title,
          job_type: formData.job_type,
          location: formData.location,
          experience_level: formData.experience_level,
          description: formData.description,
          requirements: formData.requirements,
          salary_range: formData.salary_range,
          application_deadline: formData.application_deadline || null,
          skills_required: skills,
          // Store additional details in a structured way
          additional_details: {
            work_arrangement: formData.work_arrangement,
            education_level: formData.education_level,
            industry: formData.industry,
            department: formData.department,
            responsibilities: formData.responsibilities,
            currency: formData.currency,
            salary_type: formData.salary_type,
            start_date: formData.start_date,
            duration: formData.duration,
            team_size: formData.team_size,
            reporting_to: formData.reporting_to,
            travel_required: formData.travel_required,
            security_clearance: formData.security_clearance,
            visa_sponsorship: formData.visa_sponsorship,
            remote_work_percentage: formData.remote_work_percentage,
            company_culture: formData.company_culture,
            growth_opportunities: formData.growth_opportunities,
            benefits: benefits
          }
        });

      if (error) throw error;

      toast.success('Job posted successfully!');
      onComplete();
    } catch (error: any) {
      console.error('Error creating job:', error);
      toast.error('Failed to post job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Post a New Job</h1>
        <p className="text-muted-foreground">Fill out all the details to attract the best candidates</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="post-card">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Basic Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Senior Software Engineer"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="job_type">Job Type *</Label>
              <Select onValueChange={(value) => setFormData({...formData, job_type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="work_arrangement">Work Arrangement</Label>
              <Select onValueChange={(value) => setFormData({...formData, work_arrangement: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select arrangement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on-site">On-site</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                name="industry"
                placeholder="e.g., Technology, Healthcare"
                value={formData.industry}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                name="department"
                placeholder="e.g., Engineering, Marketing"
                value={formData.department}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        {/* Location & Timing */}
        <div className="post-card">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Location & Timing</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                name="location"
                placeholder="e.g., San Francisco, CA or Remote"
                value={formData.location}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="remote_work_percentage">Remote Work %</Label>
              <Input
                id="remote_work_percentage"
                name="remote_work_percentage"
                placeholder="e.g., 50%, 100%"
                value={formData.remote_work_percentage}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label htmlFor="start_date">Expected Start Date</Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label htmlFor="application_deadline">Application Deadline</Label>
              <Input
                id="application_deadline"
                name="application_deadline"
                type="date"
                value={formData.application_deadline}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label htmlFor="duration">Duration (if temporary)</Label>
              <Input
                id="duration"
                name="duration"
                placeholder="e.g., 6 months, 1 year"
                value={formData.duration}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label htmlFor="travel_required">Travel Required</Label>
              <Select onValueChange={(value) => setFormData({...formData, travel_required: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select travel requirement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="minimal">Minimal (0-10%)</SelectItem>
                  <SelectItem value="occasional">Occasional (10-25%)</SelectItem>
                  <SelectItem value="frequent">Frequent (25-50%)</SelectItem>
                  <SelectItem value="extensive">Extensive (50%+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="post-card">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Requirements</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="experience_level">Experience Level *</Label>
              <Select onValueChange={(value) => setFormData({...formData, experience_level: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                  <SelectItem value="mid">Mid Level (2-5 years)</SelectItem>
                  <SelectItem value="senior">Senior Level (5-8 years)</SelectItem>
                  <SelectItem value="lead">Lead/Principal (8+ years)</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="education_level">Education Level</Label>
              <Select onValueChange={(value) => setFormData({...formData, education_level: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select education level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high-school">High School</SelectItem>
                  <SelectItem value="associate">Associate Degree</SelectItem>
                  <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                  <SelectItem value="master">Master's Degree</SelectItem>
                  <SelectItem value="phd">PhD</SelectItem>
                  <SelectItem value="not-specified">Not Specified</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="security_clearance">Security Clearance</Label>
              <Select onValueChange={(value) => setFormData({...formData, security_clearance: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select if required" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None Required</SelectItem>
                  <SelectItem value="secret">Secret</SelectItem>
                  <SelectItem value="top-secret">Top Secret</SelectItem>
                  <SelectItem value="ts-sci">TS/SCI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="visa_sponsorship"
                name="visa_sponsorship"
                checked={formData.visa_sponsorship}
                onChange={handleInputChange}
                className="rounded"
              />
              <Label htmlFor="visa_sponsorship">Visa sponsorship available</Label>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Required Skills</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add a required skill"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <Button type="button" onClick={addSkill} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                    {skill}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => removeSkill(skill)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="requirements">Detailed Requirements</Label>
              <Textarea
                id="requirements"
                name="requirements"
                placeholder="List the detailed requirements for this position..."
                value={formData.requirements}
                onChange={handleInputChange}
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Job Description */}
        <div className="post-card">
          <h2 className="text-xl font-semibold mb-4">Job Description</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Job Overview</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Provide a compelling overview of the role and your company..."
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="responsibilities">Key Responsibilities</Label>
              <Textarea
                id="responsibilities"
                name="responsibilities"
                placeholder="List the main responsibilities and duties..."
                value={formData.responsibilities}
                onChange={handleInputChange}
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="company_culture">Company Culture</Label>
              <Textarea
                id="company_culture"
                name="company_culture"
                placeholder="Describe your company culture and work environment..."
                value={formData.company_culture}
                onChange={handleInputChange}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="growth_opportunities">Growth Opportunities</Label>
              <Textarea
                id="growth_opportunities"
                name="growth_opportunities"
                placeholder="Describe career growth and development opportunities..."
                value={formData.growth_opportunities}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Compensation & Team */}
        <div className="post-card">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Compensation & Team</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="salary_range">Salary Range</Label>
              <Input
                id="salary_range"
                name="salary_range"
                placeholder="e.g., $80,000 - $120,000"
                value={formData.salary_range}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select onValueChange={(value) => setFormData({...formData, currency: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="USD" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="salary_type">Salary Type</Label>
              <Select onValueChange={(value) => setFormData({...formData, salary_type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="project">Per Project</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="team_size">Team Size</Label>
              <Input
                id="team_size"
                name="team_size"
                placeholder="e.g., 5-10 people"
                value={formData.team_size}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label htmlFor="reporting_to">Reports To</Label>
              <Input
                id="reporting_to"
                name="reporting_to"
                placeholder="e.g., Engineering Manager"
                value={formData.reporting_to}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div>
            <Label>Benefits & Perks</Label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add a benefit"
                value={newBenefit}
                onChange={(e) => setNewBenefit(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
              />
              <Button type="button" onClick={addBenefit} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {benefits.map((benefit) => (
                <Badge key={benefit} variant="outline" className="flex items-center gap-1">
                  {benefit}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => removeBenefit(benefit)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Posting Job...' : 'Post Job'}
          </Button>
        </div>
      </form>
    </div>
  );
}
