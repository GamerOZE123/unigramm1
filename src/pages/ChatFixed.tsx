import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Users } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import MobileLayout from '@/components/layout/MobileLayout';
import MobileHeader from '@/components/layout/MobileHeader';
import { useIsMobile } from '@/hooks/use-mobile';

export default function ChatFixed() {
  const [message, setMessage] = useState('');
  const isMobile = useIsMobile();

  const content = (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <MessageCircle className="w-8 h-8" />
        Chat
      </h1>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Recent Chats
            </h3>
            <div className="space-y-2">
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No recent chats</p>
                <p className="text-sm">Start a conversation!</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardContent className="p-4 h-96 flex flex-col">
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Select a chat to start messaging</p>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Input
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1"
              />
              <Button>Send</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return isMobile ? (
    <MobileLayout>
      <MobileHeader />
      {content}
    </MobileLayout>
  ) : (
    <Layout>{content}</Layout>
  );
}