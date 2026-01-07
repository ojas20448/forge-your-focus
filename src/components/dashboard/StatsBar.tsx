import React from 'react';
import { Flame, Zap, Trophy, Target, AlertTriangle } from 'lucide-react';
import { UserStats } from '@/types/focusforge';
import { cn } from '@/lib/utils';

interface StatsBarProps {
  stats: UserStats;
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats }) => {
  const leagueColors = {
    bronze: 'text-league-bronze',
    silver: 'text-league-silver',
    gold: 'text-league-gold',
    diamond: 'text-primary',
  };

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between bg-card/50 rounded-2xl p-3 border border-border/50">
        {/* XP */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-xp-glow/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-xp-glow" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">XP</span>
            <span className="text-sm font-bold font-mono-time text-foreground">
              {stats.total_xp.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Streak */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-streak-glow/20 flex items-center justify-center">
            <Flame className="w-4 h-4 text-streak-glow" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Streak</span>
            <span className="text-sm font-bold font-mono-time text-foreground">
              {stats.current_streak}d
            </span>
          </div>
        </div>

        {/* League */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            stats.league === 'diamond' ? 'bg-primary/20' : 'bg-secondary'
          )}>
            <Trophy className={cn("w-4 h-4", leagueColors[stats.league])} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Rank</span>
            <span className="text-sm font-bold font-mono-time text-foreground">
              #{stats.league_rank}
            </span>
          </div>
        </div>

        {/* Debt Score - replaces weekly focus, moved below */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            stats.debt_score > 50 ? 'bg-accent/20' : stats.debt_score > 25 ? 'bg-warning/20' : 'bg-success/20'
          )}>
            <AlertTriangle className={cn(
              "w-4 h-4",
              stats.debt_score > 50 ? 'text-accent' : stats.debt_score > 25 ? 'text-warning' : 'text-success'
            )} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Debt</span>
            <span className={cn(
              "text-sm font-bold font-mono-time",
              stats.debt_score > 50 ? 'text-accent' : stats.debt_score > 25 ? 'text-warning' : 'text-success'
            )}>
              {stats.debt_score}%
            </span>
          </div>
        </div>
      </div>
      
      {/* Weekly Focus Progress Bar */}
      <div className="mt-2 px-1">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">Weekly Focus</span>
          <span className="font-mono-time font-medium text-foreground">
            {stats.weekly_focus_hours}h / {stats.weekly_goal_hours}h
          </span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all",
              stats.weekly_focus_hours >= stats.weekly_goal_hours ? 'bg-success' : 'bg-primary'
            )}
            style={{ width: `${Math.min((stats.weekly_focus_hours / stats.weekly_goal_hours) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
