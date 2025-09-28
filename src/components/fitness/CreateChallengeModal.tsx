
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useFitnessChallenges } from '@/hooks/useFitnessChallenges';
import { toast } from 'sonner';

interface CreateChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const challengeTypes = [
  { value: 'distance', label: 'Distance', units: ['miles', 'kilometers', 'steps'] },
  { value: 'reps', label: 'Repetitions', units: ['reps', 'sets'] },
  { value: 'time', label: 'Time', units: ['minutes', 'hours'] },
  { value: 'calories', label: 'Calories', units: ['calories'] }
];

export default function CreateChallengeModal({ isOpen, onClose }: CreateChallengeModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    challenge_type: '',
    target_value: '',
    target_unit: '',
    start_date: '',
    end_date: '',
    max_participants: '',
    prize_description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createChallenge } = useFitnessChallenges();

  const selectedChallengeType = challengeTypes.find(type => type.value === formData.challenge_type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.challenge_type || !formData.target_value || !formData.target_unit || !formData.start_date || !formData.end_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      toast.error('End date must be after start date');
      return;
    }

    setIsSubmitting(true);
    try {
      await createChallenge({
        title: formData.title,
        description: formData.description || undefined,
        challenge_type: formData.challenge_type,
        target_value: parseInt(formData.target_value),
        target_unit: formData.target_unit,
        start_date: formData.start_date,
        end_date: formData.end_date,
        is_active: true,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : undefined,
        prize_description: formData.prize_description || undefined
      });
      
      toast.success('Challenge created successfully!');
      setFormData({
        title: '',
        description: '',
        challenge_type: '',
        target_value: '',
        target_unit: '',
        start_date: '',
        end_date: '',
        max_participants: '',
        prize_description: ''
      });
      onClose();
    } catch (error) {
      toast.error('Failed to create challenge');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: value,
      // Reset target_unit when challenge_type changes
      ...(field === 'challenge_type' && { target_unit: '' })
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Fitness Challenge</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Challenge Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g., 30-Day Push-Up Challenge"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe your challenge..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="challenge_type">Challenge Type *</Label>
            <Select value={formData.challenge_type} onValueChange={(value) => handleChange('challenge_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select challenge type" />
              </SelectTrigger>
              <SelectContent>
                {challengeTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedChallengeType && (
            <div>
              <Label htmlFor="target_unit">Unit *</Label>
              <Select value={formData.target_unit} onValueChange={(value) => handleChange('target_unit', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {selectedChallengeType.units.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="target_value">Target Value *</Label>
            <Input
              id="target_value"
              type="number"
              value={formData.target_value}
              onChange={(e) => handleChange('target_value', e.target.value)}
              placeholder="1000"
              min="1"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleChange('start_date', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="end_date">End Date *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleChange('end_date', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="max_participants">Max Participants</Label>
            <Input
              id="max_participants"
              type="number"
              value={formData.max_participants}
              onChange={(e) => handleChange('max_participants', e.target.value)}
              placeholder="100"
              min="1"
            />
          </div>

          <div>
            <Label htmlFor="prize_description">Prize Description</Label>
            <Input
              id="prize_description"
              value={formData.prize_description}
              onChange={(e) => handleChange('prize_description', e.target.value)}
              placeholder="e.g., Winner gets gym gear package"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Creating...' : 'Create Challenge'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
