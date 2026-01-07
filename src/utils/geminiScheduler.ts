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
    this.model = config.model || 'gemini-1.5-flash'; // Free tier model
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
    
    return `You are an AI productivity coach for FocusForge. Parse the user's request and create an optimized task schedule.

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

// Factory function to create scheduler instance
export const createGeminiScheduler = (apiKey: string): GeminiScheduler => {
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    throw new Error('Gemini API key not configured. Add VITE_GEMINI_API_KEY to .env file');
  }
  return new GeminiScheduler({ apiKey });
};

// Export types
export type { GeminiScheduler, GeneratedTask, SchedulingRequest };
