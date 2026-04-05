import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, RefreshCw, Save, X, Sparkles, ArrowUp, ArrowDown } from 'lucide-react';

interface Prompt {
  id: string;
  prompt_text: string;
  category: string;
  is_active: boolean;
  display_order: number;
}

const CATEGORIES = ['general', 'travel', 'music', 'campus', 'fun'];

interface Props {
  password: string;
}

const AdminDatingPrompts: React.FC<Props> = ({ password }) => {
  const [items, setItems] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formText, setFormText] = useState('');
  const [formCategory, setFormCategory] = useState('general');
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('dating_prompts')
      .select('*')
      .order('display_order', { ascending: true });
    if (error) {
      toast.error('Failed to load prompts');
    } else {
      setItems((data || []) as unknown as Prompt[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    if (!formText.trim()) { toast.error('Prompt text is required'); return; }
    setSaving(true);
    if (editingId) {
      const { error } = await supabase.functions.invoke('verify-admin', {
        body: { password, action: 'update_dating_prompt', id: editingId, prompt_text: formText, category: formCategory },
      });
      if (error) toast.error('Failed to update');
      else toast.success('Updated');
    } else {
      const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.display_order)) : 0;
      const { error } = await supabase.functions.invoke('verify-admin', {
        body: { password, action: 'add_dating_prompt', prompt_text: formText, category: formCategory, display_order: maxOrder + 1 },
      });
      if (error) toast.error('Failed to add');
      else toast.success('Added');
    }
    setShowForm(false);
    setEditingId(null);
    setFormText('');
    setFormCategory('general');
    setSaving(false);
    fetchItems();
  };

  const handleToggle = async (id: string, val: boolean) => {
    const { error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'toggle_dating_prompt', id, is_active: val },
    });
    if (error) toast.error('Failed to toggle');
    else setItems(prev => prev.map(i => i.id === id ? { ...i, is_active: val } : i));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this prompt?')) return;
    const { error } = await supabase.functions.invoke('verify-admin', {
      body: { password, action: 'delete_dating_prompt', id },
    });
    if (error) toast.error('Failed to delete');
    else { toast.success('Deleted'); setItems(prev => prev.filter(i => i.id !== id)); }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const filtered = getFiltered();
    const idx = filtered.findIndex(i => i.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= filtered.length) return;
    const a = filtered[idx];
    const b = filtered[swapIdx];
    await Promise.all([
      supabase.functions.invoke('verify-admin', {
        body: { password, action: 'update_dating_prompt_order', id: a.id, display_order: b.display_order },
      }),
      supabase.functions.invoke('verify-admin', {
        body: { password, action: 'update_dating_prompt_order', id: b.id, display_order: a.display_order },
      }),
    ]);
    fetchItems();
  };

  const startEdit = (item: Prompt) => {
    setEditingId(item.id);
    setFormText(item.prompt_text);
    setFormCategory(item.category);
    setShowForm(true);
  };

  const getFiltered = () => filterCat === 'all' ? items : items.filter(i => i.category === filterCat);
  const filtered = getFiltered();

  return (
    <div className="space-y-4">
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" /> Profile Prompts
              <Badge variant="secondary" className="ml-2">{items.length}</Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={fetchItems}><RefreshCw className="w-4 h-4" /></Button>
              <Button size="sm" onClick={() => { setShowForm(true); setEditingId(null); setFormText(''); setFormCategory('general'); }}>
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-1 flex-wrap">
            {['all', ...CATEGORIES].map(cat => (
              <Button key={cat} variant={filterCat === cat ? 'default' : 'outline'} size="sm" className="text-xs capitalize" onClick={() => setFilterCat(cat)}>
                {cat}
              </Button>
            ))}
          </div>

          {showForm && (
            <div className="p-4 rounded-lg bg-muted/50 border border-border/40 space-y-3">
              <Input placeholder="Enter prompt text…" value={formText} onChange={e => setFormText(e.target.value)} />
              <div className="flex items-center gap-2">
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  <Save className="w-3 h-3 mr-1" /> {editingId ? 'Update' : 'Add'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); }}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <p className="text-center text-muted-foreground py-6">Loading…</p>
          ) : (
            <div className="rounded-lg border border-border/40 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Prompt</TableHead>
                    <TableHead className="w-24">Category</TableHead>
                    <TableHead className="w-20">Active</TableHead>
                    <TableHead className="w-28">Order</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-muted-foreground">{item.display_order}</TableCell>
                      <TableCell className="font-medium text-sm">{item.prompt_text}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs capitalize">{item.category}</Badge></TableCell>
                      <TableCell>
                        <Switch checked={item.is_active} onCheckedChange={(v) => handleToggle(item.id, v)} className="data-[state=checked]:bg-green-500" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleReorder(item.id, 'up')} disabled={idx === 0}><ArrowUp className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleReorder(item.id, 'down')} disabled={idx === filtered.length - 1}><ArrowDown className="w-3 h-3" /></Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(item)}><Pencil className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No prompts found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDatingPrompts;
