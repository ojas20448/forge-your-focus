-- Create achievements table
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  xp_reward INTEGER DEFAULT 50,
  requirement_type TEXT NOT NULL, -- 'streak', 'focus_hours', 'tasks_completed', 'raids_joined'
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_achievements junction table
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Create daily_checkins table for streak tracking
CREATE TABLE public.daily_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  focus_minutes INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, checkin_date)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

-- Achievements are viewable by everyone
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);

-- User achievements policies
CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can unlock achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Daily checkins policies
CREATE POLICY "Users can view their own checkins" ON public.daily_checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own checkins" ON public.daily_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own checkins" ON public.daily_checkins FOR UPDATE USING (auth.uid() = user_id);

-- Enable realtime for raids and raid_members
ALTER PUBLICATION supabase_realtime ADD TABLE public.raids;
ALTER PUBLICATION supabase_realtime ADD TABLE public.raid_members;

-- Function to calculate and update user streaks
CREATE OR REPLACE FUNCTION public.update_user_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  consecutive_days INTEGER := 0;
  check_date DATE;
  has_checkin BOOLEAN;
BEGIN
  -- Start from yesterday and count backwards
  check_date := CURRENT_DATE - INTERVAL '1 day';
  
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM daily_checkins 
      WHERE user_id = NEW.user_id 
      AND checkin_date = check_date
    ) INTO has_checkin;
    
    IF has_checkin THEN
      consecutive_days := consecutive_days + 1;
      check_date := check_date - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;
    
    -- Safety limit
    IF consecutive_days > 365 THEN EXIT; END IF;
  END LOOP;
  
  -- Add 1 for today's checkin
  consecutive_days := consecutive_days + 1;
  
  -- Update profile with new streak
  UPDATE profiles 
  SET 
    current_streak = consecutive_days,
    longest_streak = GREATEST(longest_streak, consecutive_days),
    updated_at = now()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to update streak on checkin
CREATE TRIGGER on_daily_checkin
  AFTER INSERT ON public.daily_checkins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_streak();

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION public.check_achievements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  achievement_record RECORD;
  user_value INTEGER;
BEGIN
  FOR achievement_record IN SELECT * FROM achievements LOOP
    -- Skip if already unlocked
    IF EXISTS (
      SELECT 1 FROM user_achievements 
      WHERE user_id = NEW.user_id AND achievement_id = achievement_record.id
    ) THEN
      CONTINUE;
    END IF;
    
    -- Check requirement based on type
    CASE achievement_record.requirement_type
      WHEN 'streak' THEN
        SELECT current_streak INTO user_value FROM profiles WHERE user_id = NEW.user_id;
      WHEN 'focus_hours' THEN
        SELECT COALESCE(SUM(actual_duration_minutes), 0) / 60 INTO user_value 
        FROM focus_sessions WHERE user_id = NEW.user_id AND was_completed = true;
      WHEN 'tasks_completed' THEN
        SELECT COUNT(*) INTO user_value FROM tasks WHERE user_id = NEW.user_id AND is_completed = true;
      ELSE
        user_value := 0;
    END CASE;
    
    -- Award achievement if requirement met
    IF user_value >= achievement_record.requirement_value THEN
      INSERT INTO user_achievements (user_id, achievement_id) 
      VALUES (NEW.user_id, achievement_record.id)
      ON CONFLICT DO NOTHING;
      
      -- Award XP
      UPDATE profiles 
      SET total_xp = total_xp + achievement_record.xp_reward
      WHERE user_id = NEW.user_id;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Trigger to check achievements on checkin
CREATE TRIGGER on_checkin_check_achievements
  AFTER INSERT OR UPDATE ON public.daily_checkins
  FOR EACH ROW
  EXECUTE FUNCTION public.check_achievements();

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, xp_reward, requirement_type, requirement_value) VALUES
  ('First Steps', 'Complete your first day', '🎯', 25, 'streak', 1),
  ('Week Warrior', 'Maintain a 7-day streak', '🔥', 100, 'streak', 7),
  ('Monthly Master', 'Maintain a 30-day streak', '⚡', 500, 'streak', 30),
  ('Focus Initiate', 'Complete 1 hour of focused work', '🧘', 50, 'focus_hours', 1),
  ('Deep Worker', 'Complete 10 hours of focused work', '💪', 200, 'focus_hours', 10),
  ('Focus Legend', 'Complete 100 hours of focused work', '🏆', 1000, 'focus_hours', 100),
  ('Task Starter', 'Complete 5 tasks', '✅', 50, 'tasks_completed', 5),
  ('Task Machine', 'Complete 50 tasks', '🚀', 300, 'tasks_completed', 50),
  ('Productivity God', 'Complete 500 tasks', '👑', 2000, 'tasks_completed', 500);