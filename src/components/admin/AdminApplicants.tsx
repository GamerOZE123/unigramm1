import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ChevronLeft, ChevronRight, Mail, GraduationCap, Calendar,
  Link as LinkIcon, FileText, Sparkles, Trash2, RefreshCw, User, Globe, Clock,
  Hourglass, RotateCcw
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';

interface Application {
  id: string;
  full_name: string;
  email: string;
  university: string | null;
  year_of_study: string | null;
  role: string | null;
  custom_role: string | null;
  skills: string | null;
  experience: string | null;
  experience_links: string | null;
  portfolio_url: string | null;
  message: string | null;
  created_at: string | null;
  status?: string | null;
}

interface Props {
  password: string;
}

const AdminApplicants: React.FC<Props> = ({ password }) => {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [notify, setNotify] = useState(true);
  const [view, setView] = useState<'list' | 'individuals'>('list');

  const fetchApps = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-admin', {
        body: { password, action: 'fetch_contributor_applications' },
      });
      if (error || data?.error) throw new Error(data?.error || 'Failed to load');
      setApps(data.applications || []);
      setIndex(0);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load applicants');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async () => {
    const current = apps[index];
    if (!current) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-admin', {
        body: { password, action: 'delete_contributor_application', id: current.id },
      });
      if (error || data?.error) throw new Error(data?.error || 'Failed');
      const next = apps.filter(a => a.id !== current.id);
      setApps(next);
      setIndex(i => Math.max(0, Math.min(i, next.length - 1)));
      toast.success('Application deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
    setDeleting(false);
  };

  const handleToggleWaitlist = async () => {
    const current = apps[index];
    if (!current) return;
    const newStatus = current.status === 'waitlisted' ? 'pending' : 'waitlisted';
    setUpdatingStatus(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-admin', {
        body: {
          password,
          action: 'set_application_status',
          id: current.id,
          status: newStatus,
          notify,
        },
      });
      if (error || data?.error) throw new Error(data?.error || 'Failed');
      setApps(prev => prev.map(a => a.id === current.id ? { ...a, status: newStatus } : a));
      const baseMsg = newStatus === 'waitlisted' ? 'Added to waitlist' : 'Removed from waitlist';
      if (notify) {
        if (data?.notified) toast.success(`${baseMsg} • Applicant notified`);
        else toast.warning(`${baseMsg} • Notify failed: ${data?.notifyError || 'unknown error'}`);
      } else {
        toast.success(baseMsg);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
    setUpdatingStatus(false);
  };

  if (loading) {
    return (
      <Card className="border-border/40">
        <CardContent className="py-12 text-center text-muted-foreground">Loading applications…</CardContent>
      </Card>
    );
  }

  if (apps.length === 0) {
    return (
      <Card className="border-border/40">
        <CardContent className="py-12 text-center text-muted-foreground space-y-3">
          <Sparkles className="w-8 h-8 mx-auto opacity-50" />
          <p>No contributor applications yet.</p>
          <Button variant="outline" size="sm" onClick={fetchApps}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  const app = apps[index];
  const displayRole = app.role === 'other' && app.custom_role ? app.custom_role : app.role;
  const isWaitlisted = app.status === 'waitlisted';

  return (
    <div className="space-y-4">
      <Tabs value={view} onValueChange={(v) => setView(v as 'list' | 'individuals')}>
        <TabsList className="grid w-full max-w-sm grid-cols-2">
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="individuals">Individuals</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <Badge variant="secondary" className="text-sm">{apps.length} applicants</Badge>
            <Button variant="outline" size="sm" onClick={fetchApps}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
          </div>
          <Card className="border-border/40">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>University</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apps.map((a, i) => {
                    const r = a.role === 'other' && a.custom_role ? a.custom_role : a.role;
                    return (
                      <TableRow key={a.id} className="cursor-pointer" onClick={() => { setIndex(i); setView('individuals'); }}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium">{a.full_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{a.email}</TableCell>
                        <TableCell className="text-sm">{a.university || '—'}</TableCell>
                        <TableCell className="text-sm">{a.year_of_study || '—'}</TableCell>
                        <TableCell className="text-sm capitalize">{r || '—'}</TableCell>
                        <TableCell>
                          {a.status === 'waitlisted' ? (
                            <Badge variant="secondary" className="text-xs gap-1"><Hourglass className="w-3 h-3" /> Waitlisted</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {a.created_at ? new Date(a.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setIndex(i); setView('individuals'); }}>
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="individuals" className="mt-4 space-y-4">
          {/* Top bar: counter + actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            Applicant {index + 1} of {apps.length}
          </Badge>
          {app.created_at && (
            <Badge variant="outline" className="text-xs gap-1">
              <Clock className="w-3 h-3" />
              {new Date(app.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </Badge>
          )}
          {isWaitlisted && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Hourglass className="w-3 h-3" /> Waitlisted
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-2 text-xs text-muted-foreground select-none cursor-pointer px-2 py-1.5 rounded-md border border-border/40 bg-muted/30">
            <Checkbox
              checked={notify}
              onCheckedChange={(v) => setNotify(v === true)}
              className="h-3.5 w-3.5"
            />
            Notify applicant by email
          </label>
          <Button
            variant={isWaitlisted ? 'outline' : 'default'}
            size="sm"
            onClick={handleToggleWaitlist}
            disabled={updatingStatus}
          >
            {isWaitlisted ? (
              <><RotateCcw className="w-4 h-4 mr-1" /> {updatingStatus ? 'Updating…' : 'Remove from waitlist'}</>
            ) : (
              <><Hourglass className="w-4 h-4 mr-1" /> {updatingStatus ? 'Updating…' : 'Add to waitlist'}</>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchApps}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={deleting}>
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete application?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove {app.full_name}'s application. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Applicant detail card */}
      <Card className="border-border/40">
        <CardContent className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4 pb-4 border-b border-border/40">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold text-foreground truncate">{app.full_name}</h2>
              <a href={`mailto:${app.email}`} className="text-sm text-primary hover:underline flex items-center gap-1.5 mt-1">
                <Mail className="w-3.5 h-3.5" /> {app.email}
              </a>
            </div>
            {displayRole && (
              <Badge className="capitalize">{displayRole}</Badge>
            )}
          </div>

          {/* Quick facts grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field icon={GraduationCap} label="University" value={app.university} />
            <Field icon={Calendar} label="Year of study" value={app.year_of_study} />
            <Field icon={Globe} label="Portfolio" value={app.portfolio_url} isLink />
            <Field icon={User} label="Role" value={displayRole as string | null} />
          </div>

          {/* Long-form sections — always shown, even if blank */}
          <Section icon={Sparkles} title="Skills / Tech stack" content={app.skills} />
          <Section icon={FileText} title="Any prior experience?" content={app.experience} />
          <Section icon={LinkIcon} title="Experience links" content={app.experience_links} />
          <Section icon={FileText} title="Anything they wanted to ask or say" content={app.message} />
        </CardContent>
      </Card>

      {/* Pager */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => setIndex(i => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Previous
        </Button>
        <p className="text-sm text-muted-foreground">
          {index + 1} / {apps.length}
        </p>
        <Button
          variant="outline"
          onClick={() => setIndex(i => Math.min(apps.length - 1, i + 1))}
          disabled={index >= apps.length - 1}
        >
          Next <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const Field: React.FC<{ icon: React.ElementType; label: string; value: string | null; isLink?: boolean }> = ({ icon: Icon, label, value, isLink }) => (
  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/40">
    <Icon className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
    <div className="min-w-0 flex-1">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</p>
      {value ? (
        isLink ? (
          <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline break-all">
            {value}
          </a>
        ) : (
          <p className="text-sm text-foreground break-words">{value}</p>
        )
      ) : (
        <p className="text-sm text-muted-foreground italic">—</p>
      )}
    </div>
  </div>
);

const Section: React.FC<{ icon: React.ElementType; title: string; content: string | null }> = ({ icon: Icon, title, content }) => {
  const isEmpty = !content || !content.trim();
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="w-4 h-4 text-muted-foreground" /> {title}
      </div>
      {isEmpty ? (
        <p className="text-sm text-muted-foreground italic pl-6">— No answer provided</p>
      ) : (
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed pl-6">{content}</p>
      )}
    </div>
  );
};

export default AdminApplicants;