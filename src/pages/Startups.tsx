import React, { useEffect, useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import Layout from '@/components/layout/Layout';
import MobileHeader from '@/components/layout/MobileHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Rocket, 
  Lightbulb, 
  Users, 
  TrendingUp,
  Plus,
  ImagePlus,
  X,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import StartupCard from '@/components/startups/StartupCard';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface Startup {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  stage: string;
  slug: string | null;
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
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStartup, setEditingStartup] = useState<Startup | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    stage: 'idea',
    looking_for: '',
    website_url: '',
    contact_email: '',
    logo_url: ''
  });
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStartups();
    fetchBookmarks();
  }, [user]);

  const fetchBookmarks = async () => {
    if (!user) {
      setBookmarkedIds(new Set());
      return;
    }

    try {
      const { data } = await supabase
        .from('item_favorites')
        .select('item_id')
        .eq('user_id', user.id)
        .eq('item_type', 'startup');

      if (data) {
        setBookmarkedIds(new Set(data.map(d => d.item_id)));
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    }
  };

  const fetchStartups = async () => {
    try {
      const { data, error } = await supabase
        .from('student_startups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      if (data && data.length > 0) {
        const userIds = data.map((s: any) => s.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, username, avatar_url, university, linkedin_url')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        // Map profiles to startups
        const startupsWithProfiles = data.map((startup: any) => ({
          ...startup,
          profiles: profilesData?.find((p: any) => p.user_id === startup.user_id)
        }));

        setStartups(startupsWithProfiles as any || []);
      } else {
        setStartups([]);
      }
    } catch (error) {
      console.error('Error fetching startups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmarkChange = (startupId: string, isBookmarked: boolean) => {
    setBookmarkedIds(prev => {
      const newSet = new Set(prev);
      if (isBookmarked) {
        newSet.add(startupId);
      } else {
        newSet.delete(startupId);
      }
      return newSet;
    });
  };

  // Sort startups with bookmarked ones at the top
  const sortedStartups = [...startups].sort((a, b) => {
    const aBookmarked = bookmarkedIds.has(a.id);
    const bBookmarked = bookmarkedIds.has(b.id);
    if (aBookmarked && !bBookmarked) return -1;
    if (!aBookmarked && bBookmarked) return 1;
    return 0;
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    setLogoUploading(true);
    try {
      // Compress the image before uploading
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 512,
        useWebWorker: true,
        fileType: 'image/webp'
      });

      const fileName = `${user.id}-${Date.now()}.webp`;
      const filePath = `startup-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('lovable-uploads')
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('lovable-uploads')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, logo_url: publicUrl }));
      toast.success('Logo uploaded!');
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setLogoUploading(false);
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
          contact_email: formData.contact_email || null,
          logo_url: formData.logo_url || null
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
        contact_email: '',
        logo_url: ''
      });
      fetchStartups();
    } catch (error: any) {
      console.error('Error creating startup:', error);
      toast.error(error.message || 'Failed to post startup');
    }
  };

  const handleEdit = (startup: Startup, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingStartup(startup);
    setFormData({
      title: startup.title,
      description: startup.description,
      category: startup.category,
      stage: startup.stage,
      looking_for: startup.looking_for?.join(', ') || '',
      website_url: startup.website_url || '',
      contact_email: startup.contact_email || '',
      logo_url: ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingStartup) return;

    try {
      const lookingForArray = formData.looking_for
        .split(',')
        .map(item => item.trim())
        .filter(item => item);

      const { error } = await supabase
        .from('student_startups')
        .update({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          stage: formData.stage,
          looking_for: lookingForArray,
          website_url: formData.website_url || null,
          contact_email: formData.contact_email || null
        })
        .eq('id', editingStartup.id);

      if (error) throw error;

      toast.success('Startup updated successfully!');
      setIsEditModalOpen(false);
      setEditingStartup(null);
      setFormData({
        title: '',
        description: '',
        category: '',
        stage: 'idea',
        looking_for: '',
        website_url: '',
        contact_email: '',
        logo_url: ''
      });
      fetchStartups();
    } catch (error: any) {
      console.error('Error updating startup:', error);
      toast.error(error.message || 'Failed to update startup');
    }
  };

  const handleDelete = async (startupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this startup?')) return;

    try {
      const { error } = await supabase
        .from('student_startups')
        .delete()
        .eq('id', startupId);

      if (error) throw error;

      toast.success('Startup deleted successfully!');
      fetchStartups();
    } catch (error: any) {
      console.error('Error deleting startup:', error);
      toast.error(error.message || 'Failed to delete startup');
    }
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
                {/* Logo Upload */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Logo</label>
                  <div className="flex items-center gap-4">
                    <div 
                      className="relative w-20 h-20 rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer flex items-center justify-center bg-muted/50 overflow-hidden"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      {formData.logo_url ? (
                        <>
                          <img 
                            src={formData.logo_url} 
                            alt="Logo preview" 
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData(prev => ({ ...prev, logo_url: '' }));
                            }}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : logoUploading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      ) : (
                        <ImagePlus className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Click to upload a logo</p>
                      <p className="text-xs">PNG, JPG up to 5MB</p>
                    </div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </div>
                </div>

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

          {/* Edit Modal */}
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Startup</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdate} className="space-y-4">
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

                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Update Startup
                  </Button>
                </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedStartups.map((startup) => (
                <StartupCard
                  key={startup.id}
                  startup={startup}
                  isBookmarked={bookmarkedIds.has(startup.id)}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onBookmarkChange={handleBookmarkChange}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
