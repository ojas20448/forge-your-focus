/**
 * Deadline Parser
 * Converts natural language deadlines into dates
 * Examples: "by Friday", "in 3 days", "next week", "tomorrow"
 */

import { addDays, addWeeks, addMonths, nextMonday, nextTuesday, nextWednesday, nextThursday, nextFriday, nextSaturday, nextSunday, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export interface ParsedDeadline {
  date: Date;
  confidence: number; // 0-1
  parsedFrom: string;
}

/**
 * Parse natural language deadline into a date
 */
export function parseDeadline(text: string, baseDate: Date = new Date()): ParsedDeadline | null {
  const normalized = text.toLowerCase().trim();

  // Relative days
  if (/\b(today|now)\b/.test(normalized)) {
    return { date: baseDate, confidence: 1, parsedFrom: 'today' };
  }

  if (/\b(tomorrow|tmrw|tmr)\b/.test(normalized)) {
    return { date: addDays(baseDate, 1), confidence: 1, parsedFrom: 'tomorrow' };
  }

  if (/\b(yesterday)\b/.test(normalized)) {
    return { date: addDays(baseDate, -1), confidence: 1, parsedFrom: 'yesterday' };
  }

  // "in X days/weeks/months"
  const inPattern = /\bin\s+(\d+)\s+(day|days|week|weeks|month|months|hour|hours)\b/i;
  const inMatch = normalized.match(inPattern);
  if (inMatch) {
    const amount = parseInt(inMatch[1]);
    const unit = inMatch[2].toLowerCase();
    
    if (unit.startsWith('day')) {
      return { date: addDays(baseDate, amount), confidence: 0.95, parsedFrom: `in ${amount} days` };
    }
    if (unit.startsWith('week')) {
      return { date: addWeeks(baseDate, amount), confidence: 0.95, parsedFrom: `in ${amount} weeks` };
    }
    if (unit.startsWith('month')) {
      return { date: addMonths(baseDate, amount), confidence: 0.95, parsedFrom: `in ${amount} months` };
    }
    if (unit.startsWith('hour')) {
      const hours = amount;
      return { date: new Date(baseDate.getTime() + hours * 60 * 60 * 1000), confidence: 0.9, parsedFrom: `in ${amount} hours` };
    }
  }

  // "X days/weeks from now"
  const fromPattern = /(\d+)\s+(day|days|week|weeks|month|months)\s+from\s+now/i;
  const fromMatch = normalized.match(fromPattern);
  if (fromMatch) {
    const amount = parseInt(fromMatch[1]);
    const unit = fromMatch[2].toLowerCase();
    
    if (unit.startsWith('day')) {
      return { date: addDays(baseDate, amount), confidence: 0.95, parsedFrom: `${amount} days from now` };
    }
    if (unit.startsWith('week')) {
      return { date: addWeeks(baseDate, amount), confidence: 0.95, parsedFrom: `${amount} weeks from now` };
    }
    if (unit.startsWith('month')) {
      return { date: addMonths(baseDate, amount), confidence: 0.95, parsedFrom: `${amount} months from now` };
    }
  }

  // Specific weekdays
  const dayOfWeekMap: { [key: string]: (date: Date) => Date } = {
    'monday': nextMonday,
    'tuesday': nextTuesday,
    'wednesday': nextWednesday,
    'thursday': nextThursday,
    'friday': nextFriday,
    'saturday': nextSaturday,
    'sunday': nextSunday,
  };

  // "next Monday", "by Friday", "on Thursday"
  for (const [day, fn] of Object.entries(dayOfWeekMap)) {
    const pattern = new RegExp(`\\b(next|by|on|this)\\s+${day}\\b`, 'i');
    if (pattern.test(normalized)) {
      return { date: fn(baseDate), confidence: 0.9, parsedFrom: `next ${day}` };
    }
  }

  // Just day name without prefix
  for (const [day, fn] of Object.entries(dayOfWeekMap)) {
    if (new RegExp(`\\b${day}\\b`, 'i').test(normalized)) {
      return { date: fn(baseDate), confidence: 0.75, parsedFrom: day };
    }
  }

  // "next week", "this week", "end of week"
  if (/\bnext\s+week\b/.test(normalized)) {
    return { date: addWeeks(baseDate, 1), confidence: 0.8, parsedFrom: 'next week' };
  }

  if (/\bthis\s+week\b/.test(normalized) || /\bend\s+of\s+(the\s+)?week\b/.test(normalized)) {
    return { date: endOfWeek(baseDate), confidence: 0.8, parsedFrom: 'end of this week' };
  }

  if (/\bstart\s+of\s+(the\s+)?week\b/.test(normalized)) {
    return { date: startOfWeek(baseDate), confidence: 0.8, parsedFrom: 'start of week' };
  }

  // "next month", "end of month"
  if (/\bnext\s+month\b/.test(normalized)) {
    return { date: addMonths(baseDate, 1), confidence: 0.8, parsedFrom: 'next month' };
  }

  if (/\bend\s+of\s+(the\s+)?month\b/.test(normalized)) {
    return { date: endOfMonth(baseDate), confidence: 0.8, parsedFrom: 'end of month' };
  }

  if (/\bstart\s+of\s+(the\s+)?month\b/.test(normalized)) {
    return { date: startOfMonth(baseDate), confidence: 0.8, parsedFrom: 'start of month' };
  }

  // Specific dates: "Jan 15", "January 15th", "15 Jan", "1/15", "01/15/2026"
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const monthShort = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

  // "Jan 15" or "January 15"
  for (let i = 0; i < monthNames.length; i++) {
    const fullPattern = new RegExp(`\\b${monthNames[i]}\\s+(\\d{1,2})(st|nd|rd|th)?\\b`, 'i');
    const shortPattern = new RegExp(`\\b${monthShort[i]}\\s+(\\d{1,2})(st|nd|rd|th)?\\b`, 'i');
    
    const fullMatch = normalized.match(fullPattern);
    const shortMatch = normalized.match(shortPattern);
    
    if (fullMatch || shortMatch) {
      const day = parseInt((fullMatch || shortMatch)![1]);
      const year = baseDate.getFullYear();
      const date = new Date(year, i, day);
      
      // If date is in the past, assume next year
      if (date < baseDate) {
        date.setFullYear(year + 1);
      }
      
      return { date, confidence: 0.9, parsedFrom: `${monthNames[i]} ${day}` };
    }
  }

  // "15 Jan" or "15 January"
  for (let i = 0; i < monthNames.length; i++) {
    const fullPattern = new RegExp(`\\b(\\d{1,2})(st|nd|rd|th)?\\s+${monthNames[i]}\\b`, 'i');
    const shortPattern = new RegExp(`\\b(\\d{1,2})(st|nd|rd|th)?\\s+${monthShort[i]}\\b`, 'i');
    
    const fullMatch = normalized.match(fullPattern);
    const shortMatch = normalized.match(shortPattern);
    
    if (fullMatch || shortMatch) {
      const day = parseInt((fullMatch || shortMatch)![1]);
      const year = baseDate.getFullYear();
      const date = new Date(year, i, day);
      
      if (date < baseDate) {
        date.setFullYear(year + 1);
      }
      
      return { date, confidence: 0.9, parsedFrom: `${day} ${monthNames[i]}` };
    }
  }

  // Date formats: "1/15", "01/15", "1/15/26", "01/15/2026"
  const datePattern = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/;
  const dateMatch = normalized.match(datePattern);
  if (dateMatch) {
    const month = parseInt(dateMatch[1]) - 1; // 0-indexed
    const day = parseInt(dateMatch[2]);
    let year = baseDate.getFullYear();
    
    if (dateMatch[3]) {
      year = parseInt(dateMatch[3]);
      if (year < 100) {
        year += 2000; // Assume 2000s for 2-digit years
      }
    }
    
    const date = new Date(year, month, day);
    
    // If no year provided and date is in past, assume next year
    if (!dateMatch[3] && date < baseDate) {
      date.setFullYear(year + 1);
    }
    
    return { date, confidence: 0.85, parsedFrom: `${month + 1}/${day}${dateMatch[3] ? `/${year}` : ''}` };
  }

  // No match found
  return null;
}

/**
 * Extract all deadlines from text
 */
export function extractDeadlines(text: string, baseDate: Date = new Date()): ParsedDeadline[] {
  const phrases = text.split(/[,;.!?]/).map(s => s.trim()).filter(Boolean);
  const deadlines: ParsedDeadline[] = [];

  for (const phrase of phrases) {
    const deadline = parseDeadline(phrase, baseDate);
    if (deadline && deadline.confidence >= 0.7) {
      deadlines.push(deadline);
    }
  }

  return deadlines;
}

/**
 * Find the most confident deadline in text
 */
export function findBestDeadline(text: string, baseDate: Date = new Date()): ParsedDeadline | null {
  const deadlines = extractDeadlines(text, baseDate);
  if (deadlines.length === 0) return null;
  
  // Return the one with highest confidence
  return deadlines.reduce((best, current) => 
    current.confidence > best.confidence ? current : best
  );
}
