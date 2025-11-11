import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Crown, Shield, User, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface GroupMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user?: {
    full_name: string;
    username: string;
    avatar_url: string;
    university: string;
  };
}

interface GroupMemberSearchProps {
  members: GroupMember[];
  onClose: () => void;
}

export default function GroupMemberSearch({ members, onClose }: GroupMemberSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [filteredMembers, setFilteredMembers] = useState<GroupMember[]>(members);

  useEffect(() => {
    let filtered = members;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (member) =>
          member.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.user?.university?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter((member) => member.role === roleFilter);
    }

    setFilteredMembers(filtered);
  }, [searchQuery, roleFilter, members]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'moderator':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'moderator':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Group Members ({filteredMembers.length})
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="moderator">Moderators</SelectItem>
              <SelectItem value="member">Members</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {filteredMembers.length > 0 ? (
            filteredMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={member.user?.avatar_url} />
                  <AvatarFallback>
                    {member.user?.full_name?.charAt(0) ||
                      member.user?.username?.charAt(0) ||
                      'U'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">
                      {member.user?.full_name || member.user?.username}
                    </p>
                    {getRoleIcon(member.role)}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {member.user?.university || 'No university'}
                  </p>
                </div>

                <Badge variant={getRoleBadgeVariant(member.role)}>
                  {member.role}
                </Badge>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No members found
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
