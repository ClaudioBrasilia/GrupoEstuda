
-- Drop the problematic policies that access auth.users directly
DROP POLICY IF EXISTS "Users can view their invitations" ON public.group_invitations;
DROP POLICY IF EXISTS "Users can update their invitation status" ON public.group_invitations;

-- Recreate the SELECT policy using the get_user_email function
CREATE POLICY "Users can view their invitations" 
ON public.group_invitations 
FOR SELECT 
USING (
  (invitee_id = auth.uid()) 
  OR (invitee_email = get_user_email(auth.uid()))
);

-- Recreate the UPDATE policy using the get_user_email function
CREATE POLICY "Users can update their invitation status" 
ON public.group_invitations 
FOR UPDATE 
USING (
  ((invitee_id = auth.uid()) OR (invitee_email = get_user_email(auth.uid())))
  AND (status = 'pending')
  AND (expires_at > now())
)
WITH CHECK (status = ANY (ARRAY['accepted', 'rejected']));
