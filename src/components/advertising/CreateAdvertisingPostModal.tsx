import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, X, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface CreateAdvertisingPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated: () => void;
}

export default function CreateAdvertisingPostModal({
  open,
  onOpenChange,
  onPostCreated
}: CreateAdvertisingPostModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  
  // Subscription and targeting state
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const [targetingEnabled, setTargetingEnabled] = useState(false);
  const [universities, setUniversities] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedUniversities, setSelectedUniversities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && user) {
      fetchSubscriptionAndUniversities();
    }
  }, [open, user]);

  const fetchSubscriptionAndUniversities = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch current subscription
      const { data: userSub, error: subError } = await supabase
        .from('user_subscriptions')
        .select('subscriptions(name, targeting_enabled)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (subError) throw subError;

      const subscription = userSub?.subscriptions as any;
      setSubscriptionTier(subscription?.name?.toLowerCase() || 'free');
      setTargetingEnabled(subscription?.targeting_enabled || false);

      // Fetch universities if targeting is enabled
      if (subscription?.targeting_enabled) {
        const { data: univData, error: univError } = await supabase
          .from('universities')
          .select('id, name')
          .order('name');

        if (univError) throw univError;
        setUniversities(univData || []);
      }
    } catch (error) {
      console.error('Error fetching subscription and universities:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUniversity = (universityId: string) => {
    setSelectedUniversities(prev => 
      prev.includes(universityId)
        ? prev.filter(id => id !== universityId)
        : [...prev, universityId]
    );
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !imageFile || !title.trim() || !redirectUrl.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and select an image.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setProcessingStatus("Processing image...");
    
    try {
      // Process image using the new edge function
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('userId', user.id);
      formData.append('type', 'advertising');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No auth session');

      const response = await supabase.functions.invoke('process-image', {
        body: formData,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw response.error;
      
      const { imageUrls } = response.data;
      
      setProcessingStatus("Saving post...");

      // Create advertising post with all image URLs
      const { error: insertError } = await supabase
        .from('advertising_posts')
        .insert({
          company_id: user.id,
          title: title.trim(),
          description: description.trim(),
          image_url: imageUrls.original, // Keep for backwards compatibility
          image_thumbnail_url: imageUrls.thumbnail,
          image_medium_url: imageUrls.medium,
          image_original_url: imageUrls.original,
          redirect_url: redirectUrl.trim(),
          target_universities: targetingEnabled && selectedUniversities.length > 0 
            ? selectedUniversities 
            : null
        });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Advertising post created successfully!"
      });

      // Reset form
      setTitle('');
      setDescription('');
      setRedirectUrl('');
      setImageFile(null);
      setImagePreview(null);
      setSelectedUniversities([]);
      onOpenChange(false);
      onPostCreated();
    } catch (error) {
      console.error('Error creating advertising post:', error);
      toast({
        title: "Error",
        description: "Failed to create advertising post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setProcessingStatus(null);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Advertising Post</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="image">Image *</Label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Click to upload an image
                </p>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('image')?.click()}
                >
                  Choose Image
                </Button>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter advertising post title"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter post description (optional)"
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Redirect URL */}
          <div className="space-y-2">
            <Label htmlFor="url">Website URL *</Label>
            <Input
              id="url"
              type="url"
              value={redirectUrl}
              onChange={(e) => setRedirectUrl(e.target.value)}
              placeholder="https://yourwebsite.com"
            />
          </div>

          {/* Targeting Section */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Audience Targeting</Label>
                <p className="text-sm text-muted-foreground">
                  {targetingEnabled 
                    ? 'Select specific universities to target your ad' 
                    : 'Available in Growth and Premium plans'}
                </p>
              </div>
              {!targetingEnabled && (
                <Badge variant="secondary" className="gap-1">
                  <Lock className="w-3 h-3" />
                  Locked
                </Badge>
              )}
            </div>

            {targetingEnabled && universities.length > 0 && (
              <div className="space-y-2">
                <Label>Target Universities (Optional)</Label>
                <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                  {universities.map((university) => (
                    <div
                      key={university.id}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="checkbox"
                        id={`uni-${university.id}`}
                        checked={selectedUniversities.includes(university.id)}
                        onChange={() => toggleUniversity(university.id)}
                        className="rounded border-input"
                      />
                      <label
                        htmlFor={`uni-${university.id}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {university.name}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty to show ad to all universities
                </p>
              </div>
            )}

            {!targetingEnabled && (
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <Lock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Upgrade to Growth or Premium to unlock audience targeting features
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? (processingStatus || "Creating...") : "Create Post"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}