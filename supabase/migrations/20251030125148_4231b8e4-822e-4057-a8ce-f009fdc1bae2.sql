-- Add water_goal_ml column to profiles table
ALTER TABLE profiles ADD COLUMN water_goal_ml integer DEFAULT 2500 NOT NULL;

-- Add check constraint to ensure reasonable values (500ml to 5000ml)
ALTER TABLE profiles ADD CONSTRAINT water_goal_reasonable 
  CHECK (water_goal_ml >= 500 AND water_goal_ml <= 5000);