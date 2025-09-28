import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import MobileLayout from '@/components/layout/MobileLayout';
import MobileHeader from '@/components/layout/MobileHeader';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

export default function UniversityFixed() {
  const [selectedTab, setSelectedTab] = useState<"company" | "student">('student');
  const [userType, setUserType] = useState<string>('student');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchUserType = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        if (data) {
          setUserType(data.user_type || 'student');
        }
      } catch (error) {
        console.error('Error fetching user type:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserType();
  }, [user]);

  const content = (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">University Hub</h1>
      
      <Tabs 
        value={selectedTab} 
        onValueChange={(value) => setSelectedTab(value as "company" | "student")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="student">Student Features</TabsTrigger>
          <TabsTrigger value="company">Company Features</TabsTrigger>
        </TabsList>

        <TabsContent value="student" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Marketplace</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Buy and sell items with other students</p>
                <Button asChild>
                  <a href="/marketplace">Browse Items</a>
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Fitness</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Join fitness challenges and track workouts</p>
                <Button asChild>
                  <a href="/fitness">Get Active</a>
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Clubs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Discover and join student organizations</p>
                <Button asChild>
                  <a href="/clubs">Explore Clubs</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="company" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Advertising</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Promote your business to students</p>
                <Button asChild>
                  <a href="/advertising">Create Ads</a>
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recruitment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Find talented students for your company</p>
                <Button asChild>
                  <a href="/jobs">Post Jobs</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  return isMobile ? (
    <MobileLayout>
      <MobileHeader />
      {content}
    </MobileLayout>
  ) : (
    <Layout>{content}</Layout>
  );
}