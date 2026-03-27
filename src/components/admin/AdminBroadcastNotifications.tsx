import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bell, Send, Users, Search, Smartphone, AlertTriangle, History, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UserRow {
  user_id: string;
  full_name: string | null;
  username: string | null;
  university: string | null;
}

interface BroadcastLog {
  id: string;
  sent_by: string;
  title: string;
  message: string;
  deep_link: string | null;
  audience_type: string;
  recipient_count: number;
  sent_at: string;
}

const DEEP_LINK_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: '/home', label: 'Home' },
  { value: '/university', label: 'University' },
  { value: '/clubs', label: 'Clubs' },
  { value: '/confessions', label: 'Confessions' },
  { value: '/carpooling', label: 'Carpool' },
  { value: '/startups', label: 'Startups' },
  { value: '/advertising', label: 'Advertising' },
];

const BATCH_SIZE = 50;

interface Props {
  password: string;
}

const AdminBroadcastNotifications: React.FC<Props> = ({ password }) => {
  const [audience, setAudience] = useState<'all' | 'select' | ''>('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [deepLink, setDeepLink] = useState('none');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Logs state
  const [logs, setLogs] = useState<BroadcastLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (audience === 'select' && users.length === 0) {
      fetchUsers();
    }
  }, [audience]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-admin', {
        body: { password, action: 'fetch_users' },
      });
      if (error || !data?.valid) throw new Error('Failed to fetch users');
      setUsers(
        (data.users || []).map((u: any) => ({
          user_id: u.user_id,
          full_name: u.full_name,
          username: u.username,
          university: u.university,
        }))
      );
    } catch {
      toast.error('Failed to load users');
    }
    setLoadingUsers(false);
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-admin', {
        body: { password, action: 'fetch_broadcast_logs' },
      });
      if (error || !data?.valid) throw new Error('Failed to fetch logs');
      setLogs(data.logs || []);
    } catch {
      toast.error('Failed to load broadcast logs');
    }
    setLoadingLogs(false);
  };

  const handleDeleteLog = async (logId: string) => {
    if (!confirm('Delete this broadcast log entry?')) return;
    try {
      const { data, error } = await supabase.functions.invoke('verify-admin', {
        body: { password, action: 'delete_broadcast_log', id: logId },
      });
      if (error || !data?.success) throw new Error('Failed to delete');
      setLogs((prev) => prev.filter((l) => l.id !== logId));
      toast.success('Log entry deleted');
    } catch {
      toast.error('Failed to delete log entry');
    }
  };

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const q = userSearch.toLowerCase();
    return users.filter(
      (u) =>
        u.full_name?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.university?.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const selectAll = () => setSelectedUserIds(new Set(filteredUsers.map((u) => u.user_id)));
  const deselectAll = () => setSelectedUserIds(new Set());

  const canSend = title.trim() && body.trim() && (audience === 'all' || selectedUserIds.size > 0);

  const handleSend = async () => {
    setShowConfirm(false);
    setSending(true);

    try {
      let targetIds: string[];

      if (audience === 'all') {
        const { data, error } = await supabase.functions.invoke('verify-admin', {
          body: { password, action: 'fetch_all_user_ids' },
        });
        if (error || !data?.valid) throw new Error('Failed to fetch user IDs');
        targetIds = data.user_ids;
      } else {
        targetIds = Array.from(selectedUserIds);
      }

      if (targetIds.length === 0) {
        toast.error('No users to notify');
        setSending(false);
        return;
      }

      setProgress({ current: 0, total: targetIds.length });

      for (let i = 0; i < targetIds.length; i += BATCH_SIZE) {
        const batch = targetIds.slice(i, i + BATCH_SIZE);
        const isFirstBatch = i === 0;
        const { data, error } = await supabase.functions.invoke('verify-admin', {
          body: {
            password,
            action: 'broadcast_batch',
            user_ids: batch,
            title: title.trim(),
            message: body.trim(),
            navigate_to: deepLink === 'none' ? null : deepLink,
            log_broadcast: isFirstBatch,
            audience_type: audience,
            total_recipients: targetIds.length,
            all_target_ids: audience === 'select' ? targetIds : null,
          },
        });
        if (error || !data?.valid) {
          toast.error(`Batch failed at ${i}: ${data?.error || 'Unknown error'}`);
          break;
        }
        setProgress({ current: Math.min(i + BATCH_SIZE, targetIds.length), total: targetIds.length });
      }

      toast.success(`Broadcast sent to ${targetIds.length} users`);
      setTitle('');
      setBody('');
      setDeepLink('none');
      setSelectedUserIds(new Set());
      fetchLogs(); // Refresh logs
    } catch (err: any) {
      toast.error(err.message || 'Failed to send broadcast');
    }

    setSending(false);
    setProgress({ current: 0, total: 0 });
  };

  const recipientCount = audience === 'all' ? users.length || '(all approved)' : selectedUserIds.size;

  return (
    <Tabs defaultValue="compose" className="space-y-4">
      <TabsList>
        <TabsTrigger value="compose" className="gap-2">
          <Send className="w-3.5 h-3.5" /> Compose
        </TabsTrigger>
        <TabsTrigger value="logs" className="gap-2">
          <History className="w-3.5 h-3.5" /> Sent Log
          {logs.length > 0 && (
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{logs.length}</Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="compose" className="space-y-6">
        {/* Audience Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" /> Audience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={audience} onValueChange={(v) => setAudience(v as 'all' | 'select')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="audience-all" />
                <Label htmlFor="audience-all">All Approved Users</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="select" id="audience-select" />
                <Label htmlFor="audience-select">Select Users</Label>
              </div>
            </RadioGroup>

            {audience === 'select' && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, username, university…"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={selectAll}>All</Button>
                  <Button variant="outline" size="sm" onClick={deselectAll}>None</Button>
                </div>
                <Badge variant="secondary">{selectedUserIds.size} selected</Badge>
                <ScrollArea className="h-60 border rounded-md">
                  {loadingUsers ? (
                    <p className="p-4 text-sm text-muted-foreground">Loading…</p>
                  ) : (
                    <div className="p-2 space-y-1">
                      {filteredUsers.map((u) => (
                        <label key={u.user_id} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer">
                          <Checkbox checked={selectedUserIds.has(u.user_id)} onCheckedChange={() => toggleUser(u.user_id)} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {u.full_name || 'No name'}{' '}
                              <span className="text-muted-foreground font-normal">@{u.username}</span>
                            </p>
                            {u.university && <p className="text-xs text-muted-foreground truncate">{u.university}</p>}
                          </div>
                        </label>
                      ))}
                      {filteredUsers.length === 0 && (
                        <p className="text-sm text-muted-foreground p-4 text-center">No users found</p>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-4 h-4" /> Notification Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Title (max 60 chars)</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 60))} placeholder="Notification title…" maxLength={60} />
              <p className="text-xs text-muted-foreground mt-1">{title.length}/60</p>
            </div>
            <div>
              <Label>Body (max 160 chars)</Label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value.slice(0, 160))} placeholder="Notification message…" maxLength={160} className="min-h-[60px]" />
              <p className="text-xs text-muted-foreground mt-1">{body.length}/160</p>
            </div>
            <div>
              <Label>Deep Link Target</Label>
              <Select value={deepLink} onValueChange={setDeepLink}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEEP_LINK_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="w-4 h-4" /> Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-xl p-4 max-w-xs mx-auto space-y-1 shadow-sm border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
                  <Bell className="w-3 h-3 text-primary" />
                </div>
                <span className="font-medium">Unigramm</span>
                <span className="ml-auto">now</span>
              </div>
              <p className="text-sm font-semibold text-foreground">{title || 'Notification Title'}</p>
              <p className="text-xs text-muted-foreground">{body || 'Notification body will appear here…'}</p>
              {deepLink !== 'none' && (
                <p className="text-[10px] text-primary">Opens → {DEEP_LINK_OPTIONS.find((o) => o.value === deepLink)?.label}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        {sending && progress.total > 0 && (
          <Card>
            <CardContent className="pt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Sending notifications…</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <Progress value={(progress.current / progress.total) * 100} />
            </CardContent>
          </Card>
        )}

        {/* Send */}
        <Button onClick={() => setShowConfirm(true)} disabled={!canSend || sending} className="w-full" size="lg">
          <Send className="w-4 h-4 mr-2" />
          {sending ? 'Sending…' : `Send to ${recipientCount} users`}
        </Button>

        {/* Confirmation Modal */}
        <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" /> Confirm Broadcast
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <p><strong>To:</strong> {audience === 'all' ? 'All approved users' : `${selectedUserIds.size} selected users`}</p>
              <p><strong>Title:</strong> {title}</p>
              <p><strong>Body:</strong> {body}</p>
              {deepLink !== 'none' && <p><strong>Opens:</strong> {DEEP_LINK_OPTIONS.find((o) => o.value === deepLink)?.label}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleSend}>
                <Send className="w-4 h-4 mr-2" /> Send Now
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TabsContent>

      <TabsContent value="logs" className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Broadcast History</h3>
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loadingLogs}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingLogs ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        {loadingLogs ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Loading logs…</CardContent></Card>
        ) : logs.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No broadcasts sent yet.</CardContent></Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Sent By</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Audience</TableHead>
                      <TableHead className="text-right">Recipients</TableHead>
                      <TableHead>Deep Link</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {format(new Date(log.sent_at), 'MMM d, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={log.sent_by === 'admin' ? 'default' : 'secondary'} className="text-xs">
                            {log.sent_by}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium max-w-[150px] truncate">{log.title}</TableCell>
                        <TableCell className="text-muted-foreground text-xs max-w-[200px] truncate">{log.message}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs capitalize">{log.audience_type}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">{log.recipient_count}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.deep_link ? DEEP_LINK_OPTIONS.find((o) => o.value === log.deep_link)?.label || log.deep_link : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteLog(log.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default AdminBroadcastNotifications;
