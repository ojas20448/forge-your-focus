// Boss Battle System - Weekly boss raids with HP tracking, abilities, and loot
// Collaborative gameplay where users team up to defeat powerful bosses

import { supabase } from '@/integrations/supabase/client';
import { hapticFeedback } from './hapticFeedback';

export interface BossAbility {
  id: string;
  name: string;
  description: string;
  damage: number;
  cooldown: number;
}

export interface BossPhase {
  phase: number;
  hpThreshold: number;
  abilities: BossAbility[];
  description: string;
}

export interface Boss {
  id: string;
  name: string;
  description: string;
  total_hp: number;
  current_hp: number;
  level: number;
  image_url?: string;
  phases: BossPhase[];
  loot_pool: BossLoot[];
  current_phase: number;
  last_ability_time?: string;
}

export interface BossLoot {
  type: 'xp_multiplier' | 'theme' | 'power_up' | 'avatar' | 'badge';
  name: string;
  description: string;
  value: number | string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  dropChance: number;
}

export interface BossBattle {
  id: string;
  boss_id: string;
  started_at: string;
  ends_at: string;
  status: 'active' | 'completed' | 'failed';
  participants: string[];
  damage_dealt: Record<string, number>;
  current_hp: number;
  total_hp: number;
}

export interface BossAttack {
  user_id: string;
  damage: number;
  timestamp: string;
  focus_minutes: number;
}

class BossBattleManager {
  private BOSS_TEMPLATES: Boss[] = [
    {
      id: 'procrastination_demon',
      name: 'Procrastination Demon',
      description: 'A shadowy beast that feeds on wasted time and broken promises',
      total_hp: 100000,
      current_hp: 100000,
      level: 1,
      current_phase: 1,
      phases: [
        {
          phase: 1,
          hpThreshold: 100,
          description: 'The demon awakens, tempting you with distractions',
          abilities: [
            {
              id: 'distraction_wave',
              name: 'Distraction Wave',
              description: 'Reduces all participants\' XP gain by 20% for 1 hour',
              damage: 0,
              cooldown: 3600000, // 1 hour
            },
          ],
        },
        {
          phase: 2,
          hpThreshold: 60,
          description: 'Enraged! The demon summons addictive content',
          abilities: [
            {
              id: 'distraction_wave',
              name: 'Distraction Wave',
              description: 'Reduces all participants\' XP gain by 20% for 1 hour',
              damage: 0,
              cooldown: 3600000,
            },
            {
              id: 'time_drain',
              name: 'Time Drain',
              description: 'Steals 30 minutes from everyone\'s focus time',
              damage: 5000,
              cooldown: 7200000, // 2 hours
            },
          ],
        },
        {
          phase: 3,
          hpThreshold: 30,
          description: 'FINAL FORM! The demon unleashes its full power',
          abilities: [
            {
              id: 'distraction_wave',
              name: 'Distraction Wave',
              description: 'Reduces all participants\' XP gain by 20% for 1 hour',
              damage: 0,
              cooldown: 3600000,
            },
            {
              id: 'time_drain',
              name: 'Time Drain',
              description: 'Steals 30 minutes from everyone\'s focus time',
              damage: 5000,
              cooldown: 7200000,
            },
            {
              id: 'motivation_steal',
              name: 'Motivation Steal',
              description: 'Requires double focus time to deal damage',
              damage: 10000,
              cooldown: 10800000, // 3 hours
            },
          ],
        },
      ],
      loot_pool: [
        {
          type: 'xp_multiplier',
          name: '2x XP Weekend',
          description: 'Double XP for all tasks for 48 hours',
          value: 2,
          rarity: 'epic',
          dropChance: 0.3,
        },
        {
          type: 'theme',
          name: 'Demon Slayer Theme',
          description: 'Exclusive dark red and black theme',
          value: 'demon_slayer',
          rarity: 'rare',
          dropChance: 0.5,
        },
        {
          type: 'power_up',
          name: 'Focus Shield',
          description: 'Prevents task decay for 7 days',
          value: 7,
          rarity: 'rare',
          dropChance: 0.4,
        },
        {
          type: 'badge',
          name: 'Demon Slayer',
          description: 'Proof you defeated the Procrastination Demon',
          value: 'demon_slayer_badge',
          rarity: 'legendary',
          dropChance: 1.0,
        },
      ],
    },
    {
      id: 'burnout_dragon',
      name: 'Burnout Dragon',
      description: 'A fire-breathing monster that drains energy and motivation',
      total_hp: 150000,
      current_hp: 150000,
      level: 2,
      current_phase: 1,
      phases: [
        {
          phase: 1,
          hpThreshold: 100,
          description: 'The dragon breathes exhausting flames',
          abilities: [
            {
              id: 'energy_drain',
              name: 'Energy Drain',
              description: 'Reduces streak multiplier by 50% for 2 hours',
              damage: 0,
              cooldown: 7200000,
            },
          ],
        },
        {
          phase: 2,
          hpThreshold: 60,
          description: 'The dragon\'s flames intensify!',
          abilities: [
            {
              id: 'energy_drain',
              name: 'Energy Drain',
              description: 'Reduces streak multiplier by 50% for 2 hours',
              damage: 0,
              cooldown: 7200000,
            },
            {
              id: 'burnout_roar',
              name: 'Burnout Roar',
              description: 'Increases task decay rate for 24 hours',
              damage: 8000,
              cooldown: 14400000, // 4 hours
            },
          ],
        },
        {
          phase: 3,
          hpThreshold: 20,
          description: 'ENRAGED! The dragon enters a fury',
          abilities: [
            {
              id: 'energy_drain',
              name: 'Energy Drain',
              description: 'Reduces streak multiplier by 50% for 2 hours',
              damage: 0,
              cooldown: 7200000,
            },
            {
              id: 'burnout_roar',
              name: 'Burnout Roar',
              description: 'Increases task decay rate for 24 hours',
              damage: 8000,
              cooldown: 14400000,
            },
            {
              id: 'inferno',
              name: 'Inferno',
              description: 'Massive damage - requires 2 hours of focus to counter',
              damage: 20000,
              cooldown: 21600000, // 6 hours
            },
          ],
        },
      ],
      loot_pool: [
        {
          type: 'xp_multiplier',
          name: '3x XP Boost',
          description: 'Triple XP for 24 hours',
          value: 3,
          rarity: 'legendary',
          dropChance: 0.2,
        },
        {
          type: 'theme',
          name: 'Dragon Warrior Theme',
          description: 'Exclusive fire and gold theme',
          value: 'dragon_warrior',
          rarity: 'epic',
          dropChance: 0.4,
        },
        {
          type: 'power_up',
          name: 'Eternal Focus',
          description: '50% XP bonus for all tasks for 14 days',
          value: 14,
          rarity: 'epic',
          dropChance: 0.35,
        },
        {
          type: 'avatar',
          name: 'Dragon Slayer Avatar',
          description: 'Exclusive avatar frame with flames',
          value: 'dragon_slayer_avatar',
          rarity: 'legendary',
          dropChance: 1.0,
        },
      ],
    },
  ];

  /**
   * Start a new weekly boss battle
   */
  async startWeeklyBoss(bossTemplateId?: string): Promise<BossBattle | null> {
    // Select random boss or use specified template
    const template = bossTemplateId 
      ? this.BOSS_TEMPLATES.find(b => b.id === bossTemplateId)
      : this.BOSS_TEMPLATES[Math.floor(Math.random() * this.BOSS_TEMPLATES.length)];

    if (!template) return null;

    const now = new Date();
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create boss instance
    const { data: boss, error: bossError } = await supabase
      .from('bosses')
      .insert({
        name: template.name,
        description: template.description,
        total_hp: template.total_hp,
        current_hp: template.total_hp,
        level: template.level,
        phases: template.phases,
        loot_pool: template.loot_pool,
        current_phase: 1,
      })
      .select()
      .single();

    if (bossError || !boss) {
      console.error('Failed to create boss:', bossError);
      return null;
    }

    // Create battle
    const { data: battle, error: battleError } = await supabase
      .from('boss_battles')
      .insert({
        boss_id: boss.id,
        started_at: now.toISOString(),
        ends_at: endDate.toISOString(),
        status: 'active',
        participants: [],
        damage_dealt: {},
        current_hp: template.total_hp,
        total_hp: template.total_hp,
      })
      .select()
      .single();

    if (battleError) {
      console.error('Failed to create battle:', battleError);
      return null;
    }

    console.log(`Boss battle started: ${template.name}`);
    return battle;
  }

  /**
   * Attack boss with focus time
   */
  async attackBoss(
    battleId: string,
    userId: string,
    focusMinutes: number
  ): Promise<{ damage: number; newHp: number; phaseChanged: boolean } | null> {
    // Get battle info
    const { data: battle } = await supabase
      .from('boss_battles')
      .select('*, bosses(*)')
      .eq('id', battleId)
      .single();

    if (!battle || battle.status !== 'active') return null;

    // Calculate damage (1 minute of focus = 100 damage)
    const baseDamage = focusMinutes * 100;
    const damage = Math.floor(baseDamage);

    // Update battle
    const newHp = Math.max(0, battle.current_hp - damage);
    const damageDealt = { ...battle.damage_dealt };
    damageDealt[userId] = (damageDealt[userId] || 0) + damage;

    // Add participant if not already in
    const participants = battle.participants.includes(userId)
      ? battle.participants
      : [...battle.participants, userId];

    // Check for phase transition
    const boss = battle.bosses;
    const hpPercent = (newHp / battle.total_hp) * 100;
    let newPhase = boss.current_phase;
    let phaseChanged = false;

    for (const phase of boss.phases) {
      if (hpPercent <= phase.hpThreshold && phase.phase > newPhase) {
        newPhase = phase.phase;
        phaseChanged = true;
      }
    }

    // Update battle
    await supabase
      .from('boss_battles')
      .update({
        current_hp: newHp,
        damage_dealt: damageDealt,
        participants,
        status: newHp === 0 ? 'completed' : 'active',
      })
      .eq('id', battleId);

    // Update boss phase if changed
    if (phaseChanged) {
      await supabase
        .from('bosses')
        .update({ current_phase: newPhase })
        .eq('id', boss.id);

      await hapticFeedback.trigger('heavy');
    }

    // Check if boss is defeated
    if (newHp === 0) {
      await this.defeatBoss(battleId, boss.id, participants);
    }

    // Record attack
    await supabase.from('boss_attacks').insert({
      battle_id: battleId,
      user_id: userId,
      damage,
      focus_minutes: focusMinutes,
      timestamp: new Date().toISOString(),
    });

    return { damage, newHp, phaseChanged };
  }

  /**
   * Handle boss defeat and distribute loot
   */
  private async defeatBoss(
    battleId: string,
    bossId: string,
    participants: string[]
  ): Promise<void> {
    console.log(`Boss defeated! Distributing loot to ${participants.length} participants`);

    // Get boss loot pool
    const { data: boss } = await supabase
      .from('bosses')
      .select('loot_pool')
      .eq('id', bossId)
      .single();

    if (!boss || !boss.loot_pool) return;

    // Distribute loot to each participant
    const lootPromises = participants.map(async (userId) => {
      const droppedLoot: BossLoot[] = [];

      // Roll for each loot item
      for (const loot of boss.loot_pool) {
        const roll = Math.random();
        if (roll <= loot.dropChance) {
          droppedLoot.push(loot);

          // Award loot to user
          await supabase.from('user_loot').insert({
            user_id: userId,
            loot_type: loot.type,
            loot_name: loot.name,
            loot_value: loot.value,
            rarity: loot.rarity,
            obtained_at: new Date().toISOString(),
          });

          // Apply immediate effects
          if (loot.type === 'xp_multiplier') {
            // Set XP multiplier in user profile
            await supabase
              .from('profiles')
              .update({
                xp_multiplier: loot.value,
                xp_multiplier_expires_at: new Date(
                  Date.now() + (typeof loot.value === 'number' ? loot.value * 24 * 60 * 60 * 1000 : 0)
                ).toISOString(),
              })
              .eq('user_id', userId);
          }
        }
      }

      console.log(`User ${userId} received ${droppedLoot.length} loot items`);
      return droppedLoot;
    });

    await Promise.all(lootPromises);
    await hapticFeedback.trigger('achievement');
  }

  /**
   * Get active boss battle
   */
  async getActiveBattle(): Promise<BossBattle | null> {
    const { data, error } = await supabase
      .from('boss_battles')
      .select('*, bosses(*)')
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return data;
  }

  /**
   * Get boss battle leaderboard
   */
  async getBattleLeaderboard(battleId: string): Promise<Array<{
    user_id: string;
    username: string;
    damage: number;
    rank: number;
  }>> {
    const { data: battle } = await supabase
      .from('boss_battles')
      .select('damage_dealt, participants')
      .eq('id', battleId)
      .single();

    if (!battle) return [];

    // Convert damage_dealt object to array
    const leaderboard = Object.entries(battle.damage_dealt || {})
      .map(([userId, damage]) => ({ user_id: userId, damage: damage as number }))
      .sort((a, b) => b.damage - a.damage);

    // Fetch usernames
    const enriched = await Promise.all(
      leaderboard.map(async (entry, index) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', entry.user_id)
          .single();

        return {
          ...entry,
          username: profile?.display_name || 'Anonymous',
          rank: index + 1,
        };
      })
    );

    return enriched;
  }

  /**
   * Trigger boss ability (automated or manual)
   */
  async triggerBossAbility(bossId: string, abilityId: string): Promise<void> {
    const { data: boss } = await supabase
      .from('bosses')
      .select('*')
      .eq('id', bossId)
      .single();

    if (!boss) return;

    const currentPhase = boss.phases.find((p: BossPhase) => p.phase === boss.current_phase);
    if (!currentPhase) return;

    const ability = currentPhase.abilities.find((a: BossAbility) => a.id === abilityId);
    if (!ability) return;

    // Check cooldown
    const lastUse = boss.last_ability_time ? new Date(boss.last_ability_time).getTime() : 0;
    const now = Date.now();
    if (now - lastUse < ability.cooldown) return;

    // Update last ability time
    await supabase
      .from('bosses')
      .update({ last_ability_time: new Date().toISOString() })
      .eq('id', bossId);

    console.log(`Boss used ${ability.name}!`);
    await hapticFeedback.trigger('warning');

    // TODO: Apply ability effects to participants
  }

  /**
   * Get user's battle stats
   */
  async getUserBattleStats(userId: string): Promise<{
    totalDamage: number;
    battlesParticipated: number;
    bossesDefeated: number;
    lootCollected: number;
  }> {
    // Get all battles user participated in
    const { data: battles } = await supabase
      .from('boss_battles')
      .select('damage_dealt, status')
      .contains('participants', [userId]);

    if (!battles) {
      return { totalDamage: 0, battlesParticipated: 0, bossesDefeated: 0, lootCollected: 0 };
    }

    const totalDamage = battles.reduce((sum, b) => sum + (b.damage_dealt[userId] || 0), 0);
    const battlesParticipated = battles.length;
    const bossesDefeated = battles.filter(b => b.status === 'completed').length;

    // Get loot count
    const { data: loot } = await supabase
      .from('user_loot')
      .select('id')
      .eq('user_id', userId);

    return {
      totalDamage,
      battlesParticipated,
      bossesDefeated,
      lootCollected: loot?.length || 0,
    };
  }
}

// Singleton instance
export const bossBattleManager = new BossBattleManager();
