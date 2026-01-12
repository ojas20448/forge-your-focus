// Gemini AI Integration for Smart Scheduling
// Free tier: 15 requests per minute, 1500 per day

interface GeminiConfig {
  apiKey: string;
  model?: string;
}

interface SchedulingRequest {
  userInput: string;
  energyProfile: 'morning_lark' | 'night_owl' | 'balanced';
  existingTasks: Array<{ title: string; time: string }>;
  goals: Array<{ title: string }>;
  currentTime: string;
}

interface GeneratedTask {
  title: string;
  description: string;
  duration: number;
  priority: 'low' | 'medium' | 'high';
  suggestedTime: string;
  taskType: 'study' | 'deepwork' | 'physical' | 'manifestation' | 'break';
  linkedGoal?: string;
  reasoning: string;
}

class GeminiScheduler {
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor(config: GeminiConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'gemini-flash-latest'; // Latest available model with quota
  }

  /**
   * Generate smart task schedule from natural language input
   */
  async generateSchedule(request: SchedulingRequest): Promise<GeneratedTask[]> {
    const prompt = this.buildPrompt(request);

    try {
      const response = await fetch(
        `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const textResponse = data.candidates[0].content.parts[0].text;

      // Parse JSON response
      const jsonMatch = textResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      const tasks: GeneratedTask[] = JSON.parse(jsonMatch[0]);
      return tasks;
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  /**
   * Build prompt for Gemini with context
   */
  private buildPrompt(request: SchedulingRequest): string {
    const peakHours = this.getPeakHours(request.energyProfile);

    return `You are an AI productivity coach for Xecute. Parse the user's request and create an optimized task schedule.

USER INPUT: "${request.userInput}"

CONTEXT:
- Energy Profile: ${request.energyProfile}
- Peak Hours: ${peakHours}
- Current Time: ${request.currentTime}
- Existing Tasks: ${JSON.stringify(request.existingTasks)}
- Active Goals: ${request.goals.map(g => g.title).join(', ')}

RULES:
1. Schedule high-priority tasks during peak energy hours
2. Include breaks every 90-120 minutes
3. Estimate realistic durations (study: 45-120min, workout: 30-60min)
4. Link tasks to goals when relevant
5. Avoid scheduling conflicts
6. Consider cognitive load (alternate heavy and light tasks)

OUTPUT FORMAT (JSON array):
[
  {
    "title": "Task name",
    "description": "Brief description",
    "duration": 90,
    "priority": "high" | "medium" | "low",
    "suggestedTime": "HH:MM - HH:MM",
    "taskType": "study" | "deepwork" | "physical" | "manifestation" | "break",
    "linkedGoal": "Goal name or null",
    "reasoning": "Why scheduled at this time"
  }
]

Return ONLY the JSON array, no markdown or extra text.`;
  }

  /**
   * Get peak hours based on energy profile
   */
  private getPeakHours(profile: string): string {
    switch (profile) {
      case 'morning_lark':
        return '6 AM - 12 PM';
      case 'night_owl':
        return '6 PM - 12 AM';
      default:
        return '9 AM - 5 PM';
    }
  }

  /**
   * Quick task parsing without full schedule generation (faster, uses less tokens)
   */
  async parseQuickTask(userInput: string): Promise<{ title: string; duration: number; priority: string }> {
    const prompt = `Extract task info from: "${userInput}"
Return JSON: {"title": "...", "duration": minutes, "priority": "high/medium/low"}`;

    try {
      const response = await fetch(
        `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 256 },
          }),
        }
      );

      const data = await response.json();
      const textResponse = data.candidates[0].content.parts[0].text;
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('Failed to parse task');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      // Fallback parsing
      return {
        title: userInput,
        duration: 60,
        priority: 'medium'
      };
    }
  }
}

/**
 * Generate milestone plan for a year goal using AI
 */
export async function generateMilestonePlan(
  goalTitle: string,
  goalDescription: string,
  targetDate: string,
  weeklyHours: number,
  apiKey: string
): Promise<Array<{ month: string; title: string; requiredHours: number }>> {
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    throw new Error('Gemini API key not configured');
  }

  const monthsUntilTarget = Math.ceil(
    (new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)
  );

  const prompt = `You are an AI coach for Xecute helping break down long-term goals into actionable milestones.

GOAL: ${goalTitle}
DESCRIPTION: ${goalDescription}
TARGET DATE: ${targetDate}
AVAILABLE TIME: ${weeklyHours} hours/week
TIMELINE: ${monthsUntilTarget} months

Create a realistic milestone breakdown. Each milestone should:
1. Be achievable in ~1 month
2. Build on previous milestones
3. Have specific, measurable outcomes
4. Distribute ${weeklyHours}hrs/week effectively

Return JSON array:
[
  {
    "month": "Jan 2026",
    "title": "Specific milestone name",
    "requiredHours": 40
  }
]

Return ONLY the JSON array, no markdown.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error:', response.status, errorData);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Validate response structure
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid API response structure:', data);
      throw new Error('Invalid response from Gemini API');
    }

    const textResponse = data.candidates[0].content.parts[0].text;
    const jsonMatch = textResponse.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      console.error('Failed to parse JSON from response:', textResponse);
      throw new Error('Failed to parse milestone plan from AI response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error generating milestone plan:', error);
    throw error;
  }
}

/**
 * Get AI coaching message based on user's progress
 */
export async function getCoachingMessage(
  context: {
    currentStreak: number;
    todayProgress: number;
    activeGoals: number;
    recentAchievements: string[];
  },
  apiKey: string
): Promise<string> {
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    return "Keep pushing! You're doing great! 💪";
  }

  const prompt = `You are a motivational AI coach for Xecute. Give a SHORT, energizing message (max 15 words).

USER STATUS:
- Streak: ${context.currentStreak} days
- Today's progress: ${context.todayProgress}%
- Active goals: ${context.activeGoals}
- Recent wins: ${context.recentAchievements.join(', ') || 'None yet'}

Give ONE sentence of motivation. Be specific to their situation. Use emojis. Be encouraging but not pushy.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 128 },
        }),
      }
    );

    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim().replace(/"/g, '');
  } catch (error) {
    console.error('Error getting coaching message:', error);
    return "Stay focused and execute! 🎯";
  }
}

/**
 * Suggest tasks based on current goals and energy level
 */
export async function suggestNextTasks(
  goals: Array<{ title: string; progress: number }>,
  energyLevel: 'high' | 'medium' | 'low',
  currentTime: string,
  apiKey: string
): Promise<Array<{ title: string; duration: number; reason: string }>> {
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    return [];
  }

  const prompt = `You are an AI productivity assistant for Xecute. Suggest 3 tasks for RIGHT NOW.

CONTEXT:
- Current time: ${currentTime}
- Energy level: ${energyLevel}
- Active goals: ${JSON.stringify(goals)}

RULES:
- High energy = challenging tasks
- Medium energy = moderate tasks
- Low energy = easy wins or learning
- Consider time of day
- Link to goals

Return JSON:
[
  {
    "title": "Specific task name",
    "duration": 45,
    "reason": "Why now (10 words max)"
  }
]

Return ONLY JSON array.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
        }),
      }
    );

    const data = await response.json();
    const textResponse = data.candidates[0].content.parts[0].text;
    const jsonMatch = textResponse.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      return [];
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error suggesting tasks:', error);
    return [];
  }
}

// Factory function to create scheduler instance
export const createGeminiScheduler = (apiKey: string): GeminiScheduler => {
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    throw new Error('Gemini API key not configured. Add VITE_GEMINI_API_KEY to .env file');
  }
  return new GeminiScheduler({ apiKey });
};

// Export types
export type { GeminiScheduler, GeneratedTask, SchedulingRequest };
