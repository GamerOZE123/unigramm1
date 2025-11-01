import React, { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/layout/Layout';
import { CarTaxiFront, Plus, Filter, X as XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import MobileHeader from '@/components/layout/MobileHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const SNU_LOCATIONS = [
  "SNU inner gate",
  "SNU Parking 1",
  "Botanical Garden",
  "IGI Airport T1",
  "IGI Airport T2",
  "IGI Airport T3",
  "Ghaziabad Railway Station",
  "Pari Chowk",
  "Hindon Airport",
  "SNU"
];
import CreateRideModal from '@/components/carpooling/CreateRideModal';
import CarpoolRideCard from '@/components/carpooling/CarpoolRideCard';
import RideRequestModal from '@/components/carpooling/RideRequestModal';
import RideRequestsModal from '@/components/carpooling/RideRequestsModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const navigate = useNavigate();
  const [userUniversity, setUserUniversity] = useState<string>('');
  const [rides, setRides] = useState<CarpoolRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [createRideModalOpen, setCreateRideModalOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestsModalOpen, setRequestsModalOpen] = useState(false);
  const [selectedRideId, setSelectedRideId] = useState<string>('');
  const [rideToDelete, setRideToDelete] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    date: ''
  });

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

  const fetchRides = useCallback(async () => {
    if (!userUniversity || !user) return;
    
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      let query = supabase
        .from('carpool_rides')
        .select('*')
        .eq('is_active', true)
        .gte('ride_date', today);

      // Apply filters to query if possible (but we'll also filter client-side)
      if (filters.from) {
        query = query.eq('from_location', filters.from);
      }
      if (filters.to) {
        query = query.eq('to_location', filters.to);
      }
      if (filters.date) {
        query = query.eq('ride_date', filters.date);
      }

      const { data: ridesData, error: ridesError } = await query
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

        // Fetch ride requests for current user (as passenger)
        const { data: requestsData } = await supabase
          .from('carpool_ride_requests')
          .select('ride_id, status')
          .eq('passenger_id', user.id);

        // Fetch pending requests count for owner's rides
        const ownerRideIds = ridesData.filter(r => r.driver_id === user.id).map(r => r.id);
        let ownerRequestsData = null;
        if (ownerRideIds.length > 0) {
          const { data, error: ownerRequestsError } = await supabase
            .from('carpool_ride_requests')
            .select('ride_id, status')
            .in('ride_id', ownerRideIds)
            .eq('status', 'pending');
          
          if (ownerRequestsError) throw ownerRequestsError;
          ownerRequestsData = data;
        }

        const profilesMap = new Map();
        profilesData?.forEach(profile => {
          profilesMap.set(profile.user_id, profile);
        });

        const requestsMap = new Map();
        requestsData?.forEach(request => {
          requestsMap.set(request.ride_id, request);
        });

        // Count pending requests per ride for owners
        const pendingCountMap = new Map();
        ownerRequestsData?.forEach(request => {
          const count = pendingCountMap.get(request.ride_id) || 0;
          pendingCountMap.set(request.ride_id, count + 1);
        });

        const ridesWithProfiles = ridesData.map(ride => ({
          ...ride,
          profiles: profilesMap.get(ride.driver_id),
          request: requestsMap.get(ride.id),
          pendingRequestsCount: ride.driver_id === user.id ? (pendingCountMap.get(ride.id) || 0) : undefined
        }));

        // Filter by university
        let filteredRides = ridesWithProfiles.filter(
          ride => ride.profiles?.university === userUniversity
        );

        // Apply user filters
        if (filters.from) {
          filteredRides = filteredRides.filter(ride => ride.from_location === filters.from);
        }
        if (filters.to) {
          filteredRides = filteredRides.filter(ride => ride.to_location === filters.to);
        }
        if (filters.date) {
          filteredRides = filteredRides.filter(ride => ride.ride_date === filters.date);
        }

        // Sort: accepted requests first, then by date
        const sortedRides = filteredRides.sort((a, b) => {
          const aAccepted = a.request?.status === 'accepted';
          const bAccepted = b.request?.status === 'accepted';
          
          if (aAccepted && !bAccepted) return -1;
          if (!aAccepted && bAccepted) return 1;
          
          // Then sort by date
          const dateA = new Date(a.ride_date + 'T' + a.ride_time);
          const dateB = new Date(b.ride_date + 'T' + b.ride_time);
          return dateA.getTime() - dateB.getTime();
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
  }, [userUniversity, user, filters]);

  const handleRequestRide = (rideId: string) => {
    setSelectedRideId(rideId);
    setRequestModalOpen(true);
  };

  const handleViewRequests = (rideId: string) => {
    setSelectedRideId(rideId);
    setRequestsModalOpen(true);
  };

  const handleDeleteRide = (rideId: string) => {
    setRideToDelete(rideId);
  };

  const handleMessage = async (driverId: string) => {
    if (!user) return;

    try {
      const { data: conversationId, error } = await supabase
        .rpc('get_or_create_conversation', {
          user1_id: user.id,
          user2_id: driverId
        });

      if (error) throw error;

      navigate(`/chat?conversation=${conversationId}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      toast({
        title: "Error",
        description: "Failed to start chat",
        variant: "destructive",
      });
    }
  };

  const confirmDeleteRide = async () => {
    if (!rideToDelete) return;

    try {
      const { error } = await supabase
        .from('carpool_rides')
        .delete()
        .eq('id', rideToDelete);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ride deleted successfully!",
      });

      setRideToDelete(null);
      fetchRides();
    } catch (error) {
      console.error('Error deleting ride:', error);
      toast({
        title: "Error",
        description: "Failed to delete ride. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (userUniversity && user) {
      fetchRides();
    }
  }, [fetchRides]);

  // Real-time subscription for ride updates
  useEffect(() => {
    if (!user || !userUniversity) return;

    const channel = supabase
      .channel('carpool-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'carpool_rides',
          filter: `is_active=eq.true`
        },
        () => {
          fetchRides();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'carpool_ride_requests',
        },
        () => {
          fetchRides();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userUniversity]);

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
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Available Rides</h2>
          </div>

          {/* Filters */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Filters</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Select value={filters.from} onValueChange={(value) => setFilters({ ...filters, from: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="From location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All locations</SelectItem>
                  {SNU_LOCATIONS.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filters.to} onValueChange={(value) => setFilters({ ...filters, to: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="To location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All locations</SelectItem>
                  {SNU_LOCATIONS.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                placeholder="Filter by date"
              />
              
              {(filters.from || filters.to || filters.date) && (
                <Button
                  variant="outline"
                  onClick={() => setFilters({ from: '', to: '', date: '' })}
                  className="w-full"
                >
                  <XIcon className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </Card>
          
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading rides...</div>
          ) : rides.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No rides available at the moment</div>
          ) : (
            <div className="space-y-4">
              {/* Accepted rides section */}
              {rides.filter(r => r.request?.status === 'accepted').length > 0 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {rides
                      .filter(r => r.request?.status === 'accepted')
                      .map((ride) => (
                        <CarpoolRideCard
                          key={ride.id}
                          ride={ride}
                          isOwner={ride.driver_id === user?.id}
                          hasRequested={!!ride.request}
                          requestStatus={ride.request?.status}
                          onRequestRide={() => handleRequestRide(ride.id)}
                          onViewRequests={() => handleViewRequests(ride.id)}
                          onDeleteRide={() => handleDeleteRide(ride.id)}
                          onMessage={ride.driver_id !== user?.id ? () => handleMessage(ride.driver_id) : undefined}
                        />
                      ))}
                  </div>
                  <Separator className="my-6" />
                </>
              )}
              
              {/* Other rides section */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {rides
                  .filter(r => r.request?.status !== 'accepted')
                  .map((ride) => (
                    <CarpoolRideCard
                      key={ride.id}
                      ride={ride}
                      isOwner={ride.driver_id === user?.id}
                      hasRequested={!!ride.request}
                      requestStatus={ride.request?.status}
                      onRequestRide={() => handleRequestRide(ride.id)}
                      onViewRequests={() => handleViewRequests(ride.id)}
                      onDeleteRide={() => handleDeleteRide(ride.id)}
                      onMessage={ride.driver_id !== user?.id ? () => handleMessage(ride.driver_id) : undefined}
                    />
                  ))}
              </div>
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

      {/* Ride Requests Modal (for owners) */}
      {selectedRideId && (
        <RideRequestsModal
          open={requestsModalOpen}
          onOpenChange={setRequestsModalOpen}
          rideId={selectedRideId}
          onRequestHandled={fetchRides}
        />
      )}

      {/* Delete Ride Confirmation */}
      <AlertDialog open={!!rideToDelete} onOpenChange={(open) => !open && setRideToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your ride offer. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRideToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteRide} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
