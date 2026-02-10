import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DatingProfile {
  id: string;
  user_id: string;
  bio: string | null;
  gender: string | null;
  interested_in: string | null;
  looking_for: string | null;
  images_json: string[] | null;
  prompts_json: any | null;
  is_active: boolean | null;
  last_active: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useDatingProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DatingProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('dating_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProfile({
          ...data,
          images_json: Array.isArray(data.images_json) ? data.images_json as string[] : [],
        });
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('Error fetching dating profile:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const upsertProfile = async (updates: Partial<Omit<DatingProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!user) return;
    try {
      const payload = {
        user_id: user.id,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      if (profile) {
        const { error } = await supabase
          .from('dating_profiles')
          .update(payload)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('dating_profiles')
          .insert(payload);
        if (error) throw error;
      }

      await fetchProfile();
      toast.success('Dating profile saved!');
    } catch (err: any) {
      console.error('Error saving dating profile:', err);
      toast.error('Failed to save profile');
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) return null;
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from('post-images')
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from('post-images')
        .getPublicUrl(path);
      return urlData.publicUrl;
    } catch (err) {
      console.error('Error uploading image:', err);
      toast.error('Failed to upload image');
      return null;
    }
  };

  return { profile, loading, upsertProfile, uploadImage, refetch: fetchProfile };
}
