import React, { useState, useEffect } from 'react';
import { Trophy, Users, Zap, Clock, Target, ChevronRight, Crown, Swords, Shield, Plus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRaids, RaidMember } from '@/hooks/useRaids';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';

export const RaidsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'raids' | 'league'>('raids');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [raidMembers, setRaidMembers] = useState<Record<string, RaidMember[]>>({});
  
  const { raids, loading, createRaid, joinRaid, getRaidMembers } = useRaids();
  const { profile } = useProfile();

  const [newRaid, setNewRaid] = useState({
    name: '',
    description: '',
    target_hours: 100,
    ends_at: format(addDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm"),
    reward: '2x XP Weekend'
  });

  // Fetch members for each raid
  useEffect(() => {
    raids.forEach(async (raid) => {
      const members = await getRaidMembers(raid.id);
      setRaidMembers(prev => ({ ...prev, [raid.id]: members }));
    });
  }, [raids]);

  const handleCreateRaid = async () => {
    if (!newRaid.name.trim()) return;
    
    setCreating(true);
    await createRaid({
      name: newRaid.name,
      description: newRaid.description,
      target_hours: newRaid.target_hours,
      ends_at: new Date(newRaid.ends_at).toISOString(),
      reward: newRaid.reward
    });
    setCreating(false);
    setShowCreateModal(false);
    setNewRaid({
      name: '',
      description: '',
      target_hours: 100,
      ends_at: format(addDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm"),
      reward: '2x XP Weekend'
    });
  };

  const leaderboard = [
    { rank: 1, name: 'PhysicsMaster', xp: 45200, avatar: '🏆' },
    { rank: 2, name: 'StudyKing', xp: 42100, avatar: '👑' },
    { rank: 3, name: 'FocusQueen', xp: 38900, avatar: '💎' },
    { rank: 47, name: profile?.display_name || 'You', xp: profile?.total_xp || 0, avatar: '🎯', isYou: true },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-xl border-b border-border z-20">
        <div className="px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Raids & Leagues</h1>
          {activeTab === 'raids' && (
            <Button variant="ghost" size="icon" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-5 h-5" />
            </Button>
          )}
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
          {/* Active Raids */}
          {raids.length > 0 ? (
            raids.map(raid => {
              const members = raidMembers[raid.id] || [];
              const raidProgress = (raid.current_hours / raid.target_hours) * 100;
              const daysRemaining = Math.max(0, Math.ceil((new Date(raid.ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

              return (
                <section key={raid.id} className="px-4 py-4">
                  <div className="bg-gradient-to-br from-card to-primary/5 rounded-2xl border border-primary/30 p-4 overflow-hidden relative">
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                            <Swords className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground">{raid.name}</h3>
                            <p className="text-xs text-muted-foreground">{members.length} members</p>
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
                            {raid.current_hours}/{raid.target_hours}h
                          </span>
                        </div>
                        <div className="h-3 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-primary to-success rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, raidProgress)}%` }}
                          />
                        </div>
                      </div>

                      {/* Reward */}
                      {raid.reward && (
                        <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-xp-glow" />
                            <span className="text-sm font-medium text-foreground">Reward</span>
                          </div>
                          <span className="text-sm font-bold text-xp-glow">{raid.reward}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Team Members */}
                  {members.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Team Members
                      </h4>
                      {members.slice(0, 5).map((member, index) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-card/80 border border-border/30"
                        >
                          <span className="text-lg font-bold text-muted-foreground w-6 font-mono-time">
                            #{index + 1}
                          </span>
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl">
                            👤
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground text-sm">Member</p>
                            <p className="text-xs text-muted-foreground">{member.focus_hours}h this week</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-xp-glow font-mono-time text-sm">+{member.xp_contributed}</p>
                            <p className="text-[10px] text-muted-foreground">XP</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
              <div className="w-20 h-20 rounded-2xl bg-secondary/50 flex items-center justify-center mb-6">
                <Swords className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">No active raids</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Create or join a raid to compete with friends
              </p>
              <Button variant="glow" onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Create Raid
              </Button>
            </div>
          )}
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
                  <h3 className="font-bold text-foreground text-lg">
                    {(profile?.level || 1) >= 10 ? 'Gold' : (profile?.level || 1) >= 5 ? 'Silver' : 'Bronze'} League
                  </h3>
                  <p className="text-sm text-muted-foreground">Level {profile?.level || 1}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-secondary/50 rounded-xl p-3 text-center">
                  <Zap className="w-4 h-4 text-xp-glow mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Total XP</p>
                  <p className="font-bold font-mono-time">{profile?.total_xp || 0}</p>
                </div>
                <div className="bg-secondary/50 rounded-xl p-3 text-center">
                  <Clock className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Streak</p>
                  <p className="font-bold font-mono-time">{profile?.current_streak || 0}d</p>
                </div>
                <div className="bg-secondary/50 rounded-xl p-3 text-center">
                  <Target className="w-4 h-4 text-success mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Level</p>
                  <p className="font-bold font-mono-time">{profile?.level || 1}</p>
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

      {/* Create Raid Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />
          
          <div className="relative w-full max-w-md bg-card border-t border-x border-border rounded-t-3xl max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Create Raid</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowCreateModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Raid Name</label>
                <Input
                  value={newRaid.name}
                  onChange={(e) => setNewRaid(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Physics Masters"
                  className="bg-secondary/50"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Description</label>
                <Textarea
                  value={newRaid.description}
                  onChange={(e) => setNewRaid(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What's this raid about?"
                  className="bg-secondary/50 min-h-[60px]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Target Hours</label>
                <Input
                  type="number"
                  value={newRaid.target_hours}
                  onChange={(e) => setNewRaid(prev => ({ ...prev, target_hours: parseInt(e.target.value) || 100 }))}
                  className="bg-secondary/50"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">End Date & Time</label>
                <Input
                  type="datetime-local"
                  value={newRaid.ends_at}
                  onChange={(e) => setNewRaid(prev => ({ ...prev, ends_at: e.target.value }))}
                  className="bg-secondary/50"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Reward</label>
                <Input
                  value={newRaid.reward}
                  onChange={(e) => setNewRaid(prev => ({ ...prev, reward: e.target.value }))}
                  placeholder="e.g., 2x XP Weekend"
                  className="bg-secondary/50"
                />
              </div>

              <Button 
                variant="glow" 
                className="w-full" 
                onClick={handleCreateRaid}
                disabled={!newRaid.name.trim() || creating}
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Swords className="w-4 h-4 mr-2" />
                )}
                Create Raid
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
