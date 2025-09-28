
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StudentProfileSetupProps {
  onComplete: () => void;
}

export default function StudentProfileSetup({ onComplete }: StudentProfileSetupProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [certificates, setCertificates] = useState<string[]>([]);
  const [newCertificate, setNewCertificate] = useState('');
  const [preferredJobTypes, setPreferredJobTypes] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    resume_url: '',
    experience_level: '',
    preferred_location: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
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

  const addCertificate = () => {
    if (newCertificate.trim() && !certificates.includes(newCertificate.trim())) {
      setCertificates([...certificates, newCertificate.trim()]);
      setNewCertificate('');
    }
  };

  const removeCertificate = (certificate: string) => {
    setCertificates(certificates.filter(c => c !== certificate));
  };

  const toggleJobType = (jobType: string) => {
    if (preferredJobTypes.includes(jobType)) {
      setPreferredJobTypes(preferredJobTypes.filter(t => t !== jobType));
    } else {
      setPreferredJobTypes([...preferredJobTypes, jobType]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('student_profiles')
        .insert({
          user_id: user.id,
          ...formData,
          skills,
          certificates,
          preferred_job_types: preferredJobTypes
        });

      if (error) throw error;

      toast.success('Profile created successfully!');
      onComplete();
    } catch (error: any) {
      console.error('Error creating student profile:', error);
      toast.error('Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-card">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Complete Your Profile</h2>
        <p className="text-muted-foreground">
          Help us match you with the perfect jobs and internships by completing your profile.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="experience_level">Experience Level</Label>
          <Select onValueChange={(value) => setFormData({...formData, experience_level: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select your experience level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="entry">Entry Level</SelectItem>
              <SelectItem value="mid">Mid Level</SelectItem>
              <SelectItem value="senior">Senior Level</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="preferred_location">Preferred Location</Label>
          <Input
            id="preferred_location"
            name="preferred_location"
            placeholder="e.g., San Francisco, Remote, etc."
            value={formData.preferred_location}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <Label>Preferred Job Types</Label>
          <div className="flex flex-wrap gap-2">
            {['internship', 'full-time', 'part-time', 'contract'].map((type) => (
              <Button
                key={type}
                type="button"
                variant={preferredJobTypes.includes(type) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleJobType(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Skills</Label>
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="Add a skill"
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

        <div className="space-y-2">
          <Label>Certificates</Label>
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="Add a certificate"
              value={newCertificate}
              onChange={(e) => setNewCertificate(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertificate())}
            />
            <Button type="button" onClick={addCertificate} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {certificates.map((cert) => (
              <Badge key={cert} variant="secondary" className="flex items-center gap-1">
                {cert}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => removeCertificate(cert)}
                />
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="linkedin_url">LinkedIn URL</Label>
            <Input
              id="linkedin_url"
              name="linkedin_url"
              placeholder="https://linkedin.com/in/yourprofile"
              value={formData.linkedin_url}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="github_url">GitHub URL</Label>
            <Input
              id="github_url"
              name="github_url"
              placeholder="https://github.com/yourusername"
              value={formData.github_url}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="portfolio_url">Portfolio URL</Label>
          <Input
            id="portfolio_url"
            name="portfolio_url"
            placeholder="https://yourportfolio.com"
            value={formData.portfolio_url}
            onChange={handleInputChange}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating Profile...' : 'Complete Profile'}
        </Button>
      </form>
    </div>
  );
}
