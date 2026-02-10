import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { DatingProfile } from '@/hooks/useDatingProfile';

interface DatingProfileFormProps {
  profile: DatingProfile | null;
  onSave: (data: any) => Promise<void>;
  onUploadImage: (file: File) => Promise<string | null>;
}

export default function DatingProfileForm({ profile, onSave, onUploadImage }: DatingProfileFormProps) {
  const [bio, setBio] = useState(profile?.bio || '');
  const [gender, setGender] = useState(profile?.gender || '');
  const [interestedIn, setInterestedIn] = useState(profile?.interested_in || '');
  const [lookingFor, setLookingFor] = useState(profile?.looking_for || '');
  const [images, setImages] = useState<string[]>(profile?.images_json || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) {
      toast.error('Maximum 5 photos');
      return;
    }
    setUploading(true);
    for (const file of files) {
      const url = await onUploadImage(file);
      if (url) setImages(prev => [...prev, url]);
    }
    setUploading(false);
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!gender || !interestedIn) {
      toast.error('Please fill in gender and interested in');
      return;
    }
    setSaving(true);
    await onSave({
      bio,
      gender,
      interested_in: interestedIn,
      looking_for: lookingFor,
      images_json: images,
      is_active: true,
    });
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* Photos */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Photos (up to 5)</Label>
        <div className="grid grid-cols-3 gap-3">
          {images.map((url, i) => (
            <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted border border-border group">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
          {images.length < 5 && (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="aspect-[3/4] rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-pink-500/50 hover:text-pink-500 transition-colors"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              <span className="text-xs">Add</span>
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleUpload} />
      </div>

      {/* Bio */}
      <div>
        <Label htmlFor="dating-bio">Bio</Label>
        <Textarea
          id="dating-bio"
          value={bio}
          onChange={e => setBio(e.target.value)}
          placeholder="Tell people about yourself..."
          maxLength={300}
          rows={3}
        />
      </div>

      {/* Gender */}
      <div>
        <Label>Gender</Label>
        <Select value={gender} onValueChange={setGender}>
          <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Male">Male</SelectItem>
            <SelectItem value="Female">Female</SelectItem>
            <SelectItem value="Non-binary">Non-binary</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Interested In */}
      <div>
        <Label>Interested In</Label>
        <Select value={interestedIn} onValueChange={setInterestedIn}>
          <SelectTrigger><SelectValue placeholder="Who are you interested in?" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Male">Male</SelectItem>
            <SelectItem value="Female">Female</SelectItem>
            <SelectItem value="Everyone">Everyone</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Looking For */}
      <div>
        <Label>Looking For</Label>
        <Select value={lookingFor} onValueChange={setLookingFor}>
          <SelectTrigger><SelectValue placeholder="What are you looking for?" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Relationship">Relationship</SelectItem>
            <SelectItem value="Casual">Casual</SelectItem>
            <SelectItem value="Friendship">Friendship</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white border-0"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        {profile ? 'Update Profile' : 'Create Profile'}
      </Button>
    </div>
  );
}
