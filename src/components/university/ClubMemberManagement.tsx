import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Edit2, Trash2, Plus, Search, UserPlus, Check, X, Users, Crown, Shield, User } from 'lucide-react';
import { useClubMembers } from '@/hooks/useClubMembers';
import { useClubJoinRequests } from '@/hooks/useClubJoinRequests';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ClubMemberManagementProps {
  clubId: string;
}

interface StudentUser {
  user_id: string;
  full_name: string;
  avatar_url: string;
  university: string;
  major: string;
}

const PREDEFINED_ROLES = [
  { value: 'Admin', label: 'Admin', icon: Crown, description: 'Full access to manage club' },
  { value: 'Moderator', label: 'Moderator', icon: Shield, description: 'Can manage posts and events' },
  { value: 'Member', label: 'Member', icon: User, description: 'Regular club member' },
];

export default function ClubMemberManagement({ clubId }: ClubMemberManagementProps) {
  const { members, loading, removeMember, updateMemberRole, refetch } = useClubMembers(clubId);
  const { requests, loading: requestsLoading, acceptRequest, rejectRequest } = useClubJoinRequests(clubId, false);
  const { toast } = useToast();
  
  // State for member management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [customRole, setCustomRole] = useState('');
  const [isCustomRole, setIsCustomRole] = useState(false);
  
  // State for adding new members
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StudentUser[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentUser | null>(null);
  const [newMemberRole, setNewMemberRole] = useState('Member');
  const [newMemberCustomRole, setNewMemberCustomRole] = useState('');
  const [isNewMemberCustomRole, setIsNewMemberCustomRole] = useState(false);
  const [searchingStudents, setSearchingStudents] = useState(false);

  // Get unique custom roles from existing members
  const existingCustomRoles = useMemo(() => {
    const roles = new Set<string>();
    members.forEach(member => {
      if (member.role && !PREDEFINED_ROLES.find(r => r.value === member.role)) {
        roles.add(member.role);
      }
    });
    return Array.from(roles);
  }, [members]);

  // All available roles (predefined + custom)
  const allRoles = useMemo(() => [
    ...PREDEFINED_ROLES,
    ...existingCustomRoles.map(role => ({
      value: role,
      label: role,
      icon: User,
      description: 'Custom role'
    }))
  ], [existingCustomRoles]);

  // Filter members by search
  const filteredMembers = useMemo(() => {
    if (!searchQuery) return members;
    const query = searchQuery.toLowerCase();
    return members.filter(member => 
      member.profiles?.full_name?.toLowerCase().includes(query) ||
      member.role?.toLowerCase().includes(query) ||
      member.profiles?.university?.toLowerCase().includes(query)
    );
  }, [members, searchQuery]);

  // Search for students to add
  const searchStudents = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchingStudents(true);
    try {
      const memberUserIds = members.map(m => m.user_id);
      
      let queryBuilder = supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, university, major')
        .eq('user_type', 'student')
        .ilike('full_name', `%${query}%`)
        .limit(10);

      // Only add the exclusion filter if there are existing members
      if (memberUserIds.length > 0) {
        queryBuilder = queryBuilder.not('user_id', 'in', `(${memberUserIds.join(',')})`);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching students:', error);
    } finally {
      setSearchingStudents(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAddMemberOpen) {
        searchStudents(studentSearchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [studentSearchQuery, isAddMemberOpen]);

  // Add member to club
  const handleAddMember = async () => {
    if (!selectedStudent) return;

    const roleToAssign = isNewMemberCustomRole ? newMemberCustomRole : newMemberRole;
    if (!roleToAssign.trim()) {
      toast({
        title: "Error",
        description: "Please select or enter a role",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('club_memberships')
        .insert({
          club_id: clubId,
          user_id: selectedStudent.user_id,
          role: roleToAssign.trim()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedStudent.full_name} has been added as ${roleToAssign}`
      });

      refetch();
      setIsAddMemberOpen(false);
      setSelectedStudent(null);
      setStudentSearchQuery('');
      setNewMemberRole('Member');
      setNewMemberCustomRole('');
      setIsNewMemberCustomRole(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add member",
        variant: "destructive"
      });
    }
  };

  // Update member role
  const handleUpdateRole = async () => {
    if (!selectedMemberId) return;

    const roleToAssign = isCustomRole ? customRole : selectedRole;
    if (!roleToAssign.trim()) {
      toast({
        title: "Error",
        description: "Please select or enter a role",
        variant: "destructive"
      });
      return;
    }

    await updateMemberRole(selectedMemberId, roleToAssign.trim());
    setSelectedMemberId(null);
    setSelectedRole('');
    setCustomRole('');
    setIsCustomRole(false);
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (window.confirm(`Are you sure you want to remove ${memberName} from the club?`)) {
      await removeMember(memberId);
    }
  };

  const pendingRequests = requests.filter(req => req.status === 'pending' && req.request_type === 'request');

  const handleAcceptRequest = async (requestId: string, studentId: string) => {
    await acceptRequest(requestId, studentId, clubId);
  };

  const getRoleIcon = (role: string) => {
    const predefinedRole = PREDEFINED_ROLES.find(r => r.value === role);
    if (predefinedRole) {
      const Icon = predefinedRole.icon;
      return <Icon className="h-4 w-4" />;
    }
    return <User className="h-4 w-4" />;
  };

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "outline" => {
    switch (role) {
      case 'Admin': return 'default';
      case 'Moderator': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground text-center">Loading members...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Member Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {members.length} members in club
          </p>
        </div>
        <Button onClick={() => setIsAddMemberOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Member
        </Button>
      </div>

      {/* Pending Join Requests */}
      {pendingRequests.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Pending Requests ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingRequests.map((request) => (
                <div 
                  key={request.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={request.profiles?.avatar_url || ''} />
                      <AvatarFallback>{request.profiles?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{request.profiles?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{request.profiles?.university}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleAcceptRequest(request.id, request.student_id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => rejectRequest(request.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Members List */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[500px]">
            {filteredMembers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No members found</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredMembers.map((member) => (
                  <div 
                    key={member.id} 
                    className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.profiles?.avatar_url || ''} />
                        <AvatarFallback>{member.profiles?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.profiles?.full_name}</p>
                        <p className="text-sm text-muted-foreground">{member.profiles?.university}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge variant={getRoleBadgeVariant(member.role || 'Member')} className="gap-1">
                        {getRoleIcon(member.role || 'Member')}
                        {member.role || 'Member'}
                      </Badge>
                      
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedMemberId(member.id);
                            setSelectedRole(member.role || 'Member');
                            setIsCustomRole(!PREDEFINED_ROLES.find(r => r.value === member.role));
                            setCustomRole(PREDEFINED_ROLES.find(r => r.value === member.role) ? '' : (member.role || ''));
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRemoveMember(member.id, member.profiles?.full_name || 'this member')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Student Search */}
            <div className="space-y-2">
              <Label>Search Student</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Search Results or Selected Student */}
            {selectedStudent ? (
              <div className="p-3 rounded-lg bg-primary/10 border-2 border-primary flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedStudent.avatar_url || ''} />
                    <AvatarFallback>{selectedStudent.full_name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{selectedStudent.full_name}</p>
                    <p className="text-xs text-muted-foreground">{selectedStudent.university}</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setSelectedStudent(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[200px] border rounded-lg">
                {searchingStudents ? (
                  <div className="p-4 text-center text-muted-foreground">Searching...</div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {studentSearchQuery.length < 2 ? 'Type to search students' : 'No students found'}
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {searchResults.map((student) => (
                      <div
                        key={student.user_id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                        onClick={() => setSelectedStudent(student)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={student.avatar_url || ''} />
                          <AvatarFallback>{student.full_name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{student.full_name}</p>
                          <p className="text-xs text-muted-foreground">{student.university}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            )}

            {/* Role Selection */}
            <div className="space-y-2">
              <Label>Assign Role</Label>
              <Select
                value={isNewMemberCustomRole ? 'custom' : newMemberRole}
                onValueChange={(value) => {
                  if (value === 'custom') {
                    setIsNewMemberCustomRole(true);
                  } else {
                    setIsNewMemberCustomRole(false);
                    setNewMemberRole(value);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {allRoles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex items-center gap-2">
                        <role.icon className="h-4 w-4" />
                        {role.label}
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Custom Role
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {isNewMemberCustomRole && (
                <Input
                  placeholder="Enter custom role name..."
                  value={newMemberCustomRole}
                  onChange={(e) => setNewMemberCustomRole(e.target.value)}
                />
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddMember} 
              disabled={!selectedStudent || (!newMemberRole && !newMemberCustomRole)}
            >
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={!!selectedMemberId} onOpenChange={(open) => !open && setSelectedMemberId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Member Role</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Role</Label>
              <Select
                value={isCustomRole ? 'custom' : selectedRole}
                onValueChange={(value) => {
                  if (value === 'custom') {
                    setIsCustomRole(true);
                  } else {
                    setIsCustomRole(false);
                    setSelectedRole(value);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {allRoles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex items-center gap-2">
                        <role.icon className="h-4 w-4" />
                        {role.label}
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Custom Role
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {isCustomRole && (
                <Input
                  placeholder="Enter custom role name..."
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                />
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedMemberId(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
