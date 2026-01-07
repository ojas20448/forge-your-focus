// Enhanced achievements system with diverse categories
// Includes streak, social, milestone, and special achievements

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'streak' | 'social' | 'milestone' | 'task' | 'focus' | 'special';
  icon: string;
  xp_reward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  condition: {
    type: string;
    value: number;
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'alltime';
  };
  unlocked: boolean;
  progress: number;
  unlocked_at?: string;
}

export const achievementsData: Achievement[] = [
  // Streak Achievements
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: 'Complete 7 days in a row',
    category: 'streak',
    icon: '🔥',
    xp_reward: 100,
    rarity: 'common',
    condition: { type: 'streak', value: 7, timeframe: 'alltime' },
    unlocked: false,
    progress: 0,
  },
  {
    id: 'streak_30',
    title: 'Month Master',
    description: 'Complete 30 days in a row',
    category: 'streak',
    icon: '⚡',
    xp_reward: 500,
    rarity: 'rare',
    condition: { type: 'streak', value: 30, timeframe: 'alltime' },
    unlocked: false,
    progress: 0,
  },
  {
    id: 'streak_100',
    title: 'Century Champion',
    description: 'Complete 100 days in a row',
    category: 'streak',
    icon: '💯',
    xp_reward: 2000,
    rarity: 'epic',
    condition: { type: 'streak', value: 100, timeframe: 'alltime' },
    unlocked: false,
    progress: 0,
  },
  {
    id: 'streak_365',
    title: 'Year of Excellence',
    description: 'Complete 365 days in a row',
    category: 'streak',
    icon: '👑',
    xp_reward: 10000,
    rarity: 'legendary',
    condition: { type: 'streak', value: 365, timeframe: 'alltime' },
    unlocked: false,
    progress: 0,
  },

  // Social Achievements
  {
    id: 'social_first_friend',
    title: 'Social Butterfly',
    description: 'Add your first friend',
    category: 'social',
    icon: '🤝',
    xp_reward: 50,
    rarity: 'common',
    condition: { type: 'friends_count', value: 1 },
    unlocked: false,
    progress: 0,
  },
  {
    id: 'social_5_friends',
    title: 'Circle Builder',
    description: 'Have 5 active friends',
    category: 'social',
    icon: '👥',
    xp_reward: 150,
    rarity: 'common',
    condition: { type: 'friends_count', value: 5 },
    unlocked: false,
    progress: 0,
  },
  {
    id: 'social_first_challenge',
    title: 'Challenger',
    description: 'Complete your first friend challenge',
    category: 'social',
    icon: '⚔️',
    xp_reward: 200,
    rarity: 'rare',
    condition: { type: 'challenges_completed', value: 1 },
    unlocked: false,
    progress: 0,
  },
  {
    id: 'social_challenge_winner',
    title: 'Champion',
    description: 'Win 5 friend challenges',
    category: 'social',
    icon: '🏆',
    xp_reward: 500,
    rarity: 'epic',
    condition: { type: 'challenges_won', value: 5 },
    unlocked: false,
    progress: 0,
  },
  {
    id: 'social_first_raid',
    title: 'Team Player',
    description: 'Complete your first raid',
    category: 'social',
    icon: '🛡️',
    xp_reward: 150,
    rarity: 'common',
    condition: { type: 'raids_completed', value: 1 },
    unlocked: false,
    progress: 0,
  },
  {
    id: 'social_raid_legend',
    title: 'Raid Legend',
    description: 'Complete 50 raids',
    category: 'social',
    icon: '⚡',
    xp_reward: 1000,
    rarity: 'epic',
    condition: { type: 'raids_completed', value: 50 },
    unlocked: false,
    progress: 0,
  },
  {
    id: 'social_leaderboard_top10',
    title: 'Rising Star',
    description: 'Reach top 10 in global leaderboard',
    category: 'social',
    icon: '🌟',
    xp_reward: 1500,
    rarity: 'epic',
    condition: { type: 'leaderboard_rank', value: 10 },
    unlocked: false,
    progress: 0,
  },
  {
    id: 'social_leaderboard_top1',
    title: 'Number One',
    description: 'Reach #1 in global leaderboard',
    category: 'social',
    icon: '🥇',
    xp_reward: 5000,
    rarity: 'legendary',
    condition: { type: 'leaderboard_rank', value: 1 },
    unlocked: false,
    progress: 0,
  },

  // Milestone Achievements
  {
    id: 'milestone_level_10',
    title: 'Apprentice',
    description: 'Reach level 10',
    category: 'milestone',
    icon: '📚',
    xp_reward: 200,
    rarity: 'common',
    condition: { type: 'level', value: 10 },
    unlocked: false,
    progress: 0,
  },
  {
    id: 'milestone_level_25',
    title: 'Adept',
    description: 'Reach level 25',
    category: 'milestone',
    icon: '🎓',
    xp_reward: 500,
    rarity: 'rare',
    condition: { type: 'level', value: 25 },
    unlocked: false,
    progress: 0,
  },
  {
    id: 'milestone_level_50',
    title: 'Master',
    description: 'Reach level 50',
    category: 'milestone',
    icon: '🔮',
    xp_reward: 1500,
    rarity: 'epic',
    condition: { type: 'level', value: 50 },
    unlocked: false,
    progress: 0,
  },
  {
    id: 'milestone_level_100',
    title: 'Legend',
    description: 'Reach level 100',
    category: 'milestone',
    icon: '💎',
    xp_reward: 5000,
    rarity: 'legendary',
    condition: { type: 'level', value: 100 },
    unlocked: false,
    progress: 0,
  },
  {
    id: 'milestone_xp_10k',
    title: 'XP Collector',
    description: 'Earn 10,000 total XP',
    category: 'milestone',
    icon: '💰',
    xp_reward: 300,
    rarity: 'common',
    condition: { type: 'total_xp', value: 10000 },
    unlocked: false,
    progress: 0,
  },
  {
    id: 'milestone_xp_100k',
    title: 'XP Millionaire',
    description: 'Earn 100,000 total XP',
    category: 'milestone',
    icon: '💸',
    xp_reward: 3000,
    rarity: 'epic',
    condition: { type: 'total_xp', value: 100000 },
    unlocked: false,
    progress: 0,
  },

  // Task Achievements
  {
    id: 'task_first_complete',
    title: 'First Steps',
    description: 'Complete your first task',
    category: 'task',
    icon: '✅',
    xp_reward: 25,
    rarity: 'common',
    condition: { type: 'tasks_completed', value: 1 },
    unlocked: false,
    progress: 0,
  },
  {
    id: 'task_100_complete',
    title: 'Task Crusher',
    description: 'Complete 100 tasks',
    category: 'task',
    icon: '💪',
    xp_reward: 500,
    rarity: 'rare',
    condition: { type: 'tasks_completed', value: 100 },
    unlocked: false,
    progress: 0,
  },
  {
    id: 'task_perfect_day',
    title: 'Perfect Day',
    description: 'Complete all tasks in a single day',
    category: 'task',
    icon: '🌟',
    xp_reward: 200,
    rarity: 'rare',
    condition: { type: 'perfect_days', value: 1 },
    unlocked: false,
    progress: 0,
  },
  {
    id: 'task_no_decay',
    title: 'Zero Tolerance',
    description: 'Complete 30 days without any rotten tasks',
    category: 'task',
    icon: '🛡️',
    xp_reward: 800,
    rarity: 'epic',
    condition: { type: 'days_no_rotten', value: 30 },
    unlocked: false,
    progress: 0,
  },

  // Focus Achievements
  {
    id: 'focus_10_hours',
    title: 'Focused Beginner',
    description: 'Complete 10 hours of verified focus',
    category: 'focus',
    icon: '🎯',
    xp_reward: 200,
    rarity: 'common',
    condition: { type: 'focus_hours', value: 10 },
    unlocked: false,
    progress: 0,
  },
  {
    id: 'focus_100_hours',
    title: 'Concentration King',
    description: 'Complete 100 hours of verified focus',
    category: 'focus',
    icon: '🧠',
    xp_reward: 1000,
    rarity: 'rare',
    condition: { type: 'focus_hours', value: 100 },
    unlocked: false,
    progress: 0,
  },
  {
    id: 'focus_1000_hours',
    title: 'Deep Work Master',
    description: 'Complete 1000 hours of verified focus',
    category: 'focus',
    icon: '🔥',
    xp_reward: 5000,
    rarity: 'legendary',
    condition: { type: 'focus_hours', value: 1000 },
    unlocked: false,
    progress: 0,
  },
  {
    id: 'focus_perfect_score',
    title: 'Perfect Focus',
    description: 'Maintain 100% verification score for 1 hour',
    category: 'focus',
    icon: '💯',
    xp_reward: 300,
    rarity: 'rare',
    condition: { type: 'perfect_focus_sessions', value: 1 },
    unlocked: false,
    progress: 0,
  },
  {
    id: 'focus_marathon',
    title: 'Marathon Focus',
    description: 'Complete a 4-hour focus session',
    category: 'focus',
    icon: '🏃',
    xp_reward: 500,
    rarity: 'epic',
    condition: { type: 'longest_session_minutes', value: 240 },
    unlocked: false,
    progress: 0,
  },

  // Special Achievements
  {
    id: 'special_early_bird',
    title: 'Early Bird',
    description: 'Start 10 tasks before 6 AM',
    category: 'special',
    icon: '🌅',
    xp_reward: 300,
    rarity: 'rare',
    condition: { type: 'early_starts', value: 10 },
    unlocked: false,
    progress: 0,
  },
  {
    id: 'special_night_owl',
    title: 'Night Owl',
    description: 'Complete 10 tasks after 10 PM',
    category: 'special',
    icon: '🦉',
    xp_reward: 300,
    rarity: 'rare',
    condition: { type: 'late_completions', value: 10 },
    unlocked: false,
    progress: 0,
  },
  {
    id: 'special_weekend_warrior',
    title: 'Weekend Warrior',
    description: 'Complete 20 tasks on weekends',
    category: 'special',
    icon: '🎖️',
    xp_reward: 400,
    rarity: 'rare',
    condition: { type: 'weekend_tasks', value: 20 },
    unlocked: false,
    progress: 0,
  },
  {
    id: 'special_comeback',
    title: 'Comeback Kid',
    description: 'Rebuild a 7-day streak after losing it',
    category: 'special',
    icon: '🔄',
    xp_reward: 500,
    rarity: 'epic',
    condition: { type: 'streak_comebacks', value: 1 },
    unlocked: false,
    progress: 0,
  },
  {
    id: 'special_beta_tester',
    title: 'Beta Hero',
    description: 'Use the app during beta period',
    category: 'special',
    icon: '🚀',
    xp_reward: 1000,
    rarity: 'legendary',
    condition: { type: 'beta_user', value: 1 },
    unlocked: false,
    progress: 0,
  },
];

/**
 * Get achievements by category
 */
export function getAchievementsByCategory(category: Achievement['category']): Achievement[] {
  return achievementsData.filter(a => a.category === category);
}

/**
 * Get achievements by rarity
 */
export function getAchievementsByRarity(rarity: Achievement['rarity']): Achievement[] {
  return achievementsData.filter(a => a.rarity === rarity);
}

/**
 * Calculate total possible XP from achievements
 */
export function getTotalAchievementXP(): number {
  return achievementsData.reduce((sum, a) => sum + a.xp_reward, 0);
}

/**
 * Get achievement progress percentage
 */
export function getAchievementProgress(achievement: Achievement): number {
  return Math.min(100, (achievement.progress / achievement.condition.value) * 100);
}
