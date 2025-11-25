import React, { useState } from "react";
import Layout from "@/components/layout/Layout";
import MobileLayout from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNotifications } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { useChat } from "@/hooks/useChat";
import { Heart, MessageCircle, User, Check, CarTaxiFront } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Notifications() {
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();
  const { createConversation } = useChat();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("all");

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="w-5 h-5 text-red-500" />;
      case "comment":
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case "follow":
        return <User className="w-5 h-5 text-green-500" />;
      case "message":
        return <MessageCircle className="w-5 h-5 text-purple-500" />;
      case "carpool_request":
        return <CarTaxiFront className="w-5 h-5 text-orange-500" />;
      case "carpool_accepted":
        return <Check className="w-5 h-5 text-green-500" />;
      case "club_accepted":
        return <Check className="w-5 h-5 text-green-500" />;
      default:
        return <div className="w-5 h-5 bg-gray-400 rounded-full" />;
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Handle different notification types
    if (notification.type === "message" && notification.related_user_id) {
      // Create conversation and navigate to chat with conversation ID
      const conversationId = await createConversation(notification.related_user_id);
      if (conversationId) {
        navigate(`/chat?conversation=${conversationId}`);
      }
    } else if (notification.type === "carpool_request" || notification.type === "carpool_accepted") {
      // Navigate to carpooling page
      navigate("/carpooling");
    } else if (notification.type === "club_accepted") {
      // Navigate to clubs page
      navigate("/clubs");
    } else if (notification.related_post_id) {
      // Navigate to the specific post
      navigate(`/post/${notification.related_post_id}`);
    } else if (notification.related_user_id) {
      // Navigate to user profile
      navigate(`/profile/${notification.related_user_id}`);
    }
  };

  if (loading) {
    const LoadingComponent = (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

    return isMobile ? <MobileLayout>{LoadingComponent}</MobileLayout> : <Layout>{LoadingComponent}</Layout>;
  }

  const getFilteredNotifications = () => {
    if (activeTab === "all") return notifications;
    if (activeTab === "likes") return notifications.filter(n => n.type === "like");
    if (activeTab === "messages") return notifications.filter(n => n.type === "message");
    if (activeTab === "mentions") return notifications.filter(n => n.type === "comment");
    return notifications;
  };

  const filteredNotifications = getFilteredNotifications();

  const NotificationContent = (
    <div className="space-y-6 pt-6 px-4">
      <div className="flex items-center justify-end">
        {notifications.some((n) => !n.is_read) && (
          <Button onClick={markAllAsRead} variant="outline" size="sm">
            <Check className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="likes">Likes</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="mentions">Mentions</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-3 mt-6">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-card border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                  !notification.is_read ? "bg-muted/30" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{notification.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(notification.created_at).toLocaleDateString()} at{" "}
                      {new Date(notification.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  {!notification.is_read && <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No notifications</h3>
              <p className="text-muted-foreground">You're all caught up!</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );

  return isMobile ? <MobileLayout>{NotificationContent}</MobileLayout> : <Layout>{NotificationContent}</Layout>;
}
