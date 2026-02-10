import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatingProfile } from '@/hooks/useDatingProfile';
import { useDatingCandidates } from '@/hooks/useDatingCandidates';
import { useDatingMatches } from '@/hooks/useDatingMatches';
import DatingCardStack from '@/components/dating/DatingCardStack';
import DatingMatchesList from '@/components/dating/DatingMatchesList';
import DatingChatWindow from '@/components/dating/DatingChatWindow';
import DatingFilters from '@/components/dating/DatingFilters';
import MatchModal from '@/components/dating/MatchModal';
import DatingProfileView from '@/components/dating/DatingProfileView';
import MobileLayout from '@/components/layout/MobileLayout';
import { Heart, Users, Settings, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import type { DatingMatch } from '@/hooks/useDatingMatches';

type Tab = 'discover' | 'matches' | 'profile';

export default function Dating() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { profile, loading: profileLoading } = useDatingProfile();
  const { candidates, loading: candidatesLoading, fetchCandidates, likeUser, passUser, matchedUserId, matchedUserInfo, clearMatch, reloadCandidates } = useDatingCandidates();
  const { matches, loading: matchesLoading } = useDatingMatches();

  const [tab, setTab] = useState<Tab>('discover');
  const [selectedMatch, setSelectedMatch] = useState<DatingMatch | null>(null);
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 24]);
  const [genderFilter, setGenderFilter] = useState('Everyone');

  // Redirect to setup if no profile
  useEffect(() => {
    if (!profileLoading && !profile) {
      navigate('/dating/setup');
    }
  }, [profileLoading, profile, navigate]);

  // Fetch candidates on mount
  useEffect(() => {
    if (profile) fetchCandidates();
  }, [profile]);

  // matchedUserInfo is stored in the hook before the candidate is removed

  const handleLike = useCallback(async (userId: string) => {
    await likeUser(userId);
  }, [likeUser]);

  const handlePass = useCallback(async (userId: string) => {
    await passUser(userId);
  }, [passUser]);

  const handleMatchChat = () => {
    clearMatch();
    setTab('matches');
  };

  if (profileLoading) return null;

  const tabNav = (
    <div className="flex border-b border-border">
      {[
        { key: 'discover' as Tab, label: 'Discover', icon: Compass },
        { key: 'matches' as Tab, label: 'Matches', icon: Heart },
        { key: 'profile' as Tab, label: 'Profile', icon: Settings },
      ].map(t => (
        <button
          key={t.key}
          onClick={() => { setTab(t.key); setSelectedMatch(null); }}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2',
            tab === t.key
              ? 'border-pink-500 text-pink-500'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <t.icon className="w-4 h-4" />
          {t.label}
        </button>
      ))}
    </div>
  );

  // Desktop split layout
  if (!isMobile) {
    return (
      <MobileLayout>
        <div className="min-h-screen bg-background">
          <div className="max-w-6xl mx-auto flex">
            {/* Left sidebar - matches */}
            <div className="w-80 border-r border-border min-h-screen flex flex-col">
              <div className="p-4 border-b border-border">
                <h2 className="font-bold text-lg bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
                  💜 Let's Discover
                </h2>
              </div>
              {tabNav}
              {tab === 'matches' && (
                <DatingMatchesList
                  matches={matches}
                  activeMatchId={selectedMatch?.id}
                  onSelect={setSelectedMatch}
                />
              )}
            </div>

            {/* Center */}
            <div className="flex-1 min-h-screen">
              {tab === 'discover' && (
                <DatingCardStack
                  candidates={candidates}
                  loading={candidatesLoading}
                  onLike={handleLike}
                  onPass={handlePass}
                  onFetchMore={fetchCandidates}
                    onReload={reloadCandidates}
                />
              )}
              {tab === 'matches' && selectedMatch && (
                <DatingChatWindow match={selectedMatch} />
              )}
              {tab === 'matches' && !selectedMatch && (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Select a match to start chatting
                </div>
              )}
              {tab === 'profile' && (
                <DatingProfileView />
              )}
            </div>

            {/* Right sidebar - filters (only on discover) */}
            {tab === 'discover' && (
              <div className="w-64 border-l border-border">
                <DatingFilters
                  ageRange={ageRange}
                  genderFilter={genderFilter}
                  onAgeChange={setAgeRange}
                  onGenderChange={setGenderFilter}
                />
              </div>
            )}
          </div>

          <MatchModal
            open={!!matchedUserId}
            onClose={clearMatch}
            matchedUser={matchedUserInfo}
            onChat={handleMatchChat}
          />
        </div>
      </MobileLayout>
    );
  }

  // Mobile layout
  return (
    <MobileLayout>
      <div className="min-h-screen bg-background pb-20">
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            💜 Let's Discover
          </h1>
        </div>

        {tabNav}

        {tab === 'discover' && (
          <DatingCardStack
            candidates={candidates}
            loading={candidatesLoading}
            onLike={handleLike}
            onPass={handlePass}
            onFetchMore={fetchCandidates}
            onReload={reloadCandidates}
          />
        )}

        {tab === 'matches' && !selectedMatch && (
          <DatingMatchesList
            matches={matches}
            onSelect={setSelectedMatch}
          />
        )}

        {tab === 'matches' && selectedMatch && (
          <div className="h-[calc(100vh-180px)]">
            <DatingChatWindow match={selectedMatch} />
          </div>
        )}

        {tab === 'profile' && (
          <DatingProfileView />
        )}

        <MatchModal
          open={!!matchedUserId}
          onClose={clearMatch}
          matchedUser={matchedUserInfo}
          onChat={handleMatchChat}
        />
      </div>
    </MobileLayout>
  );
}
