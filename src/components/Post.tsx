import { Heart, MessageCircle, Repeat2, Share, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

interface PostProps {
  author: string;
  username: string;
  time: string;
  content: string;
  avatar: string;
  likes?: number;
  comments?: number;
  reposts?: number;
}

const Post = ({ author, username, time, content, avatar, likes = 0, comments = 0, reposts = 0 }: PostProps) => {
  return (
    <Card className="p-4 hover:shadow-hover transition-all duration-200 border-0 border-b border-border rounded-none bg-card">
      <div className="flex space-x-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatar} alt={author} />
          <AvatarFallback>{author.charAt(0)}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-1 mb-1">
            <span className="font-semibold text-foreground">{author}</span>
            <span className="text-muted-foreground">@{username}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{time}</span>
            <div className="ml-auto">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <p className="text-foreground mb-3 leading-relaxed">{content}</p>
          
          <div className="flex items-center justify-between max-w-md">
            <Button variant="ghost" size="sm" className="text-social-gray hover:text-social-blue hover:bg-social-blue/10 -ml-2">
              <MessageCircle className="h-4 w-4 mr-1" />
              <span className="text-sm">{comments}</span>
            </Button>
            
            <Button variant="ghost" size="sm" className="text-social-gray hover:text-social-green hover:bg-social-green/10">
              <Repeat2 className="h-4 w-4 mr-1" />
              <span className="text-sm">{reposts}</span>
            </Button>
            
            <Button variant="ghost" size="sm" className="text-social-gray hover:text-social-red hover:bg-social-red/10">
              <Heart className="h-4 w-4 mr-1" />
              <span className="text-sm">{likes}</span>
            </Button>
            
            <Button variant="ghost" size="sm" className="text-social-gray hover:text-social-blue hover:bg-social-blue/10">
              <Share className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default Post;