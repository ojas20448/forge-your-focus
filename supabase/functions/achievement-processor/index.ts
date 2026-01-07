import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all achievements
    const { data: achievements, error: achievementsError } = await supabaseClient
      .from('achievements')
      .select('*')

    if (achievementsError) throw achievementsError

    // Get all users
    const { data: users, error: usersError } = await supabaseClient
      .from('profiles')
      .select('user_id, total_xp, current_streak')

    if (usersError) throw usersError

    let achievementsUnlocked = 0

    for (const user of users || []) {
      // Get user's already unlocked achievements
      const { data: unlocked } = await supabaseClient
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', user.user_id)

      const unlockedIds = new Set(unlocked?.map(ua => ua.achievement_id) || [])

      // Get user stats for checking requirements
      const { data: sessionStats } = await supabaseClient
        .from('focus_sessions')
        .select('id')
        .eq('user_id', user.user_id)

      const { data: taskStats } = await supabaseClient
        .from('tasks')
        .select('id')
        .eq('user_id', user.user_id)
        .eq('is_completed', true)

      // Check each achievement
      for (const achievement of achievements || []) {
        // Skip if already unlocked
        if (unlockedIds.has(achievement.id)) continue

        let current = 0

        switch (achievement.requirement_type) {
          case 'total_xp':
            current = user.total_xp || 0
            break
          case 'streak_days':
            current = user.current_streak || 0
            break
          case 'focus_sessions':
            current = sessionStats?.length || 0
            break
          case 'tasks_completed':
            current = taskStats?.length || 0
            break
        }

        // Check if achievement should be unlocked
        if (current >= achievement.requirement_value) {
          // Unlock achievement
          const { error: unlockError } = await supabaseClient
            .from('user_achievements')
            .insert({
              user_id: user.user_id,
              achievement_id: achievement.id,
            })

          if (!unlockError) {
            // Award XP
            const newTotalXp = (user.total_xp || 0) + achievement.xp_reward
            const newLevel = Math.floor(newTotalXp / 100) + 1

            await supabaseClient
              .from('profiles')
              .update({
                total_xp: newTotalXp,
                level: newLevel,
              })
              .eq('user_id', user.user_id)

            achievementsUnlocked++
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        achievementsUnlocked,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
