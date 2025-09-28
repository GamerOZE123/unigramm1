
import React from 'react';
import { ArrowLeft, TrendingUp, Trophy, Users, Dumbbell, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

type TabType = 'overview' | 'challenges' | 'buddies' | 'workouts' | 'schedule';

interface FitnessNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const fitnessNavigation = [
  { key: 'overview' as const, label: 'Overview', icon: TrendingUp },
  { key: 'challenges' as const, label: 'Challenges', icon: Trophy },
  { key: 'buddies' as const, label: 'Workout Buddies', icon: Users },
  { key: 'workouts' as const, label: 'Quick Workouts', icon: Dumbbell },
  { key: 'schedule' as const, label: 'Gym Schedule', icon: Calendar }
];

export default function FitnessNavigation({ activeTab, onTabChange }: FitnessNavigationProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/university');
  };

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to University
        </Button>
        
        <div className="flex gap-2">
          {fitnessNavigation.map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTabChange(tab.key)}
              className="flex items-center gap-2"
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border">
        <div className="grid grid-cols-5 h-16">
          {fitnessNavigation.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                <span className="text-xs font-medium">{tab.label}</span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Back Button */}
      <div className="md:hidden fixed top-4 left-4 z-40">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="bg-background/80 backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </div>
    </>
  );
}
