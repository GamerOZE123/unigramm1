import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Check, X, Crown } from 'lucide-react';
import { toast } from 'sonner';

interface Subscription {
  id: string;
  name: string;
  price_monthly: number;
  features: any;
  monthly_post_limit: number;
  targeting_enabled: boolean;
  analytics_tier: string;
  priority_placement: boolean;
  custom_branding: boolean;
}

interface UserSubscription {
  subscription_id: string;
  status: string;
  expires_at: string | null;
  subscriptions: Subscription;
}

interface CompanyProfile {
  monthly_posts_used: number;
  monthly_posts_limit: number;
}

interface SubscriptionCardProps {
  onUpgradeClick: () => void;
}

export default function SubscriptionCard({ onUpgradeClick }: SubscriptionCardProps) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscriptionData();
    }
  }, [user]);

  const fetchSubscriptionData = async () => {
    try {
      // Fetch user subscription
      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*, subscriptions(*)')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (subError && subError.code !== 'PGRST116') throw subError;
      setSubscription(subData);

      // Fetch company profile
      const { data: profileData, error: profileError } = await supabase
        .from('company_profiles')
        .select('monthly_posts_used, monthly_posts_limit')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (profileError) throw profileError;
      setCompanyProfile(profileData);
    } catch (error: any) {
      console.error('Error fetching subscription data:', error);
      // Don't show error toast for missing data - it's expected for new users
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading subscription...</div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription || !companyProfile) {
    return null;
  }

  const plan = subscription.subscriptions;
  const postsUsed = companyProfile.monthly_posts_used;
  const postsLimit = plan.monthly_post_limit === -1 ? Infinity : plan.monthly_post_limit;
  const usagePercentage = postsLimit === Infinity ? 0 : (postsUsed / postsLimit) * 100;
  const daysUntilRenewal = subscription.expires_at
    ? Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const getPlanColor = (name: string) => {
    switch (name.toLowerCase()) {
      case 'free': return 'bg-muted text-muted-foreground';
      case 'growth': return 'bg-blue-500 text-white';
      case 'premium': return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white';
      default: return 'bg-primary text-primary-foreground';
    }
  };

  const getProgressColor = () => {
    if (usagePercentage >= 90) return 'bg-destructive';
    if (usagePercentage >= 70) return 'bg-amber-500';
    return 'bg-primary';
  };

  const features = [
    { label: 'Monthly Posts', value: postsLimit === Infinity ? 'Unlimited' : postsLimit, included: true },
    { label: 'Analytics', value: plan.analytics_tier, included: true },
    { label: 'Audience Targeting', value: '', included: plan.targeting_enabled },
    { label: 'Priority Placement', value: '', included: plan.priority_placement },
    { label: 'Custom Branding', value: '', included: plan.custom_branding },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Current Subscription</CardTitle>
          <Badge className={getPlanColor(plan.name)}>
            {plan.name === 'Premium' && <Crown className="w-3 h-3 mr-1" />}
            {plan.name}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Post Usage */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Posts Used This Month</span>
            <span className="font-medium">
              {postsUsed} / {postsLimit === Infinity ? '∞' : postsLimit}
            </span>
          </div>
          {postsLimit !== Infinity && (
            <Progress value={usagePercentage} className={`h-2 ${getProgressColor()}`} />
          )}
          {usagePercentage >= 90 && postsLimit !== Infinity && (
            <p className="text-sm text-destructive mt-2">
              ⚠️ You're almost at your post limit!
            </p>
          )}
        </div>

        {/* Features List */}
        <div className="space-y-2">
          <p className="text-sm font-medium mb-3">Plan Features</p>
          {features.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              {feature.included ? (
                <Check className="w-4 h-4 text-primary" />
              ) : (
                <X className="w-4 h-4 text-muted-foreground" />
              )}
              <span className={feature.included ? '' : 'text-muted-foreground'}>
                {feature.label}
                {feature.value && ` - ${feature.value}`}
              </span>
            </div>
          ))}
        </div>

        {/* Renewal Info */}
        {daysUntilRenewal && (
          <div className="text-sm text-muted-foreground">
            Renews in {daysUntilRenewal} days
          </div>
        )}

        {/* Upgrade Button */}
        {plan.name !== 'Premium' && (
          <Button onClick={onUpgradeClick} className="w-full">
            Upgrade Plan
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
