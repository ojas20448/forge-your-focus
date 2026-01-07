import React, { useState } from 'react';
import { Trophy, Medal, Crown, TrendingUp, Zap, ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useLeagues } from '@/hooks/useLeagues';
import { useProfile } from '@/hooks/useProfile';

interface LeaderboardScreenProps {
  onBack: () => void;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ onBack }) => {
  const { leagues, leaderboard, myRank, myLeague, loading } = useLeagues();
  const { profile } = useProfile();
  const [viewMode, setViewMode] = useState<'all-time' | 'weekly'>('all-time');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getLeagueColor = (tier: number | null) => {
    if (!tier) return 'text-gray-400';
    if (tier >= 4) return 'text-yellow-500'; // Diamond
    if (tier === 3) return 'text-yellow-600'; // Gold
    if (tier === 2) return 'text-gray-400'; // Silver
    return 'text-orange-600'; // Bronze
  };

  const getLeagueIcon = (tier: number | null) => {
    if (!tier) return <Medal className="w-4 h-4" />;
    if (tier >= 4) return <Crown className="w-4 h-4" />;
    if (tier === 3) return <Trophy className="w-4 h-4" />;
    return <Medal className="w-4 h-4" />;
  };

  const getLeagueName = (tier: number | null) => {
    const league = leagues.find(l => l.tier === tier);
    return league?.name || 'Unranked';
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-background p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-4"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Global Rankings</h1>
            <p className="text-muted-foreground">Compete with others worldwide</p>
          </div>
          <Trophy className="w-12 h-12 text-primary animate-pulse" />
        </div>

        {/* My League Card */}
        {myLeague && (
          <div className="mt-6 bg-card rounded-xl p-4 border shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center',
                  myLeague.tier >= 4 ? 'bg-yellow-500/20' :
                  myLeague.tier === 3 ? 'bg-yellow-600/20' :
                  myLeague.tier === 2 ? 'bg-gray-400/20' :
                  'bg-orange-600/20'
                )}>
                  {getLeagueIcon(myLeague.tier)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your League</p>
                  <h3 className={cn('text-xl font-bold', getLeagueColor(myLeague.tier))}>
                    {myLeague.name}
                  </h3>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Your Rank</p>
                <p className="text-2xl font-bold text-primary">#{myRank || '—'}</p>
              </div>
            </div>

            {/* Progress to next league */}
            {myLeague.tier < 5 && profile && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{myLeague.min_xp} XP</span>
                  <span>{myLeague.max_xp} XP</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                    style={{
                      width: `${((profile.total_xp - myLeague.min_xp) / (myLeague.max_xp - myLeague.min_xp)) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-center">
                  {myLeague.max_xp - profile.total_xp} XP to next league
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 p-4">
        <Button
          variant={viewMode === 'all-time' ? 'default' : 'outline'}
          className="flex-1"
          onClick={() => setViewMode('all-time')}
        >
          <Trophy className="w-4 h-4 mr-2" />
          All-Time
        </Button>
        <Button
          variant={viewMode === 'weekly' ? 'default' : 'outline'}
          className="flex-1"
          onClick={() => setViewMode('weekly')}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          This Week
        </Button>
      </div>

      {/* League Tiers Overview */}
      <div className="px-4 mb-4">
        <h2 className="text-lg font-semibold mb-3">League Tiers</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {leagues.map((league) => (
            <div
              key={league.id}
              className={cn(
                'p-3 rounded-lg border text-center transition-all',
                myLeague?.id === league.id
                  ? 'bg-primary/10 border-primary scale-105'
                  : 'bg-card hover:bg-accent'
              )}
            >
              <div className={cn('text-2xl mb-1', getLeagueColor(league.tier))}>
                {getLeagueIcon(league.tier)}
              </div>
              <p className="text-xs font-medium">{league.name}</p>
              <p className="text-xs text-muted-foreground">
                {league.min_xp}+ XP
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="px-4">
        <h2 className="text-lg font-semibold mb-3">Top Players</h2>
        <div className="space-y-2">
          {leaderboard.slice(0, 50).map((entry, index) => (
            <div
              key={entry.user_id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg transition-all',
                entry.user_id === profile?.user_id
                  ? 'bg-primary/10 border-2 border-primary'
                  : 'bg-card hover:bg-accent',
                index < 3 && 'shadow-lg'
              )}
            >
              {/* Rank */}
              <div className="w-8 text-center">
                {index === 0 && <span className="text-2xl">🥇</span>}
                {index === 1 && <span className="text-2xl">🥈</span>}
                {index === 2 && <span className="text-2xl">🥉</span>}
                {index >= 3 && (
                  <span className="font-bold text-muted-foreground">
                    {entry.rank}
                  </span>
                )}
              </div>

              {/* Avatar */}
              <Avatar className="w-10 h-10">
                <AvatarImage src={entry.avatar_url || undefined} />
                <AvatarFallback>
                  {(entry.display_name || 'User').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">
                  {entry.display_name || `User ${entry.user_id.slice(0, 8)}`}
                  {entry.user_id === profile?.user_id && (
                    <span className="ml-2 text-xs text-primary">(You)</span>
                  )}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Level {entry.level}</span>
                  <span>•</span>
                  <span className={getLeagueColor(entry.current_league_tier)}>
                    {getLeagueName(entry.current_league_tier)}
                  </span>
                </div>
              </div>

              {/* XP */}
              <div className="text-right">
                <div className="flex items-center gap-1 text-primary font-bold">
                  <Zap className="w-4 h-4" />
                  <span>{entry.total_xp.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Show more hint */}
        {leaderboard.length > 50 && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            Showing top 50 of {leaderboard.length} players
          </p>
        )}
      </div>
    </div>
  );
};
