
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useWorkouts } from '@/hooks/useWorkouts';
import { toast } from 'sonner';

interface WorkoutLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const workoutTypes = [
  'Cardio',
  'Strength Training',
  'HIIT',
  'Yoga',
  'Pilates',
  'Running',
  'Cycling',
  'Swimming',
  'Other'
];

const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
const equipmentOptions = ['None', 'Bodyweight', 'Dumbbells', 'Barbell', 'Resistance Bands', 'Gym Equipment'];

export default function WorkoutLogModal({ isOpen, onClose }: WorkoutLogModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    duration: '',
    calories: '',
    workout_type: '',
    difficulty: '',
    equipment: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addWorkout } = useWorkouts();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.duration || !formData.difficulty || !formData.equipment) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await addWorkout({
        title: formData.title,
        duration: parseInt(formData.duration),
        calories: formData.calories || undefined,
        workout_type: formData.workout_type || 'Other',
        difficulty: formData.difficulty,
        equipment: formData.equipment
      });
      
      toast.success('Workout logged successfully!');
      setFormData({
        title: '',
        duration: '',
        calories: '',
        workout_type: '',
        difficulty: '',
        equipment: ''
      });
      onClose();
    } catch (error) {
      toast.error('Failed to log workout');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log Workout</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Workout Name *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., Morning Run"
              required
            />
          </div>

          <div>
            <Label htmlFor="workout_type">Workout Type</Label>
            <Select value={formData.workout_type} onValueChange={(value) => handleChange('workout_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select workout type" />
              </SelectTrigger>
              <SelectContent>
                {workoutTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="duration">Duration (minutes) *</Label>
            <Input
              id="duration"
              type="number"
              value={formData.duration}
              onChange={(e) => handleChange('duration', e.target.value)}
              placeholder="30"
              min="1"
              required
            />
          </div>

          <div>
            <Label htmlFor="difficulty">Difficulty *</Label>
            <Select value={formData.difficulty} onValueChange={(value) => handleChange('difficulty', value)} required>
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map((difficulty) => (
                  <SelectItem key={difficulty} value={difficulty}>
                    {difficulty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="equipment">Equipment *</Label>
            <Select value={formData.equipment} onValueChange={(value) => handleChange('equipment', value)} required>
              <SelectTrigger>
                <SelectValue placeholder="Select equipment" />
              </SelectTrigger>
              <SelectContent>
                {equipmentOptions.map((equipment) => (
                  <SelectItem key={equipment} value={equipment}>
                    {equipment}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="calories">Calories Burned</Label>
            <Input
              id="calories"
              value={formData.calories}
              onChange={(e) => handleChange('calories', e.target.value)}
              placeholder="250"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Logging...' : 'Log Workout'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
