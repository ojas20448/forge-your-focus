import React from 'react';
import { Flame, Zap, Clock } from 'lucide-react';
import { UserStats } from '@/types/focusforge';
import { cn } from '@/lib/utils';

interface StatsBarProps {
  stats: UserStats;
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats }) => {
  const weeklyProgress = Math.min((stats.weekly_focus_hours / stats.weekly_goal_hours) * 100, 100);
  const isWeeklyGoalMet = stats.weekly_focus_hours >= stats.weekly_goal_hours;

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        {/* XP */}
        <div className="flex-1 flex items-center gap-2 bg-card/50 rounded-xl p-3 border border-border/50">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">XP</span>
            <span className="text-sm font-bold font-mono-time text-foreground">
              {stats.total_xp.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Streak */}
        <div className="flex-1 flex items-center gap-2 bg-card/50 rounded-xl p-3 border border-border/50">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Streak</span>
            <span className="text-sm font-bold font-mono-time text-foreground">
              {stats.current_streak} days
            </span>
          </div>
        </div>

        {/* Today's Focus */}
        <div className="flex-1 flex items-center gap-2 bg-card/50 rounded-xl p-3 border border-border/50">
          <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
            <Clock className="w-4 h-4 text-success" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Today</span>
            <span className="text-sm font-bold font-mono-time text-foreground">
              {stats.weekly_focus_hours}h
            </span>
          </div>
        </div>
      </div>

      {/* Weekly Focus Progress Bar */}
      <div className="mt-3 p-3 bg-card/50 rounded-xl border border-border/50">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-muted-foreground font-medium">Weekly Goal</span>
          <span className={cn(
            "font-mono-time font-semibold",
            isWeeklyGoalMet ? "text-success" : "text-foreground"
          )}>
            {stats.weekly_focus_hours}h / {stats.weekly_goal_hours}h
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isWeeklyGoalMet ? 'bg-success' : 'bg-primary'
            )}
            style={{ width: `${weeklyProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
