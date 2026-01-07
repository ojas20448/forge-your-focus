import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { BottomNavigation, TabId } from '@/components/layout/BottomNavigation';
import { DateStrip } from '@/components/dashboard/DateStrip';
import { StatsBar } from '@/components/dashboard/StatsBar';
import { GoalOverviewCard } from '@/components/dashboard/GoalOverviewCard';
import { Timeline } from '@/components/timeline/Timeline';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { CameraStatusBubble } from '@/components/CameraStatusBubble';
import { FocusSessionScreen } from '@/components/focus/FocusSessionScreen';
import { GoalsScreen } from '@/components/goals/GoalsScreen';
import { GoalPlannerScreen } from '@/components/goals/GoalPlannerScreen';
import { ManifestationScreen } from '@/components/manifestation/ManifestationScreen';
import { RaidsScreen } from '@/components/raids/RaidsScreen';
import { StatsScreen } from '@/components/stats/StatsScreen';
import { SettingsScreen } from '@/components/settings/SettingsScreen';
import { AchievementsScreen } from '@/components/achievements/AchievementsScreen';
import { AISchedulerModal } from '@/components/scheduler/AISchedulerModal';
import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';
import { DailyCheckinModal } from '@/components/checkin/DailyCheckinModal';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { mockDayStatuses } from '@/data/mockData';
import { Task, TaskStatus, TaskType } from '@/types/focusforge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useTasks, DbTask } from '@/hooks/useTasks';
import { useGoals } from '@/hooks/useGoals';
import { useDailyCheckin } from '@/hooks/useDailyCheckin';
import { useTaskDecay } from '@/hooks/useTaskDecay';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const ONBOARDING_KEY = 'focusforge_onboarded';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  
  const [hasOnboarded, setHasOnboarded] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ONBOARDING_KEY) === 'true';
    }
    return false;
  });
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(null);
  const [showGoalPlanner, setShowGoalPlanner] = useState(false);
  const [showSchedulerModal, setShowSchedulerModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { toast } = useToast();

  // Fetch tasks and goals from database
  const { tasks: dbTasks, loading: tasksLoading, refetch: refetchTasks } = useTasks(selectedDate);
  const { goals, yearGoals, loading: goalsLoading } = useGoals();
  const { hasCheckedInToday, loading: checkinLoading } = useDailyCheckin();
  const { checkAndApplyDecay } = useTaskDecay();

  // Check for decayed tasks on mount
  useEffect(() => {
    if (user && !tasksLoading) {
      checkAndApplyDecay();
    }
  }, [user, tasksLoading, checkAndApplyDecay]);

  // Show daily check-in modal if not checked in today
  useEffect(() => {
    if (!checkinLoading && !hasCheckedInToday && hasOnboarded && user) {
      // Small delay to let the app load first
      const timer = setTimeout(() => {
        setShowCheckinModal(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [checkinLoading, hasCheckedInToday, hasOnboarded, user]);

  // Convert DB tasks to UI Task format
  const tasks: Task[] = dbTasks.map(dbTask => ({
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description || '',
    type: 'deepwork' as TaskType,
    status: (dbTask.is_completed ? 'completed' : 'pending') as TaskStatus,
    duration_min: dbTask.duration_minutes,
    priority: (dbTask.priority || 'medium') as 'low' | 'medium' | 'high',
    decay_level: dbTask.decay_level || 0,
    suggested_block: {
      start: dbTask.start_time.slice(0, 5),
      end: dbTask.end_time.slice(0, 5),
    },
    verification_required: false,
    linked_goal_id: dbTask.goal_id || undefined,
    goal_alignment_score: dbTask.goal_id ? 0.8 : 0,
    xp_earned: dbTask.xp_reward || 0,
  }));

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const hour = new Date().getHours();
  const timeOfDay = hour < 10 ? 'morning' : hour < 18 ? 'midday' : 'evening';
  const hasActiveTask = tasks.some(t => t.status === 'active');

  // Build user stats from profile
  const userStats = {
    total_xp: profile?.total_xp || 0,
    level: profile?.level || 1,
    current_streak: profile?.current_streak || 0,
    longest_streak: profile?.longest_streak || 0,
    league: 'bronze' as const,
    league_rank: 1,
    efficiency_multiplier: 1,
    manifestation_streak: 0,
    weekly_focus_hours: 0,
    weekly_goal_hours: 0,
    energy_profile: 'balanced' as const,
    debt_score: 0,
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setHasOnboarded(true);
    toast({ 
      title: "Welcome to FocusForge!", 
      description: "Your journey to peak productivity begins now." 
    });
  };

  // Show loading state
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  const handleTaskClick = (task: Task) => {
    // Open task detail modal instead of immediately starting focus
    setSelectedTask(task);
  };

  const handleStartFocusFromDetail = () => {
    if (selectedTask && (selectedTask.status === 'pending' || selectedTask.status === 'active')) {
      setActiveFocusTask(selectedTask);
      setSelectedTask(null);
    }
  };

  const handleFABAction = (action: string) => {
    if (action === 'focus' || action === 'focus-now') {
      const pendingTask = tasks.find(t => t.status === 'pending' || t.status === 'active');
      if (pendingTask) setActiveFocusTask(pendingTask);
      else {
        toast({ title: "No tasks", description: "Create a task first to start focusing." });
      }
    } else if (action === 'plan') {
      setShowSchedulerModal(true);
    } else {
      toast({ title: "Daily Review", description: "Feature coming soon..." });
    }
  };

  const handleTasksGenerated = () => {
    refetchTasks();
    toast({ title: "Tasks Added", description: "New tasks have been added to your schedule!" });
  };

  // Onboarding Screen
  if (!hasOnboarded) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  // Focus Session Screen (full screen takeover)
  if (activeFocusTask) {
    return (
      <FocusSessionScreen
        task={activeFocusTask}
        onEnd={(xpEarned) => {
          setActiveFocusTask(null);
          refetchTasks();
          toast({ title: "Session ended", description: `+${xpEarned} XP earned!` });
        }}
        onPause={() => {}}
      />
    );
  }

  // Goal Planner Screen (full screen)
  if (showGoalPlanner) {
    return <GoalPlannerScreen onBack={() => setShowGoalPlanner(false)} />;
  }

  // Main Tab Content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'goals':
        return (
          <ErrorBoundary>
            <GoalsScreen onOpenPlanner={() => setShowGoalPlanner(true)} />
          </ErrorBoundary>
        );
      case 'raids':
        return (
          <ErrorBoundary>
            <RaidsScreen />
          </ErrorBoundary>
        );
      case 'stats':
        return (
          <ErrorBoundary>
            <AchievementsScreen />
          </ErrorBoundary>
        );
      case 'settings':
        return (
          <ErrorBoundary>
            <SettingsScreen />
          </ErrorBoundary>
        );
      default:
        return (
          <>
            <CameraStatusBubble isActive={hasActiveTask} isValid={true} />
            <header className="px-4 pt-4 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground tracking-tight">
                    Focus<span className="text-primary">Forge</span>
                  </h1>
                  <p className="text-xs text-muted-foreground font-medium">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                  <span className="text-xs font-bold text-primary font-mono-time">LVL {userStats.level}</span>
                </div>
              </div>
            </header>
            <DateStrip selectedDate={selectedDate} onDateSelect={setSelectedDate} dayStatuses={mockDayStatuses} />
            <StatsBar stats={userStats} />
            {yearGoals.length > 0 && (
              <GoalOverviewCard 
                yearGoal={{
                  id: yearGoals[0].id,
                  type: 'year',
                  title: yearGoals[0].title,
                  description: yearGoals[0].description || '',
                  target_date: yearGoals[0].target_date || '',
                  progress_percent: yearGoals[0].progress || 0,
                  is_active: yearGoals[0].is_active ?? true,
                  health_score: 70,
                }} 
                nextMilestone="Complete current milestone" 
                daysUntilMilestone={30} 
              />
            )}
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Today's Timeline</h2>
              <span className="text-xs text-muted-foreground font-mono-time">
                {tasks.filter(t => t.status === 'completed').length}/{tasks.length} completed
              </span>
            </div>
            {tasksLoading ? (
              <div className="space-y-3 px-4 py-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="ml-14 mr-4 p-4 rounded-xl bg-card border border-border/50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="h-5 w-3/4 bg-secondary/50 rounded mb-2 animate-pulse" />
                        <div className="h-3 w-1/2 bg-secondary/50 rounded animate-pulse" />
                      </div>
                      <div className="w-16 h-6 bg-secondary/50 rounded-full animate-pulse" />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-4 bg-secondary/50 rounded animate-pulse" />
                      <div className="w-16 h-4 bg-secondary/50 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Timeline tasks={tasks} onTaskClick={handleTaskClick} />
            )}
            <FloatingActionButton timeOfDay={timeOfDay} onAction={handleFABAction} />
          </>
        );
    }
  };

  return (
    <MobileLayout showNav={false}>
      {renderTabContent()}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <AISchedulerModal 
        isOpen={showSchedulerModal} 
        onClose={() => setShowSchedulerModal(false)}
        onTasksGenerated={handleTasksGenerated}
        energyProfile={userStats.energy_profile}
        goals={goals.map(g => ({ title: g.title, id: g.id }))}
        selectedDate={selectedDate}
      />
      <DailyCheckinModal 
        isOpen={showCheckinModal}
        onClose={() => setShowCheckinModal(false)}
      />
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => {
            setSelectedTask(null);
            refetchTasks();
          }}
          onStartFocus={handleStartFocusFromDetail}
        />
      )}
    </MobileLayout>
  );
};

export default Index;
