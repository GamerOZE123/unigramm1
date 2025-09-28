import React from 'react';
import { Heart, MessageCircle, Repeat2, Share, MoreHorizontal } from 'lucide-react';

interface PostProps {
  post: {
    id: number;
    user: {
      name: string;
      username: string;
      avatar: string;
    };
    content: string;
    timestamp: string;
    likes: number;
    comments: number;
    shares: number;
  };
}

export default function Post({ post }: PostProps) {
  return (
    <article className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
      <div className="flex space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-white">
            {post.user.name.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-foreground hover:underline cursor-pointer">
              {post.user.name}
            </h3>
            <span className="text-muted-foreground">@{post.user.username}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{post.timestamp}</span>
            <div className="ml-auto">
              <MoreHorizontal className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer" />
            </div>
          </div>
          
          <div className="mt-2">
            <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
          </div>
          
          <div className="flex items-center justify-between mt-4 max-w-md">
            <div className="flex items-center space-x-2 text-muted-foreground hover:text-primary cursor-pointer group">
              <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors">
                <MessageCircle className="w-4 h-4" />
              </div>
              <span className="text-sm">{post.comments}</span>
            </div>
            
            <div className="flex items-center space-x-2 text-muted-foreground hover:text-green-500 cursor-pointer group">
              <div className="p-2 rounded-full group-hover:bg-green-500/10 transition-colors">
                <Repeat2 className="w-4 h-4" />
              </div>
              <span className="text-sm">{post.shares}</span>
            </div>
            
            <div className="flex items-center space-x-2 text-muted-foreground hover:text-red-500 cursor-pointer group">
              <div className="p-2 rounded-full group-hover:bg-red-500/10 transition-colors">
                <Heart className="w-4 h-4" />
              </div>
              <span className="text-sm">{post.likes}</span>
            </div>
            
            <div className="flex items-center space-x-2 text-muted-foreground hover:text-primary cursor-pointer group">
              <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors">
                <Share className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}