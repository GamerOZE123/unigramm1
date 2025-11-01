import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Users, Package, Car, X, CheckCircle, XCircle, UserCheck, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface CarpoolRideCardProps {
  ride: {
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
      full_name: string;
      avatar_url: string;
    } | null;
    pendingRequestsCount?: number;
  };
  isOwner: boolean;
  hasRequested?: boolean;
  requestStatus?: string;
  onRequestRide: () => void;
  onViewRequests: () => void;
  onDeleteRide: () => void;
  onMessage?: () => void;
}

export default function CarpoolRideCard({
  ride,
  isOwner,
  hasRequested,
  requestStatus,
  onRequestRide,
  onViewRequests,
  onDeleteRide,
  onMessage
}: CarpoolRideCardProps) {
  return (
    <Card className="hover:shadow-lg transition-all flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={ride.profiles?.avatar_url} />
              <AvatarFallback>
                {ride.profiles?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground">
                {ride.profiles?.full_name || 'Unknown Driver'}
              </h3>
              {hasRequested && (
                <Badge 
                  variant={requestStatus === 'accepted' ? 'default' : requestStatus === 'rejected' ? 'destructive' : 'secondary'}
                  className="mt-1"
                >
                  {requestStatus === 'pending' && 'Request Pending'}
                  {requestStatus === 'accepted' && 'Request Accepted'}
                  {requestStatus === 'rejected' && 'Request Rejected'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 flex-1">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <div className="font-medium text-foreground">{ride.from_location}</div>
            <div className="text-muted-foreground">↓</div>
            <div className="font-medium text-foreground">{ride.to_location}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="font-medium">
                {new Date(ride.ride_date).toLocaleDateString('en-IN')}
              </div>
              <div className="text-xs text-muted-foreground">{ride.ride_time}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span>{ride.available_seats} seat{ride.available_seats !== 1 ? 's' : ''} available</span>
          </div>

          {ride.car_type && (
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-muted-foreground" />
              <span className="capitalize">{ride.car_type}</span>
            </div>
          )}

          {ride.baggage_allowed !== undefined && (
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span>{ride.baggage_allowed} bag{ride.baggage_allowed !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {ride.notes && (
          <div className="text-sm text-muted-foreground border-t pt-3">
            {ride.notes}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 space-y-2">
        {isOwner ? (
          <>
            <Button onClick={onViewRequests} className="w-full" size="sm">
              <UserCheck className="w-4 h-4 mr-2" />
              View Requests{ride.pendingRequestsCount !== undefined && ride.pendingRequestsCount > 0 ? ` (${ride.pendingRequestsCount})` : ''}
            </Button>
            <div className="flex gap-2">
              {onMessage && (
                <Button onClick={onMessage} variant="outline" className="flex-1" size="sm">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              )}
              <Button onClick={onDeleteRide} variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-2 w-full">
            <Button 
              onClick={onRequestRide} 
              disabled={hasRequested}
              className="w-full"
              size="sm"
            >
              {hasRequested ? (
                requestStatus === 'accepted' ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accepted
                  </>
                ) : requestStatus === 'rejected' ? (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Rejected
                  </>
                ) : (
                  'Request Sent'
                )
              ) : (
                'Request Ride'
              )}
            </Button>
            {onMessage && (
              <Button onClick={onMessage} variant="outline" className="w-full" size="sm">
                <MessageCircle className="w-4 h-4 mr-2" />
                Message Driver
              </Button>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
