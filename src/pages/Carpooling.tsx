import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { CarTaxiFront, MapPin, Clock, Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MobileHeader from '@/components/layout/MobileHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export default function Carpooling() {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [userUniversity, setUserUniversity] = useState<string>('');

  useEffect(() => {
    const fetchUserUniversity = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('university')
        .eq('user_id', user.id)
        .single();
      if (data) setUserUniversity(data.university || '');
    };
    fetchUserUniversity();
  }, [user]);

  // Mock data for demonstration - filtered by university
  const availableRides = [
    {
      id: 1,
      driver: 'Sarah Johnson',
      from: 'Campus Main Gate',
      to: 'Downtown Mall',
      time: '3:00 PM',
      date: 'Today',
      seats: 3,
      price: '$5'
    },
    {
      id: 2,
      driver: 'Mike Chen',
      from: 'Library',
      to: 'Airport',
      time: '6:30 PM',
      date: 'Tomorrow',
      seats: 2,
      price: '$15'
    },
    {
      id: 3,
      driver: 'Emma Davis',
      from: 'Student Center',
      to: 'Metro Station',
      time: '8:00 AM',
      date: 'Monday',
      seats: 4,
      price: '$3'
    }
  ];

  return (
    <Layout>
      {isMobile && <MobileHeader />}
      
      <div className="space-y-6 p-6">
        <div className="text-center">
          <CarTaxiFront className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Carpooling</h1>
          <p className="text-muted-foreground">
            Share rides, save money, and make new friends
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Button className="flex-1">
            <Plus className="w-4 h-4 mr-2" />
            Offer a Ride
          </Button>
          <Button variant="outline" className="flex-1">
            <Users className="w-4 h-4 mr-2" />
            Find a Ride
          </Button>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Available Rides</h2>
          
          {availableRides.map((ride) => (
            <Card key={ride.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{ride.driver}</span>
                  <span className="text-lg font-bold text-primary">{ride.price}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{ride.from} → {ride.to}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{ride.date} at {ride.time}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{ride.seats} seats available</span>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full mt-3">
                  Request Ride
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="post-card text-center py-8">
          <CarTaxiFront className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Start Carpooling Today</h3>
          <p className="text-muted-foreground mb-4">
            Reduce your carbon footprint and transportation costs by sharing rides with fellow students.
          </p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Ride
          </Button>
        </div>
      </div>
    </Layout>
  );
}