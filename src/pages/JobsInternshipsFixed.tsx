import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/layout/Layout';
import MobileLayout from '@/components/layout/MobileLayout';
import MobileHeader from '@/components/layout/MobileHeader';
import StudentJobsView from '@/components/jobs/StudentJobsView';
import CompanyJobsView from '@/components/jobs/CompanyJobsView';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

export default function JobsInternshipsFixed() {
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
      <h1 className="text-3xl font-bold">Jobs & Internships</h1>
      
      <Tabs 
        value={selectedTab} 
        onValueChange={(value) => setSelectedTab(value as "company" | "student")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="student">Find Jobs</TabsTrigger>
          <TabsTrigger value="company">Post Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="student" className="space-y-6">
          <StudentJobsView />
        </TabsContent>

        <TabsContent value="company" className="space-y-6">
          <CompanyJobsView />
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