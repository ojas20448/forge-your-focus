/**
 * Recurring Task Pattern Detection and Generation
 * Detects patterns like "daily", "every week", "monthly" and generates recurring tasks
 */

export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'weekdays' | 'weekends' | 'custom';

export interface RecurringTaskInfo {
  pattern: RecurrencePattern;
  interval?: number; // For custom patterns: every X days/weeks
  daysOfWeek?: number[]; // 0-6 for Sunday-Saturday
  dayOfMonth?: number; // For monthly patterns
  endDate?: Date;
  occurrences?: number; // How many times to repeat
}

export interface DetectedRecurrence {
  pattern: RecurrencePattern;
  confidence: number; // 0-1
  parsedFrom: string;
  interval?: number;
  daysOfWeek?: number[];
}

/**
 * Detect recurring task patterns in text
 */
export function detectRecurrence(text: string): DetectedRecurrence | null {
  const normalized = text.toLowerCase().trim();

  // Daily patterns
  if (/\b(daily|every\s+day|each\s+day|everyday)\b/.test(normalized)) {
    return { pattern: 'daily', confidence: 1, parsedFrom: 'daily' };
  }

  // Weekday patterns
  if (/\b(weekday|weekdays|every\s+weekday|monday\s+to\s+friday|mon-fri)\b/.test(normalized)) {
    return { 
      pattern: 'weekdays', 
      confidence: 0.95, 
      parsedFrom: 'weekdays',
      daysOfWeek: [1, 2, 3, 4, 5] // Mon-Fri
    };
  }

  // Weekend patterns
  if (/\b(weekend|weekends|every\s+weekend|saturday\s+and\s+sunday|sat-sun)\b/.test(normalized)) {
    return { 
      pattern: 'weekends', 
      confidence: 0.95, 
      parsedFrom: 'weekends',
      daysOfWeek: [0, 6] // Sat-Sun
    };
  }

  // Weekly patterns
  if (/\b(weekly|every\s+week|each\s+week|once\s+a\s+week)\b/.test(normalized)) {
    return { pattern: 'weekly', confidence: 1, parsedFrom: 'weekly' };
  }

  // Specific days of week (multiple)
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayShort = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const foundDays: number[] = [];

  for (let i = 0; i < dayNames.length; i++) {
    const pattern = new RegExp(`\\b(every|each)\\s+(${dayNames[i]}|${dayShort[i]})\\b`, 'i');
    if (pattern.test(normalized)) {
      foundDays.push(i);
    }
  }

  // "Monday and Wednesday" or "Mon, Wed, Fri"
  for (let i = 0; i < dayNames.length; i++) {
    if (new RegExp(`\\b${dayNames[i]}\\b`, 'i').test(normalized) || 
        new RegExp(`\\b${dayShort[i]}\\b`, 'i').test(normalized)) {
      if (!foundDays.includes(i)) {
        foundDays.push(i);
      }
    }
  }

  if (foundDays.length > 1) {
    return {
      pattern: 'custom',
      confidence: 0.9,
      parsedFrom: `${foundDays.length} days per week`,
      daysOfWeek: foundDays.sort()
    };
  }

  // "Every X days"
  const everyXDaysPattern = /\bevery\s+(\d+)\s+days?\b/i;
  const everyXDaysMatch = normalized.match(everyXDaysPattern);
  if (everyXDaysMatch) {
    const interval = parseInt(everyXDaysMatch[1]);
    return { 
      pattern: 'custom', 
      confidence: 0.95, 
      parsedFrom: `every ${interval} days`,
      interval 
    };
  }

  // "Every X weeks"
  const everyXWeeksPattern = /\bevery\s+(\d+)\s+weeks?\b/i;
  const everyXWeeksMatch = normalized.match(everyXWeeksPattern);
  if (everyXWeeksMatch) {
    const interval = parseInt(everyXWeeksMatch[1]) * 7;
    return { 
      pattern: 'custom', 
      confidence: 0.95, 
      parsedFrom: `every ${everyXWeeksMatch[1]} weeks`,
      interval 
    };
  }

  // Monthly patterns
  if (/\b(monthly|every\s+month|each\s+month|once\s+a\s+month)\b/.test(normalized)) {
    return { pattern: 'monthly', confidence: 1, parsedFrom: 'monthly' };
  }

  // "Twice a week"
  if (/\btwice\s+a\s+week\b/.test(normalized)) {
    return { 
      pattern: 'custom', 
      confidence: 0.85, 
      parsedFrom: 'twice a week',
      interval: 3 // Approximately every 3-4 days
    };
  }

  // "Three times a week"
  if (/\bthree\s+times\s+a\s+week\b/.test(normalized)) {
    return { 
      pattern: 'custom', 
      confidence: 0.85, 
      parsedFrom: 'three times a week',
      interval: 2 // Approximately every 2-3 days
    };
  }

  return null;
}

/**
 * Generate recurring task dates based on pattern
 */
export function generateRecurringDates(
  startDate: Date,
  pattern: RecurrencePattern,
  options: {
    interval?: number;
    daysOfWeek?: number[];
    occurrences?: number;
    endDate?: Date;
  } = {}
): Date[] {
  const dates: Date[] = [];
  const maxOccurrences = options.occurrences || 30; // Default to 30 occurrences
  const endDate = options.endDate || new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year default

  let currentDate = new Date(startDate);
  let count = 0;

  while (count < maxOccurrences && currentDate <= endDate) {
    switch (pattern) {
      case 'daily':
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
        count++;
        break;

      case 'weekly':
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 7);
        count++;
        break;

      case 'monthly':
        dates.push(new Date(currentDate));
        currentDate.setMonth(currentDate.getMonth() + 1);
        count++;
        break;

      case 'weekdays':
        const weekday = currentDate.getDay();
        if (weekday >= 1 && weekday <= 5) { // Mon-Fri
          dates.push(new Date(currentDate));
          count++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
        break;

      case 'weekends':
        const weekendDay = currentDate.getDay();
        if (weekendDay === 0 || weekendDay === 6) { // Sat-Sun
          dates.push(new Date(currentDate));
          count++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
        break;

      case 'custom':
        if (options.daysOfWeek && options.daysOfWeek.length > 0) {
          // Specific days of week
          const day = currentDate.getDay();
          if (options.daysOfWeek.includes(day)) {
            dates.push(new Date(currentDate));
            count++;
          }
          currentDate.setDate(currentDate.getDate() + 1);
        } else if (options.interval) {
          // Every X days
          dates.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + options.interval);
          count++;
        } else {
          // Fallback to weekly
          dates.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 7);
          count++;
        }
        break;
    }
  }

  return dates;
}

/**
 * Parse full recurring task description
 * Example: "Study physics every Monday and Wednesday for 2 hours"
 */
export interface ParsedRecurringTask {
  title: string;
  recurrence: DetectedRecurrence | null;
  duration?: number; // in minutes
}

export function parseRecurringTask(text: string): ParsedRecurringTask {
  // Extract duration if present
  let duration: number | undefined;
  const durationPattern = /(\d+)\s*(hour|hours|hr|hrs|minute|minutes|min|mins)/i;
  const durationMatch = text.match(durationPattern);
  
  if (durationMatch) {
    const amount = parseInt(durationMatch[1]);
    const unit = durationMatch[2].toLowerCase();
    duration = unit.startsWith('hour') || unit.startsWith('hr') 
      ? amount * 60 
      : amount;
  }

  // Detect recurrence
  const recurrence = detectRecurrence(text);

  // Extract title (remove recurrence and duration keywords)
  let title = text
    .replace(/\b(daily|every\s+day|each\s+day|everyday|weekly|every\s+week|monthly|every\s+month)\b/gi, '')
    .replace(/\b(weekday|weekdays|weekend|weekends|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/gi, '')
    .replace(/\b(and|to|through)\b/gi, '')
    .replace(/\bfor\s+\d+\s*(hour|hours|hr|hrs|minute|minutes|min|mins)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Capitalize first letter
  title = title.charAt(0).toUpperCase() + title.slice(1);

  return {
    title: title || 'Recurring Task',
    recurrence,
    duration,
  };
}
