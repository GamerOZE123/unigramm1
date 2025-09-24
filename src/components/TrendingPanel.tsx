import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const trendingTopics = [
  { topic: "#ReactJS", posts: "125K posts" },
  { topic: "#WebDev", posts: "89K posts" },
  { topic: "#JavaScript", posts: "205K posts" },
  { topic: "#TailwindCSS", posts: "45K posts" },
  { topic: "#OpenAI", posts: "178K posts" },
];

const suggestedUsers = [
  { name: "Jane Developer", username: "janedev", followers: "12.5K" },
  { name: "Tech Guru", username: "techguru", followers: "45.2K" },
  { name: "Code Master", username: "codemaster", followers: "23.8K" },
];

const TrendingPanel = () => {
  return (
    <aside className="w-80 p-4 space-y-4 hidden xl:block">
      {/* Search */}
      <Card className="shadow-soft">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Search Social..." 
              className="pl-10 bg-muted border-0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Trending */}
      <Card className="shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">What's happening</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {trendingTopics.map((trend, index) => (
            <div key={index} className="px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-foreground">{trend.topic}</p>
                  <p className="text-sm text-muted-foreground">{trend.posts}</p>
                </div>
              </div>
            </div>
          ))}
          <div className="p-4">
            <Button variant="ghost" className="text-primary hover:text-primary/80">
              Show more
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Suggested Users */}
      <Card className="shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Who to follow</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {suggestedUsers.map((user, index) => (
            <div key={index} className="px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div>
                <p className="font-semibold text-foreground">{user.name}</p>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
                <p className="text-xs text-muted-foreground">{user.followers} followers</p>
              </div>
              <Button size="sm" variant="outline">
                Follow
              </Button>
            </div>
          ))}
          <div className="p-4">
            <Button variant="ghost" className="text-primary hover:text-primary/80">
              Show more
            </Button>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
};

export default TrendingPanel;