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
import { AISchedulerModal } from '@/components/scheduler/AISchedulerModal';
import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen';
import { mockDayStatuses } from '@/data/mockData';
import { Task, TaskStatus, TaskType } from '@/types/focusforge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useTasks, DbTask } from '@/hooks/useTasks';
import { useGoals } from '@/hooks/useGoals';
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
  const { toast } = useToast();

  // Fetch tasks and goals from database
  const { tasks: dbTasks, loading: tasksLoading, refetch: refetchTasks } = useTasks(selectedDate);
  const { goals, yearGoals, loading: goalsLoading } = useGoals();

  // Convert DB tasks to UI Task format
  const tasks: Task[] = dbTasks.map(dbTask => ({
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description || '',
    type: 'deepwork' as TaskType,
    status: (dbTask.is_completed ? 'completed' : 'pending') as TaskStatus,
    duration_min: dbTask.duration_minutes,
    priority: (dbTask.priority || 'medium') as 'low' | 'medium' | 'high',
    decay_level: 0,
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
    if (task.status === 'pending' || task.status === 'active') {
      setActiveFocusTask(task);
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
        return <GoalsScreen onOpenPlanner={() => setShowGoalPlanner(true)} />;
      case 'raids':
        return <RaidsScreen />;
      case 'stats':
        return <StatsScreen />;
      case 'settings':
        return <SettingsScreen />;
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
            <Timeline tasks={tasks} onTaskClick={handleTaskClick} />
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
    </MobileLayout>
  );
};

export default Index;
