import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import MobileHeader from '@/components/layout/MobileHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Rocket, 
  Lightbulb, 
  ExternalLink, 
  Users, 
  TrendingUp,
  Plus,
  Mail,
  Linkedin,
  Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Startup {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  stage: string;
  looking_for: string[];
  website_url?: string;
  contact_email?: string;
  created_at: string;
  profiles: {
    full_name: string;
    username: string;
    avatar_url?: string;
    university?: string;
    linkedin_url?: string;
  };
}

export default function Startups() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    stage: 'idea',
    looking_for: '',
    website_url: '',
    contact_email: ''
  });

  useEffect(() => {
    fetchStartups();
  }, []);

  const fetchStartups = async () => {
    try {
      const { data, error } = await supabase
        .from('student_startups' as any)
        .select(`
          *,
          profiles (
            full_name,
            username,
            avatar_url,
            university,
            linkedin_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStartups(data as any || []);
    } catch (error) {
      console.error('Error fetching startups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const lookingForArray = formData.looking_for
        .split(',')
        .map(item => item.trim())
        .filter(item => item);

      const { error } = await supabase
        .from('student_startups' as any)
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          stage: formData.stage,
          looking_for: lookingForArray,
          website_url: formData.website_url || null,
          contact_email: formData.contact_email || null
        });

      if (error) throw error;

      toast.success('Startup posted successfully!');
      setIsCreateModalOpen(false);
      setFormData({
        title: '',
        description: '',
        category: '',
        stage: 'idea',
        looking_for: '',
        website_url: '',
        contact_email: ''
      });
      fetchStartups();
    } catch (error: any) {
      console.error('Error creating startup:', error);
      toast.error(error.message || 'Failed to post startup');
    }
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      idea: 'bg-blue-500/10 text-blue-500',
      mvp: 'bg-purple-500/10 text-purple-500',
      launched: 'bg-green-500/10 text-green-500',
      growing: 'bg-orange-500/10 text-orange-500'
    };
    return colors[stage] || colors.idea;
  };

  if (loading) {
    return (
      <Layout>
        {isMobile && <MobileHeader />}
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {isMobile && <MobileHeader />}
      
      <div className="space-y-6 pt-6 px-2 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Rocket className="w-8 h-8 text-primary" />
              Student Startups & Ideas
            </h1>
            <p className="text-muted-foreground mt-2">
              Discover innovative projects by students, find co-founders, and share your ideas
            </p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Share Your Startup
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Share Your Startup or Idea</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Startup Name *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., EduConnect"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Description *</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your startup, what problem it solves, and your vision..."
                    rows={5}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category *</label>
                    <Input
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g., EdTech, FinTech, SaaS"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Stage *</label>
                    <select
                      value={formData.stage}
                      onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-input rounded-md"
                      required
                    >
                      <option value="idea">Idea</option>
                      <option value="mvp">MVP</option>
                      <option value="launched">Launched</option>
                      <option value="growing">Growing</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Looking For</label>
                  <Input
                    value={formData.looking_for}
                    onChange={(e) => setFormData({ ...formData, looking_for: e.target.value })}
                    placeholder="e.g., Co-founder, Developer, Investor (comma separated)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Website</label>
                    <Input
                      value={formData.website_url}
                      onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                      placeholder="https://yourstartup.com"
                      type="url"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Contact Email</label>
                    <Input
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      placeholder="contact@yourstartup.com"
                      type="email"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  Post Startup
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Rocket className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{startups.length}</p>
                <p className="text-sm text-muted-foreground">Active Startups</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{new Set(startups.map(s => s.user_id)).size}</p>
                <p className="text-sm text-muted-foreground">Student Founders</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {startups.filter(s => s.stage === 'launched' || s.stage === 'growing').length}
                </p>
                <p className="text-sm text-muted-foreground">Launched</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Startups Grid */}
        <div className="space-y-4">
          {startups.length === 0 ? (
            <Card className="p-12 text-center">
              <Lightbulb className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Startups Yet</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to share your startup or innovative idea!
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                Share Your Startup
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {startups.map((startup) => (
                <Card 
                  key={startup.id} 
                  className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/startups/${startup.id}`)}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar
                          className="h-12 w-12 cursor-pointer"
                          onClick={() => navigate(`/profile/${startup.user_id}`)}
                        >
                          <AvatarImage src={startup.profiles?.avatar_url} />
                          <AvatarFallback>
                            {startup.profiles?.full_name?.[0] || startup.profiles?.username?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg line-clamp-1">{startup.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            by {startup.profiles?.full_name || startup.profiles?.username}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStageColor(startup.stage)}>
                        {startup.stage.toUpperCase()}
                      </Badge>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {startup.description}
                    </p>

                    {/* Category & University */}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{startup.category}</Badge>
                      {startup.profiles?.university && (
                        <Badge variant="outline">{startup.profiles.university}</Badge>
                      )}
                    </div>

                    {/* Looking For */}
                    {startup.looking_for && startup.looking_for.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Looking for:</p>
                        <div className="flex flex-wrap gap-1">
                          {startup.looking_for.map((item, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      {startup.website_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 flex-1"
                          onClick={() => window.open(startup.website_url, '_blank')}
                        >
                          <Globe className="w-3 h-3" />
                          Website
                        </Button>
                      )}
                      {startup.contact_email && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 flex-1"
                          onClick={() => window.location.href = `mailto:${startup.contact_email}`}
                        >
                          <Mail className="w-3 h-3" />
                          Contact
                        </Button>
                      )}
                      {startup.profiles?.linkedin_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 flex-1"
                          onClick={() => window.open(startup.profiles.linkedin_url, '_blank')}
                        >
                          <Linkedin className="w-3 h-3" />
                          LinkedIn
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
