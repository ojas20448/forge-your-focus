import React, { useState } from 'react';
import { Clock, Target, Zap, TrendingUp, Calendar, Flame, Brain, BarChart3, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change?: number;
  suffix?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, change, suffix }) => (
  <div className="bg-card rounded-xl p-4 border border-border/50">
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-2xl font-bold font-mono-time text-foreground">{value}</span>
      {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
    </div>
    {change !== undefined && (
      <div className={cn(
        "flex items-center gap-1 mt-1 text-xs",
        change >= 0 ? "text-success" : "text-accent"
      )}>
        <TrendingUp className={cn("w-3 h-3", change < 0 && "rotate-180")} />
        <span>{change >= 0 ? '+' : ''}{change}% vs last week</span>
      </div>
    )}
  </div>
);

export const StatsScreen: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');

  const weeklyData = [
    { day: 'M', hours: 4.5, target: 7 },
    { day: 'T', hours: 6.2, target: 7 },
    { day: 'W', hours: 5.8, target: 7 },
    { day: 'T', hours: 7.5, target: 7 },
    { day: 'F', hours: 6.0, target: 7 },
    { day: 'S', hours: 3.5, target: 5 },
    { day: 'S', hours: 2.0, target: 5 },
  ];

  const maxHours = Math.max(...weeklyData.map(d => Math.max(d.hours, d.target)));

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-xl border-b border-border z-20">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">Statistics</h1>
        </div>
        
        {/* Time range tabs */}
        <div className="flex px-4 pb-3 gap-2">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all capitalize",
                timeRange === range 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary text-muted-foreground"
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </header>

      {/* Key stats */}
      <section className="px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Clock className="w-4 h-4 text-primary" />}
            label="Focus Time"
            value="32.5"
            suffix="hours"
            change={12}
          />
          <StatCard
            icon={<Target className="w-4 h-4 text-success" />}
            label="Tasks Done"
            value={47}
            change={8}
          />
          <StatCard
            icon={<Zap className="w-4 h-4 text-xp-glow" />}
            label="XP Earned"
            value="2,450"
            change={15}
          />
          <StatCard
            icon={<Flame className="w-4 h-4 text-streak-glow" />}
            label="Current Streak"
            value={23}
            suffix="days"
          />
        </div>
      </section>

      {/* Debt Score Alert */}
      <section className="px-4 py-2">
        <div className={cn(
          "bg-card rounded-2xl border p-4",
          32 > 50 ? "border-accent/50 bg-accent/5" : 
          32 > 25 ? "border-warning/50 bg-warning/5" : "border-success/50 bg-success/5"
        )}>
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              32 > 50 ? "bg-accent/20" : 32 > 25 ? "bg-warning/20" : "bg-success/20"
            )}>
              <AlertTriangle className={cn(
                "w-5 h-5",
                32 > 50 ? "text-accent" : 32 > 25 ? "text-warning" : "text-success"
              )} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-foreground">Task Debt Score</h3>
                <span className={cn(
                  "text-xl font-bold font-mono-time",
                  32 > 50 ? "text-accent" : 32 > 25 ? "text-warning" : "text-success"
                )}>
                  32%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {32 > 50 ? "⚠️ Critical! Many overdue tasks. Complete them to avoid XP penalties." :
                 32 > 25 ? "⚡ Moderate debt. Focus on clearing rotten tasks this week." :
                 "✨ Great! Low debt score. Keep up the momentum!"}
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Rotten Tasks</span>
                  <span className="font-medium text-accent">3 tasks</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Overdue Hours</span>
                  <span className="font-medium text-warning">4.5 hours</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Potential XP Loss</span>
                  <span className="font-medium text-accent">-180 XP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Focus chart */}
      <section className="px-4 py-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Weekly Focus Hours
        </h2>
        <div className="bg-card rounded-2xl border border-border/50 p-4">
          <div className="flex items-end justify-between h-40 gap-2">
            {weeklyData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full h-32 flex flex-col justify-end gap-1">
                  {/* Target indicator */}
                  <div 
                    className="w-full bg-secondary rounded-t-md"
                    style={{ height: `${(data.target / maxHours) * 100}%` }}
                  />
                  {/* Actual hours */}
                  <div 
                    className={cn(
                      "w-full rounded-t-md transition-all",
                      data.hours >= data.target ? "bg-success" : "bg-primary"
                    )}
                    style={{ 
                      height: `${(data.hours / maxHours) * 100}%`,
                      marginTop: `-${(data.target / maxHours) * 100}%`
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground font-medium">{data.day}</span>
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">Actual</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-secondary" />
              <span className="text-xs text-muted-foreground">Target</span>
            </div>
          </div>
        </div>
      </section>

      {/* Efficiency metrics */}
      <section className="px-4 py-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Efficiency Metrics
        </h2>
        <div className="space-y-3">
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Deep Work Ratio</span>
              </div>
              <span className="text-lg font-bold font-mono-time text-primary">72%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: '72%' }} />
            </div>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-success" />
                <span className="text-sm font-medium text-foreground">Goal Alignment</span>
              </div>
              <span className="text-lg font-bold font-mono-time text-success">85%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-success rounded-full" style={{ width: '85%' }} />
            </div>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-warning" />
                <span className="text-sm font-medium text-foreground">Verification Rate</span>
              </div>
              <span className="text-lg font-bold font-mono-time text-warning">94%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-warning rounded-full" style={{ width: '94%' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Streak history */}
      <section className="px-4 py-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Streak History
        </h2>
        <div className="bg-card rounded-2xl border border-border/50 p-4">
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 28 }).map((_, i) => {
              const isActive = Math.random() > 0.2;
              const intensity = isActive ? Math.random() : 0;
              return (
                <div
                  key={i}
                  className={cn(
                    "aspect-square rounded-sm transition-colors",
                    intensity > 0.7 ? "bg-success" :
                    intensity > 0.4 ? "bg-success/60" :
                    intensity > 0 ? "bg-success/30" : "bg-secondary"
                  )}
                />
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
            <span className="text-xs text-muted-foreground">4 weeks ago</span>
            <span className="text-xs text-muted-foreground">Today</span>
          </div>
        </div>
      </section>
    </div>
  );
};
