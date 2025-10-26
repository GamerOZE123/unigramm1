import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown } from 'lucide-react';
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

interface SubscriptionComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubscriptionComparisonModal({ isOpen, onClose }: SubscriptionComparisonModalProps) {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchSubscriptions();
      fetchCurrentPlan();
    }
  }, [isOpen]);

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_type', 'company')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error: any) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('subscription_id')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) setCurrentPlanId(data.subscription_id);
    } catch (error: any) {
      console.error('Error fetching current plan:', error);
    }
  };

  const handleSelectPlan = (planId: string) => {
    // TODO: Implement payment integration
    toast.info('Payment integration coming soon!');
    onClose();
  };

  const getPlanFeatures = (sub: Subscription) => {
    const features = [];
    
    if (sub.monthly_post_limit === -1) {
      features.push('Unlimited advertising posts');
    } else {
      features.push(`${sub.monthly_post_limit} posts per month`);
    }
    
    features.push(`${sub.analytics_tier.charAt(0).toUpperCase() + sub.analytics_tier.slice(1)} analytics dashboard`);
    
    if (sub.targeting_enabled) {
      features.push('Advanced audience targeting');
    }
    
    if (sub.priority_placement) {
      features.push('Priority ad placement');
      features.push('Featured in top positions');
    }
    
    if (sub.custom_branding) {
      features.push('Custom branding options');
      features.push('Homepage banner slots');
      features.push('Dedicated account manager');
    }
    
    if (sub.name === 'Growth') {
      features.push('Priority support');
    }
    
    return features;
  };

  const getPlanColor = (name: string) => {
    switch (name.toLowerCase()) {
      case 'free': return 'border-muted';
      case 'growth': return 'border-blue-500';
      case 'premium': return 'border-amber-500';
      default: return 'border-primary';
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl">
          <div className="text-center py-8">Loading plans...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Choose Your Plan</DialogTitle>
          <p className="text-muted-foreground">Select the perfect plan for your company</p>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-6 mt-6">
          {subscriptions.map((sub) => {
            const isCurrentPlan = sub.id === currentPlanId;
            
            return (
              <div
                key={sub.id}
                className={`border-2 rounded-lg p-6 relative ${getPlanColor(sub.name)} ${
                  isCurrentPlan ? 'ring-2 ring-primary' : ''
                }`}
              >
                {sub.name === 'Premium' && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                      <Crown className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-xl font-bold mb-1">{sub.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">₹{sub.price_monthly}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  {sub.price_yearly > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      or ₹{sub.price_yearly}/year (save 17%)
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {getPlanFeatures(sub).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
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
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
