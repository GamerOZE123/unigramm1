import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ArrowLeft, X, Plus, Check, UserPlus, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface Startup {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  stage: string;
  slug: string | null;
  logo_url: string | null;
  looking_for: string[];
  website_url: string | null;
  contact_email: string | null;
}

interface Contributor {
  id: string;
  user_id: string;
  role: string | null;
  profiles: {
    full_name: string;
    avatar_url: string;
    username: string;
  };
}

interface TaggedPost {
  id: string;
  content: string;
  created_at: string;
  image_url: string | null;
  is_approved_for_startup: boolean;
  profiles: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
}

const stages = [
  { key: 'Ideation', label: 'Ideation', description: 'Basic problem → solution understanding' },
  { key: 'Research', label: 'Research', description: 'Market research and validation' },
  { key: 'MVP Build', label: 'MVP Build', description: 'Building minimum viable product' },
  { key: 'Testing', label: 'Testing', description: 'Testing with early users' },
  { key: 'Launch', label: 'Launch', description: 'Public launch and growth' },
];

export default function StartupManagement() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [startup, setStartup] = useState<Startup | null>(null);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [taggedPosts, setTaggedPosts] = useState<TaggedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    category: '',
    stage: 'Ideation',
    looking_for: '',
    website_url: '',
    contact_email: ''
  });

  const [contributorEmail, setContributorEmail] = useState('');
  const [contributorRole, setContributorRole] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    if (slug) {
      fetchStartup();
    }
  }, [slug]);

  useEffect(() => {
    if (startup) {
      fetchContributors();
      fetchTaggedPosts();
    }
  }, [startup]);

  const fetchStartup = async () => {
    try {
      const { data, error } = await supabase
        .from('student_startups')
        .select('id, user_id, title, description, category, stage, slug, logo_url, looking_for, website_url, contact_email')
        .eq('slug', slug)
        .single();

      if (error) throw error;

      // Check if user is owner
      if (data.user_id !== user?.id) {
        toast.error('You do not have permission to manage this startup');
        navigate(`/startup/${slug}`);
        return;
      }

      setStartup(data);
      setFormData({
        title: data.title,
        slug: data.slug || '',
        description: data.description,
        category: data.category,
        stage: data.stage,
        looking_for: data.looking_for?.join(', ') || '',
        website_url: data.website_url || '',
        contact_email: data.contact_email || ''
      });
    } catch (error) {
      console.error('Error fetching startup:', error);
      toast.error('Failed to load startup');
    } finally {
      setLoading(false);
    }
  };

  const fetchContributors = async () => {
    if (!startup) return;

    try {
      const { data, error } = await supabase
        .from('startup_contributors')
        .select('id, user_id, role')
        .eq('startup_id', startup.id);

      if (error) throw error;

      if (data && data.length > 0) {
        const userIds = data.map(c => c.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, username, avatar_url')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        const contributorsWithProfiles = data.map(contributor => ({
          ...contributor,
          profiles: profiles?.find(p => p.user_id === contributor.user_id)!
        }));

        setContributors(contributorsWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching contributors:', error);
    }
  };

  const fetchTaggedPosts = async () => {
    if (!startup) return;

    try {
      const { data: mentions, error: mentionsError } = await supabase
        .from('post_startup_mentions')
        .select('post_id')
        .eq('startup_id', startup.id);

      if (mentionsError) throw mentionsError;

      if (mentions && mentions.length > 0) {
        const postIds = mentions.map(m => m.post_id);
        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select('id, content, created_at, image_url, is_approved_for_startup, user_id')
          .in('id', postIds)
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;

        if (posts) {
          const userIds = [...new Set(posts.map(p => p.user_id))];
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('user_id, full_name, username, avatar_url')
            .in('user_id', userIds);

          if (profilesError) throw profilesError;

          const postsWithProfiles = posts.map(post => ({
            ...post,
            profiles: profiles?.find(p => p.user_id === post.user_id)!
          }));

          setTaggedPosts(postsWithProfiles as any);
        }
      }
    } catch (error) {
      console.error('Error fetching tagged posts:', error);
    }
  };

  const handleUpdateBasicInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startup) return;

    try {
      const lookingForArray = formData.looking_for
        .split(',')
        .map(item => item.trim())
        .filter(item => item);

      const { error } = await supabase
        .from('student_startups')
        .update({
          title: formData.title,
          slug: formData.slug || null,
          description: formData.description,
          category: formData.category,
          looking_for: lookingForArray,
          website_url: formData.website_url || null,
          contact_email: formData.contact_email || null
        })
        .eq('id', startup.id);

      if (error) throw error;

      toast.success('Basic info updated successfully!');
      
      // If slug changed, redirect to new URL
      if (formData.slug !== slug) {
        navigate(`/startup/${formData.slug}/manage`);
      } else {
        fetchStartup();
      }
    } catch (error: any) {
      console.error('Error updating startup:', error);
      toast.error(error.message || 'Failed to update startup');
    }
  };

  const handleUpdateProgress = async (newStage: string) => {
    if (!startup) return;

    try {
      const { error } = await supabase
        .from('student_startups')
        .update({ stage: newStage })
        .eq('id', startup.id);

      if (error) throw error;

      setFormData({ ...formData, stage: newStage });
      toast.success('Progress updated successfully!');
      fetchStartup();
    } catch (error: any) {
      console.error('Error updating progress:', error);
      toast.error(error.message || 'Failed to update progress');
    }
  };

  const searchUsers = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url')
        .or(`full_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleAddContributor = async (userId: string) => {
    if (!startup) return;

    try {
      const { error } = await supabase
        .from('startup_contributors')
        .insert({
          startup_id: startup.id,
          user_id: userId,
          role: contributorRole || null
        });

      if (error) throw error;

      toast.success('Contributor added successfully!');
      setContributorEmail('');
      setContributorRole('');
      setSearchResults([]);
      fetchContributors();
    } catch (error: any) {
      console.error('Error adding contributor:', error);
      toast.error(error.message || 'Failed to add contributor');
    }
  };

  const handleRemoveContributor = async (contributorId: string) => {
    if (!confirm('Are you sure you want to remove this contributor?')) return;

    try {
      const { error } = await supabase
        .from('startup_contributors')
        .delete()
        .eq('id', contributorId);

      if (error) throw error;

      toast.success('Contributor removed successfully!');
      fetchContributors();
    } catch (error: any) {
      console.error('Error removing contributor:', error);
      toast.error(error.message || 'Failed to remove contributor');
    }
  };

  const handleTogglePostApproval = async (postId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ is_approved_for_startup: !currentStatus })
        .eq('id', postId);

      if (error) throw error;

      toast.success(currentStatus ? 'Post hidden from startup page' : 'Post approved for display');
      fetchTaggedPosts();
    } catch (error: any) {
      console.error('Error toggling post approval:', error);
      toast.error(error.message || 'Failed to update post');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !startup) return;

    const file = e.target.files[0];
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${startup.id}-${Date.now()}.${fileExt}`;
      const filePath = `startup-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('student_startups')
        .update({ logo_url: publicUrl })
        .eq('id', startup.id);

      if (updateError) throw updateError;

      toast.success('Logo uploaded successfully!');
      fetchStartup();
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error(error.message || 'Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!startup) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Startup not found</h2>
          <Button onClick={() => navigate('/startups')}>Back to Startups</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/startup/${startup.slug || startup.id}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Startup Page
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-6">Manage {startup.title}</h1>

        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="contributors">Contributors</TabsTrigger>
            <TabsTrigger value="posts">Tagged Posts</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card className="p-6">
              <form onSubmit={handleUpdateBasicInfo} className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted">
                      {startup.logo_url ? (
                        <img src={startup.logo_url} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-muted-foreground">
                          {startup.title.charAt(0)}
                        </div>
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90">
                      <Upload className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                  <div>
                    <h3 className="font-semibold">Startup Logo</h3>
                    <p className="text-sm text-muted-foreground">Upload a square image (recommended: 400x400px)</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Startup Name *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Slug (URL) *</label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">/startup/</span>
                    <Input
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                      placeholder="highlite"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Only lowercase letters, numbers, and hyphens</p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Description *</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Looking For</label>
                    <Input
                      value={formData.looking_for}
                      onChange={(e) => setFormData({ ...formData, looking_for: e.target.value })}
                      placeholder="Co-founder, Developer, Investor"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Website</label>
                    <Input
                      value={formData.website_url}
                      onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                      type="url"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Contact Email</label>
                    <Input
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      type="email"
                    />
                  </div>
                </div>

                <Button type="submit">Save Changes</Button>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="progress">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Update Progress Stage</h3>
              <div className="space-y-3">
                {stages.map((stage) => (
                  <button
                    key={stage.key}
                    onClick={() => handleUpdateProgress(stage.key)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      formData.stage === stage.key
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{stage.label}</p>
                        <p className="text-sm text-muted-foreground">{stage.description}</p>
                      </div>
                      {formData.stage === stage.key && <Check className="h-5 w-5 text-primary" />}
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="contributors">
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Add Contributor</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Search User</label>
                    <Input
                      value={contributorEmail}
                      onChange={(e) => {
                        setContributorEmail(e.target.value);
                        searchUsers(e.target.value);
                      }}
                      placeholder="Search by name or username..."
                    />
                    {searchResults.length > 0 && (
                      <div className="mt-2 border rounded-lg divide-y">
                        {searchResults.map((user) => (
                          <div
                            key={user.user_id}
                            className="p-3 flex items-center justify-between hover:bg-muted/50 cursor-pointer"
                            onClick={() => handleAddContributor(user.user_id)}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar_url} />
                                <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{user.full_name}</p>
                                <p className="text-sm text-muted-foreground">@{user.username}</p>
                              </div>
                            </div>
                            <UserPlus className="h-4 w-4 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Role (optional)</label>
                    <Input
                      value={contributorRole}
                      onChange={(e) => setContributorRole(e.target.value)}
                      placeholder="e.g., Co-founder, Developer, Designer"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Current Contributors</h3>
                {contributors.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No contributors yet</p>
                ) : (
                  <div className="space-y-3">
                    {contributors.map((contributor) => (
                      <div key={contributor.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={contributor.profiles.avatar_url} />
                            <AvatarFallback>{contributor.profiles.full_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{contributor.profiles.full_name}</p>
                            {contributor.role && (
                              <p className="text-sm text-muted-foreground">{contributor.role}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveContributor(contributor.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="posts">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Manage Tagged Posts</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Select which posts mentioning your startup should appear on your startup page
              </p>
              
              {taggedPosts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No posts have tagged your startup yet</p>
              ) : (
                <div className="space-y-4">
                  {taggedPosts.map((post) => (
                    <div key={post.id} className="flex gap-4 p-4 border rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.profiles.avatar_url} />
                        <AvatarFallback>{post.profiles.full_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium">{post.profiles.full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(post.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant={post.is_approved_for_startup ? 'default' : 'outline'}
                            onClick={() => handleTogglePostApproval(post.id, post.is_approved_for_startup)}
                          >
                            {post.is_approved_for_startup ? (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Approved
                              </>
                            ) : (
                              'Approve'
                            )}
                          </Button>
                        </div>
                        <p className="text-sm line-clamp-3">{post.content}</p>
                        {post.image_url && (
                          <img
                            src={post.image_url}
                            alt="Post"
                            className="mt-2 rounded-lg max-h-48 object-cover"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
