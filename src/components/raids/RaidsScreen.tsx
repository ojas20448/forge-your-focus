import React, { useState } from 'react';
import { Trophy, Users, Zap, Clock, Target, ChevronRight, Crown, Swords, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RaidMember {
  id: string;
  name: string;
  avatar: string;
  xp: number;
  focusHours: number;
  isOnline: boolean;
}

interface Raid {
  id: string;
  name: string;
  targetHours: number;
  currentHours: number;
  members: RaidMember[];
  endsAt: string;
  reward: string;
}

export const RaidsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'raids' | 'league'>('raids');

  const mockRaid: Raid = {
    id: 'r_001',
    name: 'Physics Masters',
    targetHours: 500,
    currentHours: 342,
    members: [
      { id: 'm1', name: 'Alex', avatar: '👨‍💻', xp: 2400, focusHours: 45, isOnline: true },
      { id: 'm2', name: 'Sam', avatar: '👩‍🔬', xp: 2100, focusHours: 38, isOnline: true },
      { id: 'm3', name: 'Jordan', avatar: '🧑‍🎓', xp: 1800, focusHours: 32, isOnline: false },
      { id: 'm4', name: 'You', avatar: '🎯', xp: 1650, focusHours: 28, isOnline: true },
      { id: 'm5', name: 'Riley', avatar: '📚', xp: 1200, focusHours: 21, isOnline: false },
    ],
    endsAt: '2026-01-12',
    reward: '2x XP Weekend',
  };

  const leaderboard = [
    { rank: 1, name: 'PhysicsMaster', xp: 45200, avatar: '🏆' },
    { rank: 2, name: 'StudyKing', xp: 42100, avatar: '👑' },
    { rank: 3, name: 'FocusQueen', xp: 38900, avatar: '💎' },
    { rank: 47, name: 'You', xp: 12450, avatar: '🎯', isYou: true },
    { rank: 48, name: 'Learner42', xp: 12200, avatar: '📖' },
    { rank: 49, name: 'StudyBuddy', xp: 11800, avatar: '🤓' },
  ];

  const raidProgress = (mockRaid.currentHours / mockRaid.targetHours) * 100;
  const daysRemaining = Math.ceil((new Date(mockRaid.endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-xl border-b border-border z-20">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">Raids & Leagues</h1>
        </div>
        
        {/* Tabs */}
        <div className="flex px-4 pb-2 gap-2">
          <button
            onClick={() => setActiveTab('raids')}
            className={cn(
              "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all",
              activeTab === 'raids' 
                ? "bg-primary text-primary-foreground" 
                : "bg-secondary text-muted-foreground"
            )}
          >
            <Swords className="w-4 h-4 inline mr-2" />
            Boss Raids
          </button>
          <button
            onClick={() => setActiveTab('league')}
            className={cn(
              "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all",
              activeTab === 'league' 
                ? "bg-primary text-primary-foreground" 
                : "bg-secondary text-muted-foreground"
            )}
          >
            <Trophy className="w-4 h-4 inline mr-2" />
            League
          </button>
        </div>
      </header>

      {activeTab === 'raids' ? (
        <>
          {/* Active Raid */}
          <section className="px-4 py-4">
            <div className="bg-gradient-to-br from-card to-primary/5 rounded-2xl border border-primary/30 p-4 overflow-hidden relative">
              {/* Glow effect */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Swords className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{mockRaid.name}</h3>
                      <p className="text-xs text-muted-foreground">{mockRaid.members.length} members</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">Ends in</span>
                    <p className="font-bold text-primary font-mono-time">{daysRemaining}d</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Team Progress</span>
                    <span className="font-bold font-mono-time text-foreground">
                      {mockRaid.currentHours}/{mockRaid.targetHours}h
                    </span>
                  </div>
                  <div className="h-3 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-success rounded-full transition-all duration-500"
                      style={{ width: `${raidProgress}%` }}
                    />
                  </div>
                </div>

                {/* Reward */}
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-xp-glow" />
                    <span className="text-sm font-medium text-foreground">Reward</span>
                  </div>
                  <span className="text-sm font-bold text-xp-glow">{mockRaid.reward}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Team Members */}
          <section className="px-4 py-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Team Members
            </h2>
            <div className="space-y-2">
              {mockRaid.members.map((member, index) => (
                <div
                  key={member.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all",
                    member.name === 'You' 
                      ? "bg-primary/10 border-primary/30" 
                      : "bg-card border-border/50"
                  )}
                >
                  <span className="text-lg font-bold text-muted-foreground w-6 font-mono-time">
                    #{index + 1}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl relative">
                    {member.avatar}
                    {member.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-card" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground text-sm">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.focusHours}h this week</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xp-glow font-mono-time text-sm">+{member.xp}</p>
                    <p className="text-[10px] text-muted-foreground">XP</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <>
          {/* League info */}
          <section className="px-4 py-4">
            <div className="bg-card rounded-2xl border border-border/50 p-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-league-gold/30 to-league-gold/10 flex items-center justify-center">
                  <Crown className="w-8 h-8 text-league-gold" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">Gold League</h3>
                  <p className="text-sm text-muted-foreground">Rank #47 • Top 12%</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-secondary/50 rounded-xl p-3 text-center">
                  <Zap className="w-4 h-4 text-xp-glow mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Weekly XP</p>
                  <p className="font-bold font-mono-time">2,450</p>
                </div>
                <div className="bg-secondary/50 rounded-xl p-3 text-center">
                  <Clock className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Focus Time</p>
                  <p className="font-bold font-mono-time">32h</p>
                </div>
                <div className="bg-secondary/50 rounded-xl p-3 text-center">
                  <Target className="w-4 h-4 text-success mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Tasks Done</p>
                  <p className="font-bold font-mono-time">24</p>
                </div>
              </div>
            </div>
          </section>

          {/* Leaderboard */}
          <section className="px-4 py-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Leaderboard
            </h2>
            <div className="space-y-2">
              {leaderboard.map((player) => (
                <div
                  key={player.rank}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all",
                    player.isYou 
                      ? "bg-primary/10 border-primary/30" 
                      : "bg-card border-border/50"
                  )}
                >
                  <span className={cn(
                    "text-lg font-bold w-8 font-mono-time",
                    player.rank === 1 ? "text-league-gold" :
                    player.rank === 2 ? "text-league-silver" :
                    player.rank === 3 ? "text-league-bronze" : "text-muted-foreground"
                  )}>
                    #{player.rank}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl">
                    {player.avatar}
                  </div>
                  <div className="flex-1">
                    <p className={cn(
                      "font-medium text-sm",
                      player.isYou ? "text-primary" : "text-foreground"
                    )}>
                      {player.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xp-glow font-mono-time text-sm">
                      {player.xp.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">XP</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
};
