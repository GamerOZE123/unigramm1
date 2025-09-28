
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface AddQuickWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (workout: any) => void;
}

const difficultyLevels = ['Easy', 'Beginner', 'Intermediate', 'Advanced'];
const equipmentTypes = ['None', 'Bodyweight', 'Mat', 'Dumbbells', 'Resistance Bands', 'Full Gym'];
const workoutTypes = [
  'Running',
  'Walking', 
  'Cycling',
  'Swimming',
  'HIIT',
  'Strength Training',
  'Yoga',
  'Pilates',
  'Cardio',
  'Stretching',
  'Dance',
  'Boxing',
  'Custom'
];

export default function AddQuickWorkoutModal({ isOpen, onClose, onAdd }: AddQuickWorkoutModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    duration: '',
    difficulty: '',
    equipment: '',
    calories: '',
    workout_type: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.duration || !formData.difficulty || !formData.equipment || !formData.workout_type) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newWorkout = {
      title: formData.title,
      duration: parseInt(formData.duration),
      difficulty: formData.difficulty,
      equipment: formData.equipment,
      calories: formData.calories || `${Math.round(parseInt(formData.duration) * 5)}-${Math.round(parseInt(formData.duration) * 8)}`,
      workout_type: formData.workout_type
    };

    try {
      await onAdd(newWorkout);
      toast.success('Workout added successfully!');
      setFormData({
        title: '',
        duration: '',
        difficulty: '',
        equipment: '',
        calories: '',
        workout_type: ''
      });
      onClose();
    } catch (error) {
      toast.error('Failed to add workout');
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Workout</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Workout Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., Morning Run"
              required
            />
          </div>

          <div>
            <Label htmlFor="workout_type">Workout Type *</Label>
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
              max="180"
              required
            />
          </div>

          <div>
            <Label htmlFor="difficulty">Difficulty *</Label>
            <Select value={formData.difficulty} onValueChange={(value) => handleChange('difficulty', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                {difficultyLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="equipment">Equipment *</Label>
            <Select value={formData.equipment} onValueChange={(value) => handleChange('equipment', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select equipment" />
              </SelectTrigger>
              <SelectContent>
                {equipmentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="calories">Estimated Calories</Label>
            <Input
              id="calories"
              value={formData.calories}
              onChange={(e) => handleChange('calories', e.target.value)}
              placeholder="150-200 (optional)"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add Workout
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
