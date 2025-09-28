
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Clock, Dumbbell } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Workout {
  id: string;
  title: string;
  duration: number;
  difficulty: string;
  equipment: string;
  calories?: string;
  workout_type: string;
}

interface AddToScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableWorkouts: Workout[];
  onAdd: (selectedWorkoutIds: string[], scheduleTime: string, scheduleDate?: string) => void;
}

export default function AddToScheduleModal({ isOpen, onClose, availableWorkouts, onAdd }: AddToScheduleModalProps) {
  const [selectedWorkouts, setSelectedWorkouts] = useState<string[]>([]);
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleDate, setScheduleDate] = useState<Date>();

  const handleWorkoutToggle = (workoutId: string) => {
    setSelectedWorkouts(prev => 
      prev.includes(workoutId)
        ? prev.filter(id => id !== workoutId)
        : [...prev, workoutId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedWorkouts.length === 0) {
      toast.error('Please select at least one workout');
      return;
    }
    if (!scheduleTime) {
      toast.error('Please select a time');
      return;
    }

    try {
      const dateString = scheduleDate ? format(scheduleDate, 'yyyy-MM-dd') : undefined;
      await onAdd(selectedWorkouts, scheduleTime, dateString);
      toast.success('Workouts added to schedule!');
      setSelectedWorkouts([]);
      setScheduleTime('');
      setScheduleDate(undefined);
      onClose();
    } catch (error) {
      toast.error('Failed to add workouts to schedule');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Workouts to Schedule</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Schedule Date (optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !scheduleDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {scheduleDate ? format(scheduleDate, "PPP") : "Today (default)"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={scheduleDate}
                  onSelect={setScheduleDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to schedule for today
            </p>
          </div>

          <div>
            <Label htmlFor="time">Schedule Time *</Label>
            <Input
              id="time"
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Select Workouts *</Label>
            <div className="space-y-3 mt-2">
              {availableWorkouts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No workouts available. Add some workouts first.</p>
              ) : (
                availableWorkouts.map((workout) => (
                  <div key={workout.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={`workout-${workout.id}`}
                      checked={selectedWorkouts.includes(workout.id)}
                      onCheckedChange={() => handleWorkoutToggle(workout.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Dumbbell className="w-4 h-4 text-primary" />
                        <span className="font-medium">{workout.title}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{workout.duration} min</span>
                        </div>
                        <span>{workout.workout_type}</span>
                        <span>{workout.difficulty}</span>
                        <span>{workout.equipment}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={selectedWorkouts.length === 0 || !scheduleTime}
            >
              Add to Schedule
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
