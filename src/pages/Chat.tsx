import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/layout/Layout';
import MobileLayout from '@/components/layout/MobileLayout';
import UserSearch from '@/components/chat/UserSearch';
import MobileChatHeader from '@/components/chat/MobileChatHeader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Send, MoreVertical, Trash2, MessageSquareX, UserX, Loader2, ImagePlus, Smile, Search, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/hooks/useChat';
import { useRecentChats } from '@/hooks/useRecentChats';
import { useUsers } from '@/hooks/useUsers';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMessageReactions } from '@/hooks/useMessageReactions';
import { useMessageSearch } from '@/hooks/useMessageSearch';

const TEXT_EMOJIS = ["😀", "😂", "🥰", "😍", "🤔", "👍", "❤️", "🎉", "🔥", "✨", "💯", "🙏"];
const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export default function Chat() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showUserList, setShowUserList] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState<Set<string>>(new Set());
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessageNotification, setNewMessageNotification] = useState(false);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null); // For confirmation dialog
  const [selectedChatsForBulk, setSelectedChatsForBulk] = useState<Set<string>>(new Set()); // For bulk delete
  const [uploadingImage, setUploadingImage] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousMessagesLength = useRef(0);
  const { reactions, toggleReaction } = useMessageReactions(selectedConversationId);
  const { searchResults, loading: searchLoading, searchMessages, clearSearch } = useMessageSearch();
  const {
    conversations,
    currentMessages,
    loading: chatLoading,
    fetchMessages,
    loadOlderMessages,
    sendMessage,
    createConversation,
    clearChat,
    deleteChat,
    refreshConversations,
  } = useChat();
  const { recentChats, loading, addRecentChat, refreshRecentChats } = useRecentChats(); // Added loading
  const { getUserById } = useUsers();

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (currentMessages.length > previousMessagesLength.current) {
      if (isAtBottom) {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      } else {
        setNewMessageNotification(true);
      }
    }
    previousMessagesLength.current = currentMessages.length;
  }, [currentMessages, isAtBottom]);

  useEffect(() => {
    if (selectedConversationId && currentMessages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        setIsAtBottom(true);
      }, 50);
    }
  }, [selectedConversationId]);

  // Realtime: move chats to top + unread badge
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('chat-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const message = payload.new;
          if (message.sender_id !== user.id) {
            const chatUserId = message.sender_id;
            // Move chat to top and add to recentChats (handled by useRecentChats.ts)
            // Add unread badge
            if (selectedUser?.user_id !== chatUserId) {
              setUnreadMessages((prev) => new Set(prev).add(chatUserId));
            }
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedUser]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 10;
    const atTop = scrollTop <= 10;
    setIsAtBottom(atBottom);
    if (atBottom) setNewMessageNotification(false);
    if (atTop && selectedConversationId && currentMessages.length >= 20) {
      const prevHeight = scrollHeight;
      loadOlderMessages(selectedConversationId).then(() => {
        setTimeout(() => {
          if (messagesContainerRef.current) {
            const newHeight = messagesContainerRef.current.scrollHeight;
            messagesContainerRef.current.scrollTop = newHeight - prevHeight;
          }
        }, 50);
      });
    }
  };

  useEffect(() => {
    if (selectedConversationId) fetchMessages(selectedConversationId);
  }, [selectedConversationId]);

  // Handle conversation query parameter
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId && conversationId !== selectedConversationId) {
      setSelectedConversationId(conversationId);
      
      // Get user details from the conversation
      const loadConversation = async () => {
        // First check if conversation is already in the list
        let conversation = conversations.find(c => c.conversation_id === conversationId);
        
        // If not found, refresh conversations list
        if (!conversation) {
          await refreshConversations();
          // Wait a bit for conversations to update
          await new Promise(resolve => setTimeout(resolve, 100));
          conversation = conversations.find(c => c.conversation_id === conversationId);
        }
        
        // If still not found, we might need to query the database
        if (!conversation) {
          // Try to get conversation from database
          const { data } = await supabase
            .rpc('get_user_conversations', { target_user_id: user?.id || '' });
          conversation = data?.find((c: any) => c.conversation_id === conversationId);
        }
        
        if (conversation) {
          const userData = await getUserById(conversation.other_user_id);
          if (userData) {
            setSelectedUser(userData);
            if (isMobile) setShowUserList(false);
          }
        }
      };
      
      loadConversation();
    }
  }, [searchParams]);

  const handleUserClick = async (userId: string) => {
  try {
    // Ensure the current user is authenticated before proceeding
    if (!user || !user.id) {
      toast.error('You must be logged in to start a chat.');
      return;
    }

    const userProfile = await getUserById(userId);
    if (!userProfile) {
      console.error('Failed to fetch user profile:', userId);
      toast.error('Failed to load user profile');
      return;
    }
    console.log('Selected user:', userProfile);
    setSelectedUser(userProfile);

    // Pass the user's ID to the conversation creation function
    const conversationId = await createConversation(userId);
    
    if (!conversationId) {
      console.error('Failed to create conversation for user:', userId);
      toast.error('Failed to create conversation');
      return;
    }
    
    setSelectedConversationId(conversationId);
    setNewMessageNotification(false);
    setUnreadMessages((prev) => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
    if (isMobile) setShowUserList(false);
  } catch (error) {
    console.error('Error in handleUserClick:', JSON.stringify(error, null, 2));
    toast.error('An error occurred while starting the chat');
  }
};
  const handleBackToUserList = () => {
    setShowUserList(true);
    setSelectedConversationId(null);
    setSelectedUser(null);
  };

  const uploadMediaFile = async (file: File) => {
    // Validate file type
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    
    if (!isImage && !isVideo) {
      toast.error("Please upload an image or video file");
      return null;
    }

    // Validate file size (max 100MB for videos, 50MB for images)
    const maxSize = isVideo ? 100 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File size must be less than ${isVideo ? '100MB' : '50MB'}`);
      return null;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
      
      // Use resumable upload for files larger than 6MB
      const useResumable = file.size > 6 * 1024 * 1024;
      
      const uploadOptions = useResumable ? {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      } : {};

      const { data, error } = await supabase.storage
        .from("chat-media")
        .upload(fileName, file, uploadOptions);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("chat-media")
        .getPublicUrl(data.path);

      toast.success(file.type.startsWith("image/") ? "Image uploaded" : "Video uploaded");
      return publicUrl;
    } catch (error) {
      console.error("Error uploading media:", error);
      toast.error(`Failed to upload media: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const uploadMultipleMedia = async (files: FileList): Promise<string[]> => {
    const uploadPromises = Array.from(files).map(file => uploadMediaFile(file));
    const results = await Promise.all(uploadPromises);
    return results.filter((url): url is string => url !== null);
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const urls = await uploadMultipleMedia(files);
    if (urls.length > 0) {
      setMediaUrls(prev => [...prev, ...urls]);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const mediaFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/') || item.type.startsWith('video/')) {
        const file = item.getAsFile();
        if (file) {
          mediaFiles.push(file);
        }
      }
    }

    if (mediaFiles.length > 0) {
      e.preventDefault();
      const urls = await Promise.all(mediaFiles.map(file => uploadMediaFile(file)));
      const validUrls = urls.filter((url): url is string => url !== null);
      if (validUrls.length > 0) {
        setMediaUrls(prev => [...prev, ...validUrls]);
      }
    }
  };

  const addEmoji = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
  };

  const handleSearch = () => {
    if (selectedConversationId && searchQuery.trim()) {
      searchMessages(selectedConversationId, searchQuery);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    clearSearch();
    setShowSearch(false);
  };

  const scrollToMessage = (messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElement.classList.add('bg-primary/10');
      setTimeout(() => messageElement.classList.remove('bg-primary/10'), 2000);
    }
    handleClearSearch();
  };

  const renderMessageContent = (content: string) => {
    const imageMatch = content.match(/\[IMAGE\](.*?)\[\/IMAGE\]/);
    if (imageMatch) {
      const [fullMatch, imageUrl] = imageMatch;
      const textContent = content.replace(fullMatch, "").trim();
      return (
        <>
          {textContent && <p className="text-sm break-words overflow-wrap-anywhere mb-2 whitespace-pre-wrap">{formatTextWithLinks(textContent)}</p>}
          <img 
            src={imageUrl} 
            alt="Shared image" 
            className="rounded-lg max-w-full h-auto max-h-64 object-cover cursor-pointer"
            onClick={() => window.open(imageUrl, '_blank')}
          />
        </>
      );
    }
    return <p className="text-sm break-words overflow-wrap-anywhere whitespace-pre-wrap">{formatTextWithLinks(content)}</p>;
  };

  const formatTextWithLinks = (text: string) => {
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlPattern);
    
    return parts.map((part, index) => {
      if (part.match(urlPattern)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 dark:text-blue-400 underline hover:text-blue-600 dark:hover:text-blue-300 font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && mediaUrls.length === 0) || !selectedConversationId) return;
    const messageContent = newMessage.trim() || ' ';
    setNewMessage('');
    
    // Send first media with message, rest as separate messages
    await sendMessage(selectedConversationId, messageContent, mediaUrls[0]);
    for (let i = 1; i < mediaUrls.length; i++) {
      await sendMessage(selectedConversationId, ' ', mediaUrls[i]);
    }
    
    setMediaUrls([]);
  };

  const handleClearChat = async () => {
    if (!selectedConversationId || !user) return;
    const result = await clearChat(selectedConversationId);
    if (result.success) toast.success('Chat cleared');
    else toast.error('Failed to clear chat');
  };

  const handleDeleteChat = async (conversationId?: string, otherUserId?: string) => {
    if (conversationId && otherUserId) {
      // Single delete: Show confirmation
      setDeletingChatId(conversationId);
      return;
    }

    // Bulk delete
    if (selectedChatsForBulk.size === 0) {
      toast.error('No chats selected for deletion');
      return;
    }

    let successCount = 0;
    for (const otherUserId of selectedChatsForBulk) {
      const conv = conversations.find((c) => c.other_user_id === otherUserId);
      if (conv) {
        const result = await deleteChat(conv.conversation_id, otherUserId);
        if (result.success) successCount++;
        else console.error('Failed to delete chat:', otherUserId, result.error);
      }
    }

    if (successCount > 0) {
      toast.success(`Deleted ${successCount} chat${successCount > 1 ? 's' : ''} for you`);
      setSelectedChatsForBulk(new Set());
      setSelectedConversationId(null);
      setSelectedUser(null);
      refreshConversations();
      refreshRecentChats();
    } else {
      toast.error('Failed to delete chats');
    }
  };

  const confirmDelete = async () => {
    if (!deletingChatId || !selectedUser?.user_id) {
      console.error('Missing conversationId or userId:', { deletingChatId, userId: selectedUser?.user_id });
      toast.error('Cannot delete chat: Missing details');
      setDeletingChatId(null);
      return;
    }
    console.log('Confirming delete:', { conversationId: deletingChatId, otherUserId: selectedUser.user_id });
    const result = await deleteChat(deletingChatId, selectedUser.user_id);
    console.log('Delete result:', result);
    setDeletingChatId(null);
    if (result.success) {
      toast.success('Chat deleted for you');
      setSelectedConversationId(null);
      setSelectedUser(null);
      refreshConversations();
      refreshRecentChats();
    } else {
      toast.error('Failed to delete chat: ' + result.error);
    }
  };

  const toggleBulkSelect = (otherUserId: string) => {
    const newSet = new Set(selectedChatsForBulk);
    if (newSet.has(otherUserId)) {
      newSet.delete(otherUserId);
    } else {
      newSet.add(otherUserId);
    }
    setSelectedChatsForBulk(newSet);
  };

  const handleBlockUser = async () => {
    if (!selectedUser?.user_id || !user) return;
    const { error } = await supabase.from('blocked_users').insert({
      blocker_id: user.id,
      blocked_id: selectedUser.user_id,
    });
    if (error) {
      console.error('Error blocking user:', error);
      toast.error('Failed to block user');
      return;
    }
    toast.success('User blocked');
    setSelectedConversationId(null);
    setSelectedUser(null);
  };

  // --- UI (Desktop) ---
  if (!isMobile) {
    return (
      <Layout>
        <div className="h-[calc(100vh-4rem)] flex gap-6">
          {/* Left column - user list */}
          <div className="w-[380px] bg-card border border-border rounded-2xl overflow-hidden flex-shrink-0 flex flex-col">
            <div className="p-5 border-b border-border bg-surface/30">
              <h2 className="text-xl font-bold text-foreground mb-4">Messages</h2>
              <UserSearch onStartChat={handleUserClick} />
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">
                  Recent Chats
                </h3>
                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                )}
                {!loading && recentChats.length === 0 && (
                  <div className="text-center py-12 px-4">
                    <p className="text-muted-foreground text-sm mb-1">No recent chats</p>
                    <p className="text-muted-foreground/60 text-xs">Search for someone to start</p>
                  </div>
                )}
                {!loading &&
                  recentChats.map((chat) => {
                    const isSelected = selectedUser?.user_id === chat.other_user_id;
                    return (
                      <div
                        key={chat.other_user_id}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'bg-primary/10 shadow-sm border-l-4 border-l-primary' 
                            : 'hover:bg-surface/80 border-l-4 border-l-transparent'
                        }`}
                        onClick={() => handleUserClick(chat.other_user_id)}
                      >
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center relative overflow-hidden ring-2 ring-border">
                            {chat.other_user_avatar ? (
                              <img src={chat.other_user_avatar} alt={chat.other_user_name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm font-bold text-white">
                                {chat.other_user_name?.charAt(0) || 'U'}
                              </span>
                            )}
                          </div>
                          {unreadMessages.has(chat.other_user_id) && (
                            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full ring-2 ring-card"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">{chat.other_user_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{chat.other_user_university}</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
          {/* Right column - chat */}
          <div className="flex-1 bg-card border border-border rounded-2xl flex flex-col h-full overflow-hidden">
            {chatLoading && (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
            {!chatLoading && selectedUser ? (
              <>
                {/* Chat header */}
                <div className="p-5 border-b border-border bg-surface/30 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center overflow-hidden ring-2 ring-border cursor-pointer hover:ring-primary transition-all">
                        {selectedUser.avatar_url ? (
                          <img 
                            src={selectedUser.avatar_url} 
                            alt={selectedUser.full_name || selectedUser.username} 
                            className="w-full h-full object-cover" 
                            onClick={() => navigate(`/${selectedUser.username}`)}
                          />
                        ) : (
                          <span className="text-sm font-bold text-white">
                            {selectedUser.full_name?.charAt(0) || selectedUser.username?.charAt(0) || 'U'}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3
                          className="font-semibold text-foreground text-base cursor-pointer hover:text-primary transition-colors"
                          onClick={() => navigate(`/${selectedUser.username}`)}
                        >
                          {selectedUser.full_name || selectedUser.username}
                        </h3>
                        <p className="text-xs text-muted-foreground">{selectedUser.university}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowSearch(!showSearch)}
                      >
                        <Search className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={handleClearChat}>
                            <MessageSquareX className="w-4 h-4 mr-2" /> Clear Chat
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteChat(selectedConversationId!, selectedUser.user_id)}>
                            <Trash2 className="w-4 h-4 mr-2" /> Delete Chat
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleBlockUser} className="text-destructive">
                            <UserX className="w-4 h-4 mr-2" /> Block User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  {/* Search bar */}
                  {showSearch && (
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Search messages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="flex-1"
                      />
                      <Button onClick={handleSearch} size="sm" disabled={searchLoading}>
                        Search
                      </Button>
                      <Button onClick={handleClearSearch} size="sm" variant="ghost">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Search results */}
                  {searchResults.length > 0 && (
                    <div className="mt-2 max-h-40 overflow-y-auto bg-muted/30 rounded-lg p-2">
                      <p className="text-xs text-muted-foreground mb-2">Found {searchResults.length} message(s)</p>
                      {searchResults.map((msg) => (
                        <div
                          key={msg.id}
                          onClick={() => scrollToMessage(msg.id)}
                          className="p-2 hover:bg-muted rounded cursor-pointer text-sm"
                        >
                          <p className="truncate">{msg.content}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(msg.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Chat messages */}
                <div
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 p-6 overflow-y-auto space-y-3 relative bg-background/50"
                >
                  {currentMessages.length ? (
                    currentMessages.map((message, index) => {
                      const messageReactions = reactions[message.id] || [];
                      const isMine = message.sender_id === user?.id;
                      const isSameSenderAsPrev = index > 0 && currentMessages[index - 1].sender_id === message.sender_id;
                      
                      return (
                        <div
                          key={message.id}
                          id={`message-${message.id}`}
                          className={`flex gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'} ${
                            isSameSenderAsPrev ? 'mt-1' : 'mt-4'
                          } transition-all duration-200 group`}
                        >
                          <div className={`max-w-xs lg:max-w-md flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                            <div
                              className={`px-4 py-3 rounded-2xl shadow-sm transition-all hover:shadow-md ${
                                isMine ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'
                              }`}
                            >
                              {message.media_url && message.media_url.length > 0 && (
                                <div className="mb-2 space-y-2">
                                  {message.media_url.map((url, idx) => (
                                    url.match(/\.(mp4|webm|ogg)$/i) ? (
                                      <video
                                        key={idx}
                                        src={url}
                                        className="max-w-xs rounded-lg"
                                        controls
                                      />
                                    ) : (
                                      <img
                                        key={idx}
                                        src={url}
                                        alt="Message attachment"
                                        className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => window.open(url, '_blank')}
                                      />
                                    )
                                  ))}
                                </div>
                              )}
                              <div className="break-all whitespace-pre-wrap text-sm">{renderMessageContent(message.content)}</div>
                              <p
                                className={`text-xs mt-2 font-medium ${
                                  message.sender_id === user?.id ? 'text-primary-foreground/80' : 'text-muted-foreground'
                                }`}
                              >
                                {new Date(message.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                            
                            {/* Reactions */}
                            {messageReactions.length > 0 && (
                              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                {messageReactions.map((r) => (
                                  <button
                                    key={r.emoji}
                                    onClick={() => toggleReaction(message.id, r.emoji)}
                                    className={`px-2.5 py-1 rounded-full text-xs flex items-center gap-1 font-medium transition-all hover:scale-105 ${
                                      r.hasReacted
                                        ? "bg-primary/20 border border-primary/40 shadow-sm"
                                        : "bg-surface border border-border hover:bg-surface-hover"
                                    }`}
                                  >
                                    <span>{r.emoji}</span>
                                    <span className="text-muted-foreground">{r.count}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                            
                            {/* Add reaction button */}
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Smile className="w-3 h-3" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-2" align={isMine ? "end" : "start"}>
                                <div className="flex gap-1">
                                  {REACTION_EMOJIS.map((e) => (
                                    <button
                                      key={e}
                                      onClick={() => toggleReaction(message.id, e)}
                                      className="w-8 h-8 rounded hover:bg-muted flex items-center justify-center transition-colors"
                                    >
                                      {e}
                                    </button>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-center h-full text-center">
                      <div className="p-8 rounded-2xl bg-surface/50">
                        <h3 className="text-lg font-semibold text-foreground mb-2">No messages yet</h3>
                        <p className="text-sm text-muted-foreground">Start the conversation!</p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                  {newMessageNotification && (
                    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-10">
                      <Button
                        onClick={() => {
                          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                          setNewMessageNotification(false);
                        }}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                        size="sm"
                      >
                        New message ↓
                      </Button>
                    </div>
                  )}
                </div>
                {/* Input */}
                <div className="border-t border-border p-4 bg-card/50 backdrop-blur-sm">
                  {mediaUrls.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {mediaUrls.map((url, index) => (
                        <div key={index} className="relative inline-block group">
                          {url.match(/\.(mp4|webm|ogg)$/i) ? (
                            <video src={url} className="h-24 rounded-xl ring-2 ring-border" controls />
                          ) : (
                            <img src={url} alt="Preview" className="h-24 rounded-xl ring-2 ring-border" />
                          )}
                          <button
                            onClick={() => setMediaUrls(prev => prev.filter((_, i) => i !== index))}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-sm font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 items-end">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleMediaUpload}
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                      />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="flex-shrink-0 hover:bg-surface"
                    >
                      {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="flex-shrink-0 hover:bg-surface">
                          <Smile className="w-4 h-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2" align="start">
                        <div className="grid grid-cols-6 gap-1">
                          {TEXT_EMOJIS.map((e) => (
                            <button
                              key={e}
                              onClick={() => addEmoji(e)}
                              className="w-9 h-9 rounded-lg hover:bg-surface flex items-center justify-center transition-colors text-xl hover:scale-110"
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onPaste={handlePaste}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="flex-1 resize-none"
                      rows={1}
                    />
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={(!newMessage.trim() && mediaUrls.length === 0) || uploadingImage}
                      className="flex-shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div className="p-12 rounded-3xl bg-surface/50 max-w-md">
                  <h3 className="text-xl font-semibold text-foreground mb-3">Welcome to Messages</h3>
                  <p className="text-sm text-muted-foreground">Select a conversation from the left to start chatting</p>
                </div>
              </div>
            )}
            {/* Confirmation Dialog (Instagram-style) */}
            {deletingChatId && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-card p-6 rounded-lg max-w-sm w-full mx-4">
                  <h3 className="text-lg font-semibold mb-2">Delete Chat?</h3>
                  <p className="text-muted-foreground mb-4">
                    This will remove the chat from your inbox only. The other person will still have it.
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDeletingChatId(null)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={confirmDelete}>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // --- Mobile UI ---
  return (
    <>
      {showUserList ? (
        <MobileLayout showHeader={true} showNavigation={true}>
          <div className="p-4">
            <UserSearch onStartChat={handleUserClick} />
            <div className="mt-6 space-y-4">
               <h3 className="text-sm font-medium text-muted-foreground">
                 Recent Chats
               </h3>
              {loading && (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {!loading && recentChats.length === 0 && (
                <p className="text-muted-foreground text-sm">No recent chats. Start one!</p>
              )}
              {!loading &&
                recentChats.map((chat) => (
                   <div
                     key={chat.other_user_id}
                     className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                     onClick={() => handleUserClick(chat.other_user_id)}
                   >
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center relative overflow-hidden">
                        {chat.other_user_avatar ? (
                          <img src={chat.other_user_avatar} alt={chat.other_user_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-white">
                            {chat.other_user_name?.charAt(0) || 'U'}
                          </span>
                        )}
                        {unreadMessages.has(chat.other_user_id) && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                        )}
                      </div>
                     <div className="flex-1">
                       <p className="font-medium text-foreground">{chat.other_user_name}</p>
                       <p className="text-sm text-muted-foreground">{chat.other_user_university}</p>
                     </div>
                   </div>
                ))}
            </div>
          </div>
        </MobileLayout>
      ) : (
        <div className="h-screen bg-background flex flex-col">
          <MobileChatHeader
            userName={selectedUser?.full_name || selectedUser?.username || 'Unknown User'}
            userUniversity={selectedUser?.university || 'University'}
            userAvatar={selectedUser?.avatar_url}
            onBackClick={handleBackToUserList}
            onClearChat={handleClearChat}
            onDeleteChat={() => handleDeleteChat(selectedConversationId!, selectedUser.user_id)}
            onBlockUser={handleBlockUser}
          />
          <div className="flex-1 flex flex-col overflow-hidden">
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 p-4 overflow-y-auto space-y-4 pb-safe relative"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              {chatLoading && (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {!chatLoading && currentMessages.length ? (
                currentMessages.map((message) => {
                  const messageReactions = reactions[message.id] || [];
                  const isMine = message.sender_id === user?.id;
                  return (
                    <div
                      key={message.id}
                      id={`message-${message.id}`}
                      className={`flex gap-2 group ${isMine ? 'flex-row-reverse' : 'flex-row'} transition-colors duration-500`}
                    >
                      <div className={`max-w-xs flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            isMine ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                          }`}
                        >
                          {message.media_url && message.media_url.length > 0 && (
                            <div className="mb-2 space-y-2">
                              {message.media_url.map((url, idx) => (
                                url.match(/\.(mp4|webm|ogg)$/i) ? (
                                  <video
                                    key={idx}
                                    src={url}
                                    className="max-w-xs rounded-lg"
                                    controls
                                  />
                                ) : (
                                  <img
                                    key={idx}
                                    src={url}
                                    alt="Message attachment"
                                    className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => window.open(url, '_blank')}
                                  />
                                )
                              ))}
                            </div>
                          )}
                        <div className="break-all whitespace-pre-wrap">{renderMessageContent(message.content)}</div>
                          <p
                        className={`text-xs mt-1 ${
                            isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}
                        >
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      
                      {/* Reactions */}
                      {messageReactions.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {messageReactions.map((r) => (
                            <button
                              key={r.emoji}
                              onClick={() => toggleReaction(message.id, r.emoji)}
                              className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 transition-colors ${
                                r.hasReacted
                                  ? "bg-primary/30 border border-primary/50"
                                  : "bg-card border border-border hover:bg-muted"
                              }`}
                            >
                              <span>{r.emoji}</span>
                              <span className="text-muted-foreground">{r.count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {/* Add reaction button */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Smile className="w-3 h-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2" align={isMine ? "end" : "start"}>
                          <div className="flex gap-1">
                            {REACTION_EMOJIS.map((e) => (
                              <button
                                key={e}
                                onClick={() => toggleReaction(message.id, e)}
                                className="w-8 h-8 rounded hover:bg-muted flex items-center justify-center transition-colors"
                              >
                                {e}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-2">No messages yet</h3>
                    <p className="text-muted-foreground">Start the conversation!</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
              {newMessageNotification && (
                <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-10">
                  <Button
                    onClick={() => {
                      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                      setNewMessageNotification(false);
                    }}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                    size="sm"
                  >
                    New message ↓
                  </Button>
                </div>
              )}
            </div>
            <div className="border-t border-border p-4 bg-card/95 backdrop-blur-sm sticky bottom-0">
              {mediaUrls.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {mediaUrls.map((url, index) => (
                    <div key={index} className="relative inline-block">
                      {url.match(/\.(mp4|webm|ogg)$/i) ? (
                        <video src={url} className="h-20 rounded-lg" controls />
                      ) : (
                        <img src={url} alt="Preview" className="h-20 rounded-lg" />
                      )}
                      <button
                        onClick={() => setMediaUrls(prev => prev.filter((_, i) => i !== index))}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 items-end">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleMediaUpload}
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                  />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="flex-shrink-0"
                >
                  <ImagePlus className="w-4 h-4" />
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="flex-shrink-0">
                      <Smile className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2" align="start">
                    <div className="grid grid-cols-6 gap-1">
                      {TEXT_EMOJIS.map((e) => (
                        <button
                          key={e}
                          onClick={() => addEmoji(e)}
                          className="w-8 h-8 rounded hover:bg-muted flex items-center justify-center transition-colors text-lg"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onPaste={handlePaste}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 resize-none max-h-32"
                  rows={1}
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={(!newMessage.trim() && mediaUrls.length === 0) || uploadingImage}
                  className="flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          {deletingChatId && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-card p-6 rounded-lg max-w-sm w-full mx-4">
                <h3 className="text-lg font-semibold mb-2">Delete Chat?</h3>
                <p className="text-muted-foreground mb-4">
                  This will remove the chat from your inbox only. The other person will still have it.
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDeletingChatId(null)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={confirmDelete}>
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
