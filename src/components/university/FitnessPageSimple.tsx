import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Dumbbell, Calendar, Trophy } from 'lucide-react';
import Layout from '@/components/layout/Layout';

export default function FitnessPageSimple() {
  const [selectedTab, setSelectedTab] = useState('challenges');

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold">Fitness Hub</h1>
          <div className="flex gap-2">
            <Button
              variant={selectedTab === 'challenges' ? 'default' : 'outline'}
              onClick={() => setSelectedTab('challenges')}
              className="flex items-center gap-2"
            >
              <Trophy className="w-4 h-4" />
              Challenges
            </Button>
            <Button
              variant={selectedTab === 'schedule' ? 'default' : 'outline'}
              onClick={() => setSelectedTab('schedule')}
              className="flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Schedule
            </Button>
            <Button
              variant={selectedTab === 'workouts' ? 'default' : 'outline'}
              onClick={() => setSelectedTab('workouts')}
              className="flex items-center gap-2"
            >
              <Dumbbell className="w-4 h-4" />
              Workouts
            </Button>
          </div>
        </div>

        {selectedTab === 'challenges' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Trophy className="w-6 h-6 text-primary" />
                Fitness Challenges
              </h2>
            </div>
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Fitness challenges coming soon!</p>
                  <p className="text-sm">Join challenges to compete with other students.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedTab === 'schedule' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="w-6 h-6 text-primary" />
                Workout Schedule
              </h2>
            </div>
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Schedule your workouts!</p>
                  <p className="text-sm">Plan your fitness routine for the week.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedTab === 'workouts' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Dumbbell className="w-6 h-6 text-primary" />
                My Workouts
              </h2>
            </div>
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Start your fitness journey!</p>
                  <p className="text-sm">Create and track your workouts.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}