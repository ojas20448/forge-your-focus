import { DbTask } from '@/hooks/useTasks';

export type TaskTimeCategory = 'overdue' | 'due_today' | 'due_this_week' | 'future';
export type TaskUrgency = 'critical' | 'high' | 'medium' | 'low';

/**
 * Check if a task is overdue
 */
export function isTaskOverdue(task: DbTask): boolean {
    const now = new Date();
    const scheduledDate = new Date(task.scheduled_date);
    const [hours, minutes] = task.end_time.split(':').map(Number);

    scheduledDate.setHours(hours, minutes, 0, 0);

    return scheduledDate < now && !task.is_completed;
}

/**
 * Get task urgency level
 */
export function getTaskUrgency(task: DbTask): TaskUrgency {
    if (task.is_completed) {
        return 'low';
    }

    if (isTaskOverdue(task)) {
        return 'critical';
    }

    const category = getTaskTimeCategory(task);

    if (category === 'due_today') {
        return 'high';
    }

    if (category === 'due_this_week') {
        return 'medium';
    }

    return 'low';
}

/**
 * Get time category for a task
 */
export function getTaskTimeCategory(task: DbTask): TaskTimeCategory {
    if (isTaskOverdue(task)) {
        return 'overdue';
    }

    const now = new Date();
    const scheduledDate = new Date(task.scheduled_date);

    // Reset time to start of day for comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDay = new Date(scheduledDate.getFullYear(), scheduledDate.getMonth(), scheduledDate.getDate());

    const daysDiff = Math.ceil((taskDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
        return 'due_today';
    }

    if (daysDiff <= 7) {
        return 'due_this_week';
    }

    return 'future';
}

/**
 * Sort tasks by due time (overdue first, then by scheduled time)
 */
export function sortTasksByDueTime(tasks: DbTask[]): DbTask[] {
    return [...tasks].sort((a, b) => {
        // Completed tasks go to bottom
        if (a.is_completed && !b.is_completed) return 1;
        if (!a.is_completed && b.is_completed) return -1;

        const aOverdue = isTaskOverdue(a);
        const bOverdue = isTaskOverdue(b);

        // Overdue tasks first
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;

        // Then sort by scheduled date and time
        const aDateTime = new Date(`${a.scheduled_date}T${a.start_time}`);
        const bDateTime = new Date(`${b.scheduled_date}T${b.start_time}`);

        return aDateTime.getTime() - bDateTime.getTime();
    });
}

/**
 * Check if two tasks have time conflicts
 */
export function hasTimeConflict(task1: DbTask, task2: DbTask): boolean {
    // Different days = no conflict
    if (task1.scheduled_date !== task2.scheduled_date) {
        return false;
    }

    const start1 = timeToMinutes(task1.start_time);
    const end1 = timeToMinutes(task1.end_time);
    const start2 = timeToMinutes(task2.start_time);
    const end2 = timeToMinutes(task2.end_time);

    // Check for overlap
    return (start1 < end2 && end1 > start2);
}

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Get optimal task time based on energy profile
 */
export function getOptimalTaskTime(
    task: DbTask,
    energyProfile: 'morning_lark' | 'night_owl' | 'balanced'
): { startHour: number; endHour: number; reason: string } {
    const duration = task.duration_minutes;
    const priority = task.priority || 'medium';

    // High priority tasks should be during peak hours
    if (priority === 'high') {
        switch (energyProfile) {
            case 'morning_lark':
                return { startHour: 8, endHour: 8 + Math.ceil(duration / 60), reason: 'Peak morning energy' };
            case 'night_owl':
                return { startHour: 20, endHour: 20 + Math.ceil(duration / 60), reason: 'Peak evening energy' };
            default:
                return { startHour: 10, endHour: 10 + Math.ceil(duration / 60), reason: 'Mid-morning focus time' };
        }
    }

    // Medium priority - flexible hours
    if (priority === 'medium') {
        switch (energyProfile) {
            case 'morning_lark':
                return { startHour: 10, endHour: 10 + Math.ceil(duration / 60), reason: 'Good morning hours' };
            case 'night_owl':
                return { startHour: 18, endHour: 18 + Math.ceil(duration / 60), reason: 'Good evening hours' };
            default:
                return { startHour: 14, endHour: 14 + Math.ceil(duration / 60), reason: 'Afternoon productivity' };
        }
    }

    // Low priority - off-peak hours
    switch (energyProfile) {
        case 'morning_lark':
            return { startHour: 14, endHour: 14 + Math.ceil(duration / 60), reason: 'Afternoon tasks' };
        case 'night_owl':
            return { startHour: 16, endHour: 16 + Math.ceil(duration / 60), reason: 'Pre-evening tasks' };
        default:
            return { startHour: 16, endHour: 16 + Math.ceil(duration / 60), reason: 'Late afternoon' };
    }
}

/**
 * Validate task scheduling
 */
export function validateTaskScheduling(task: {
    scheduled_date: string;
    start_time: string;
    end_time: string;
}): { isValid: boolean; error?: string } {
    const scheduledDate = new Date(task.scheduled_date);
    const now = new Date();

    // Check if date is valid
    if (isNaN(scheduledDate.getTime())) {
        return { isValid: false, error: 'Invalid date format' };
    }

    // Check if scheduling in the past
    const [startHours, startMinutes] = task.start_time.split(':').map(Number);
    const taskDateTime = new Date(scheduledDate);
    taskDateTime.setHours(startHours, startMinutes, 0, 0);

    if (taskDateTime < now) {
        return { isValid: false, error: 'Cannot schedule tasks in the past' };
    }

    // Validate start_time < end_time
    const startMinutesTotal = timeToMinutes(task.start_time);
    const endMinutesTotal = timeToMinutes(task.end_time);

    if (startMinutesTotal >= endMinutesTotal) {
        return { isValid: false, error: 'End time must be after start time' };
    }

    return { isValid: true };
}

/**
 * Get time until task starts
 */
export function getTimeUntilTask(task: DbTask): {
    hours: number;
    minutes: number;
    formattedString: string;
} {
    const now = new Date();
    const scheduledDate = new Date(task.scheduled_date);
    const [hours, minutes] = task.start_time.split(':').map(Number);

    scheduledDate.setHours(hours, minutes, 0, 0);

    const diffMs = scheduledDate.getTime() - now.getTime();

    if (diffMs < 0) {
        return { hours: 0, minutes: 0, formattedString: 'Started' };
    }

    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const totalMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    let formattedString: string;
    if (totalHours > 24) {
        const days = Math.floor(totalHours / 24);
        formattedString = `in ${days} day${days !== 1 ? 's' : ''}`;
    } else if (totalHours > 0) {
        formattedString = `in ${totalHours}h ${totalMinutes}m`;
    } else {
        formattedString = `in ${totalMinutes}m`;
    }

    return { hours: totalHours, minutes: totalMinutes, formattedString };
}

/**
 * Get urgency color for UI
 */
export function getUrgencyColor(urgency: TaskUrgency): string {
    switch (urgency) {
        case 'critical':
            return 'destructive';
        case 'high':
            return 'warning';
        case 'medium':
            return 'primary';
        case 'low':
            return 'muted';
        default:
            return 'default';
    }
}
