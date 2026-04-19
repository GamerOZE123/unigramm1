import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Pin, PinOff, Trash2, StickyNote, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Note {
  id: string;
  content: string;
  author_name: string;
  pinned: boolean;
  created_at: string;
}

interface Props {
  password: string;
}

const AdminNotes: React.FC<Props> = ({ password }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-admin', {
        body: { password, action: 'fetch_admin_notes' },
      });
      if (error || !data?.valid) throw new Error(data?.error || 'Failed to load');
      setNotes(data.notes || []);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (password) fetchNotes();
  }, [password]);

  const addNote = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-admin', {
        body: { password, action: 'create_admin_note', content },
      });
      if (error || !data?.valid || data?.error) throw new Error(data?.error || 'Failed');
      setContent('');
      setNotes((prev) => [data.note, ...prev]);
      toast.success('Note added');
    } catch (e: any) {
      toast.error(e.message || 'Failed to add note');
    } finally {
      setSubmitting(false);
    }
  };

  const togglePin = async (note: Note) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-admin', {
        body: { password, action: 'toggle_pin_admin_note', id: note.id, pinned: !note.pinned },
      });
      if (error || !data?.valid || data?.error) throw new Error(data?.error || 'Failed');
      fetchNotes();
    } catch (e: any) {
      toast.error(e.message || 'Failed');
    }
  };

  const deleteNote = async (id: string) => {
    if (!confirm('Delete this note?')) return;
    try {
      const { data, error } = await supabase.functions.invoke('verify-admin', {
        body: { password, action: 'delete_admin_note', id },
      });
      if (error || !data?.valid || data?.error) throw new Error(data?.error || 'Failed');
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success('Deleted');
    } catch (e: any) {
      toast.error(e.message || 'Failed');
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-amber-400" />
          Team Notes & Comments
          <Badge variant="secondary" className="ml-auto text-xs">
            {notes.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-col sm:flex-row">
          <Textarea
            placeholder="Leave a note for the team… (e.g. reminders, decisions, todos)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={2}
            className="resize-none"
          />
          <Button
            onClick={addNote}
            disabled={submitting || !content.trim()}
            className="sm:self-end"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
          </Button>
        </div>

        <div className="space-y-2 max-h-[420px] overflow-y-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Loading…</p>
          ) : notes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No notes yet. Drop the first one above.
            </p>
          ) : (
            notes.map((n) => (
              <div
                key={n.id}
                className={`p-3 rounded-lg border ${
                  n.pinned ? 'bg-amber-500/5 border-amber-500/30' : 'bg-muted/30 border-border/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{n.author_name}</span>
                    <span>·</span>
                    <span>{formatDate(n.created_at)}</span>
                    {n.pinned && (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-amber-500/40 text-amber-500">
                        Pinned
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => togglePin(n)}
                      title={n.pinned ? 'Unpin' : 'Pin'}
                    >
                      {n.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => deleteNote(n.id)}
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap break-words">{n.content}</p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminNotes;
