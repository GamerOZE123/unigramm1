import React from 'react';
import { Home, Search, Bell, Mail, Bookmark, User, MoreHorizontal } from 'lucide-react';

export default function Sidebar() {
  const menuItems = [
    { icon: Home, label: 'Home', active: true },
    { icon: Search, label: 'Explore' },
    { icon: Bell, label: 'Notifications' },
    { icon: Mail, label: 'Messages' },
    { icon: Bookmark, label: 'Bookmarks' },
    { icon: User, label: 'Profile' },
    { icon: MoreHorizontal, label: 'More' }
  ];

  return (
    <aside className="hidden md:block w-64 p-4">
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <div
            key={item.label}
            className={`flex items-center space-x-4 p-3 rounded-full cursor-pointer transition-colors ${
              item.active 
                ? 'bg-primary/10 text-primary font-semibold' 
                : 'hover:bg-muted text-foreground'
            }`}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-xl">{item.label}</span>
          </div>
        ))}
      </nav>
      
      <div className="mt-8">
        <button className="w-full bg-primary text-primary-foreground py-3 rounded-full font-semibold text-lg hover:bg-primary/90 transition-colors">
          Tweet
        </button>
      </div>
      
      <div className="mt-8 p-4 border border-border rounded-2xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">John Doe</p>
            <p className="text-sm text-muted-foreground">@johndoe</p>
          </div>
        </div>
      </div>
    </aside>
  );
}