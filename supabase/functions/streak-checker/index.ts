import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    // Get all users
    const { data: users, error: usersError } = await supabaseClient
      .from('profiles')
      .select('user_id, current_streak, longest_streak, last_activity_date')

    if (usersError) throw usersError

    let streaksUpdated = 0
    let streaksBroken = 0

    for (const user of users || []) {
      // Check if user had any completed tasks or focus sessions yesterday
      const { data: tasks } = await supabaseClient
        .from('tasks')
        .select('id')
        .eq('user_id', user.user_id)
        .eq('is_completed', true)
        .eq('scheduled_date', yesterdayStr)
        .limit(1)

      const { data: sessions } = await supabaseClient
        .from('focus_sessions')
        .select('id')
        .eq('user_id', user.user_id)
        .gte('start_time', yesterday.toISOString())
        .limit(1)

      const wasActive = (tasks && tasks.length > 0) || (sessions && sessions.length > 0)
      
      const lastActivity = user.last_activity_date ? new Date(user.last_activity_date) : null
      const daysSinceLastActivity = lastActivity 
        ? Math.floor((new Date().getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
        : 999

      let newStreak = user.current_streak || 0

      if (wasActive) {
        // Continue or start streak
        if (daysSinceLastActivity <= 1) {
          newStreak = (user.current_streak || 0) + 1
        } else {
          newStreak = 1
        }

        await supabaseClient
          .from('profiles')
          .update({
            current_streak: newStreak,
            longest_streak: Math.max(newStreak, user.longest_streak || 0),
            last_activity_date: yesterday.toISOString(),
          })
          .eq('user_id', user.user_id)

        streaksUpdated++
      } else if (daysSinceLastActivity > 1 && user.current_streak > 0) {
        // Break streak if more than 1 day inactive
        await supabaseClient
          .from('profiles')
          .update({ current_streak: 0 })
          .eq('user_id', user.user_id)

        streaksBroken++
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        streaksUpdated,
        streaksBroken,
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
