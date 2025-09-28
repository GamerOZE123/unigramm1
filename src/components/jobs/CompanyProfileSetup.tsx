
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CompanyProfileSetupProps {
  onComplete: () => void;
}

export default function CompanyProfileSetup({ onComplete }: CompanyProfileSetupProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    company_description: '',
    website_url: '',
    industry: '',
    company_size: '',
    headquarters: '',
    logo_url: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('company_profiles')
        .insert({
          user_id: user.id,
          ...formData
        });

      if (error) throw error;

      toast.success('Company profile created successfully!');
      onComplete();
    } catch (error: any) {
      console.error('Error creating company profile:', error);
      toast.error('Failed to create company profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-card">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Set Up Your Company Profile</h2>
        <p className="text-muted-foreground">
          Complete your company profile to start posting jobs and finding great candidates.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="company_name">Company Name *</Label>
          <Input
            id="company_name"
            name="company_name"
            placeholder="Enter your company name"
            value={formData.company_name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company_description">Company Description</Label>
          <Textarea
            id="company_description"
            name="company_description"
            placeholder="Describe your company and what you do..."
            value={formData.company_description}
            onChange={handleInputChange}
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="website_url">Website URL</Label>
            <Input
              id="website_url"
              name="website_url"
              placeholder="https://yourcompany.com"
              value={formData.website_url}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              name="industry"
              placeholder="e.g., Technology, Healthcare, Finance"
              value={formData.industry}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company_size">Company Size</Label>
            <Select onValueChange={(value) => setFormData({...formData, company_size: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select company size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-10">1-10 employees</SelectItem>
                <SelectItem value="11-50">11-50 employees</SelectItem>
                <SelectItem value="51-200">51-200 employees</SelectItem>
                <SelectItem value="201-500">201-500 employees</SelectItem>
                <SelectItem value="501-1000">501-1000 employees</SelectItem>
                <SelectItem value="1000+">1000+ employees</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="headquarters">Headquarters</Label>
            <Input
              id="headquarters"
              name="headquarters"
              placeholder="e.g., San Francisco, CA"
              value={formData.headquarters}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="logo_url">Company Logo URL</Label>
          <Input
            id="logo_url"
            name="logo_url"
            placeholder="https://yourcompany.com/logo.png"
            value={formData.logo_url}
            onChange={handleInputChange}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating Profile...' : 'Complete Company Profile'}
        </Button>
      </form>
    </div>
  );
}
