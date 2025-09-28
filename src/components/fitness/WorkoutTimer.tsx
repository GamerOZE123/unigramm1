
import React, { useState, useEffect } from 'react';
import { X, Play, Pause, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WorkoutTimerProps {
  isOpen: boolean;
  onClose: () => void;
  workoutName?: string;
  duration?: number; // Duration in minutes
}

export default function WorkoutTimer({ isOpen, onClose, workoutName = "Workout", duration = 15 }: WorkoutTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration * 60); // Convert minutes to seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    // Reset timer when modal opens with new duration
    if (isOpen) {
      setTimeLeft(duration * 60);
      setIsRunning(false);
      setIsPaused(false);
      setIsCompleted(false);
    }
  }, [isOpen, duration]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            setIsRunning(false);
            setIsCompleted(true);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, isPaused, timeLeft]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(duration * 60);
    setIsCompleted(false);
  };

  const handleClose = () => {
    handleStop();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      {/* Close Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClose}
        className="absolute top-4 left-4 text-white hover:bg-white/10"
      >
        <X className="w-6 h-6" />
      </Button>

      {/* Workout Name */}
      <h1 className="text-white text-2xl font-bold mb-8">{workoutName}</h1>

      {/* Timer Display */}
      <div className={`text-white text-8xl md:text-9xl font-mono font-bold mb-12 ${
        isCompleted ? 'text-green-400' : timeLeft <= 60 ? 'text-red-400' : ''
      }`}>
        {formatTime(timeLeft)}
      </div>

      {/* Completion Message */}
      {isCompleted && (
        <div className="text-white text-xl mb-8 text-center">
          <p className="text-green-400 font-bold">Workout Complete!</p>
          <p className="text-sm opacity-80">Great job finishing your workout!</p>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-6">
        {!isRunning && !isCompleted ? (
          <Button
            onClick={handleStart}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg"
          >
            <Play className="w-6 h-6 mr-2" />
            Start
          </Button>
        ) : isCompleted ? (
          <Button
            onClick={handleClose}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
          >
            Done
          </Button>
        ) : (
          <>
            {isPaused ? (
              <Button
                onClick={handleResume}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg"
              >
                <Play className="w-6 h-6 mr-2" />
                Resume
              </Button>
            ) : (
              <Button
                onClick={handlePause}
                size="lg"
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-4 text-lg"
              >
                <Pause className="w-6 h-6 mr-2" />
                Pause
              </Button>
            )}
            <Button
              onClick={handleStop}
              size="lg"
              variant="destructive"
              className="px-8 py-4 text-lg"
            >
              <Square className="w-6 h-6 mr-2" />
              Stop
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
