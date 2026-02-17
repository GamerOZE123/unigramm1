import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

interface Member {
  user_id: string;
  role: string;
  full_name: string | null;
  username: string;
  avatar_url: string | null;
}

interface CommunityMembersPanelProps {
  communityId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CommunityMembersPanel: React.FC<CommunityMembersPanelProps> = ({
  communityId,
  open,
  onOpenChange,
}) => {
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (!open) return;
    const fetchMembers = async () => {
      const { data: memberRows } = await supabase
        .from('community_members')
        .select('user_id, role')
        .eq('community_id', communityId);

      if (!memberRows?.length) return;

      const userIds = memberRows.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
      setMembers(
        memberRows.map(m => ({
          ...m,
          ...(profileMap.get(m.user_id) || { full_name: null, username: 'unknown', avatar_url: null }),
        }))
      );
    };
    fetchMembers();
  }, [communityId, open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Members ({members.length})</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          {members.map((member) => (
            <div key={member.user_id} className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={member.avatar_url || ''} />
                <AvatarFallback>{(member.full_name || member.username)?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {member.full_name || member.username}
                </p>
                <p className="text-xs text-muted-foreground">@{member.username}</p>
              </div>
              {member.role === 'admin' && (
                <Badge variant="secondary" className="text-xs">Admin</Badge>
              )}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
