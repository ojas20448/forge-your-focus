-- Create function to get weekly leaderboard
CREATE OR REPLACE FUNCTION get_weekly_leaderboard(week_start timestamptz)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  weekly_xp bigint,
  rank bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.user_id,
    p.display_name,
    p.avatar_url,
    COALESCE(SUM(fs.xp_earned), 0) as weekly_xp,
    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(fs.xp_earned), 0) DESC) as rank
  FROM profiles p
  LEFT JOIN focus_sessions fs ON fs.user_id = p.user_id
    AND fs.start_time >= week_start
    AND fs.start_time < week_start + INTERVAL '7 days'
  GROUP BY p.user_id, p.display_name, p.avatar_url
  ORDER BY weekly_xp DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_weekly_leaderboard(timestamptz) TO authenticated;

-- Add weekly_xp column to profiles if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weekly_xp integer DEFAULT 0;

-- Add index for faster leaderboard queries
CREATE INDEX IF NOT EXISTS idx_profiles_total_xp ON profiles(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_start_time ON focus_sessions(user_id, start_time);
