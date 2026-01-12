import { DbGoal } from '@/hooks/useGoals';

export type GoalStatus = 'overdue' | 'active' | 'upcoming' | 'completed';
export type GoalUrgency = 'high' | 'medium' | 'low';

/**
 * Get the status of a goal based on its target date and progress
 */
export function getGoalStatus(goal: DbGoal): GoalStatus {
    if (goal.progress !== null && goal.progress >= 100) {
        return 'completed';
    }

    if (!goal.target_date) {
        return 'active';
    }

    const now = new Date();
    const targetDate = new Date(goal.target_date);
    const daysUntilTarget = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Overdue if past target date
    if (daysUntilTarget < 0) {
        return 'overdue';
    }

    // Upcoming if more than 7 days away
    if (daysUntilTarget > 7) {
        return 'upcoming';
    }

    // Active if within 7 days
    return 'active';
}

/**
 * Check if a goal is overdue
 */
export function isGoalOverdue(goal: DbGoal): boolean {
    return getGoalStatus(goal) === 'overdue';
}

/**
 * Get time remaining until goal target date
 */
export function getTimeRemaining(targetDate: string | null): {
    days: number;
    hours: number;
    isOverdue: boolean;
    formattedString: string;
} {
    if (!targetDate) {
        return { days: 0, hours: 0, isOverdue: false, formattedString: 'No deadline' };
    }

    const now = new Date();
    const target = new Date(targetDate);
    const diffMs = target.getTime() - now.getTime();
    const isOverdue = diffMs < 0;
    const absDiffMs = Math.abs(diffMs);

    const days = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((absDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    let formattedString: string;
    if (isOverdue) {
        if (days > 0) {
            formattedString = `Overdue by ${days} day${days !== 1 ? 's' : ''}`;
        } else {
            formattedString = `Overdue by ${hours} hour${hours !== 1 ? 's' : ''}`;
        }
    } else {
        if (days > 0) {
            formattedString = `${days} day${days !== 1 ? 's' : ''} remaining`;
        } else if (hours > 0) {
            formattedString = `${hours} hour${hours !== 1 ? 's' : ''} remaining`;
        } else {
            formattedString = 'Due very soon';
        }
    }

    return { days, hours, isOverdue, formattedString };
}

/**
 * Calculate expected progress based on time elapsed
 */
export function getProgressBasedOnTime(goal: DbGoal): {
    expectedProgress: number;
    actualProgress: number;
    isOnTrack: boolean;
    variance: number;
} {
    if (!goal.target_date || !goal.created_at) {
        return {
            expectedProgress: 0,
            actualProgress: goal.progress || 0,
            isOnTrack: true,
            variance: 0,
        };
    }

    const now = new Date();
    const created = new Date(goal.created_at);
    const target = new Date(goal.target_date);

    const totalDuration = target.getTime() - created.getTime();
    const elapsed = now.getTime() - created.getTime();

    // Calculate expected progress (0-100%)
    const expectedProgress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    const actualProgress = goal.progress || 0;
    const variance = actualProgress - expectedProgress;

    // On track if within 10% of expected progress
    const isOnTrack = Math.abs(variance) <= 10;

    return {
        expectedProgress: Math.round(expectedProgress),
        actualProgress,
        isOnTrack,
        variance: Math.round(variance),
    };
}

/**
 * Get urgency level of a goal
 */
export function getGoalUrgency(goal: DbGoal): GoalUrgency {
    const status = getGoalStatus(goal);

    if (status === 'overdue') {
        return 'high';
    }

    if (status === 'completed') {
        return 'low';
    }

    if (!goal.target_date) {
        return 'medium';
    }

    const timeRemaining = getTimeRemaining(goal.target_date);

    // High urgency if less than 3 days remaining
    if (timeRemaining.days < 3) {
        return 'high';
    }

    // Medium urgency if less than 7 days
    if (timeRemaining.days < 7) {
        return 'medium';
    }

    return 'low';
}

/**
 * Validate if a goal date is valid (in the future)
 */
export function isValidGoalDate(targetDate: string): {
    isValid: boolean;
    error?: string;
} {
    const target = new Date(targetDate);
    const now = new Date();

    // Check if date is valid
    if (isNaN(target.getTime())) {
        return { isValid: false, error: 'Invalid date format' };
    }

    // Check if date is in the past
    if (target < now) {
        return { isValid: false, error: 'Target date must be in the future' };
    }

    // Warn if date is very soon (less than 1 day)
    const hoursUntilTarget = (target.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilTarget < 24) {
        return { isValid: true, error: 'Warning: Goal target is less than 24 hours away' };
    }

    return { isValid: true };
}

/**
 * Get status badge color
 */
export function getGoalStatusColor(status: GoalStatus): string {
    switch (status) {
        case 'overdue':
            return 'destructive';
        case 'active':
            return 'warning';
        case 'upcoming':
            return 'success';
        case 'completed':
            return 'muted';
        default:
            return 'default';
    }
}
