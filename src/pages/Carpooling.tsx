import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { CarTaxiFront, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MobileHeader from '@/components/layout/MobileHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import CreateRideModal from '@/components/carpooling/CreateRideModal';
import CarpoolRideCard from '@/components/carpooling/CarpoolRideCard';
import RideRequestModal from '@/components/carpooling/RideRequestModal';
import EditRideModal from '@/components/carpooling/EditRideModal';

interface CarpoolRide {
  id: string;
  driver_id: string;
  from_location: string;
  to_location: string;
  ride_time: string;
  ride_date: string;
  available_seats: number;
  price: number;
  car_type?: string;
  baggage_allowed?: number;
  notes?: string;
  profiles?: {
    user_id: string;
    full_name: string;
    avatar_url: string;
    university: string;
  } | null;
  request?: {
    status: string;
  } | null;
}

export default function Carpooling() {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [userUniversity, setUserUniversity] = useState<string>('');
  const [rides, setRides] = useState<CarpoolRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [createRideModalOpen, setCreateRideModalOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRideId, setSelectedRideId] = useState<string>('');
  const [selectedRide, setSelectedRide] = useState<any>(null);

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
    if (!userUniversity || !user) return;
    
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

        // Fetch ride requests for current user
        const { data: requestsData } = await supabase
          .from('carpool_ride_requests')
          .select('ride_id, status')
          .eq('passenger_id', user.id);

        const profilesMap = new Map();
        profilesData?.forEach(profile => {
          profilesMap.set(profile.user_id, profile);
        });

        const requestsMap = new Map();
        requestsData?.forEach(request => {
          requestsMap.set(request.ride_id, request);
        });

        const ridesWithProfiles = ridesData.map(ride => ({
          ...ride,
          profiles: profilesMap.get(ride.driver_id),
          request: requestsMap.get(ride.id)
        }));

        // Filter by university
        const filteredRides = ridesWithProfiles.filter(
          ride => ride.profiles?.university === userUniversity
        );

        // Sort: user's requested rides first, then by date
        const sortedRides = filteredRides.sort((a, b) => {
          if (a.request && !b.request) return -1;
          if (!a.request && b.request) return 1;
          return 0;
        });

        setRides(sortedRides);
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

  const handleRequestRide = (rideId: string) => {
    setSelectedRideId(rideId);
    setRequestModalOpen(true);
  };

  const handleEditRide = (ride: any) => {
    setSelectedRide(ride);
    setEditModalOpen(true);
  };

  useEffect(() => {
    fetchRides();
  }, [userUniversity, user]);

  return (
    <Layout>
      {isMobile && <MobileHeader />}
      
      <div className="max-w-7xl mx-auto space-y-6 p-6 pb-24">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {rides.map((ride) => (
                <CarpoolRideCard
                  key={ride.id}
                  ride={ride}
                  isOwner={ride.driver_id === user?.id}
                  hasRequested={!!ride.request}
                  requestStatus={ride.request?.status}
                  onRequestRide={() => handleRequestRide(ride.id)}
                  onEditRide={() => handleEditRide(ride)}
                />
              ))}
            </div>
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
        onRideCreated={fetchRides}
      />

      {/* Request Ride Modal */}
      <RideRequestModal
        open={requestModalOpen}
        onOpenChange={setRequestModalOpen}
        rideId={selectedRideId}
        onRequestCreated={fetchRides}
      />

      {/* Edit Ride Modal */}
      {selectedRide && (
        <EditRideModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          ride={selectedRide}
          onRideUpdated={fetchRides}
        />
      )}
    </Layout>
  );
}