import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { CarTaxiFront, MapPin, Clock, Users, Plus, Package, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MobileHeader from '@/components/layout/MobileHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import CreateRideModal from '@/components/carpooling/CreateRideModal';

interface CarpoolRide {
  id: string;
  driver_id: string;
  from_location: string;
  to_location: string;
  ride_time: string;
  ride_date: string;
  available_seats: number;
  price: number;
  profiles?: {
    user_id: string;
    full_name: string;
    avatar_url: string;
    university: string;
  } | null;
}

export default function Carpooling() {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [userUniversity, setUserUniversity] = useState<string>('');
  const [rides, setRides] = useState<CarpoolRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [createRideModalOpen, setCreateRideModalOpen] = useState(false);

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

  const fetchRides = async () => {
    if (!userUniversity) return;
    
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      const { data: ridesData, error: ridesError } = await supabase
        .from('carpool_rides')
        .select('*')
        .eq('is_active', true)
        .gte('ride_date', today)
        .order('ride_date', { ascending: true })
        .order('ride_time', { ascending: true });

      if (ridesError) throw ridesError;

      if (ridesData && ridesData.length > 0) {
        // Fetch profiles for all drivers
        const driverIds = [...new Set(ridesData.map(ride => ride.driver_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url, university')
          .in('user_id', driverIds);

        if (profilesError) throw profilesError;

        const profilesMap = new Map();
        profilesData?.forEach(profile => {
          profilesMap.set(profile.user_id, profile);
        });

        const ridesWithProfiles = ridesData.map(ride => ({
          ...ride,
          profiles: profilesMap.get(ride.driver_id)
        }));

        // Filter by university
        const filteredRides = ridesWithProfiles.filter(
          ride => ride.profiles?.university === userUniversity
        );

        setRides(filteredRides);
      } else {
        setRides([]);
      }
    } catch (error) {
      console.error('Error fetching rides:', error);
      toast({
        title: "Error",
        description: "Failed to load carpool rides",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, [userUniversity]);

  return (
    <Layout>
      {isMobile && <MobileHeader />}
      
      <div className="space-y-6 p-6 pb-24">
        <div className="text-center">
          <CarTaxiFront className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Carpooling</h1>
          <p className="text-muted-foreground">
            Share rides, save money, and make new friends
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Available Rides</h2>
          
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading rides...</div>
          ) : rides.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No rides available at the moment</div>
          ) : (
            rides.map((ride) => (
              <Card key={ride.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>{ride.profiles?.full_name || 'Unknown Driver'}</span>
                    <span className="text-lg font-bold text-primary">${ride.price}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{ride.from_location} → {ride.to_location}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{new Date(ride.ride_date).toLocaleDateString()} at {ride.ride_time}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>{ride.available_seats} seats</span>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full sm:w-auto mt-3">
                    Request Ride
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-6 z-50">
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg"
          onClick={() => setCreateRideModalOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Create Ride Modal */}
      <CreateRideModal
        open={createRideModalOpen}
        onOpenChange={setCreateRideModalOpen}
        onRideCreated={() => {
          fetchRides();
        }}
      />
    </Layout>
  );
}