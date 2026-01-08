-- Migration: Manifestation Features
-- Description: Add manifestation streak tracking and affirmation sessions

-- Add manifestation streak to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS manifestation_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_manifestation_date DATE;

-- Create affirmation sessions table
CREATE TABLE IF NOT EXISTS affirmation_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  session_type TEXT CHECK (session_type IN ('affirmation', 'visualization', 'journaling')),
  duration_minutes INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_affirmation_sessions_user_id ON affirmation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_affirmation_sessions_completed_at ON affirmation_sessions(completed_at);
CREATE INDEX IF NOT EXISTS idx_affirmation_sessions_type ON affirmation_sessions(session_type);

-- Create journal entries table (if not exists)
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'quick_journal' CHECK (type IN ('quick_journal', 'full_entry', 'gratitude', 'reflection')),
  mood TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for journal entries
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON journal_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_journal_entries_type ON journal_entries(type);

-- Create storage bucket for vision board images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('vision-board', 'vision-board', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on affirmation_sessions
ALTER TABLE affirmation_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for affirmation_sessions
CREATE POLICY "Users can view their own affirmation sessions"
  ON affirmation_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own affirmation sessions"
  ON affirmation_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Enable RLS on journal_entries
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for journal_entries
CREATE POLICY "Users can view their own journal entries"
  ON journal_entries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own journal entries"
  ON journal_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries"
  ON journal_entries
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries"
  ON journal_entries
  FOR DELETE
  USING (auth.uid() = user_id);

-- Storage policies for vision board bucket
CREATE POLICY "Users can upload vision board images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'vision-board' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own vision board images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'vision-board' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own vision board images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'vision-board' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to update manifestation streak
CREATE OR REPLACE FUNCTION update_manifestation_streak()
RETURNS TRIGGER AS $$
BEGIN
  -- If last manifestation was yesterday, increment streak
  IF (SELECT last_manifestation_date FROM profiles WHERE user_id = NEW.user_id) = CURRENT_DATE - INTERVAL '1 day' THEN
    UPDATE profiles 
    SET manifestation_streak = manifestation_streak + 1,
        last_manifestation_date = CURRENT_DATE
    WHERE user_id = NEW.user_id;
  -- If last manifestation was today, don't change streak
  ELSIF (SELECT last_manifestation_date FROM profiles WHERE user_id = NEW.user_id) = CURRENT_DATE THEN
    -- Do nothing
    NULL;
  -- Otherwise reset streak to 1
  ELSE
    UPDATE profiles 
    SET manifestation_streak = 1,
        last_manifestation_date = CURRENT_DATE
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update manifestation streak when affirmation session is completed
CREATE TRIGGER update_manifestation_streak_trigger
  AFTER INSERT ON affirmation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_manifestation_streak();

-- Comment on tables
COMMENT ON TABLE affirmation_sessions IS 'Tracks completed manifestation sessions (affirmations, visualizations, journaling)';
COMMENT ON TABLE journal_entries IS 'User journal entries for reflection and gratitude';
COMMENT ON COLUMN profiles.manifestation_streak IS 'Current consecutive days of manifestation practice';
COMMENT ON COLUMN profiles.last_manifestation_date IS 'Last date user completed a manifestation session';
