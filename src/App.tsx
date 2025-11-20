
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { GhostModeProvider } from '@/contexts/GhostModeContext';
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
import BuySell from '@/pages/BuySell';
import Auction from '@/pages/Auction';
import Marketplace from '@/pages/Marketplace';
import Jobs from '@/pages/Jobs';
import JobsInternships from '@/pages/JobsInternships';
import Notifications from '@/pages/Notifications';
import NotFound from '@/pages/NotFound';
import Holidays from '@/pages/Holidays';
import Post from '@/pages/Post';
import Fitness from '@/pages/Fitness';
import Advertising from '@/pages/Advertising';
import Carpooling from '@/pages/Carpooling';
import GhostChat from '@/pages/GhostChat';
import StoreManagement from '@/pages/StoreManagement';
import AllPosts from '@/pages/AllPosts';
import Startups from '@/pages/Startups';

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
        <GhostModeProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/profile/:userId?" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
              <Route path="/chat/:conversationId?" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/university" element={<ProtectedRoute><University /></ProtectedRoute>} />
              <Route path="/clubs" element={<ProtectedRoute><Clubs /></ProtectedRoute>} />
              <Route path="/clubs/:clubId" element={<ProtectedRoute><ClubDetail /></ProtectedRoute>} />
              <Route path="/buy-sell" element={<ProtectedRoute><BuySell /></ProtectedRoute>} />
              <Route path="/auction" element={<ProtectedRoute><Auction /></ProtectedRoute>} />
              <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
              <Route path="/store-management" element={<ProtectedRoute><StoreManagement /></ProtectedRoute>} />
              <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
              <Route path="/jobs-internships" element={<ProtectedRoute><JobsInternships /></ProtectedRoute>} />
              <Route path="/advertising" element={<ProtectedRoute><Advertising /></ProtectedRoute>} />
              <Route path="/carpooling" element={<ProtectedRoute><Carpooling /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/holidays" element={<ProtectedRoute><Holidays /></ProtectedRoute>} />
              <Route path="/fitness" element={<ProtectedRoute><Fitness /></ProtectedRoute>} />
              <Route path="/ghost-chat" element={<ProtectedRoute><GhostChat /></ProtectedRoute>} />
              <Route path="/post/:postId" element={<ProtectedRoute><Post /></ProtectedRoute>} />
              <Route path="/all-posts" element={<ProtectedRoute><AllPosts /></ProtectedRoute>} />
              <Route path="/startups" element={<ProtectedRoute><Startups /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </Router>
        </GhostModeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
