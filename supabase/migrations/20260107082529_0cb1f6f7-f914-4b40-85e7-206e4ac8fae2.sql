-- Create function to auto-calculate goal progress from completed tasks
CREATE OR REPLACE FUNCTION public.calculate_goal_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_tasks INTEGER;
  completed_tasks INTEGER;
  new_progress INTEGER;
BEGIN
  -- Only process if task has a goal linked
  IF NEW.goal_id IS NOT NULL THEN
    -- Count total tasks for this goal
    SELECT COUNT(*) INTO total_tasks 
    FROM tasks 
    WHERE goal_id = NEW.goal_id;
    
    -- Count completed tasks for this goal
    SELECT COUNT(*) INTO completed_tasks 
    FROM tasks 
    WHERE goal_id = NEW.goal_id AND is_completed = true;
    
    -- Calculate progress percentage
    IF total_tasks > 0 THEN
      new_progress := (completed_tasks * 100) / total_tasks;
    ELSE
      new_progress := 0;
    END IF;
    
    -- Update the goal progress
    UPDATE goals 
    SET progress = new_progress, updated_at = now()
    WHERE id = NEW.goal_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to update goal progress when task is completed/updated
CREATE TRIGGER on_task_completion_update_goal_progress
  AFTER UPDATE OF is_completed ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_goal_progress();

-- Also trigger on insert in case task is created as completed
CREATE TRIGGER on_task_insert_update_goal_progress
  AFTER INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_goal_progress();

-- Add storage policies for vision-boards bucket
CREATE POLICY "Vision board images are viewable by owner" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'vision-boards' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own vision board images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'vision-boards' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own vision board images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'vision-boards' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own vision board images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'vision-boards' AND auth.uid()::text = (storage.foldername(name))[1]);