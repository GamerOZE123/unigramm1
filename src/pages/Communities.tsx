import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import MobileHeader from '@/components/layout/MobileHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCommunities } from '@/hooks/useCommunities';
import { CommunityCard } from '@/components/communities/CommunityCard';
import { CreateCommunityModal } from '@/components/communities/CreateCommunityModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Communities() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const {
    communities,
    myCommunities,
    myMemberships,
    loading,
    createCommunity,
    joinCommunity,
    leaveCommunity,
  } = useCommunities();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <Layout>
      {isMobile && <MobileHeader />}
      <div className="space-y-4 pt-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/university')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Communities</h1>
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" /> Create
          </Button>
        </div>

        <Tabs defaultValue="browse">
          <TabsList className="w-full">
            <TabsTrigger value="browse" className="flex-1">Browse</TabsTrigger>
            <TabsTrigger value="mine" className="flex-1">My Communities</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-3 mt-3">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : communities.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No communities yet. Be the first to create one!</p>
            ) : (
              communities.map((c) => (
                <CommunityCard
                  key={c.id}
                  community={c}
                  isMember={myMemberships.has(c.id)}
                  onJoin={joinCommunity}
                  onLeave={leaveCommunity}
                  onClick={(id) => navigate(`/communities/${id}`)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="mine" className="space-y-3 mt-3">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : myCommunities.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">You haven't joined any communities yet.</p>
            ) : (
              myCommunities.map((c) => (
                <CommunityCard
                  key={c.id}
                  community={c}
                  isMember={true}
                  onJoin={joinCommunity}
                  onLeave={leaveCommunity}
                  onClick={(id) => navigate(`/communities/${id}`)}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CreateCommunityModal
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreate={createCommunity}
      />
    </Layout>
  );
}
