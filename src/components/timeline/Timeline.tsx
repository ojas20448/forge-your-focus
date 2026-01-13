import React from 'react';
import { Task } from '@/types/focusforge';
import { TimeSpine, TimeMarker } from './TimeSpine';
import { TaskBlock } from './TaskBlock';
import { BreakBlock } from './BreakBlock';

interface TimelineProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ tasks, onTaskClick }) => {
  // Calculate current time percentage (6am to 11pm = 17 hours)
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const dayStartHour = 6;
  const dayEndHour = 23;
  const totalDayMinutes = (dayEndHour - dayStartHour) * 60;
  const currentMinutes = (hours - dayStartHour) * 60 + minutes;
  const currentTimePercent = Math.max(0, Math.min(100, (currentMinutes / totalDayMinutes) * 100));

  // Generate time markers
  const timeMarkers = [];
  for (let hour = dayStartHour; hour <= dayEndHour; hour += 2) {
    const time = `${hour.toString().padStart(2, '0')}:00`;
    timeMarkers.push({
      time,
      isCurrentHour: hour === hours || hour === hours - 1,
    });
  }

  // Sort tasks by start time
  const sortedTasks = [...tasks].sort((a, b) =>
    a.suggested_block.start.localeCompare(b.suggested_block.start)
  );

  // Check if there should be a break between tasks
  const getBreakBetweenTasks = (currentTask: Task, nextTask: Task) => {
    const currentEnd = currentTask.suggested_block.end;
    const nextStart = nextTask.suggested_block.start;

    if (currentEnd < nextStart) {
      const [currentEndHour, currentEndMin] = currentEnd.split(':').map(Number);
      const [nextStartHour, nextStartMin] = nextStart.split(':').map(Number);
      const breakDuration = (nextStartHour * 60 + nextStartMin) - (currentEndHour * 60 + currentEndMin);

      if (breakDuration >= 5 && breakDuration <= 30) {
        return {
          duration: breakDuration,
          startTime: currentEnd,
          endTime: nextStart,
        };
      }
    }
    return null;
  };

  return (
    <div className="relative px-4 py-6 min-h-[600px]">
      {/* Time spine */}
      <TimeSpine currentTimePercent={currentTimePercent} />

      {/* Timeline content */}
      <div className="space-y-3">
        {sortedTasks.map((task, index) => (
          <React.Fragment key={task.id}>
            {/* Time marker before task */}
            {(index === 0 || sortedTasks[index - 1].suggested_block.end !== task.suggested_block.start) && (
              <div className="flex items-center">
                <span className="text-xs font-mono-time w-10 text-right text-muted-foreground">
                  {task.suggested_block.start}
                </span>
                <div className="w-2 h-2 ml-3 rounded-full bg-primary/50" />
              </div>
            )}

            {/* Task block */}
            <TaskBlock task={task} onTaskClick={onTaskClick} />

            {/* Break between tasks */}
            {index < sortedTasks.length - 1 && (
              (() => {
                const breakInfo = getBreakBetweenTasks(task, sortedTasks[index + 1]);
                if (breakInfo) {
                  return (
                    <BreakBlock
                      duration={breakInfo.duration}
                      startTime={breakInfo.startTime}
                      endTime={breakInfo.endTime}
                    />
                  );
                }
                return null;
              })()
            )}
          </React.Fragment>
        ))}

        {/* Empty state */}
        {sortedTasks.length === 0 && (
          <div className="ml-14 mr-4 py-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No tasks yet</h3>
            <p className="text-sm text-muted-foreground max-w-[200px]">
              Tap the + button to add your first task
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
