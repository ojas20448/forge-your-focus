import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const now = new Date()
    const overdueThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 24 hours ago
    const rottenThreshold = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) // 3 days ago

    // Get all incomplete tasks
    const { data: tasks, error: fetchError } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('is_completed', false)
      .lt('scheduled_date', now.toISOString().split('T')[0])

    if (fetchError) throw fetchError

    let updatedCount = 0

    for (const task of tasks || []) {
      const scheduledDate = new Date(task.scheduled_date)
      let newDecayLevel = task.decay_level || 0

      // Calculate decay based on how overdue the task is
      if (scheduledDate < rottenThreshold) {
        newDecayLevel = 3 // Rotten (3+ days overdue)
      } else if (scheduledDate < overdueThreshold) {
        newDecayLevel = 2 // Very overdue (1-3 days)
      } else {
        newDecayLevel = 1 // Slightly overdue
      }

      // Update task if decay level changed
      if (newDecayLevel !== task.decay_level) {
        const { error: updateError } = await supabaseClient
          .from('tasks')
          .update({
            decay_level: newDecayLevel,
            decay_started_at: task.decay_started_at || now.toISOString(),
          })
          .eq('id', task.id)

        if (!updateError) {
          updatedCount++
        }
      }
    }

    // Update user debt scores
    const { data: users, error: usersError } = await supabaseClient
      .from('profiles')
      .select('user_id')

    if (usersError) throw usersError

    for (const user of users || []) {
      const { data: userTasks } = await supabaseClient
        .from('tasks')
        .select('decay_level')
        .eq('user_id', user.user_id)
        .eq('is_completed', false)

      // Calculate debt score (0-100%)
      const decayValues = userTasks?.map(t => t.decay_level || 0) || []
      const totalDecay = decayValues.reduce((sum, val) => sum + val, 0)
      const maxPossibleDecay = decayValues.length * 3 // Max decay per task is 3
      const debtScore = maxPossibleDecay > 0
        ? Math.round((totalDecay / maxPossibleDecay) * 100)
        : 0

      await supabaseClient
        .from('profiles')
        .update({ debt_score: debtScore })
        .eq('user_id', user.user_id)
    }

    return new Response(
      JSON.stringify({
        success: true,
        tasksUpdated: updatedCount,
        timestamp: now.toISOString(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
