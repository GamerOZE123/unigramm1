import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, BarChart3, FileText, Hash, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import HashtagSelector from './HashtagSelector';
import MentionInput from './MentionInput';
import PollCreator from './PollCreator';
import SurveyCreator from './SurveyCreator';
import { MultipleImageUpload } from '@/components/ui/multiple-image-upload';

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function CreatePostModal({ open, onOpenChange, onSuccess }: CreatePostModalProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [mentionedStartups, setMentionedStartups] = useState<any[]>([]);
  const [mentionedClubs, setMentionedClubs] = useState<any[]>([]);
  const [mentionedUsers, setMentionedUsers] = useState<any[]>([]);
  const [postType, setPostType] = useState<'text' | 'poll' | 'survey'>('text');
  const [pollData, setPollData] = useState<any>(null);
  const [surveyData, setSurveyData] = useState<any>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);

  const handlePost = async () => {
    if (!user || (!content.trim() && !pollData && !surveyData && imageUrls.length === 0)) return;

    setIsPosting(true);
    try {
      // Determine post type
      const dbPostType = pollData ? 'poll' : surveyData ? 'survey' : 'post';
      
      const postData: any = {
        user_id: user.id,
        content: content.trim() || (pollData ? pollData.question : 'Survey'),
        hashtags: hashtags.length > 0 ? hashtags : null,
        post_type: dbPostType,
      };

      // Add images if present
      if (imageUrls.length > 0) {
        postData.image_urls = imageUrls;
      }

      if (pollData) {
        postData.poll_question = pollData.question;
        postData.poll_options = JSON.stringify(pollData.options);
        postData.poll_ends_at = pollData.endsAt;
      }

      if (surveyData) {
        postData.survey_questions = JSON.stringify(surveyData.questions);
      }

      const { data: post, error } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single();

      if (error) throw error;

      // Add startup mentions
      if (mentionedStartups.length > 0 && post) {
        const mentions = mentionedStartups.map(s => ({
          post_id: post.id,
          startup_id: s.id,
        }));

        const { error: mentionError } = await supabase
          .from('post_startup_mentions')
          .insert(mentions);

        if (mentionError) throw mentionError;
      }

      // Add club mentions
      if (mentionedClubs.length > 0 && post) {
        const clubMentions = mentionedClubs.map(c => ({
          post_id: post.id,
          club_id: c.id,
        }));

        const { error: clubMentionError } = await supabase
          .from('post_club_mentions')
          .insert(clubMentions);

        if (clubMentionError) throw clubMentionError;
      }

      toast.success('Post created successfully!');
      handleReset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  const handleReset = () => {
    setContent('');
    setHashtags([]);
    setMentionedStartups([]);
    setMentionedClubs([]);
    setMentionedUsers([]);
    setPostType('text');
    setPollData(null);
    setSurveyData(null);
    setImageUrls([]);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleReset();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
        </DialogHeader>

        <Tabs value={postType} onValueChange={(v: any) => setPostType(v)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text" className="gap-2">
              <Hash className="w-4 h-4" />
              Post
            </TabsTrigger>
            <TabsTrigger value="poll" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Poll
            </TabsTrigger>
            <TabsTrigger value="survey" className="gap-2">
              <FileText className="w-4 h-4" />
              Survey
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4 mt-4">
            <MentionInput
              value={content}
              onChange={setContent}
              onMentionSelect={(item) => {
                if (item.type === 'startup') {
                  if (!mentionedStartups.find(s => s.id === item.id)) {
                    setMentionedStartups([...mentionedStartups, item]);
                  }
                } else if (item.type === 'club') {
                  if (!mentionedClubs.find(c => c.id === item.id)) {
                    setMentionedClubs([...mentionedClubs, item]);
                  }
                } else if (item.type === 'user') {
                  if (!mentionedUsers.find(u => u.user_id === item.user_id)) {
                    setMentionedUsers([...mentionedUsers, item]);
                  }
                }
              }}
              placeholder="What's happening? Use @ to mention users, clubs, or startups..."
            />

            <div>
              <label className="text-sm font-medium mb-2 block">Add Images</label>
              <MultipleImageUpload
                onImagesUploaded={setImageUrls}
                maxImages={10}
                bucketName="post-images"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Add Hashtags</label>
              <HashtagSelector hashtags={hashtags} onHashtagsChange={setHashtags} />
            </div>

            {(mentionedStartups.length > 0 || mentionedClubs.length > 0 || mentionedUsers.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {mentionedUsers.map((user, index) => (
                  <div
                    key={`user-${index}`}
                    className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                  >
                    <span>@{user.username}</span>
                    <button
                      onClick={() => setMentionedUsers(mentionedUsers.filter((_, i) => i !== index))}
                      className="hover:bg-primary/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {mentionedClubs.map((club, index) => (
                  <div
                    key={`club-${index}`}
                    className="flex items-center gap-2 bg-accent/10 text-accent-foreground px-3 py-1 rounded-full text-sm"
                  >
                    <span>@{club.club_name}</span>
                    <button
                      onClick={() => setMentionedClubs(mentionedClubs.filter((_, i) => i !== index))}
                      className="hover:bg-accent/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {mentionedStartups.map((startup, index) => (
                  <div
                    key={`startup-${index}`}
                    className="flex items-center gap-2 bg-secondary/10 text-secondary px-3 py-1 rounded-full text-sm"
                  >
                    <span>@{startup.title}</span>
                    <button
                      onClick={() => setMentionedStartups(mentionedStartups.filter((_, i) => i !== index))}
                      className="hover:bg-secondary/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={handlePost}
              disabled={(!content.trim() && imageUrls.length === 0) || isPosting}
              className="w-full"
            >
              {isPosting ? 'Posting...' : 'Post'}
            </Button>
          </TabsContent>

          <TabsContent value="poll" className="mt-4">
            <PollCreator
              onPollCreate={(poll) => {
                setPollData(poll);
                handlePost();
              }}
              onCancel={() => setPostType('text')}
            />
          </TabsContent>

          <TabsContent value="survey" className="mt-4">
            <SurveyCreator
              onSurveyCreate={(survey) => {
                setSurveyData(survey);
                handlePost();
              }}
              onCancel={() => setPostType('text')}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}