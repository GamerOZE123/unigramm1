import React from 'react';
import { Search, Home, Bell, Mail, Bookmark, User } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-primary">Social</h1>
            <nav className="hidden md:flex items-center space-x-6">
              <Home className="w-6 h-6 text-foreground cursor-pointer hover:text-primary transition-colors" />
              <Search className="w-6 h-6 text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
              <Bell className="w-6 h-6 text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
              <Mail className="w-6 h-6 text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 pr-4 py-2 bg-muted rounded-full text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
              />
            </div>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer">
              <User className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}