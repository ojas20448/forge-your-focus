import React from 'react';
import { Trophy, Lock, CheckCircle2, Flame, Clock, Target } from 'lucide-react';
import { useAchievements } from '@/hooks/useAchievements';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const getAchievementIcon = (type: string) => {
  switch (type) {
    case 'streak':
      return Flame;
    case 'focus_hours':
      return Clock;
    case 'tasks_completed':
      return Target;
    default:
      return Trophy;
  }
};

const getAchievementColor = (type: string) => {
  switch (type) {
    case 'streak':
      return 'text-streak-glow bg-streak-glow/20';
    case 'focus_hours':
      return 'text-primary bg-primary/20';
    case 'tasks_completed':
      return 'text-success bg-success/20';
    default:
      return 'text-xp-glow bg-xp-glow/20';
  }
};

export const AchievementsScreen: React.FC = () => {
  const { achievements, userAchievements, loading, isUnlocked } = useAchievements();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const unlockedCount = userAchievements.length;
  const totalCount = achievements.length;

  // Group achievements by type
  const groupedAchievements = achievements.reduce((acc, achievement) => {
    const type = achievement.requirement_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(achievement);
    return acc;
  }, {} as Record<string, typeof achievements>);

  const typeLabels: Record<string, string> = {
    streak: '🔥 Streak Achievements',
    focus_hours: '⏱️ Focus Time Achievements',
    tasks_completed: '✅ Task Achievements',
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-xl border-b border-border z-20">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">Achievements</h1>
          <p className="text-sm text-muted-foreground">
            {unlockedCount} of {totalCount} unlocked
          </p>
        </div>
      </header>

      {/* Progress Overview */}
      <section className="px-4 py-4">
        <div className="bg-gradient-to-r from-primary/20 to-xp-glow/20 rounded-2xl border border-primary/30 p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/30 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Achievement Progress</p>
              <p className="text-2xl font-bold text-foreground">
                {Math.round((unlockedCount / totalCount) * 100)}%
              </p>
              <div className="h-2 bg-secondary rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-xp-glow rounded-full transition-all"
                  style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Achievement Groups */}
      {Object.entries(groupedAchievements).map(([type, typeAchievements]) => (
        <section key={type} className="px-4 py-2">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            {typeLabels[type] || type}
          </h2>
          <div className="space-y-3">
            {typeAchievements.map((achievement) => {
              const unlocked = isUnlocked(achievement.id);
              const IconComponent = getAchievementIcon(achievement.requirement_type);
              const colorClass = getAchievementColor(achievement.requirement_type);
              const unlockedAt = userAchievements.find(
                (ua) => ua.achievement_id === achievement.id
              )?.unlocked_at;

              return (
                <div
                  key={achievement.id}
                  className={cn(
                    "relative rounded-2xl border p-4 transition-all",
                    unlocked
                      ? "bg-card border-primary/30"
                      : "bg-card/50 border-border/50 opacity-60"
                  )}
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div
                      className={cn(
                        "w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0",
                        unlocked ? colorClass : "bg-secondary text-muted-foreground"
                      )}
                    >
                      {unlocked ? (
                        achievement.icon || <IconComponent className="w-7 h-7" />
                      ) : (
                        <Lock className="w-6 h-6" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground truncate">
                          {achievement.name}
                        </h3>
                        {unlocked && (
                          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {achievement.description}
                      </p>
                      {unlocked && unlockedAt && (
                        <p className="text-xs text-primary mt-1">
                          Unlocked {new Date(unlockedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* XP Reward */}
                    <div
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-bold font-mono-time shrink-0",
                        unlocked
                          ? "bg-xp-glow/20 text-xp-glow"
                          : "bg-secondary text-muted-foreground"
                      )}
                    >
                      +{achievement.xp_reward} XP
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};
