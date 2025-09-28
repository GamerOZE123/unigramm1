import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, User, FileText, Award, Briefcase, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Education {
  id: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
  gpa: string;
  description: string;
}

interface Experience {
  id: string;
  company: string;
  position: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
  location: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  url: string;
  start_date: string;
  end_date: string;
}

interface StudentApplicationFormProps {
  onComplete: () => void;
  onCancel: () => void;
}

export default function StudentApplicationForm({ onComplete, onCancel }: StudentApplicationFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [languages, setLanguages] = useState<{language: string, proficiency: string}[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [newCertification, setNewCertification] = useState('');
  const [education, setEducation] = useState<Education[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [personalInfo, setPersonalInfo] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    website_url: '',
    desired_salary_min: '',
    desired_salary_max: '',
    availability: '',
    visa_status: '',
    willing_to_relocate: false,
    preferred_work_arrangement: '',
    notice_period: ''
  });

  useEffect(() => {
    fetchExistingProfile();
  }, [user]);

  const fetchExistingProfile = async () => {
    if (!user) return;
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const { data: studentProfile } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setPersonalInfo(prev => ({
          ...prev,
          first_name: profile.full_name?.split(' ')[0] || '',
          last_name: profile.full_name?.split(' ').slice(1).join(' ') || '',
          email: user.email || ''
        }));
      }

      if (studentProfile) {
        setSkills(studentProfile.skills || []);
        setCertifications(studentProfile.certificates || []);
        setPersonalInfo(prev => ({
          ...prev,
          linkedin_url: studentProfile.linkedin_url || '',
          github_url: studentProfile.github_url || '',
          portfolio_url: studentProfile.portfolio_url || ''
        }));
        
        if (studentProfile.education && Array.isArray(studentProfile.education)) {
          setEducation(studentProfile.education as unknown as Education[]);
        }
        
        if (studentProfile.work_experience && Array.isArray(studentProfile.work_experience)) {
          setExperience(studentProfile.work_experience as unknown as Experience[]);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setPersonalInfo({
      ...personalInfo,
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

  const addCertification = () => {
    if (newCertification.trim() && !certifications.includes(newCertification.trim())) {
      setCertifications([...certifications, newCertification.trim()]);
      setNewCertification('');
    }
  };

  const removeCertification = (cert: string) => {
    setCertifications(certifications.filter(c => c !== cert));
  };

  const addEducation = () => {
    const newEdu: Education = {
      id: Date.now().toString(),
      institution: '',
      degree: '',
      field_of_study: '',
      start_date: '',
      end_date: '',
      gpa: '',
      description: ''
    };
    setEducation([...education, newEdu]);
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setEducation(education.map(edu => 
      edu.id === id ? { ...edu, [field]: value } : edu
    ));
  };

  const removeEducation = (id: string) => {
    setEducation(education.filter(edu => edu.id !== id));
  };

  const addExperience = () => {
    const newExp: Experience = {
      id: Date.now().toString(),
      company: '',
      position: '',
      start_date: '',
      end_date: '',
      is_current: false,
      description: '',
      location: ''
    };
    setExperience([...experience, newExp]);
  };

  const updateExperience = (id: string, field: keyof Experience, value: string | boolean) => {
    setExperience(experience.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  const removeExperience = (id: string) => {
    setExperience(experience.filter(exp => exp.id !== id));
  };

  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: '',
      description: '',
      technologies: [],
      url: '',
      start_date: '',
      end_date: ''
    };
    setProjects([...projects, newProject]);
  };

  const updateProject = (id: string, field: keyof Project, value: string | string[]) => {
    setProjects(projects.map(project => 
      project.id === id ? { ...project, [field]: value } : project
    ));
  };

  const removeProject = (id: string) => {
    setProjects(projects.filter(project => project.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      // Check if student profile exists
      const { data: existingProfile } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingProfile) {
        // Update existing profile
        const { error: profileError } = await supabase
          .from('student_profiles')
          .update({
            skills,
            certificates: certifications,
            linkedin_url: personalInfo.linkedin_url,
            github_url: personalInfo.github_url,
            portfolio_url: personalInfo.portfolio_url,
            education: education as any,
            work_experience: experience as any,
            preferred_location: personalInfo.location,
          })
          .eq('user_id', user.id);

        if (profileError) throw profileError;
      } else {
        // Insert new profile
        const { error: profileError } = await supabase
          .from('student_profiles')
          .insert({
            user_id: user.id,
            skills,
            certificates: certifications,
            linkedin_url: personalInfo.linkedin_url,
            github_url: personalInfo.github_url,
            portfolio_url: personalInfo.portfolio_url,
            education: education as any,
            work_experience: experience as any,
            preferred_location: personalInfo.location,
          });

        if (profileError) throw profileError;
      }

      // Update main profile
      const { error: mainProfileError } = await supabase
        .from('profiles')
        .update({
          full_name: `${personalInfo.first_name} ${personalInfo.last_name}`.trim(),
          bio: personalInfo.summary
        })
        .eq('user_id', user.id);

      if (mainProfileError) throw mainProfileError;

      toast.success('Profile updated successfully!');
      onComplete();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Complete Your Professional Profile</h1>
        <p className="text-muted-foreground">Build a comprehensive profile to attract employers</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information */}
        <div className="post-card">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Personal Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                name="first_name"
                value={personalInfo.first_name}
                onChange={handlePersonalInfoChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                name="last_name"
                value={personalInfo.last_name}
                onChange={handlePersonalInfoChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={personalInfo.email}
                onChange={handlePersonalInfoChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={personalInfo.phone}
                onChange={handlePersonalInfoChange}
              />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                placeholder="City, State/Country"
                value={personalInfo.location}
                onChange={handlePersonalInfoChange}
              />
            </div>

            <div>
              <Label htmlFor="visa_status">Visa Status</Label>
              <select
                id="visa_status"
                name="visa_status"
                value={personalInfo.visa_status}
                onChange={handlePersonalInfoChange}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select status</option>
                <option value="citizen">Citizen</option>
                <option value="permanent_resident">Permanent Resident</option>
                <option value="h1b">H1B</option>
                <option value="f1_opt">F1 OPT</option>
                <option value="student">Student Visa</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="summary">Professional Summary</Label>
              <Textarea
                id="summary"
                name="summary"
                placeholder="Write a compelling summary of your background and career goals..."
                value={personalInfo.summary}
                onChange={handlePersonalInfoChange}
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Online Presence */}
        <div className="post-card">
          <div className="flex items-center gap-2 mb-4">
            <ExternalLink className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Online Presence</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="linkedin_url">LinkedIn Profile</Label>
              <Input
                id="linkedin_url"
                name="linkedin_url"
                placeholder="https://linkedin.com/in/yourprofile"
                value={personalInfo.linkedin_url}
                onChange={handlePersonalInfoChange}
              />
            </div>

            <div>
              <Label htmlFor="github_url">GitHub Profile</Label>
              <Input
                id="github_url"
                name="github_url"
                placeholder="https://github.com/yourusername"
                value={personalInfo.github_url}
                onChange={handlePersonalInfoChange}
              />
            </div>

            <div>
              <Label htmlFor="portfolio_url">Portfolio Website</Label>
              <Input
                id="portfolio_url"
                name="portfolio_url"
                placeholder="https://yourportfolio.com"
                value={personalInfo.portfolio_url}
                onChange={handlePersonalInfoChange}
              />
            </div>

            <div>
              <Label htmlFor="website_url">Personal Website</Label>
              <Input
                id="website_url"
                name="website_url"
                placeholder="https://yourwebsite.com"
                value={personalInfo.website_url}
                onChange={handlePersonalInfoChange}
              />
            </div>
          </div>
        </div>

        {/* Education */}
        <div className="post-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Education</h2>
            <Button type="button" onClick={addEducation} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Education
            </Button>
          </div>

          {education.map((edu) => (
            <div key={edu.id} className="border rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Institution *</Label>
                  <Input
                    value={edu.institution}
                    onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                    placeholder="University/College name"
                    required
                  />
                </div>

                <div>
                  <Label>Degree *</Label>
                  <Input
                    value={edu.degree}
                    onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                    placeholder="e.g., Bachelor's, Master's"
                    required
                  />
                </div>

                <div>
                  <Label>Field of Study</Label>
                  <Input
                    value={edu.field_of_study}
                    onChange={(e) => updateEducation(edu.id, 'field_of_study', e.target.value)}
                    placeholder="e.g., Computer Science"
                  />
                </div>

                <div>
                  <Label>GPA</Label>
                  <Input
                    value={edu.gpa}
                    onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
                    placeholder="e.g., 3.8/4.0"
                  />
                </div>

                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={edu.start_date}
                    onChange={(e) => updateEducation(edu.id, 'start_date', e.target.value)}
                  />
                </div>

                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={edu.end_date}
                    onChange={(e) => updateEducation(edu.id, 'end_date', e.target.value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={edu.description}
                    onChange={(e) => updateEducation(edu.id, 'description', e.target.value)}
                    placeholder="Relevant coursework, achievements, activities..."
                    rows={3}
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeEducation(edu.id)}
                className="mt-2"
              >
                <X className="w-4 h-4 mr-2" />
                Remove
              </Button>
            </div>
          ))}
        </div>

        {/* Experience */}
        <div className="post-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Work Experience</h2>
            </div>
            <Button type="button" onClick={addExperience} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Experience
            </Button>
          </div>

          {experience.map((exp) => (
            <div key={exp.id} className="border rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Company *</Label>
                  <Input
                    value={exp.company}
                    onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                    placeholder="Company name"
                    required
                  />
                </div>

                <div>
                  <Label>Position *</Label>
                  <Input
                    value={exp.position}
                    onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                    placeholder="Job title"
                    required
                  />
                </div>

                <div>
                  <Label>Location</Label>
                  <Input
                    value={exp.location}
                    onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                    placeholder="City, State"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`current-${exp.id}`}
                    checked={exp.is_current}
                    onChange={(e) => updateExperience(exp.id, 'is_current', e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor={`current-${exp.id}`}>Currently working here</Label>
                </div>

                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={exp.start_date}
                    onChange={(e) => updateExperience(exp.id, 'start_date', e.target.value)}
                  />
                </div>

                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={exp.end_date}
                    onChange={(e) => updateExperience(exp.id, 'end_date', e.target.value)}
                    disabled={exp.is_current}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={exp.description}
                    onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                    placeholder="Describe your responsibilities and achievements..."
                    rows={4}
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeExperience(exp.id)}
                className="mt-2"
              >
                <X className="w-4 h-4 mr-2" />
                Remove
              </Button>
            </div>
          ))}
        </div>

        {/* Skills & Certifications */}
        <div className="post-card">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Skills & Certifications</h2>
          </div>

          <div className="space-y-6">
            <div>
              <Label>Technical Skills</Label>
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

            <div>
              <Label>Certifications</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add a certification"
                  value={newCertification}
                  onChange={(e) => setNewCertification(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                />
                <Button type="button" onClick={addCertification} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {certifications.map((cert) => (
                  <Badge key={cert} variant="outline" className="flex items-center gap-1">
                    {cert}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => removeCertification(cert)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Job Preferences */}
        <div className="post-card">
          <h2 className="text-xl font-semibold mb-4">Job Preferences</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="desired_salary_min">Desired Salary (Min)</Label>
              <Input
                id="desired_salary_min"
                name="desired_salary_min"
                placeholder="e.g., 80000"
                value={personalInfo.desired_salary_min}
                onChange={handlePersonalInfoChange}
              />
            </div>

            <div>
              <Label htmlFor="desired_salary_max">Desired Salary (Max)</Label>
              <Input
                id="desired_salary_max"
                name="desired_salary_max"
                placeholder="e.g., 120000"
                value={personalInfo.desired_salary_max}
                onChange={handlePersonalInfoChange}
              />
            </div>

            <div>
              <Label htmlFor="preferred_work_arrangement">Preferred Work Arrangement</Label>
              <select
                id="preferred_work_arrangement"
                name="preferred_work_arrangement"
                value={personalInfo.preferred_work_arrangement}
                onChange={handlePersonalInfoChange}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select preference</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="on-site">On-site</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>

            <div>
              <Label htmlFor="availability">Availability</Label>
              <select
                id="availability"
                name="availability"
                value={personalInfo.availability}
                onChange={handlePersonalInfoChange}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select availability</option>
                <option value="immediately">Immediately</option>
                <option value="2_weeks">2 weeks</option>
                <option value="1_month">1 month</option>
                <option value="2_months">2 months</option>
                <option value="3_months">3+ months</option>
              </select>
            </div>

            <div>
              <Label htmlFor="notice_period">Current Notice Period</Label>
              <Input
                id="notice_period"
                name="notice_period"
                placeholder="e.g., 2 weeks, 1 month"
                value={personalInfo.notice_period}
                onChange={handlePersonalInfoChange}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="willing_to_relocate"
                name="willing_to_relocate"
                checked={personalInfo.willing_to_relocate}
                onChange={handlePersonalInfoChange}
                className="rounded"
              />
              <Label htmlFor="willing_to_relocate">Willing to relocate</Label>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving Profile...' : 'Save Profile'}
          </Button>
        </div>
      </form>
    </div>
  );
}
