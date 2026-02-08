-- Fix infinite recursion in group_members RLS policies by creating security definer functions

-- 1. Create security definer function to get user's groups
CREATE OR REPLACE FUNCTION public.get_user_groups(user_uuid UUID)
RETURNS SETOF UUID AS $$
  SELECT group_id FROM public.group_members WHERE user_id = user_uuid;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- 2. Create security definer function to check if user is admin of a group
CREATE OR REPLACE FUNCTION public.is_user_group_admin(user_uuid UUID, group_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.group_members 
    WHERE user_id = user_uuid AND group_id = group_uuid AND is_admin = true
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- 3. Create security definer function to get user's admin groups
CREATE OR REPLACE FUNCTION public.get_user_admin_groups(user_uuid UUID)
RETURNS SETOF UUID AS $$
  SELECT group_id FROM public.group_members 
  WHERE user_id = user_uuid AND is_admin = true;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- 4. Drop existing problematic policies
DROP POLICY IF EXISTS "Group admins can manage members" ON public.group_members;
DROP POLICY IF EXISTS "Users can view group members of their groups" ON public.group_members;

-- 5. Create new policies using security definer functions
CREATE POLICY "Group admins can manage members" ON public.group_members
FOR ALL USING (group_id IN (SELECT public.get_user_admin_groups(auth.uid())));

CREATE POLICY "Users can view group members of their groups" ON public.group_members
FOR SELECT USING (group_id IN (SELECT public.get_user_groups(auth.uid())));

-- 6. Also fix other tables that might have similar issues
-- Update groups table policies
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;
DROP POLICY IF EXISTS "Group admins can update groups" ON public.groups;

CREATE POLICY "Users can view groups they are members of" ON public.groups
FOR SELECT USING (id IN (SELECT public.get_user_groups(auth.uid())));

CREATE POLICY "Group admins can update groups" ON public.groups
FOR UPDATE USING (id IN (SELECT public.get_user_admin_groups(auth.uid())));

-- 7. Update subjects table policies
DROP POLICY IF EXISTS "Users can view subjects from their groups" ON public.subjects;
DROP POLICY IF EXISTS "Group admins can manage subjects" ON public.subjects;

CREATE POLICY "Users can view subjects from their groups" ON public.subjects
FOR SELECT USING (group_id IN (SELECT public.get_user_groups(auth.uid())));

CREATE POLICY "Group admins can manage subjects" ON public.subjects
FOR ALL USING (group_id IN (SELECT public.get_user_admin_groups(auth.uid())));

-- 8. Update messages table policies
DROP POLICY IF EXISTS "Users can view messages from their groups" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to their groups" ON public.messages;

CREATE POLICY "Users can view messages from their groups" ON public.messages
FOR SELECT USING (group_id IN (SELECT public.get_user_groups(auth.uid())));

CREATE POLICY "Users can send messages to their groups" ON public.messages
FOR INSERT WITH CHECK (auth.uid() = user_id AND group_id IN (SELECT public.get_user_groups(auth.uid())));

-- 9. Update goals table policies
DROP POLICY IF EXISTS "Users can view goals from their groups" ON public.goals;
DROP POLICY IF EXISTS "Group members can create goals" ON public.goals;

CREATE POLICY "Users can view goals from their groups" ON public.goals
FOR SELECT USING (group_id IN (SELECT public.get_user_groups(auth.uid())));

CREATE POLICY "Group members can create goals" ON public.goals
FOR INSERT WITH CHECK (auth.uid() = created_by AND group_id IN (SELECT public.get_user_groups(auth.uid())));

-- 10. Update group_files table policies
DROP POLICY IF EXISTS "Group members can view files metadata from their groups" ON public.group_files;
DROP POLICY IF EXISTS "Group members can upload files metadata to their groups" ON public.group_files;

CREATE POLICY "Group members can view files metadata from their groups" ON public.group_files
FOR SELECT USING (group_id IN (SELECT public.get_user_groups(auth.uid())));

CREATE POLICY "Group members can upload files metadata to their groups" ON public.group_files
FOR INSERT WITH CHECK (auth.uid() = user_id AND group_id IN (SELECT public.get_user_groups(auth.uid())));

-- 11. Update user_points table policies
DROP POLICY IF EXISTS "Users can view points from their groups" ON public.user_points;

CREATE POLICY "Users can view points from their groups" ON public.user_points
FOR SELECT USING (group_id IN (SELECT public.get_user_groups(auth.uid())));