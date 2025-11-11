import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type ClubRole = 'owner' | 'admin' | 'moderator' | 'member';

export interface ClubPermissions {
  canEditClubProfile: boolean;
  canManageMembers: boolean;
  canCreateEvents: boolean;
  canEditEvents: boolean;
  canDeleteEvents: boolean;
  canManagePosts: boolean;
  role: ClubRole | null;
  isOwner: boolean;
  isMember: boolean;
}

export const useClubPermissions = (clubId: string | null, clubOwnerId?: string) => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<ClubPermissions>({
    canEditClubProfile: false,
    canManageMembers: false,
    canCreateEvents: false,
    canEditEvents: false,
    canDeleteEvents: false,
    canManagePosts: false,
    role: null,
    isOwner: false,
    isMember: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !clubId) {
      setLoading(false);
      return;
    }

    checkPermissions();
  }, [user, clubId, clubOwnerId]);

  const checkPermissions = async () => {
    if (!user || !clubId) return;

    try {
      // Check if user is the club owner
      const isOwner = clubOwnerId === user.id;

      // Check membership and role
      const { data: membership, error } = await supabase
        .from('club_memberships')
        .select('role')
        .eq('club_id', clubId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking permissions:', error);
      }

      const role = isOwner ? 'owner' : (membership?.role?.toLowerCase() as ClubRole) || null;
      const isMember = !!membership || isOwner;

      // Define permissions based on role
      let perms: ClubPermissions = {
        canEditClubProfile: false,
        canManageMembers: false,
        canCreateEvents: false,
        canEditEvents: false,
        canDeleteEvents: false,
        canManagePosts: false,
        role,
        isOwner,
        isMember,
      };

      if (isOwner) {
        // Owner has all permissions
        perms = {
          canEditClubProfile: true,
          canManageMembers: true,
          canCreateEvents: true,
          canEditEvents: true,
          canDeleteEvents: true,
          canManagePosts: true,
          role: 'owner',
          isOwner: true,
          isMember: true,
        };
      } else if (role === 'admin') {
        // Admin can manage members and events, but not club profile
        perms = {
          canEditClubProfile: false,
          canManageMembers: true,
          canCreateEvents: true,
          canEditEvents: true,
          canDeleteEvents: true,
          canManagePosts: true,
          role: 'admin',
          isOwner: false,
          isMember: true,
        };
      } else if (role === 'moderator') {
        // Moderator can create and edit events, manage posts
        perms = {
          canEditClubProfile: false,
          canManageMembers: false,
          canCreateEvents: true,
          canEditEvents: true,
          canDeleteEvents: false,
          canManagePosts: true,
          role: 'moderator',
          isOwner: false,
          isMember: true,
        };
      } else if (role === 'member') {
        // Member has no special permissions
        perms = {
          canEditClubProfile: false,
          canManageMembers: false,
          canCreateEvents: false,
          canEditEvents: false,
          canDeleteEvents: false,
          canManagePosts: false,
          role: 'member',
          isOwner: false,
          isMember: true,
        };
      }

      setPermissions(perms);
    } catch (error) {
      console.error('Error checking permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  return { permissions, loading, refetch: checkPermissions };
};
