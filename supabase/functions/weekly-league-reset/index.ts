import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all users with their XP
    const { data: users, error: usersError } = await supabaseClient
      .from('profiles')
      .select('user_id, total_xp, current_league_tier')

    if (usersError) throw usersError

    // Get all leagues
    const { data: leagues, error: leaguesError } = await supabaseClient
      .from('leagues')
      .select('*')
      .order('min_xp', { ascending: true })

    if (leaguesError) throw leaguesError

    // Reset weekly stats (if needed - implementation depends on schema)
    // For example: reset weekly_xp to 0 for all users
    const { error: resetError } = await supabaseClient
      .from('profiles')
      .update({ weekly_xp: 0 })

    if (resetError) throw resetError

    // Update league tiers based on current XP
    let promotions = 0
    let demotions = 0

    for (const user of users || []) {
      // Find appropriate league
      const newLeague = leagues?.find(
        league => user.total_xp >= league.min_xp && user.total_xp <= league.max_xp
      )

      if (newLeague && newLeague.tier !== user.current_league_tier) {
        await supabaseClient
          .from('profiles')
          .update({ current_league_tier: newLeague.tier })
          .eq('user_id', user.user_id)

        // Record in history
        await supabaseClient
          .from('user_league_history')
          .insert({
            user_id: user.user_id,
            league_id: newLeague.id,
            xp_at_entry: user.total_xp,
          })

        if (newLeague.tier > (user.current_league_tier || 0)) {
          promotions++
        } else {
          demotions++
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        usersProcessed: users?.length || 0,
        promotions,
        demotions,
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
