
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Play, Trash2, Clock, Users, Target, Trophy, Calendar, Dumbbell, Check, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import WorkoutTimer from '@/components/fitness/WorkoutTimer';
import CreateChallengeModal from '@/components/fitness/CreateChallengeModal';
import ChallengeDetailModal from '@/components/fitness/ChallengeDetailModal';
import WorkoutLogModal from '@/components/fitness/WorkoutLogModal';
import AddQuickWorkoutModal from '@/components/fitness/AddQuickWorkoutModal';
import AddToScheduleModal from '@/components/fitness/AddToScheduleModal';
import MonthlyScheduleModal from '@/components/fitness/MonthlyScheduleModal';
import FitnessNavigation from '@/components/fitness/FitnessNavigation';
import { useWorkouts } from '@/hooks/useWorkouts';
import { useScheduledWorkouts } from '@/hooks/useScheduledWorkouts';
import { useFitnessChallenges } from '@/hooks/useFitnessChallenges';
import { useWorkoutSessions } from '@/hooks/useWorkoutSessions';

type TabType = 'overview' | 'challenges' | 'buddies' | 'workouts' | 'schedule';

export default function FitnessPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [isCreateChallengeOpen, setIsCreateChallengeOpen] = useState(false);
  const [isChallengeDetailOpen, setIsChallengeDetailOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [isWorkoutLogOpen, setIsWorkoutLogOpen] = useState(false);
  const [isAddWorkoutOpen, setIsAddWorkoutOpen] = useState(false);
  const [isAddToScheduleOpen, setIsAddToScheduleOpen] = useState(false);
  const [isMonthlyScheduleOpen, setIsMonthlyScheduleOpen] = useState(false);

  // Custom hooks for database operations
  const { workouts, loading: workoutsLoading, addWorkout, deleteWorkout } = useWorkouts();
  const { scheduledWorkouts, loading: scheduledLoading, addScheduledWorkout, deleteScheduledWorkout } = useScheduledWorkouts();
  const { challenges, userChallenges, loading: challengesLoading, createChallenge, joinChallenge } = useFitnessChallenges();
  const { completeWorkout, isWorkoutCompleted } = useWorkoutSessions();

  const handleStartWorkout = (workout: any) => {
    setSelectedWorkout(workout);
    setIsTimerOpen(true);
  };

  const handleAddWorkout = async (workoutData: any) => {
    await addWorkout(workoutData);
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    await deleteWorkout(workoutId);
    toast.success('Workout deleted successfully!');
  };

  const handleAddToSchedule = async (workoutIds: string[], time: string, date?: string) => {
    for (const workoutId of workoutIds) {
      await addScheduledWorkout(workoutId, time, date);
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    try {
      await joinChallenge(challengeId);
      toast.success('Successfully joined the challenge!');
    } catch (error) {
      toast.error('Failed to join challenge');
    }
  };

  const handleChallengeClick = (challenge: any) => {
    setSelectedChallenge(challenge);
    setIsChallengeDetailOpen(true);
  };

  const handleCreateChallenge = async (challengeData: any) => {
    try {
      await createChallenge(challengeData);
      toast.success('Challenge created successfully!');
      setIsCreateChallengeOpen(false);
    } catch (error) {
      toast.error('Failed to create challenge');
    }
  };

  const handleCompleteWorkout = async (scheduledWorkoutId: string, workoutData: any) => {
    try {
      await completeWorkout({
        workout_name: workoutData.title,
        duration_minutes: workoutData.duration,
        workout_type: workoutData.workout_type,
        calories_burned: workoutData.calories ? parseInt(workoutData.calories) : undefined,
        notes: `Completed scheduled workout: ${workoutData.title}`
      });
      toast.success('Workout marked as completed!');
    } catch (error) {
      toast.error('Failed to mark workout as completed');
    }
  };

  const joinedChallenges = challenges.filter(challenge => 
    userChallenges.some(uc => uc.challenge_id === challenge.id)
  );

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 > 12 ? hour24 - 12 : hour24 === 0 ? 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Get today's featured workout (first scheduled or first available)
  const todaysFeaturedWorkout = scheduledWorkouts[0] || (workouts.length > 0 ? { 
    workouts: workouts[0], 
    workout_id: workouts[0].id,
    scheduled_time: '09:00',
    id: `featured-${workouts[0].id}`
  } : null);

  return (
    <div className="min-h-screen bg-background">
      <FitnessNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="container mx-auto px-4 py-6 md:pt-20 pb-20 md:pb-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Fitness</h1>
          <p className="text-muted-foreground">Track your workouts, join challenges, and stay motivated!</p>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="w-full">
          <TabsList className="grid w-full grid-cols-5 md:hidden mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="buddies">Buddies</TabsTrigger>
            <TabsTrigger value="workouts">Workouts</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
                  <Dumbbell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{workouts.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Challenges</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{joinedChallenges.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Scheduled Today</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{scheduledWorkouts.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Workout of the Day */}
            {todaysFeaturedWorkout && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Workout of the Day
                  </CardTitle>
                  <CardDescription>Your featured workout for today</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <h4 className="font-medium">{todaysFeaturedWorkout.workouts.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatTime(todaysFeaturedWorkout.scheduled_time)} • {todaysFeaturedWorkout.workouts.duration} min • {todaysFeaturedWorkout.workouts.workout_type}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary">{todaysFeaturedWorkout.workouts.difficulty}</Badge>
                          <Badge variant="outline">{todaysFeaturedWorkout.workouts.equipment}</Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleStartWorkout({
                        ...todaysFeaturedWorkout.workouts,
                        id: todaysFeaturedWorkout.workout_id
                      })}
                      size="sm"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Today's Schedule
                </CardTitle>
                <CardDescription>All workouts scheduled for today</CardDescription>
              </CardHeader>
              <CardContent>
                {scheduledLoading ? (
                  <div className="text-center py-4">Loading schedule...</div>
                ) : scheduledWorkouts.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No workouts scheduled for today</p>
                    <Button onClick={() => setIsAddToScheduleOpen(true)} disabled={workouts.length === 0}>
                      <Plus className="w-4 h-4 mr-2" />
                      Schedule a Workout
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {scheduledWorkouts.map((scheduledWorkout) => (
                      <div key={scheduledWorkout.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <button
                          onClick={() => handleCompleteWorkout(scheduledWorkout.id, scheduledWorkout.workouts)}
                          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isWorkoutCompleted(scheduledWorkout.id)
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-muted-foreground hover:border-green-500'
                          }`}
                        >
                          {isWorkoutCompleted(scheduledWorkout.id) && <Check className="w-4 h-4" />}
                        </button>
                        <div className="flex-1">
                          <h4 className="font-medium">{scheduledWorkout.workouts.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatTime(scheduledWorkout.scheduled_time)} • {scheduledWorkout.workouts.duration} min • {scheduledWorkout.workouts.workout_type}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleStartWorkout({
                              ...scheduledWorkout.workouts,
                              id: scheduledWorkout.workout_id
                            })}
                            size="sm"
                            variant="outline"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Start
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteScheduledWorkout(scheduledWorkout.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {joinedChallenges.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Challenges</CardTitle>
                  <CardDescription>Track your progress in joined challenges</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {joinedChallenges.map((challenge) => (
                      <div 
                        key={challenge.id}
                        onClick={() => handleChallengeClick(challenge)}
                        className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                      >
                        <div>
                          <h4 className="font-medium">{challenge.title}</h4>
                          <p className="text-sm text-muted-foreground">{challenge.challenge_type}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            <Users className="w-3 h-3 mr-1" />
                            {challenge.participant_count || 0}
                          </Badge>
                          <Badge variant="outline">
                            <Target className="w-3 h-3 mr-1" />
                            {challenge.target_value} {challenge.target_unit}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="challenges" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Fitness Challenges</h2>
              <Button onClick={() => setIsCreateChallengeOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Challenge
              </Button>
            </div>

            {challengesLoading ? (
              <div className="text-center py-8">Loading challenges...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {challenges.map((challenge) => {
                  const isJoined = userChallenges.some(uc => uc.challenge_id === challenge.id);
                  
                  return (
                    <Card key={challenge.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">{challenge.title}</CardTitle>
                        <CardDescription>{challenge.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Type:</span>
                            <Badge variant="secondary">{challenge.challenge_type}</Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Target:</span>
                            <span>{challenge.target_value} {challenge.target_unit}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Participants:</span>
                            <Badge variant="outline">
                              <Users className="w-3 h-3 mr-1" />
                              {challenge.participant_count || 0}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Duration:</span>
                            <span>{new Date(challenge.start_date).toLocaleDateString()} - {new Date(challenge.end_date).toLocaleDateString()}</span>
                          </div>
                          {challenge.prize_description && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Prize: </span>
                              <span>{challenge.prize_description}</span>
                            </div>
                          )}
                          <div className="flex gap-2 pt-2">
                            <Button 
                              onClick={() => handleChallengeClick(challenge)}
                              variant="outline" 
                              size="sm"
                              className="flex-1"
                            >
                              View Details
                            </Button>
                            {!isJoined && (
                              <Button 
                                onClick={() => handleJoinChallenge(challenge.id)}
                                size="sm"
                                className="flex-1"
                              >
                                Join Challenge
                              </Button>
                            )}
                            {isJoined && (
                              <Badge variant="default" className="flex-1 justify-center">
                                Joined
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="buddies" className="space-y-6">
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Workout Buddies</h3>
              <p className="text-muted-foreground mb-6">Find and connect with workout partners in your area</p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Find Workout Buddies
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="workouts" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Your Workouts</h2>
              <Button onClick={() => setIsAddWorkoutOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Workout
              </Button>
            </div>

            {workoutsLoading ? (
              <div className="text-center py-8">Loading workouts...</div>
            ) : workouts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Dumbbell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No workouts added yet</p>
                  <Button onClick={() => setIsAddWorkoutOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Workout
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workouts.map((workout) => (
                  <Card key={workout.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{workout.title}</CardTitle>
                          <CardDescription>{workout.workout_type}</CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteWorkout(workout.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4" />
                          <span>{workout.duration} minutes</span>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="secondary">{workout.difficulty}</Badge>
                          <Badge variant="outline">{workout.equipment}</Badge>
                        </div>
                        {workout.calories && (
                          <p className="text-sm text-muted-foreground">
                            Estimated: {workout.calories} calories
                          </p>
                        )}
                      </div>
                      <Button 
                        onClick={() => handleStartWorkout(workout)}
                        className="w-full"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Workout
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gym Schedule</h2>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setIsMonthlyScheduleOpen(true)} 
                  variant="outline"
                  disabled={workouts.length === 0}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Monthly Schedule
                </Button>
                <Button onClick={() => setIsAddToScheduleOpen(true)} disabled={workouts.length === 0}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Schedule
                </Button>
              </div>
            </div>

            {scheduledLoading ? (
              <div className="text-center py-8">Loading schedule...</div>
            ) : scheduledWorkouts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No workouts scheduled</p>
                  {workouts.length > 0 ? (
                    <div className="flex gap-2 justify-center">
                      <Button onClick={() => setIsAddToScheduleOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Schedule a Workout
                      </Button>
                      <Button onClick={() => setIsMonthlyScheduleOpen(true)} variant="outline">
                        <Calendar className="w-4 h-4 mr-2" />
                        Monthly Schedule
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Add some workouts first to schedule them</p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {scheduledWorkouts.map((scheduledWorkout) => (
                  <Card key={scheduledWorkout.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleCompleteWorkout(scheduledWorkout.id, scheduledWorkout.workouts)}
                          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isWorkoutCompleted(scheduledWorkout.id)
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-muted-foreground hover:border-green-500'
                          }`}
                        >
                          {isWorkoutCompleted(scheduledWorkout.id) && <Check className="w-4 h-4" />}
                        </button>
                        <div>
                          <h4 className="font-medium">{scheduledWorkout.workouts.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatTime(scheduledWorkout.scheduled_time)} • {scheduledWorkout.workouts.duration} min • {scheduledWorkout.workouts.workout_type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleStartWorkout({
                            ...scheduledWorkout.workouts,
                            id: scheduledWorkout.workout_id
                          })}
                          size="sm"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Start
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteScheduledWorkout(scheduledWorkout.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <WorkoutTimer
          isOpen={isTimerOpen}
          onClose={() => setIsTimerOpen(false)}
          duration={selectedWorkout?.duration || 30}
          workoutName={selectedWorkout?.title || 'Workout'}
        />

        <CreateChallengeModal
          isOpen={isCreateChallengeOpen}
          onClose={() => setIsCreateChallengeOpen(false)}
        />

        <ChallengeDetailModal
          isOpen={isChallengeDetailOpen}
          onClose={() => setIsChallengeDetailOpen(false)}
          challenge={selectedChallenge}
          isJoined={selectedChallenge ? userChallenges.some(uc => uc.challenge_id === selectedChallenge.id) : false}
          onJoin={() => selectedChallenge && handleJoinChallenge(selectedChallenge.id)}
        />

        <WorkoutLogModal
          isOpen={isWorkoutLogOpen}
          onClose={() => setIsWorkoutLogOpen(false)}
        />

        <AddQuickWorkoutModal
          isOpen={isAddWorkoutOpen}
          onClose={() => setIsAddWorkoutOpen(false)}
          onAdd={handleAddWorkout}
        />

        <AddToScheduleModal
          isOpen={isAddToScheduleOpen}
          onClose={() => setIsAddToScheduleOpen(false)}
          availableWorkouts={workouts}
          onAdd={handleAddToSchedule}
        />

        <MonthlyScheduleModal
          isOpen={isMonthlyScheduleOpen}
          onClose={() => setIsMonthlyScheduleOpen(false)}
          availableWorkouts={workouts}
          onSchedule={handleAddToSchedule}
        />
      </div>
    </div>
  );
}
