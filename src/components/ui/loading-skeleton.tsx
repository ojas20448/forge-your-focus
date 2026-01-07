import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

// Full page loading spinner
export const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Task card skeleton
export const TaskSkeleton = () => (
  <div className="ml-14 mr-4 p-4 rounded-xl bg-card border border-border/50">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="w-16 h-6 rounded-full" />
    </div>
    <div className="flex items-center gap-3">
      <Skeleton className="w-12 h-4" />
      <Skeleton className="w-16 h-4" />
    </div>
  </div>
);

// Timeline skeleton with multiple tasks
export const TimelineSkeleton = () => (
  <div className="space-y-3 px-4 py-6">
    {[...Array(4)].map((_, i) => (
      <TaskSkeleton key={i} />
    ))}
  </div>
);

// Goal card skeleton
export const GoalSkeleton = () => (
  <div className="p-4 rounded-xl bg-card border border-border/50">
    <div className="flex items-start justify-between mb-3">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="w-12 h-5 rounded-full" />
    </div>
    <Skeleton className="h-3 w-full mb-3" />
    <Skeleton className="h-2 w-full rounded-full" />
  </div>
);

// Goals screen skeleton
export const GoalsScreenSkeleton = () => (
  <div className="min-h-screen bg-background pb-24">
    <header className="sticky top-0 bg-background/95 backdrop-blur-xl border-b border-border z-20">
      <div className="flex items-center justify-between px-4 py-4">
        <Skeleton className="h-7 w-20" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </div>
    </header>
    <div className="px-4 py-4">
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
    <div className="px-4 py-2 space-y-3">
      {[...Array(3)].map((_, i) => (
        <GoalSkeleton key={i} />
      ))}
    </div>
  </div>
);

// Raids screen skeleton
export const RaidsSkeleton = () => (
  <div className="min-h-screen bg-background pb-24">
    <header className="sticky top-0 bg-background/95 backdrop-blur-xl border-b border-border z-20 px-4 py-4">
      <Skeleton className="h-7 w-20" />
    </header>
    <div className="p-4 space-y-4">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="p-4 rounded-xl bg-card border border-border/50">
          <Skeleton className="h-6 w-3/4 mb-3" />
          <Skeleton className="h-3 w-full mb-4" />
          <Skeleton className="h-4 w-full rounded-full mb-4" />
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1 rounded-md" />
            <Skeleton className="h-9 flex-1 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Achievement skeleton
export const AchievementSkeleton = () => (
  <div className="p-4 rounded-xl bg-card border border-border/50">
    <div className="flex items-center gap-3">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <div className="flex-1">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  </div>
);

// Stats bar skeleton
export const StatsBarSkeleton = () => (
  <div className="flex items-center gap-4 px-4 py-3 overflow-x-auto">
    {[...Array(4)].map((_, i) => (
      <Skeleton key={i} className="h-16 w-20 rounded-xl flex-shrink-0" />
    ))}
  </div>
);
