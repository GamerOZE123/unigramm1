import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Users2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import type { AdminSection } from './AdminSidebar';

interface TeamMember {
  id: string;
  name: string;
  email: string | null;
  password: string;
  allowed_sections: string[];
  is_active: boolean;
  created_at: string;
}

const ALL_SECTIONS: { key: AdminSection; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'pending', label: 'Pending Accounts' },
  { key: 'waitlist', label: 'Waitlist' },
  { key: 'users', label: 'User Management' },
  { key: 'auth', label: 'Authenticated Users' },
  { key: 'overflow', label: 'Overflow' },
  { key: 'university', label: 'University Features' },
  { key: 'flags', label: 'Feature Flags' },
  { key: 'config', label: 'App Config' },
  { key: 'broadcast', label: 'Broadcast' },
];

interface Props {
  password: string;
}

const AdminTeamMembers: React.FC<Props> = ({ password }) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formSections, setFormSections] = useState<string[]>([]);

  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'fetch_team_members' },
    });
    if (!error && data?.members) setMembers(data.members);
    else if (data?.error) toast.error(data.error);
    setLoading(false);
  };

  useEffect(() => { fetchMembers(); }, []);

  const openAdd = () => {
    setEditing(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormSections([]);
    setShowPassword(false);
    setDialogOpen(true);
  };

  const openEdit = (m: TeamMember) => {
    setEditing(m);
    setFormName(m.name);
    setFormEmail(m.email || '');
    setFormPassword('');
    setFormSections(m.allowed_sections);
    setShowPassword(false);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) { toast.error('Name is required'); return; }
    if (!editing && !formPassword.trim()) { toast.error('Password is required'); return; }
    if (formSections.length === 0) { toast.error('Select at least one section'); return; }

    setSaving(true);
    if (editing) {
      const { data, error } = await supabase.functions.invoke('verify-admin', {
        body: {
          password,
          action: 'update_team_member',
          member_id: editing.id,
          name: formName,
          email: formEmail || null,
          member_password: formPassword || undefined,
          allowed_sections: formSections,
        },
      });
      if (error || data?.error) toast.error(data?.error || 'Failed to update');
      else { toast.success('Team member updated'); setDialogOpen(false); fetchMembers(); }
    } else {
      const { data, error } = await supabase.functions.invoke('verify-admin', {
        body: {
          password,
          action: 'add_team_member',
          name: formName,
          email: formEmail || null,
          member_password: formPassword,
          allowed_sections: formSections,
        },
      });
      if (error || data?.error) toast.error(data?.error || 'Failed to add');
      else { toast.success('Team member added'); setDialogOpen(false); fetchMembers(); }
    }
    setSaving(false);
  };

  const handleToggleActive = async (m: TeamMember) => {
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'update_team_member', member_id: m.id, is_active: !m.is_active },
    });
    if (error || data?.error) toast.error('Failed to update');
    else { toast.success(m.is_active ? 'Deactivated' : 'Activated'); fetchMembers(); }
  };

  const handleDelete = async (m: TeamMember) => {
    if (!confirm(`Remove ${m.name} from the team?`)) return;
    const { data, error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'delete_team_member', member_id: m.id },
    });
    if (error || data?.error) toast.error('Failed to delete');
    else { toast.success('Team member removed'); fetchMembers(); }
  };

  const toggleSection = (key: string) => {
    setFormSections(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users2 className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Team Members</h2>
          <Badge variant="secondary">{members.length}</Badge>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="w-4 h-4 mr-1" /> Add Member
        </Button>
      </div>

      <Card className="border-border/40">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading…</div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No team members yet. Add one to share admin access.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Sections</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="text-muted-foreground">{m.email || '—'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[300px]">
                        {m.allowed_sections.map(s => (
                          <Badge key={s} variant="outline" className="text-xs capitalize">
                            {s.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={m.is_active} onCheckedChange={() => handleToggleActive(m)} />
                        <span className={`text-xs ${m.is_active ? 'text-green-400' : 'text-muted-foreground'}`}>
                          {m.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(m)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Team Member' : 'Add Team Member'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Team member name" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="Optional email" />
            </div>
            <div>
              <Label>{editing ? 'New Password (leave blank to keep)' : 'Password *'}</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formPassword}
                  onChange={e => setFormPassword(e.target.value)}
                  placeholder={editing ? 'Leave blank to keep current' : 'Set a password'}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label>Allowed Sections *</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {ALL_SECTIONS.map(s => (
                  <label key={s.key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={formSections.includes(s.key)}
                      onCheckedChange={() => toggleSection(s.key)}
                    />
                    {s.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTeamMembers;
