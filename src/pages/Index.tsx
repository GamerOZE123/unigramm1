import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Post from "@/components/Post";
import TrendingPanel from "@/components/TrendingPanel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Image, Smile, Calendar } from "lucide-react";

import avatar1 from "@/assets/avatar1.jpg";
import avatar2 from "@/assets/avatar2.jpg";
import avatar3 from "@/assets/avatar3.jpg";

const samplePosts = [
  {
    author: "Sarah Johnson",
    username: "sarahjdev",
    time: "2h",
    content: "Just finished working on a new React component library! The developer experience is so much smoother when you have well-designed, reusable components. What's your favorite UI library? 🚀",
    avatar: avatar1,
    likes: 24,
    comments: 8,
    reposts: 3
  },
  {
    author: "Mike Chen",
    username: "mikechen",
    time: "4h",
    content: "Hot take: TypeScript has fundamentally changed how I write JavaScript. The type safety and IntelliSense support make development so much more enjoyable. Anyone else feel the same way?",
    avatar: avatar2,
    likes: 156,
    comments: 42,
    reposts: 18
  },
  {
    author: "Emma Wilson",
    username: "emmawilson",
    time: "6h",
    content: "Beautiful sunset from my home office window today. Sometimes it's the simple moments that remind us to take a break from coding and appreciate the world around us. 🌅",
    avatar: avatar3,
    likes: 89,
    comments: 15,
    reposts: 7
  },
  {
    author: "Sarah Johnson",
    username: "sarahjdev",
    time: "8h",
    content: "Pro tip: Use CSS Grid for layout and Flexbox for components. This combination gives you the best of both worlds - powerful layout control and flexible component design.",
    avatar: avatar1,
    likes: 67,
    comments: 12,
    reposts: 23
  },
  {
    author: "Mike Chen",
    username: "mikechen",
    time: "12h",
    content: "Coffee ☕ + Clean Code 📝 + Good Music 🎵 = Perfect Development Environment. What's in your perfect coding setup?",
    avatar: avatar2,
    likes: 134,
    comments: 28,
    reposts: 15
  }
];

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <div className="max-w-7xl mx-auto flex">
        <Sidebar />
        
        {/* Main Feed */}
        <main className="flex-1 border-x bg-background/50 backdrop-blur-sm">
          {/* Tweet Composer */}
          <Card className="border-0 border-b border-border rounded-none bg-card">
            <CardContent className="p-4">
              <div className="flex space-x-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={avatar1} alt="Your avatar" />
                  <AvatarFallback>You</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea 
                    placeholder="What's happening?"
                    className="border-0 bg-transparent text-lg resize-none focus-visible:ring-0 p-0"
                    rows={3}
                  />
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-4">
                      <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 p-2">
                        <Image className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 p-2">
                        <Smile className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 p-2">
                        <Calendar className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button className="bg-gradient-primary hover:opacity-90 px-6">
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Posts Feed */}
          <div>
            {samplePosts.map((post, index) => (
              <Post key={index} {...post} />
            ))}
          </div>
        </main>
        
        <TrendingPanel />
      </div>
    </div>
  );
};

export default Index;