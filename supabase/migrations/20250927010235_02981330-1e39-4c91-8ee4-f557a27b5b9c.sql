-- Create trigger to automatically update goals when study sessions are completed
CREATE TRIGGER update_goals_trigger
  AFTER INSERT OR UPDATE ON study_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_goals_from_study_sessions();