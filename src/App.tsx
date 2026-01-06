
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from '@/components/ui/sonner';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Auth from '@/pages/Auth';
import Home from '@/pages/Home';
import Profile from '@/pages/Profile';
import Explore from '@/pages/Explore';
import Chat from '@/pages/Chat';
import University from '@/pages/University';
import Clubs from '@/pages/Clubs';
import ClubDetail from '@/pages/ClubDetail';
import Notifications from '@/pages/Notifications';
import NotFound from '@/pages/NotFound';
import Post from '@/pages/Post';
import Fitness from '@/pages/Fitness';
import Advertising from '@/pages/Advertising';
import AdvertisingPost from '@/pages/AdvertisingPost';
import AllPosts from '@/pages/AllPosts';
import Startups from '@/pages/Startups';
import StartupDetail from '@/pages/StartupDetail';
import StartupManagement from '@/pages/StartupManagement';
import Settings from '@/pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
              <Route path="/chat/:conversationId?" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/university" element={<ProtectedRoute><University /></ProtectedRoute>} />
              <Route path="/clubs" element={<ProtectedRoute><Clubs /></ProtectedRoute>} />
              <Route path="/clubs/:clubId" element={<ProtectedRoute><ClubDetail /></ProtectedRoute>} />
              <Route path="/advertising" element={<ProtectedRoute><Advertising /></ProtectedRoute>} />
              <Route path="/ad/:postId" element={<ProtectedRoute><AdvertisingPost /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/fitness" element={<ProtectedRoute><Fitness /></ProtectedRoute>} />
              <Route path="/post/:postId" element={<ProtectedRoute><Post /></ProtectedRoute>} />
              <Route path="/all-posts" element={<ProtectedRoute><AllPosts /></ProtectedRoute>} />
              <Route path="/startups" element={<ProtectedRoute><Startups /></ProtectedRoute>} />
              <Route path="/startup/:slug" element={<ProtectedRoute><StartupDetail /></ProtectedRoute>} />
              <Route path="/startup/:slug/manage" element={<ProtectedRoute><StartupManagement /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/:username" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
