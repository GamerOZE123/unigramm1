
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Clock, Dumbbell, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';

interface Workout {
  id: string;
  title: string;
  duration: number;
  difficulty: string;
  equipment: string;
  calories?: string;
  workout_type: string;
}

interface ScheduledWorkout {
  workoutId: string;
  time: string;
  dates: Date[];
}

interface MonthlyScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableWorkouts: Workout[];
  onSchedule: (workoutIds: string[], time: string, date: string) => void;
}

export default function MonthlyScheduleModal({ isOpen, onClose, availableWorkouts, onSchedule }: MonthlyScheduleModalProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [scheduledWorkouts, setScheduledWorkouts] = useState<ScheduledWorkout[]>([]);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('09:00');

  const monthDays = eachDayOfInterval({
    start: startOfMonth(selectedMonth),
    end: endOfMonth(selectedMonth)
  });

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    setSelectedDates(prev => {
      const isSelected = prev.some(d => isSameDay(d, date));
      if (isSelected) {
        return prev.filter(d => !isSameDay(d, date));
      } else {
        return [...prev, date].sort((a, b) => a.getTime() - b.getTime());
      }
    });
  };

  const handleAddWorkoutSchedule = () => {
    if (!selectedWorkout || selectedDates.length === 0) {
      toast.error('Please select a workout and at least one date');
      return;
    }

    const newSchedule: ScheduledWorkout = {
      workoutId: selectedWorkout,
      time: selectedTime,
      dates: [...selectedDates]
    };

    setScheduledWorkouts(prev => [...prev, newSchedule]);
    setSelectedDates([]);
    setSelectedWorkout('');
    setSelectedTime('09:00');
    toast.success(`Workout scheduled for ${selectedDates.length} days`);
  };

  const handleRemoveSchedule = (index: number) => {
    setScheduledWorkouts(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveSchedule = async () => {
    if (scheduledWorkouts.length === 0) {
      toast.error('Please add at least one workout schedule');
      return;
    }

    try {
      for (const schedule of scheduledWorkouts) {
        for (const date of schedule.dates) {
          await onSchedule([schedule.workoutId], schedule.time, format(date, 'yyyy-MM-dd'));
        }
      }
      
      toast.success('Monthly schedule created successfully!');
      setScheduledWorkouts([]);
      setSelectedDates([]);
      onClose();
    } catch (error) {
      toast.error('Failed to create monthly schedule');
    }
  };

  const getWorkoutById = (id: string) => availableWorkouts.find(w => w.id === id);

  const isDayScheduled = (date: Date) => {
    return scheduledWorkouts.some(schedule => 
      schedule.dates.some(d => isSameDay(d, date))
    );
  };

  const getScheduledWorkoutsForDay = (date: Date) => {
    return scheduledWorkouts.filter(schedule => 
      schedule.dates.some(d => isSameDay(d, date))
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Monthly Workout Schedule
          </DialogTitle>
        </DialogHeader>

        {availableWorkouts.length === 0 ? (
          <div className="text-center py-8">
            <Dumbbell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No workouts available. Add some workouts first.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calendar Section */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Select Month</Label>
                <Calendar
                  mode="single"
                  selected={selectedMonth}
                  onSelect={(date) => date && setSelectedMonth(date)}
                  className="rounded-md border"
                  month={selectedMonth}
                  onMonthChange={setSelectedMonth}
                />
              </div>

              <div>
                <Label className="text-base font-medium mb-2 block">Select Dates for Workout</Label>
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm font-medium p-2">
                      {day}
                    </div>
                  ))}
                  {monthDays.map(date => {
                    const isSelected = selectedDates.some(d => isSameDay(d, date));
                    const isScheduled = isDayScheduled(date);
                    
                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => handleDateSelect(date)}
                        className={`
                          p-2 text-sm rounded transition-colors
                          ${isSelected 
                            ? 'bg-primary text-primary-foreground' 
                            : isScheduled
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : 'hover:bg-muted'
                          }
                        `}
                      >
                        {format(date, 'd')}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Scheduling Section */}
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Select Workout</Label>
                <Select value={selectedWorkout} onValueChange={setSelectedWorkout}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a workout" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableWorkouts.map(workout => (
                      <SelectItem key={workout.id} value={workout.id}>
                        <div className="flex items-center gap-2">
                          <Dumbbell className="w-4 h-4" />
                          <span>{workout.title} ({workout.duration} min)</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleAddWorkoutSchedule}
                className="w-full"
                disabled={!selectedWorkout || selectedDates.length === 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add to Schedule ({selectedDates.length} days)
              </Button>

              {/* Scheduled Workouts List */}
              {scheduledWorkouts.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-base font-medium">Scheduled Workouts</Label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {scheduledWorkouts.map((schedule, index) => {
                      const workout = getWorkoutById(schedule.workoutId);
                      return (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Dumbbell className="w-4 h-4 text-primary" />
                              <span className="font-medium">{workout?.title}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>{schedule.time}</span>
                              <span>•</span>
                              <span>{schedule.dates.length} days</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSchedule(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleSaveSchedule}
            className="flex-1"
            disabled={scheduledWorkouts.length === 0}
          >
            Create Monthly Schedule
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
