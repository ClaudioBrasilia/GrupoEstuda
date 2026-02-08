-- Fix security warning: Function Search Path Mutable
-- Update the function to have proper search_path set
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;