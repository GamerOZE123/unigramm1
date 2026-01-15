import { useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';

export const PushNotificationInitializer: React.FC = () => {
  const { user } = useAuth();
  const { isSupported, permission, isSubscribed, subscribe } = usePushNotifications();

  useEffect(() => {
    // Only attempt to subscribe if:
    // 1. User is logged in
    // 2. Push is supported
    // 3. Permission is not denied
    // 4. Not already subscribed
    if (user && isSupported && permission !== 'denied' && !isSubscribed) {
      // Auto-subscribe if permission was previously granted
      if (permission === 'granted') {
        subscribe();
      }
    }
  }, [user, isSupported, permission, isSubscribed, subscribe]);

  // Register service worker on mount
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'NAVIGATE_TO_CHAT') {
          window.location.href = `/chat?conversation=${event.data.conversationId}`;
        }
      });
    }
  }, []);

  return null;
};
