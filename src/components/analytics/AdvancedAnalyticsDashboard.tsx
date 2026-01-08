import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Calendar, Clock, Zap, Target, BarChart3, Activity, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, getHours, parseISO } from 'date-fns';

interface ProductivityData {
  hourlyProductivity: { hour: number; tasks: number; xp: number }[];
  weeklyTrend: { day: string; productivity: number }[];
  cognitiveLoad: number; // 0-100
  burnoutRisk: number; // 0-100
  bestHours: number[];
  worstHours: number[];
  taskTypeDistribution: { type: string; count: number; percentage: number }[];
  completionRate: number;
  averageSessionDuration: number;
}

export const AdvancedAnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<ProductivityData | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | '3months'>('week');

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, timeRange]);

  const loadAnalytics = async () => {
    if (!user) return;

    setLoading(true);
    const daysBack = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
    const startDate = format(subDays(new Date(), daysBack), 'yyyy-MM-dd');

    try {
      // Fetch tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .gte('scheduled_date', startDate);

      // Fetch focus sessions
      const { data: sessions } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', new Date(startDate).toISOString());

      if (!tasks || !sessions) {
        setLoading(false);
        return;
      }

      // Process hourly productivity
      const hourlyMap = new Map<number, { tasks: number; xp: number }>();
      tasks.forEach(task => {
        const hour = parseInt(task.start_time.split(':')[0]);
        const current = hourlyMap.get(hour) || { tasks: 0, xp: 0 };
        current.tasks += 1;
        current.xp += task.xp_reward || 0;
        hourlyMap.set(hour, current);
      });

      const hourlyProductivity = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        tasks: hourlyMap.get(hour)?.tasks || 0,
        xp: hourlyMap.get(hour)?.xp || 0,
      }));

      // Find best and worst hours
      const sortedHours = [...hourlyProductivity]
        .filter(h => h.tasks > 0)
        .sort((a, b) => b.xp - a.xp);
      const bestHours = sortedHours.slice(0, 3).map(h => h.hour);
      const worstHours = sortedHours.slice(-3).map(h => h.hour);

      // Weekly trend
      const weekDays = eachDayOfInterval({
        start: subDays(new Date(), 6),
        end: new Date(),
      });
      const weeklyTrend = weekDays.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayTasks = tasks.filter(t => t.scheduled_date === dayStr);
        const completedCount = dayTasks.filter(t => t.is_completed).length;
        const productivity = dayTasks.length > 0 ? (completedCount / dayTasks.length) * 100 : 0;
        
        return {
          day: format(day, 'EEE'),
          productivity,
        };
      });

      // Task type distribution
      const typeMap = new Map<string, number>();
      tasks.forEach(task => {
        const type = task.priority || 'medium';
        typeMap.set(type, (typeMap.get(type) || 0) + 1);
      });
      const total = tasks.length || 1;
      const taskTypeDistribution = Array.from(typeMap.entries()).map(([type, count]) => ({
        type,
        count,
        percentage: (count / total) * 100,
      }));

      // Completion rate
      const completed = tasks.filter(t => t.is_completed).length;
      const completionRate = tasks.length > 0 ? (completed / tasks.length) * 100 : 0;

      // Average session duration
      const totalSessionMinutes = sessions.reduce((sum, s) => sum + (s.actual_duration_minutes || 0), 0);
      const averageSessionDuration = sessions.length > 0 ? totalSessionMinutes / sessions.length : 0;

      // Cognitive load (based on task density and completion rate)
      const avgTasksPerDay = tasks.length / daysBack;
      const cognitiveLoad = Math.min(100, (avgTasksPerDay / 10) * 100 * (completionRate < 60 ? 1.5 : 1));

      // Burnout risk (based on multiple factors)
      const incompleteTasks = tasks.filter(t => !t.is_completed && new Date(t.scheduled_date) < new Date());
      const overdueRate = tasks.length > 0 ? (incompleteTasks.length / tasks.length) * 100 : 0;
      const longSessionsCount = sessions.filter(s => s.actual_duration_minutes > 120).length;
      const burnoutRisk = Math.min(100, (overdueRate * 0.5) + (cognitiveLoad * 0.3) + (longSessionsCount / sessions.length) * 20);

      setAnalytics({
        hourlyProductivity,
        weeklyTrend,
        cognitiveLoad,
        burnoutRisk,
        bestHours,
        worstHours,
        taskTypeDistribution,
        completionRate,
        averageSessionDuration,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    // TODO: Implement PDF export using jsPDF or similar
    alert('PDF export coming soon!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Analyzing your productivity...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  const getRiskColor = (risk: number) => {
    if (risk < 30) return 'text-success';
    if (risk < 60) return 'text-warning';
    return 'text-danger';
  };

  const getRiskBg = (risk: number) => {
    if (risk < 30) return 'bg-success/10 border-success/30';
    if (risk < 60) return 'bg-warning/10 border-warning/30';
    return 'bg-danger/10 border-danger/30';
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            Advanced Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Deep insights into your productivity patterns</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-border rounded-lg overflow-hidden">
            {(['week', 'month', '3months'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors",
                  timeRange === range 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-background text-muted-foreground hover:text-foreground"
                )}
              >
                {range === '3months' ? '3M' : range === 'month' ? '1M' : '1W'}
              </button>
            ))}
          </div>
          <Button onClick={exportToPDF} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={cn("border", getRiskBg(analytics.cognitiveLoad))}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Cognitive Load
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("text-3xl font-bold", getRiskColor(analytics.cognitiveLoad))}>
              {Math.round(analytics.cognitiveLoad)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.cognitiveLoad < 30 ? 'Manageable' : analytics.cognitiveLoad < 60 ? 'Moderate' : 'High stress'}
            </p>
          </CardContent>
        </Card>

        <Card className={cn("border", getRiskBg(analytics.burnoutRisk))}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Burnout Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("text-3xl font-bold", getRiskColor(analytics.burnoutRisk))}>
              {Math.round(analytics.burnoutRisk)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.burnoutRisk < 30 ? 'Low risk' : analytics.burnoutRisk < 60 ? 'Watch closely' : 'Take a break!'}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {Math.round(analytics.completionRate)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.completionRate > 80 ? 'Excellent!' : analytics.completionRate > 60 ? 'Good' : 'Needs work'}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Avg Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {Math.round(analytics.averageSessionDuration)}m
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.averageSessionDuration > 60 ? 'Deep focus' : 'Quick sprints'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Productivity Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Hourly Productivity Heatmap
          </CardTitle>
          <CardDescription>Discover your peak productivity hours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-12 gap-2">
            {analytics.hourlyProductivity.map(({ hour, tasks, xp }) => {
              const maxXp = Math.max(...analytics.hourlyProductivity.map(h => h.xp), 1);
              const intensity = (xp / maxXp) * 100;
              const isBest = analytics.bestHours.includes(hour);
              const isWorst = analytics.worstHours.includes(hour);

              return (
                <div
                  key={hour}
                  className={cn(
                    "aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all hover:scale-110",
                    intensity === 0 && "bg-muted/20 text-muted-foreground",
                    intensity > 0 && intensity < 25 && "bg-primary/20 text-primary",
                    intensity >= 25 && intensity < 50 && "bg-primary/40 text-primary",
                    intensity >= 50 && intensity < 75 && "bg-primary/60 text-primary-foreground",
                    intensity >= 75 && "bg-primary text-primary-foreground",
                    isBest && "ring-2 ring-success",
                    isWorst && "ring-2 ring-danger"
                  )}
                  title={`${hour}:00 - ${tasks} tasks, ${xp} XP`}
                >
                  <span>{hour}</span>
                  {tasks > 0 && <span className="text-[8px] opacity-70">{tasks}</span>}
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-primary/20" />
              <span className="text-muted-foreground">Low</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-primary" />
              <span className="text-muted-foreground">High</span>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded ring-2 ring-success" />
              <span className="text-muted-foreground">Best hours: {analytics.bestHours.map(h => `${h}:00`).join(', ')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Weekly Productivity Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.weeklyTrend.map(({ day, productivity }) => (
              <div key={day} className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground w-12">{day}</span>
                <div className="flex-1 bg-muted rounded-full h-8 overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all flex items-center justify-end px-3 text-xs font-bold",
                      productivity >= 80 && "bg-success text-success-foreground",
                      productivity >= 60 && productivity < 80 && "bg-primary text-primary-foreground",
                      productivity >= 40 && productivity < 60 && "bg-warning text-warning-foreground",
                      productivity < 40 && "bg-danger text-danger-foreground"
                    )}
                    style={{ width: `${Math.max(productivity, 5)}%` }}
                  >
                    {Math.round(productivity)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Zap className="w-5 h-5" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {analytics.burnoutRisk > 60 && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
              <strong>⚠️ High burnout risk detected!</strong> Consider taking a break and reducing your workload for the next few days.
            </div>
          )}
          {analytics.completionRate < 60 && (
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 text-warning text-sm">
              <strong>💡 Low completion rate.</strong> Try breaking tasks into smaller chunks or scheduling fewer tasks per day.
            </div>
          )}
          {analytics.bestHours.length > 0 && (
            <div className="p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm">
              <strong>✨ Your peak hours are {analytics.bestHours.map(h => `${h}:00`).join(', ')}.</strong> Schedule your most important tasks during these times!
            </div>
          )}
          {analytics.cognitiveLoad < 30 && analytics.completionRate > 80 && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm">
              <strong>🚀 You're in the zone!</strong> Great balance between workload and completion. Consider taking on a new challenge!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
