import { Home, Hash, Bell, Mail, Bookmark, User, Settings, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
}

const sidebarItems: SidebarItem[] = [
  { icon: Home, label: "Home", active: true },
  { icon: Hash, label: "Explore" },
  { icon: Bell, label: "Notifications" },
  { icon: Mail, label: "Messages" },
  { icon: Bookmark, label: "Bookmarks" },
  { icon: User, label: "Profile" },
  { icon: Settings, label: "Settings" },
];

const Sidebar = () => {
  return (
    <aside className="w-64 h-screen sticky top-16 border-r bg-card p-4 hidden lg:block">
      <nav className="space-y-2">
        {sidebarItems.map((item, index) => (
          <Button
            key={index}
            variant={item.active ? "default" : "ghost"}
            className={cn(
              "w-full justify-start h-12 text-base font-medium",
              item.active && "bg-primary text-primary-foreground"
            )}
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.label}
          </Button>
        ))}
      </nav>
      
      <div className="mt-8 p-4 bg-gradient-primary rounded-2xl text-white">
        <h3 className="font-semibold mb-2">Get Premium</h3>
        <p className="text-sm opacity-90 mb-4">Unlock exclusive features and enhanced experience</p>
        <Button variant="secondary" size="sm" className="w-full">
          Upgrade Now
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;