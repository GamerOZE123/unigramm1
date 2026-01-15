import { useEffect, useRef } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';

export const PushNotificationInitializer: React.FC = () => {
  const { user } = useAuth();
  const { isSupported, permission, isSubscribed, isLoading, subscribe } = usePushNotifications();
  const hasAttemptedSubscribe = useRef(false);

  // Auto-subscribe when user logs in
  useEffect(() => {
    // Reset the attempt flag when user changes (logout/login)
    if (!user) {
      hasAttemptedSubscribe.current = false;
      return;
    }

    // Only attempt to subscribe once per session if:
    // 1. User is logged in
    // 2. Push is supported
    // 3. Permission is not denied
    // 4. Not already subscribed
    // 5. Not currently loading
    // 6. Haven't already attempted this session
    if (
      user && 
      isSupported && 
      permission !== 'denied' && 
      !isSubscribed && 
      !isLoading &&
      !hasAttemptedSubscribe.current
    ) {
      hasAttemptedSubscribe.current = true;
      console.log('Auto-subscribing to push notifications...');
      subscribe().then((success) => {
        if (success) {
          console.log('Push notification subscription successful');
        } else {
          console.log('Push notification subscription failed or was denied');
        }
      });
    }
  }, [user, isSupported, permission, isSubscribed, isLoading, subscribe]);

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
