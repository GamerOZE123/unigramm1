import React from 'react';
import { Search } from 'lucide-react';

export default function TrendingPanel() {
  const trendingTopics = [
    { topic: '#ReactJS', posts: '125K posts' },
    { topic: '#WebDev', posts: '89K posts' },
    { topic: '#JavaScript', posts: '234K posts' },
    { topic: '#TypeScript', posts: '67K posts' },
    { topic: '#TailwindCSS', posts: '45K posts' }
  ];

  const suggestions = [
    { name: 'Sarah Wilson', username: 'sarah_wilson', followers: '2.1K' },
    { name: 'Alex Chen', username: 'alex_dev', followers: '5.3K' },
    { name: 'Maria Garcia', username: 'maria_codes', followers: '1.8K' }
  ];

  return (
    <aside className="hidden xl:block w-80 p-4">
      <div className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search Twitter" 
            className="w-full pl-12 pr-4 py-3 bg-muted rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
          />
        </div>

        {/* Trending */}
        <div className="bg-muted rounded-2xl p-4">
          <h2 className="text-xl font-bold text-foreground mb-4">What's happening</h2>
          <div className="space-y-3">
            {trendingTopics.map((item, index) => (
              <div key={index} className="cursor-pointer hover:bg-background/50 p-2 rounded transition-colors">
                <div className="text-sm text-muted-foreground">Trending in Technology</div>
                <div className="font-semibold text-foreground">{item.topic}</div>
                <div className="text-sm text-muted-foreground">{item.posts}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Who to follow */}
        <div className="bg-muted rounded-2xl p-4">
          <h2 className="text-xl font-bold text-foreground mb-4">Who to follow</h2>
          <div className="space-y-3">
            {suggestions.map((user, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{user.name}</p>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                  </div>
                </div>
                <button className="px-4 py-1.5 bg-foreground text-background rounded-full text-sm font-semibold hover:bg-foreground/90 transition-colors">
                  Follow
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}