// Advanced Analytics Engine - Cognitive load analysis, predictions, burnout detection
// Provides deep insights into user productivity patterns and recommendations

import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, startOfDay, endOfDay, subDays, format, parseISO } from 'date-fns';

export interface CognitiveLoadPattern {
  hour: number;
  avgFocusMinutes: number;
  avgTasksCompleted: number;
  avgXpEarned: number;
  avgVerificationScore: number;
  cognitiveLoad: 'low' | 'medium' | 'high' | 'peak';
  energyLevel: number; // 0-100
}

export interface ProductivityHeatmap {
  dayOfWeek: number; // 0-6 (Sun-Sat)
  hour: number; // 0-23
  productivityScore: number; // 0-100
  focusMinutes: number;
  tasksCompleted: number;
  xpEarned: number;
}

export interface TaskPrediction {
  taskId: string;
  taskTitle: string;
  scheduledTime: string;
  failureProbability: number; // 0-1
  riskFactors: string[];
  recommendations: string[];
  confidenceScore: number; // 0-1
}

export interface BurnoutIndicators {
  burnoutScore: number; // 0-100
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  indicators: {
    consecutiveDaysWorked: number;
    avgDailyHours: number;
    weeklyHoursTrend: 'increasing' | 'stable' | 'decreasing';
    taskDecayRate: number;
    streakPressure: number;
    restDaysNeeded: number;
  };
  warnings: string[];
  recommendations: string[];
}

export interface ComparativeAnalysis {
  userPerformance: {
    weeklyXp: number;
    weeklyFocusHours: number;
    completionRate: number;
    avgTasksPerDay: number;
  };
  cohortAverage: {
    weeklyXp: number;
    weeklyFocusHours: number;
    completionRate: number;
    avgTasksPerDay: number;
  };
  percentile: number; // 0-100
  rank: number;
  totalUsers: number;
  insights: string[];
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  summary: {
    totalXp: number;
    totalFocusHours: number;
    tasksCompleted: number;
    completionRate: number;
    avgProductivityScore: number;
    streakDays: number;
  };
  cognitiveLoadPatterns: CognitiveLoadPattern[];
  productivityHeatmap: ProductivityHeatmap[];
  topPerformingHours: number[];
  burnoutAnalysis: BurnoutIndicators;
  predictions: TaskPrediction[];
  comparativeAnalysis: ComparativeAnalysis;
  achievements: Array<{ name: string; description: string }>;
  recommendations: string[];
}

class AnalyticsEngine {
  /**
   * Analyze cognitive load patterns by hour
   */
  async analyzeCognitiveLoadPatterns(userId: string, days: number = 30): Promise<CognitiveLoadPattern[]> {
    const startDate = subDays(new Date(), days);

    // Fetch focus sessions
    const { data: sessions } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('started_at', startDate.toISOString());

    // Fetch completed tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_completed', true)
      .gte('scheduled_time', startDate.toISOString());

    // Group by hour of day
    const hourlyData: Record<number, {
      focusMinutes: number[];
      tasksCompleted: number;
      xpEarned: number[];
      verificationScores: number[];
    }> = {};

    for (let hour = 0; hour < 24; hour++) {
      hourlyData[hour] = { focusMinutes: [], tasksCompleted: 0, xpEarned: [], verificationScores: [] };
    }

    // Aggregate session data
    sessions?.forEach(session => {
      const hour = new Date(session.start_time).getHours();
      hourlyData[hour].focusMinutes.push(session.actual_duration_minutes || 0);
      hourlyData[hour].xpEarned.push(session.xp_earned || 0);
      hourlyData[hour].verificationScores.push(100); // Default verification score
    });

    // Aggregate task data
    tasks?.forEach(task => {
      const hour = new Date(task.scheduled_date).getHours();
      hourlyData[hour].tasksCompleted++;
    });

    // Calculate patterns
    const patterns: CognitiveLoadPattern[] = [];

    for (let hour = 0; hour < 24; hour++) {
      const data = hourlyData[hour];
      const avgFocusMinutes = data.focusMinutes.length > 0
        ? data.focusMinutes.reduce((a, b) => a + b, 0) / data.focusMinutes.length
        : 0;
      const avgXp = data.xpEarned.length > 0
        ? data.xpEarned.reduce((a, b) => a + b, 0) / data.xpEarned.length
        : 0;
      const avgVerification = data.verificationScores.length > 0
        ? data.verificationScores.reduce((a, b) => a + b, 0) / data.verificationScores.length
        : 0;

      // Calculate cognitive load based on multiple factors
      const productivityScore = (avgFocusMinutes / 60) * 100; // 0-100
      const taskDensity = data.tasksCompleted * 10; // 0-100+
      const energyLevel = (avgVerification + productivityScore) / 2;

      let cognitiveLoad: 'low' | 'medium' | 'high' | 'peak';
      if (energyLevel < 30) cognitiveLoad = 'low';
      else if (energyLevel < 60) cognitiveLoad = 'medium';
      else if (energyLevel < 85) cognitiveLoad = 'high';
      else cognitiveLoad = 'peak';

      patterns.push({
        hour,
        avgFocusMinutes,
        avgTasksCompleted: data.tasksCompleted / days,
        avgXpEarned: avgXp,
        avgVerificationScore: avgVerification,
        cognitiveLoad,
        energyLevel: Math.round(energyLevel),
      });
    }

    return patterns;
  }

  /**
   * Generate productivity heatmap
   */
  async generateProductivityHeatmap(userId: string, weeks: number = 4): Promise<ProductivityHeatmap[]> {
    const startDate = subDays(new Date(), weeks * 7);
    const heatmap: ProductivityHeatmap[] = [];

    // Fetch all activity data
    const { data: sessions } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('started_at', startDate.toISOString());

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_completed', true)
      .gte('completed_at', startDate.toISOString());

    // Create heatmap grid (7 days x 24 hours)
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const dayHourSessions = sessions?.filter(s => {
          const date = new Date(s.start_time);
          return date.getDay() === day && date.getHours() === hour;
        }) || [];

        const dayHourTasks = tasks?.filter(t => {
          const date = new Date(t.end_time!);
          return date.getDay() === day && date.getHours() === hour;
        }) || [];

        const focusMinutes = dayHourSessions.reduce((sum, s) => sum + (s.actual_duration_minutes || 0), 0);
        const xpEarned = dayHourSessions.reduce((sum, s) => sum + (s.xp_earned || 0), 0);
        const tasksCompleted = dayHourTasks.length;

        // Calculate productivity score (0-100)
        const focusScore = Math.min(focusMinutes / 60, 1) * 40; // 0-40
        const taskScore = Math.min(tasksCompleted / 3, 1) * 40; // 0-40
        const xpScore = Math.min(xpEarned / 500, 1) * 20; // 0-20
        const productivityScore = Math.round(focusScore + taskScore + xpScore);

        heatmap.push({
          dayOfWeek: day,
          hour,
          productivityScore,
          focusMinutes,
          tasksCompleted,
          xpEarned,
        });
      }
    }

    return heatmap;
  }

  /**
   * Predict task failure probability
   */
  async predictTaskFailure(userId: string, taskId: string): Promise<TaskPrediction> {
    const { data: task } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (!task) {
      throw new Error('Task not found');
    }

    // Fetch user's historical data
    const { data: historicalTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .limit(100)
      .order('created_at', { ascending: false });

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const riskFactors: string[] = [];
    let riskScore = 0;

    // Factor 1: Task duration
    if (task.duration_minutes > 120) {
      riskFactors.push('Long duration task (>2 hours)');
      riskScore += 0.15;
    }

    // Factor 2: Time of day
    const scheduledHour = new Date(task.scheduled_date).getHours();
    const cognitivePatterns = await this.analyzeCognitiveLoadPatterns(userId, 14);
    const hourPattern = cognitivePatterns.find(p => p.hour === scheduledHour);
    
    if (hourPattern && hourPattern.energyLevel < 40) {
      riskFactors.push('Scheduled during low-energy hour');
      riskScore += 0.2;
    }

    // Factor 3: Current streak pressure
    const streak = profile?.current_streak || 0;
    if (streak > 30) {
      riskFactors.push('High streak pressure (burnout risk)');
      riskScore += 0.1;
    }

    // Factor 4: Recent completion rate
    const recentTasks = historicalTasks?.slice(0, 20) || [];
    const recentCompletionRate = recentTasks.filter(t => t.is_completed).length / recentTasks.length;
    if (recentCompletionRate < 0.6) {
      riskFactors.push('Recent low completion rate (<60%)');
      riskScore += 0.25;
    }

    // Factor 5: Task decay
    if (task.decay_level > 0) {
      riskFactors.push('Task already decaying');
      riskScore += 0.3;
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (riskScore > 0.5) {
      recommendations.push('Consider breaking this task into smaller chunks');
      recommendations.push('Schedule during your peak productivity hours');
      recommendations.push('Set up accountability check-ins');
    }
    if (task.duration_minutes > 120) {
      recommendations.push('Use Pomodoro technique (25-minute intervals)');
    }
    if (hourPattern && hourPattern.energyLevel < 40) {
      recommendations.push(`Reschedule to ${cognitivePatterns.filter(p => p.energyLevel > 80).map(p => p.hour).join(', ')} for better results`);
    }

    return {
      taskId: task.id,
      taskTitle: task.title,
      scheduledTime: task.scheduled_date,
      failureProbability: Math.min(riskScore, 0.95),
      riskFactors,
      recommendations,
      confidenceScore: Math.min(recentTasks.length / 50, 1), // More data = higher confidence
    };
  }

  /**
   * Detect burnout indicators
   */
  async detectBurnout(userId: string): Promise<BurnoutIndicators> {
    const last30Days = subDays(new Date(), 30);

    // Fetch activity data
    const { data: sessions } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('started_at', last30Days.toISOString())
      .order('started_at', { ascending: true });

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', last30Days.toISOString());

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Calculate burnout indicators
    const warnings: string[] = [];
    let burnoutScore = 0;

    // 1. Consecutive days worked
    const daysWorked = new Set(sessions?.map(s => format(new Date(s.start_time), 'yyyy-MM-dd')) || []);
    const consecutiveDaysWorked = daysWorked.size;

    if (consecutiveDaysWorked > 21) {
      warnings.push('No rest days in 3+ weeks');
      burnoutScore += 25;
    } else if (consecutiveDaysWorked > 14) {
      warnings.push('No rest days in 2+ weeks');
      burnoutScore += 15;
    }

    // 2. Average daily hours
    const totalMinutes = sessions?.reduce((sum, s) => sum + (s.actual_duration_minutes || 0), 0) || 0;
    const avgDailyHours = totalMinutes / 60 / Math.max(daysWorked.size, 1);

    if (avgDailyHours > 10) {
      warnings.push('Excessive daily work hours (>10h/day)');
      burnoutScore += 30;
    } else if (avgDailyHours > 8) {
      warnings.push('High daily work hours (>8h/day)');
      burnoutScore += 15;
    }

    // 3. Weekly hours trend
    const weeklyHours: number[] = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = subDays(new Date(), (i + 1) * 7);
      const weekEnd = subDays(new Date(), i * 7);
      const weekSessions = sessions?.filter(s => {
        const date = new Date(s.start_time);
        return date >= weekStart && date < weekEnd;
      }) || [];
      const hours = weekSessions.reduce((sum, s) => sum + (s.actual_duration_minutes || 0), 0) / 60;
      weeklyHours.unshift(hours);
    }

    const trend = weeklyHours.length > 1 && weeklyHours[weeklyHours.length - 1] > weeklyHours[0] * 1.2
      ? 'increasing'
      : weeklyHours.length > 1 && weeklyHours[weeklyHours.length - 1] < weeklyHours[0] * 0.8
      ? 'decreasing'
      : 'stable';

    if (trend === 'increasing' && avgDailyHours > 7) {
      warnings.push('Work hours steadily increasing');
      burnoutScore += 20;
    }

    // 4. Task decay rate
    const decayedTasks = tasks?.filter(t => t.decay_level > 0).length || 0;
    const taskDecayRate = decayedTasks / Math.max(tasks?.length || 1, 1);

    if (taskDecayRate > 0.3) {
      warnings.push('High task neglect rate (>30%)');
      burnoutScore += 20;
    }

    // 5. Streak pressure
    const streak = profile?.current_streak || 0;
    const streakPressure = Math.min(streak / 100, 1) * 100;

    if (streak > 50 && taskDecayRate > 0.2) {
      warnings.push('Maintaining streak at cost of quality');
      burnoutScore += 15;
    }

    // Determine risk level
    let riskLevel: 'low' | 'moderate' | 'high' | 'critical';
    if (burnoutScore < 25) riskLevel = 'low';
    else if (burnoutScore < 50) riskLevel = 'moderate';
    else if (burnoutScore < 75) riskLevel = 'high';
    else riskLevel = 'critical';

    // Generate recommendations
    const recommendations: string[] = [];
    if (consecutiveDaysWorked > 14) {
      recommendations.push('Take a complete rest day this week');
    }
    if (avgDailyHours > 8) {
      recommendations.push('Reduce daily work hours to 6-8 hours maximum');
      recommendations.push('Schedule regular breaks (5-10 minutes every hour)');
    }
    if (taskDecayRate > 0.2) {
      recommendations.push('Focus on quality over quantity - do fewer tasks better');
    }
    if (riskLevel === 'critical') {
      recommendations.push('URGENT: Take 2-3 days off to prevent burnout');
      recommendations.push('Consider consulting with a mental health professional');
    }

    const restDaysNeeded = Math.max(0, Math.ceil(burnoutScore / 25) - 1);

    return {
      burnoutScore: Math.round(burnoutScore),
      riskLevel,
      indicators: {
        consecutiveDaysWorked,
        avgDailyHours: Math.round(avgDailyHours * 10) / 10,
        weeklyHoursTrend: trend,
        taskDecayRate: Math.round(taskDecayRate * 100) / 100,
        streakPressure: Math.round(streakPressure),
        restDaysNeeded,
      },
      warnings,
      recommendations,
    };
  }

  /**
   * Comparative analysis with similar users
   */
  async compareWithCohort(userId: string): Promise<ComparativeAnalysis> {
    const weekStart = startOfWeek(new Date());
    const weekEnd = endOfWeek(new Date());

    // Get user's profile and stats
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: userSessions } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('started_at', weekStart.toISOString())
      .lte('started_at', weekEnd.toISOString());

    const { data: userTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', subDays(new Date(), 7).toISOString());

    // Calculate user metrics
    const weeklyXp = profile?.weekly_xp || 0;
    const weeklyFocusHours = (userSessions?.reduce((sum, s) => sum + (s.actual_duration_minutes || 0), 0) || 0) / 60;
    const completedTasks = userTasks?.filter(t => t.is_completed).length || 0;
    const totalTasks = userTasks?.length || 1;
    const completionRate = completedTasks / totalTasks;
    const avgTasksPerDay = completedTasks / 7;

    // Get cohort data (same league tier)
    const { data: cohortProfiles } = await supabase
      .from('profiles')
      .select('user_id, weekly_xp, current_league_tier')
      .eq('current_league_tier', profile?.current_league_tier || 0)
      .limit(100);

    // Calculate cohort averages
    const cohortSize = cohortProfiles?.length || 1;
    const cohortXp = cohortProfiles?.reduce((sum, p) => sum + (p.weekly_xp || 0), 0) || 0;
    const cohortAvgXp = cohortXp / cohortSize;

    // Estimate cohort focus hours (simplified)
    const cohortAvgFocusHours = cohortAvgXp / 50; // Rough estimate: 50 XP per hour

    // Calculate percentile
    const usersBelow = cohortProfiles?.filter(p => (p.weekly_xp || 0) < weeklyXp).length || 0;
    const percentile = Math.round((usersBelow / cohortSize) * 100);

    // Rank
    const sortedCohort = [...(cohortProfiles || [])].sort((a, b) => (b.weekly_xp || 0) - (a.weekly_xp || 0));
    const rank = sortedCohort.findIndex(p => p.user_id === userId) + 1;

    // Generate insights
    const insights: string[] = [];
    
    if (percentile >= 90) {
      insights.push('You\'re in the top 10% of your league! Exceptional performance! 🏆');
    } else if (percentile >= 75) {
      insights.push('You\'re in the top 25% - great work! Keep it up! 🌟');
    } else if (percentile >= 50) {
      insights.push('You\'re performing above average. Room for improvement! 📈');
    } else {
      insights.push('You\'re below average. Focus on consistency! 💪');
    }

    if (weeklyXp > cohortAvgXp * 1.5) {
      insights.push('Your XP is 50% higher than average - you\'re crushing it!');
    } else if (weeklyXp < cohortAvgXp * 0.7) {
      insights.push('Your XP is below cohort average - increase focus time');
    }

    if (completionRate > 0.8) {
      insights.push('Excellent task completion rate (>80%)');
    } else if (completionRate < 0.5) {
      insights.push('Low completion rate (<50%) - break tasks into smaller pieces');
    }

    return {
      userPerformance: {
        weeklyXp,
        weeklyFocusHours: Math.round(weeklyFocusHours * 10) / 10,
        completionRate: Math.round(completionRate * 100) / 100,
        avgTasksPerDay: Math.round(avgTasksPerDay * 10) / 10,
      },
      cohortAverage: {
        weeklyXp: Math.round(cohortAvgXp),
        weeklyFocusHours: Math.round(cohortAvgFocusHours * 10) / 10,
        completionRate: 0.65, // Estimated average
        avgTasksPerDay: 3.5, // Estimated average
      },
      percentile,
      rank,
      totalUsers: cohortSize,
      insights,
    };
  }

  /**
   * Generate comprehensive weekly report
   */
  async generateWeeklyReport(userId: string): Promise<WeeklyReport> {
    const weekStart = startOfWeek(new Date());
    const weekEnd = endOfWeek(new Date());

    // Gather all data
    const [
      cognitivePatterns,
      heatmap,
      burnout,
      comparative,
    ] = await Promise.all([
      this.analyzeCognitiveLoadPatterns(userId, 7),
      this.generateProductivityHeatmap(userId, 1),
      this.detectBurnout(userId),
      this.compareWithCohort(userId),
    ]);

    // Get summary data
    const { data: sessions } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('started_at', weekStart.toISOString())
      .lte('started_at', weekEnd.toISOString());

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', weekStart.toISOString());

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: achievements } = await supabase
      .from('user_achievements')
      .select('achievements(name, description)')
      .eq('user_id', userId)
      .gte('unlocked_at', weekStart.toISOString());

    // Calculate summary
    const totalXp = profile?.weekly_xp || 0;
    const totalFocusHours = (sessions?.reduce((sum, s) => sum + (s.actual_duration_minutes || 0), 0) || 0) / 60;
    const tasksCompleted = tasks?.filter(t => t.is_completed).length || 0;
    const completionRate = tasksCompleted / Math.max(tasks?.length || 1, 1);
    
    const avgProductivityScore = heatmap
      .filter(h => h.productivityScore > 0)
      .reduce((sum, h) => sum + h.productivityScore, 0) / 
      Math.max(heatmap.filter(h => h.productivityScore > 0).length, 1);

    // Top performing hours
    const topPerformingHours = cognitivePatterns
      .sort((a, b) => b.energyLevel - a.energyLevel)
      .slice(0, 5)
      .map(p => p.hour);

    // Get predictions for upcoming tasks
    const { data: upcomingTasks } = await supabase
      .from('tasks')
      .select('id')
      .eq('user_id', userId)
      .eq('is_completed', false)
      .gte('scheduled_time', new Date().toISOString())
      .limit(5);

    const predictions = await Promise.all(
      (upcomingTasks || []).map(t => this.predictTaskFailure(userId, t.id))
    );

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (burnout.riskLevel === 'high' || burnout.riskLevel === 'critical') {
      recommendations.push(`⚠️ Burnout Risk: ${burnout.riskLevel.toUpperCase()} - Take rest days!`);
    }
    
    if (comparative.percentile < 50) {
      recommendations.push('📊 Below average performance - focus on consistency');
    }
    
    const peakHours = topPerformingHours.slice(0, 3);
    recommendations.push(`⏰ Schedule important tasks at ${peakHours.join(', ')}:00`);
    
    if (completionRate < 0.6) {
      recommendations.push('✅ Improve task completion by breaking tasks into smaller chunks');
    }

    return {
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      summary: {
        totalXp,
        totalFocusHours: Math.round(totalFocusHours * 10) / 10,
        tasksCompleted,
        completionRate: Math.round(completionRate * 100) / 100,
        avgProductivityScore: Math.round(avgProductivityScore),
        streakDays: profile?.current_streak || 0,
      },
      cognitiveLoadPatterns: cognitivePatterns,
      productivityHeatmap: heatmap,
      topPerformingHours,
      burnoutAnalysis: burnout,
      predictions: predictions.filter(p => p.failureProbability > 0.3),
      comparativeAnalysis: comparative,
      achievements: achievements?.map(a => ({
        name: (a.achievements as any)?.name || 'Achievement',
        description: (a.achievements as any)?.description || '',
      })) || [],
      recommendations,
    };
  }
}

// Singleton instance
export const analyticsEngine = new AnalyticsEngine();
