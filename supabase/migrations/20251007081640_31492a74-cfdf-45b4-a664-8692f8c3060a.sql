-- Adjust RLS to match business rules:
-- 1) Only allow premium users to join the fixed Vestibular group
-- 2) Allow group creators to add themselves as admin when creating a group
-- 3) Allow group admins to add members (insert)

-- Drop existing self-join policy that blocks normal inserts
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;

-- Allow creators to add themselves to their own groups (used right after group creation)
CREATE POLICY "Creators can add themselves as admin"
ON public.group_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND group_id IN (SELECT id FROM public.groups WHERE creator_id = auth.uid())
);

-- Premium users can join the fixed Vestibular Brasil group
CREATE POLICY "Premium users can join Vestibular group"
ON public.group_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND group_id = 'b47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.plan = 'premium'
  )
);

-- Group admins can add members to their groups
CREATE POLICY "Group admins can add members (insert)"
ON public.group_members
FOR INSERT
TO authenticated
WITH CHECK (
  group_id IN (SELECT get_user_admin_groups(auth.uid()))
);
