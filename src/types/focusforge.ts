export type TaskStatus = 'pending' | 'active' | 'completed' | 'rotten' | 'violated';
export type TaskType = 'study' | 'deepwork' | 'physical' | 'manifestation' | 'break';
export type EnergyProfile = 'morning_lark' | 'night_owl' | 'balanced';
export type GoalType = 'year' | 'month' | 'week';

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  duration_min: number;
  priority: 'low' | 'medium' | 'high';
  decay_level: number; // 0-3, 3 = fully rotten
  suggested_block: {
    start: string; // "09:00"
    end: string; // "10:30"
  };
  verification_required: boolean;
  linked_goal_id?: string;
  goal_alignment_score: number; // 0-1
  subtasks?: SubTask[];
  xp_earned?: number;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  type: GoalType;
  title: string;
  description?: string;
  target_date: string;
  progress_percent: number;
  is_active: boolean;
  parent_goal_id?: string;
  monthly_milestones?: string[];
  vision_board_ids?: string[];
  health_score: number; // 0-100
  required_weekly_hours?: number;
}

export interface UserStats {
  total_xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  league: 'bronze' | 'silver' | 'gold' | 'diamond';
  league_rank: number;
  efficiency_multiplier: number;
  manifestation_streak: number;
  weekly_focus_hours: number;
  weekly_goal_hours: number;
  energy_profile: EnergyProfile;
  debt_score: number; // 0-100, higher = more overdue tasks
}

export interface UserProfile {
  energy_profile: EnergyProfile;
  peak_hours: { start: number; end: number }; // 0-23 hours
  low_energy_hours: { start: number; end: number };
}

export interface DayStatus {
  date: string;
  completed_sessions: number;
  violations: number;
  rotten_tasks: number;
  rituals_completed: number;
  total_focus_minutes: number;
}

export interface ManifestationSession {
  id: string;
  type: 'affirmation' | 'visualization' | 'journaling';
  duration_min: number;
  completed: boolean;
  scheduled_time: string;
  xp_awarded: number;
}
