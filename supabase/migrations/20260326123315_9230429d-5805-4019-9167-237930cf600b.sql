-- Update ksreeniketh's Premium subscription to active with far-future expiry
UPDATE user_subscriptions 
SET status = 'active', 
    expires_at = '2030-12-31 23:59:59+00',
    started_at = now(),
    updated_at = now()
WHERE id = 'b6c0dbd2-1f92-44ea-9b45-cea446730c36' 
  AND user_id = 'b75eb234-0bc7-42f1-9b9a-6bfc5174b4f7';

-- Deactivate the Free tier subscription
UPDATE user_subscriptions 
SET status = 'expired'
WHERE id = 'd917ddee-e0b8-41a4-9b21-c6bedf84e0be' 
  AND user_id = 'b75eb234-0bc7-42f1-9b9a-6bfc5174b4f7';

-- Update business profile to reflect premium
UPDATE business_profiles 
SET subscription_tier = 'premium',
    subscription_expires_at = '2030-12-31 23:59:59+00',
    monthly_posts_limit = -1,
    monthly_posts_used = 0,
    targeting_enabled = true,
    analytics_tier = 'premium'
WHERE user_id = 'b75eb234-0bc7-42f1-9b9a-6bfc5174b4f7';