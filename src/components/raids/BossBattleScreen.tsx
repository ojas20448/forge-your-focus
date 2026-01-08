import React, { useState } from 'react';
import { Skull, Zap, Users, Trophy, Award, Crown, TrendingUp, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useBossBattle } from '@/hooks/useBossBattle';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export const BossBattleScreen: React.FC = () => {
  const {
    activeBattle,
    loading,
    userStats,
    leaderboard,
    attackBoss,
  } = useBossBattle();

  const [attackAmount, setAttackAmount] = useState(30);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skull className="w-16 h-16 mx-auto text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading boss battle...</p>
        </div>
      </div>
    );
  }

  if (!activeBattle) {
    return (
      <div className="min-h-screen bg-background pb-24 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <Skull className="w-24 h-24 mx-auto text-muted-foreground" />
          <h2 className="text-2xl font-bold">No Active Boss Battle</h2>
          <p className="text-muted-foreground">
            Weekly boss battles start every Monday. Check back soon!
          </p>
          
          {/* User Stats */}
          <div className="grid grid-cols-2 gap-3 mt-8">
            <div className="p-4 bg-card border border-border rounded-xl">
              <Swords className="w-6 h-6 text-primary mb-2" />
              <p className="text-2xl font-bold">{userStats.totalDamage.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Damage</p>
            </div>
            <div className="p-4 bg-card border border-border rounded-xl">
              <Trophy className="w-6 h-6 text-yellow-500 mb-2" />
              <p className="text-2xl font-bold">{userStats.bossesDefeated}</p>
              <p className="text-xs text-muted-foreground">Bosses Defeated</p>
            </div>
            <div className="p-4 bg-card border border-border rounded-xl">
              <Users className="w-6 h-6 text-blue-500 mb-2" />
              <p className="text-2xl font-bold">{userStats.battlesParticipated}</p>
              <p className="text-xs text-muted-foreground">Battles Joined</p>
            </div>
            <div className="p-4 bg-card border border-border rounded-xl">
              <Award className="w-6 h-6 text-purple-500 mb-2" />
              <p className="text-2xl font-bold">{userStats.lootCollected}</p>
              <p className="text-xs text-muted-foreground">Loot Items</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const boss = activeBattle.bosses;
  const hpPercent = (activeBattle.current_hp / activeBattle.total_hp) * 100;
  const currentPhase = boss.phases.find((p: any) => p.phase === boss.current_phase);
  const timeRemaining = formatDistanceToNow(new Date(activeBattle.ends_at), { addSuffix: true });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'text-yellow-500';
      case 'epic': return 'text-purple-500';
      case 'rare': return 'text-blue-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-xl border-b border-border z-20 p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl font-bold text-foreground">Boss Battle</h1>
            <p className="text-sm text-muted-foreground">Ends {timeRemaining}</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4" />
            <span className="font-semibold">{activeBattle.participants.length}</span>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Boss Info */}
        <div className="bg-gradient-to-br from-red-950 to-red-900 rounded-2xl p-6 border-2 border-red-500/50 relative overflow-hidden">
          {/* Phase indicator */}
          <div className="absolute top-4 right-4 px-3 py-1 bg-red-500 rounded-full text-xs font-bold">
            Phase {boss.current_phase}
          </div>

          {/* Boss icon */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-red-500/20 rounded-xl flex items-center justify-center">
              <Skull className="w-10 h-10 text-red-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">{boss.name}</h2>
              <p className="text-sm text-red-200">{boss.description}</p>
            </div>
          </div>

          {/* HP Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white font-semibold">HP</span>
              <span className="text-red-200">
                {activeBattle.current_hp.toLocaleString()} / {activeBattle.total_hp.toLocaleString()}
              </span>
            </div>
            <div className="h-4 bg-black/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500"
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* Current Phase Info */}
          {currentPhase && (
            <div className="mt-4 p-3 bg-black/30 rounded-lg">
              <p className="text-sm text-red-200">{currentPhase.description}</p>
            </div>
          )}
        </div>

        {/* Attack Section */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Attack Boss
          </h3>
          
          <p className="text-sm text-muted-foreground">
            Complete focus sessions to deal damage. 1 minute = 100 damage
          </p>

          <div className="grid grid-cols-3 gap-2">
            {[15, 30, 60].map(minutes => (
              <Button
                key={minutes}
                variant={attackAmount === minutes ? 'default' : 'outline'}
                onClick={() => setAttackAmount(minutes)}
                className="h-20 flex flex-col items-center justify-center"
              >
                <span className="text-2xl font-bold">{minutes}</span>
                <span className="text-xs">min</span>
              </Button>
            ))}
          </div>

          <Button
            onClick={() => attackBoss(attackAmount)}
            className="w-full h-12 text-lg font-bold"
            size="lg"
          >
            <Swords className="w-5 h-5 mr-2" />
            Deal {(attackAmount * 100).toLocaleString()} Damage
          </Button>
        </div>

        {/* Current Phase Abilities */}
        {currentPhase && currentPhase.abilities && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Skull className="w-5 h-5 text-destructive" />
              Boss Abilities
            </h3>
            <div className="space-y-3">
              {currentPhase.abilities.map((ability: any) => (
                <div key={ability.id} className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="font-semibold text-destructive">{ability.name}</p>
                  <p className="text-sm text-muted-foreground">{ability.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Damage Leaderboard
          </h3>
          <div className="space-y-2">
            {leaderboard.slice(0, 10).map((entry) => (
              <div
                key={entry.user_id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg",
                  entry.rank <= 3 ? "bg-primary/10" : "bg-secondary"
                )}
              >
                <div className="flex items-center gap-3">
                  {entry.rank <= 3 ? (
                    <Crown className={cn(
                      "w-5 h-5",
                      entry.rank === 1 ? "text-yellow-500" :
                      entry.rank === 2 ? "text-gray-400" :
                      "text-orange-600"
                    )} />
                  ) : (
                    <span className="w-5 text-center text-sm text-muted-foreground">
                      {entry.rank}
                    </span>
                  )}
                  <span className="font-semibold">{entry.username}</span>
                </div>
                <span className="text-sm font-mono text-primary">
                  {entry.damage.toLocaleString()} DMG
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Loot Pool */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            Possible Loot
          </h3>
          <div className="grid gap-3">
            {boss.loot_pool.map((loot: any, index: number) => (
              <div
                key={index}
                className="p-4 bg-secondary rounded-xl border border-border"
              >
                <div className="flex items-start justify-between mb-1">
                  <p className={cn("font-semibold", getRarityColor(loot.rarity))}>
                    {loot.name}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {(loot.dropChance * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{loot.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* User Stats */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold">Your Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-secondary rounded-lg">
              <p className="text-2xl font-bold">{userStats.totalDamage.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Damage</p>
            </div>
            <div className="p-3 bg-secondary rounded-lg">
              <p className="text-2xl font-bold">{userStats.bossesDefeated}</p>
              <p className="text-xs text-muted-foreground">Bosses Defeated</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
