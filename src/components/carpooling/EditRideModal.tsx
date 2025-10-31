import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Users, Package, Car, Trash2 } from 'lucide-react';
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

interface EditRideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ride: any;
  onRideUpdated: () => void;
}

export default function EditRideModal({ open, onOpenChange, ride, onRideUpdated }: EditRideModalProps) {
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({
    from_location: '',
    to_location: '',
    ride_date: '',
    ride_time: '',
    available_seats: 1,
    price: 0,
    car_type: '',
    baggage_allowed: 1,
    notes: ''
  });

  useEffect(() => {
    if (ride) {
      setFormData({
        from_location: ride.from_location || '',
        to_location: ride.to_location || '',
        ride_date: ride.ride_date || '',
        ride_time: ride.ride_time || '',
        available_seats: ride.available_seats || 1,
        price: ride.price || 0,
        car_type: ride.car_type || '',
        baggage_allowed: ride.baggage_allowed || 1,
        notes: ride.notes || ''
      });
    }
  }, [ride]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('carpool_rides')
        .update({
          from_location: formData.from_location,
          to_location: formData.to_location,
          ride_date: formData.ride_date,
          ride_time: formData.ride_time,
          available_seats: formData.available_seats,
          price: formData.price,
          car_type: formData.car_type || null,
          baggage_allowed: formData.baggage_allowed,
          notes: formData.notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', ride.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your ride has been updated successfully!",
      });

      onRideUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating ride:', error);
      toast({
        title: "Error",
        description: "Failed to update ride. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('carpool_rides')
        .delete()
        .eq('id', ride.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your ride has been deleted successfully!",
      });

      onRideUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting ride:', error);
      toast({
        title: "Error",
        description: "Failed to delete ride. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Edit Ride</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from_location" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  From *
                </Label>
                <Select
                  value={formData.from_location}
                  onValueChange={(value) => setFormData({ ...formData, from_location: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select pickup location" />
                  </SelectTrigger>
                  <SelectContent>
                    {SNU_LOCATIONS.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="to_location" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  To *
                </Label>
                <Select
                  value={formData.to_location}
                  onValueChange={(value) => setFormData({ ...formData, to_location: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {SNU_LOCATIONS.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ride_date">Date *</Label>
                <Input
                  id="ride_date"
                  type="date"
                  value={formData.ride_date}
                  onChange={(e) => setFormData({ ...formData, ride_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ride_time">Time *</Label>
                <Input
                  id="ride_time"
                  type="time"
                  value={formData.ride_time}
                  onChange={(e) => setFormData({ ...formData, ride_time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="available_seats" className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Available Seats *
                </Label>
                <Select
                  value={formData.available_seats.toString()}
                  onValueChange={(value) => setFormData({ ...formData, available_seats: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? 'seat' : 'seats'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="baggage_allowed" className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  Baggage Allowed
                </Label>
                <Select
                  value={formData.baggage_allowed.toString()}
                  onValueChange={(value) => setFormData({ ...formData, baggage_allowed: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? 'bag' : 'bags'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="car_type" className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-primary" />
                  Car Type
                </Label>
                <Select
                  value={formData.car_type}
                  onValueChange={(value) => setFormData({ ...formData, car_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select car type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedan">Sedan</SelectItem>
                    <SelectItem value="suv">SUV</SelectItem>
                    <SelectItem value="hatchback">Hatchback</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price per Seat (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information about the ride..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-between gap-3 pt-4">
              <Button 
                type="button" 
                variant="destructive" 
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Ride
              </Button>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Ride'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your ride offer. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
