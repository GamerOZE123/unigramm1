import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, TrendingUp, Target, BarChart3, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Subscription {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
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
  started_at: string;
  expires_at: string;
  auto_renew: boolean;
  subscriptions: Subscription;
}

export default function SubscriptionsView() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);

      // Fetch all company subscriptions
      const { data: subsData, error: subsError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_type', 'company')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      if (subsError) throw subsError;
      setSubscriptions(subsData || []);

      // Fetch current user subscription
      const { data: userSubData, error: userSubError } = await supabase
        .from('user_subscriptions')
        .select('*, subscriptions(*)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (userSubError && userSubError.code !== 'PGRST116') throw userSubError;
      setCurrentSubscription(userSubData);
    } catch (error: any) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (!user) return;
    
    try {
      // Check if user already has an active subscription
      if (currentSubscription) {
        // Update existing subscription
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            subscription_id: planId,
            status: 'active',
            started_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            auto_renew: true,
          })
          .eq('id', currentSubscription.subscription_id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Create new subscription
        const { error } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: user.id,
            subscription_id: planId,
            status: 'active',
            started_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            auto_renew: true,
          });

        if (error) throw error;
      }

      toast.success('Subscription updated successfully!');
      await fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      toast.error('Failed to update subscription');
    }
  };

  const getPlanFeatures = (sub: Subscription) => {
    const features = [];
    
    if (sub.monthly_post_limit === -1) {
      features.push({ text: 'Unlimited advertising posts', icon: Zap });
    } else {
      features.push({ text: `${sub.monthly_post_limit} posts per month`, icon: BarChart3 });
    }
    
    features.push({ 
      text: `${sub.analytics_tier.charAt(0).toUpperCase() + sub.analytics_tier.slice(1)} analytics dashboard`,
      icon: BarChart3 
    });
    
    if (sub.targeting_enabled) {
      features.push({ text: 'Advanced audience targeting', icon: Target });
    }
    
    if (sub.priority_placement) {
      features.push({ text: 'Priority ad placement', icon: TrendingUp });
      features.push({ text: 'Featured in top positions', icon: Crown });
    }
    
    if (sub.custom_branding) {
      features.push({ text: 'Custom branding options', icon: Crown });
      features.push({ text: 'Homepage banner slots', icon: Crown });
      features.push({ text: 'Dedicated account manager', icon: Crown });
    }
    
    if (sub.name === 'Growth') {
      features.push({ text: 'Priority support', icon: Zap });
    }
    
    return features;
  };

  const getPlanColor = (name: string) => {
    switch (name.toLowerCase()) {
      case 'free': return 'from-slate-500 to-slate-600';
      case 'growth': return 'from-blue-500 to-blue-600';
      case 'premium': return 'from-amber-500 to-orange-500';
      default: return 'from-primary to-primary';
    }
  };

  const getBorderColor = (name: string) => {
    switch (name.toLowerCase()) {
      case 'free': return 'border-muted';
      case 'growth': return 'border-blue-500';
      case 'premium': return 'border-amber-500';
      default: return 'border-primary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const currentPlanId = currentSubscription?.subscription_id;

  return (
    <div className="space-y-8">
      {/* Current Plan Section */}
      {currentSubscription && (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Current Plan</CardTitle>
                <CardDescription>Your active subscription details</CardDescription>
              </div>
              <Badge className={`bg-gradient-to-r ${getPlanColor(currentSubscription.subscriptions.name)} text-white text-lg px-4 py-2`}>
                {currentSubscription.subscriptions.name}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-lg font-semibold capitalize">{currentSubscription.status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Started On</p>
                <p className="text-lg font-semibold">
                  {new Date(currentSubscription.started_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Renews On</p>
                <p className="text-lg font-semibold">
                  {new Date(currentSubscription.expires_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Plan Features</p>
              <div className="grid md:grid-cols-2 gap-2">
                {getPlanFeatures(currentSubscription.subscriptions).map((feature, idx) => {
                  const Icon = feature.icon;
                  return (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <Icon className="w-4 h-4 text-primary" />
                      <span>{feature.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Plans Section */}
      <div>
        <h2 className="text-2xl font-bold mb-2">All Plans</h2>
        <p className="text-muted-foreground mb-6">Choose the perfect plan for your advertising needs</p>
        
        <div className="grid md:grid-cols-3 gap-6">
          {subscriptions.map((sub) => {
            const isCurrentPlan = sub.id === currentPlanId;
            
            return (
              <Card
                key={sub.id}
                className={`border-2 relative ${getBorderColor(sub.name)} ${
                  isCurrentPlan ? 'ring-2 ring-primary shadow-lg' : ''
                } transition-all hover:shadow-xl`}
              >
                {sub.name === 'Premium' && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1">
                      <Crown className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getPlanColor(sub.name)} flex items-center justify-center mb-4`}>
                    {sub.name === 'Premium' && <Crown className="w-6 h-6 text-white" />}
                    {sub.name === 'Growth' && <TrendingUp className="w-6 h-6 text-white" />}
                    {sub.name === 'Free' && <BarChart3 className="w-6 h-6 text-white" />}
                  </div>
                  <CardTitle className="text-2xl">{sub.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">₹{sub.price_monthly}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  {sub.price_yearly > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      or ₹{sub.price_yearly}/year <span className="text-primary font-semibold">(Save 17%)</span>
                    </p>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {getPlanFeatures(sub).map((feature, idx) => {
                      const Icon = feature.icon;
                      return (
                        <li key={idx} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature.text}</span>
                        </li>
                      );
                    })}
                  </ul>

                  {isCurrentPlan ? (
                    <Button disabled className="w-full">
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleSelectPlan(sub.id)}
                      variant={sub.name === 'Premium' ? 'default' : 'outline'}
                      className="w-full"
                    >
                      {sub.price_monthly === 0 ? 'Downgrade' : 'Upgrade to ' + sub.name}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-1">Can I change plans anytime?</h4>
            <p className="text-sm text-muted-foreground">
              Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">What happens when I hit my post limit?</h4>
            <p className="text-sm text-muted-foreground">
              Your existing ads will continue to run, but you won't be able to create new ones until the next billing cycle or you upgrade.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Do you offer refunds?</h4>
            <p className="text-sm text-muted-foreground">
              We offer a 7-day money-back guarantee for all paid plans. Contact support for assistance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
