import React, { useState } from 'react';
import { useDatingProfile } from '@/hooks/useDatingProfile';
import { useAuth } from '@/contexts/AuthContext';
import DatingProfileForm from './DatingProfileForm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Pencil, Eye, Heart, MapPin, Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function DatingProfileView() {
  const { user } = useAuth();
  const { profile, loading, upsertProfile, uploadImage, refetch } = useDatingProfile();
  const [editing, setEditing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/20 flex items-center justify-center">
            <Heart className="w-8 h-8 text-pink-500" />
          </div>
          <h3 className="text-lg font-semibold">No Dating Profile Yet</h3>
          <p className="text-sm text-muted-foreground">Create your dating profile to start discovering people</p>
          <Button onClick={() => setEditing(true)} className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white border-0">
            Create Profile
          </Button>
        </div>
        {editing && (
          <div className="mt-6">
            <DatingProfileForm
              profile={null}
              onSave={async (data) => {
                await upsertProfile(data);
                setEditing(false);
              }}
              onUploadImage={uploadImage}
            />
          </div>
        )}
      </div>
    );
  }

  if (editing) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit Profile</h2>
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
        <DatingProfileForm
          profile={profile}
          onSave={async (data) => {
            await upsertProfile(data);
            setEditing(false);
          }}
          onUploadImage={uploadImage}
        />
      </div>
    );
  }

  const images = profile.images_json?.length ? profile.images_json : [];

  const handleToggleActive = async () => {
    await upsertProfile({ is_active: !profile.is_active });
    toast.success(profile.is_active ? 'Profile hidden' : 'Profile visible');
  };

  // Preview card (how others see you)
  if (previewMode) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Eye className="w-4 h-4" /> Profile Preview
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setPreviewMode(false)}>Back</Button>
        </div>
        <div className="max-w-sm mx-auto rounded-3xl overflow-hidden shadow-2xl bg-card border border-border" style={{ aspectRatio: '3/4' }}>
          <div className="relative w-full h-[70%] bg-muted">
            {images.length > 0 ? (
              <img src={images[0]} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">No photos</div>
            )}
            {images.length > 1 && (
              <div className="absolute top-3 left-0 right-0 flex justify-center gap-1 px-4">
                {images.map((_, i) => (
                  <div key={i} className={cn('h-1 rounded-full flex-1', i === 0 ? 'bg-white' : 'bg-white/40')} />
                ))}
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-3 left-4">
              <h3 className="text-xl font-bold text-white drop-shadow-lg">Your Name</h3>
            </div>
          </div>
          <div className="p-4 h-[30%] flex flex-col justify-between">
            <div className="space-y-1">
              {profile.looking_for && (
                <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 font-medium">
                  {profile.looking_for}
                </span>
              )}
              {profile.bio && <p className="text-sm text-muted-foreground line-clamp-2">{profile.bio}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
          My Dating Profile
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPreviewMode(true)}>
            <Eye className="w-3.5 h-3.5 mr-1" /> Preview
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
          </Button>
        </div>
      </div>

      {/* Active toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border">
        <div>
          <Label className="text-sm font-medium">Profile Visible</Label>
          <p className="text-xs text-muted-foreground">Others can discover you when active</p>
        </div>
        <Switch checked={profile.is_active ?? false} onCheckedChange={handleToggleActive} />
      </div>

      {/* Photos grid */}
      <div>
        <h3 className="text-sm font-medium mb-2 text-muted-foreground">Photos</h3>
        <div className="grid grid-cols-3 gap-2">
          {images.map((url, i) => (
            <div key={i} className="aspect-[3/4] rounded-xl overflow-hidden bg-muted border border-border">
              <img src={url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
          {images.length === 0 && (
            <div className="aspect-[3/4] rounded-xl border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-xs">
              No photos
            </div>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="space-y-3">
        {profile.bio && (
          <div className="p-3 rounded-xl bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Bio</p>
            <p className="text-sm">{profile.bio}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Gender</p>
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-pink-500" />
              <span className="text-sm font-medium">{profile.gender || 'Not set'}</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Interested In</p>
            <div className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-sm font-medium">{profile.interested_in || 'Not set'}</span>
            </div>
          </div>
        </div>

        {profile.looking_for && (
          <div className="p-3 rounded-xl bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Looking For</p>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <Badge variant="secondary" className="bg-pink-500/10 text-pink-400 border-pink-500/20">
                {profile.looking_for}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
