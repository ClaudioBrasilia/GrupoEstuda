-- Setup Vestibular Brasil group with proper data and subjects
-- First, create the Vestibular Brasil group with proper UUID
DO $$
DECLARE
    vestibular_group_id uuid := 'b47ac10b-58cc-4372-a567-0e02b2c3d479';
BEGIN
    -- Make creator_id nullable for system groups
    ALTER TABLE groups ALTER COLUMN creator_id DROP NOT NULL;
    
    -- Insert Vestibular Brasil group if it doesn't exist
    INSERT INTO public.groups (id, name, description, type, creator_id) 
    VALUES (
      vestibular_group_id,
      'Vestibular Brasil', 
      'Grupo oficial para estudantes se preparando para vestibulares brasileiros',
      'vestibular',
      NULL  -- System group has no creator
    ) ON CONFLICT (id) DO NOTHING;

    -- Insert standard vestibular subjects for the group
    INSERT INTO public.subjects (group_id, name) VALUES
      (vestibular_group_id, 'Português'),
      (vestibular_group_id, 'Matemática'),
      (vestibular_group_id, 'História'),
      (vestibular_group_id, 'Geografia'),
      (vestibular_group_id, 'Física'),
      (vestibular_group_id, 'Química'),
      (vestibular_group_id, 'Biologia'),
      (vestibular_group_id, 'Literatura'),
      (vestibular_group_id, 'Inglês'),
      (vestibular_group_id, 'Redação')
    ON CONFLICT DO NOTHING;
END $$;

-- Create trigger to automatically update goals when study sessions are completed
CREATE OR REPLACE FUNCTION update_goals_from_study_sessions()
RETURNS TRIGGER AS $$
DECLARE
  user_groups uuid[];
  goal_record record;
  points_to_add integer;
BEGIN
  -- Only process completed sessions (when completed_at is set)
  IF NEW.completed_at IS NOT NULL AND (OLD.completed_at IS NULL OR OLD.completed_at != NEW.completed_at) THEN
    -- Get all groups the user belongs to
    SELECT ARRAY_AGG(group_id) INTO user_groups
    FROM group_members 
    WHERE user_id = NEW.user_id;
    
    -- Update relevant goals
    FOR goal_record IN 
      SELECT * FROM goals 
      WHERE group_id = ANY(user_groups) 
      AND current < target
      AND (
        (type = 'time' AND (subject_id = NEW.subject_id OR subject_id IS NULL)) OR
        (type = 'exercises' AND subject_id = NEW.subject_id) OR
        (type = 'pages' AND subject_id = NEW.subject_id)
      )
    LOOP
      points_to_add := 0;
      
      -- Calculate progress based on goal type
      IF goal_record.type = 'time' THEN
        -- Add study time in minutes
        UPDATE goals 
        SET current = LEAST(current + NEW.duration_minutes, target)
        WHERE id = goal_record.id;
        points_to_add := NEW.duration_minutes;
      ELSIF goal_record.type = 'exercises' THEN
        -- Assume 1 exercise per 10 minutes of study
        UPDATE goals 
        SET current = LEAST(current + (NEW.duration_minutes / 10), target)
        WHERE id = goal_record.id;
        points_to_add := (NEW.duration_minutes / 10) * 5;
      ELSIF goal_record.type = 'pages' THEN
        -- Assume 2 pages per 10 minutes of study  
        UPDATE goals 
        SET current = LEAST(current + (NEW.duration_minutes / 5), target)
        WHERE id = goal_record.id;
        points_to_add := (NEW.duration_minutes / 5) * 2;
      END IF;
      
      -- Update user points for this group
      IF points_to_add > 0 THEN
        INSERT INTO user_points (user_id, group_id, points)
        VALUES (NEW.user_id, goal_record.group_id, points_to_add)
        ON CONFLICT (user_id, group_id) 
        DO UPDATE SET points = user_points.points + points_to_add;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_update_goals_from_study_sessions ON study_sessions;
CREATE TRIGGER trigger_update_goals_from_study_sessions
  AFTER UPDATE ON study_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_goals_from_study_sessions();

-- Add unique constraint to user_points to prevent duplicates
ALTER TABLE user_points DROP CONSTRAINT IF EXISTS user_points_user_id_group_id_key;
ALTER TABLE user_points ADD CONSTRAINT user_points_user_id_group_id_key UNIQUE (user_id, group_id);