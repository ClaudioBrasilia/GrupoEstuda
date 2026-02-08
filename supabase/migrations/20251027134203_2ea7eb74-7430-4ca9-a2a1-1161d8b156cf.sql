-- Create group_invitations table
CREATE TABLE public.group_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL,
  invitee_email TEXT NOT NULL,
  invitee_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  UNIQUE(group_id, invitee_email, status)
);

-- Create indexes for performance
CREATE INDEX idx_group_invitations_invitee ON public.group_invitations(invitee_id, status);
CREATE INDEX idx_group_invitations_group ON public.group_invitations(group_id, status);

-- Enable RLS
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Group admins can create invitations
CREATE POLICY "Group admins can create invitations"
ON public.group_invitations FOR INSERT
WITH CHECK (
  group_id IN (SELECT get_user_admin_groups(auth.uid()))
);

-- Policy: Group admins can view group invitations
CREATE POLICY "Group admins can view group invitations"
ON public.group_invitations FOR SELECT
USING (
  group_id IN (SELECT get_user_admin_groups(auth.uid()))
);

-- Policy: Users can view their invitations by email or user_id
CREATE POLICY "Users can view their invitations"
ON public.group_invitations FOR SELECT
USING (
  invitee_id = auth.uid() OR 
  invitee_email IN (
    SELECT email FROM auth.users WHERE id = auth.uid()
  )
);

-- Policy: Users can update their invitation status
CREATE POLICY "Users can update their invitation status"
ON public.group_invitations FOR UPDATE
USING (
  (invitee_id = auth.uid() OR invitee_email IN (SELECT email FROM auth.users WHERE id = auth.uid()))
  AND status = 'pending' 
  AND expires_at > now()
)
WITH CHECK (
  status IN ('accepted', 'rejected')
);

-- Function to get user email by UUID
CREATE OR REPLACE FUNCTION public.get_user_email(user_uuid uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT email FROM auth.users WHERE id = user_uuid LIMIT 1;
$$;

-- Trigger to update updated_at on group_invitations
CREATE TRIGGER update_group_invitations_updated_at
BEFORE UPDATE ON public.group_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();