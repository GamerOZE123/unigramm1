
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Post from '@/components/Post';
import TrendingPanel from '@/components/TrendingPanel';

const samplePosts = [
  {
    id: 1,
    user: { name: 'Sarah Johnson', username: 'sarah_j', avatar: '/src/assets/avatar1.jpg' },
    content: 'Just finished my morning workout! Feeling energized for the day ahead 💪',
    timestamp: '2 hours ago',
    likes: 42,
    comments: 8,
    shares: 3
  },
  {
    id: 2,
    user: { name: 'Mike Chen', username: 'mike_chen', avatar: '/src/assets/avatar2.jpg' },
    content: 'Beautiful sunset from my balcony tonight. Nature never fails to amaze me 🌅',
    timestamp: '4 hours ago',
    likes: 89,
    comments: 15,
    shares: 12
  },
  {
    id: 3,
    user: { name: 'Emma Davis', username: 'emma_d', avatar: '/src/assets/avatar3.jpg' },
    content: 'Coffee and coding session. Building something exciting! ☕️💻',
    timestamp: '6 hours ago',
    likes: 156,
    comments: 24,
    shares: 8
  }
];

export default function Index() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex max-w-6xl mx-auto">
        <Sidebar />
        <main className="flex-1 border-x border-border">
          <div className="p-4 border-b border-border">
            <h2 className="text-xl font-semibold">Home</h2>
            <p className="text-sm text-muted-foreground">Welcome back, {user?.email}!</p>
          </div>
          <div className="divide-y divide-border">
            {samplePosts.map((post) => (
              <Post key={post.id} post={post} />
            ))}
          </div>
        </main>
        <TrendingPanel />
      </div>
    </div>
  );
}
