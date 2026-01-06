import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Sparkles } from 'lucide-react';

export default function SubscriptionsView() {
  return (
    <div className="space-y-6">
      <Card className="border-2 border-dashed border-primary/30">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4">
            <CreditCard className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Coming Soon
            <Sparkles className="w-5 h-5 text-amber-500" />
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground max-w-md mx-auto">
            We're working on exciting subscription plans to help you reach more students and grow your brand. Stay tuned for premium features including:
          </p>
          <ul className="text-sm text-muted-foreground space-y-2 max-w-xs mx-auto text-left">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Advanced audience targeting
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Priority ad placement
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Detailed analytics dashboard
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Homepage banner slots
            </li>
          </ul>
          <p className="text-sm text-muted-foreground pt-4">
            Want early access? Contact us at <span className="text-primary font-medium">support@example.com</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
