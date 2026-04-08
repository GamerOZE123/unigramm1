import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Trash2, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Props {
  password: string;
}

const OFFICIALS = [
  { email: 'appletester@gmail.com', label: 'Apple Tester' },
  { email: 'androidtester@gmail.com', label: 'Android Tester' },
];

const AdminOfficials: React.FC<Props> = ({ password }) => {
  const [clearing, setClearing] = useState<string | null>(null);

  const handleClearData = async (email: string) => {
    setClearing(email);
    try {
      const { data, error } = await supabase.functions.invoke('verify-admin', {
        body: { password, action: 'clear_user_data', email },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`All data cleared for ${email}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to clear data');
    } finally {
      setClearing(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">Officials</h2>
        <p className="text-sm text-muted-foreground">Official test accounts. Clear all user-generated data (posts, comments, chats, etc.) for these accounts.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {OFFICIALS.map((official) => (
          <Card key={official.email}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="w-4 h-4 text-primary" />
                {official.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground font-mono">{official.email}</p>
              <Badge variant="outline" className="text-xs">Official Account</Badge>
              <div className="pt-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      disabled={clearing === official.email}
                    >
                      {clearing === official.email ? (
                        <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Clearing…</>
                      ) : (
                        <><Trash2 className="w-3 h-3 mr-1" /> Clear All Data</>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear all data for {official.email}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all posts, comments, likes, chats, messages, confessions, and other user-generated content for this account. The account itself will remain. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleClearData(official.email)}>
                        Clear All Data
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminOfficials;
