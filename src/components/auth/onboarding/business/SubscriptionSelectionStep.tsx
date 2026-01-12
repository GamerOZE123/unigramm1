import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BusinessOnboardingData } from '@/hooks/useBusinessOnboarding';
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

interface SubscriptionSelectionStepProps {
  onComplete: (data: Partial<BusinessOnboardingData>) => void;
  onBack: () => void;
  onData: (data: Partial<BusinessOnboardingData>) => void;
  initialData?: Partial<BusinessOnboardingData>;
  loading?: boolean;
}

export default function SubscriptionSelectionStep({ 
  onComplete, 
  onBack, 
  onData, 
  initialData,
  loading 
}: SubscriptionSelectionStepProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>(initialData?.subscription_id || '');
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  useEffect(() => {
    // Auto-select Free tier by default
    if (subscriptions.length > 0 && !selectedPlan) {
      const freeTier = subscriptions.find(s => s.name === 'Free');
      if (freeTier) {
        setSelectedPlan(freeTier.id);
        onData({ subscription_id: freeTier.id });
      }
    }
  }, [subscriptions]);

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_type', 'business')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      if (error) throw error;
      setSubscriptions(data || []);
      
      // Auto-select Free plan if none selected
      if (!selectedPlan && data && data.length > 0) {
        setSelectedPlan(data[0].id);
      }
    } catch (error: any) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleComplete = () => {
    if (!selectedPlan) return;
    onData({ subscription_id: selectedPlan });
    onComplete({ subscription_id: selectedPlan });
  };

  const getPlanFeatures = (sub: Subscription) => {
    const features = [];
    
    if (sub.monthly_post_limit === -1) {
      features.push('Unlimited advertising posts');
    } else {
      features.push(`${sub.monthly_post_limit} posts per month`);
    }
    
    features.push(`${sub.analytics_tier.charAt(0).toUpperCase() + sub.analytics_tier.slice(1)} analytics`);
    
    if (sub.targeting_enabled) {
      features.push('Audience targeting');
    } else {
      features.push('No audience targeting');
    }
    
    if (sub.priority_placement) {
      features.push('Priority ad placement');
    }
    
    if (sub.custom_branding) {
      features.push('Custom branding options');
      features.push('Homepage banner slots');
    }
    
    return features;
  };

  if (loadingPlans) {
    return (
      <div className="bg-card p-8 rounded-lg shadow-lg text-center">
        <p className="text-muted-foreground">Loading plans...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
        <p className="text-muted-foreground">Select a subscription plan for your business</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {subscriptions.map((sub) => (
          <div
            key={sub.id}
            onClick={() => setSelectedPlan(sub.id)}
            className={`bg-card p-6 rounded-lg shadow-lg cursor-pointer transition border-2 ${
              selectedPlan === sub.id
                ? 'border-primary'
                : 'border-transparent hover:border-muted-foreground/20'
            }`}
          >
            <div className="mb-4">
              <h3 className="text-xl font-bold">{sub.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">₹{sub.price_monthly}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </div>

            <ul className="space-y-3">
              {getPlanFeatures(sub).map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {selectedPlan === sub.id && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-primary text-sm font-medium">
                  <Check className="w-5 h-5" />
                  Selected
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button 
          onClick={handleComplete} 
          disabled={!selectedPlan || loading} 
          className="flex-1"
        >
          {loading ? 'Creating Profile...' : 'Complete Setup'}
        </Button>
      </div>
    </div>
  );
}
