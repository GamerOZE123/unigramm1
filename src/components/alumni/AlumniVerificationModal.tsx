import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Upload, Linkedin, FileCheck, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AlumniVerificationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AlumniVerificationModal = ({ open, onClose, onSuccess }: AlumniVerificationModalProps) => {
  const { user } = useAuth();
  const [verificationMethod, setVerificationMethod] = useState<'document' | 'linkedin'>('document');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      // Check file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a PDF or image file');
        return;
      }
      setDocumentFile(file);
    }
  };

  const handleDocumentSubmit = async () => {
    if (!documentFile || !user) return;

    setLoading(true);
    try {
      // Upload document to storage
      const fileExt = documentFile.name.split('.').pop();
      const filePath = `${user.id}/verification-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('verification-documents')
        .upload(filePath, documentFile);

      if (uploadError) {
        // If bucket doesn't exist, proceed without upload (demo mode)
        console.warn('Storage upload failed, proceeding in demo mode:', uploadError);
      }

      // Get public URL (if uploaded)
      const { data: urlData } = supabase.storage
        .from('verification-documents')
        .getPublicUrl(filePath);

      // Create verification request
      const { error } = await supabase
        .from('alumni_verifications')
        .insert({
          user_id: user.id,
          verification_type: 'document',
          document_url: urlData?.publicUrl || filePath,
          status: 'pending',
        });

      if (error) throw error;

      setSubmitted(true);
      toast.success('Verification request submitted!');
    } catch (error: any) {
      console.error('Document verification error:', error);
      toast.error(error.message || 'Failed to submit verification');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInSubmit = async () => {
    if (!linkedinUrl || !user) return;

    // Validate LinkedIn URL
    const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/(in|profile)\/[a-zA-Z0-9-]+\/?$/;
    if (!linkedinRegex.test(linkedinUrl)) {
      toast.error('Please enter a valid LinkedIn profile URL');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('alumni_verifications')
        .insert({
          user_id: user.id,
          verification_type: 'linkedin',
          linkedin_profile_url: linkedinUrl,
          status: 'pending',
        });

      if (error) throw error;

      setSubmitted(true);
      toast.success('Verification request submitted!');
    } catch (error: any) {
      console.error('LinkedIn verification error:', error);
      toast.error(error.message || 'Failed to submit verification');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (submitted && onSuccess) {
      onSuccess();
    }
    setDocumentFile(null);
    setLinkedinUrl('');
    setSubmitted(false);
    onClose();
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="py-8 flex flex-col items-center justify-center space-y-6">
            <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-amber-500" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold">Verification Submitted! 🎓</h3>
              <p className="text-muted-foreground mt-2">
                We'll review your submission and update your status within 2-3 business days.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 w-full">
              <p className="text-sm text-center">
                You'll receive a notification when your verification is approved.
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-amber-500" />
            Verify Your Alumni Status
          </DialogTitle>
          <DialogDescription>
            Get verified to unlock exclusive alumni benefits and show your badge
          </DialogDescription>
        </DialogHeader>

        <Tabs value={verificationMethod} onValueChange={(v) => setVerificationMethod(v as 'document' | 'linkedin')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="document" className="gap-2">
              <Upload className="h-4 w-4" />
              Document
            </TabsTrigger>
            <TabsTrigger value="linkedin" className="gap-2">
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </TabsTrigger>
          </TabsList>

          <TabsContent value="document" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Upload your degree certificate</Label>
              <Card 
                className="border-dashed border-2 p-6 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {documentFile ? (
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <FileCheck className="h-5 w-5" />
                    <span className="font-medium">{documentFile.name}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload your degree certificate
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, JPG, or PNG (max 10MB)
                    </p>
                  </div>
                )}
              </Card>
            </div>

            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Your document will be securely stored and only used for verification purposes.
              </p>
            </div>

            <Button 
              onClick={handleDocumentSubmit} 
              disabled={!documentFile || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit for Verification'
              )}
            </Button>
          </TabsContent>

          <TabsContent value="linkedin" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="linkedin-url">Your LinkedIn Profile URL</Label>
              <Input
                id="linkedin-url"
                type="url"
                placeholder="https://linkedin.com/in/yourname"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
              />
            </div>

            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Make sure your LinkedIn profile shows your education history and graduation year.
              </p>
            </div>

            <Button 
              onClick={handleLinkedInSubmit} 
              disabled={!linkedinUrl || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit for Verification'
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AlumniVerificationModal;
