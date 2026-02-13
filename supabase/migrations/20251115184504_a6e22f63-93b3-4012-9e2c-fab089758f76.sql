-- Permitir que admins do grupo excluam metas
CREATE POLICY "Group admins can delete goals"
ON goals
FOR DELETE
USING (
  group_id IN (
    SELECT get_user_admin_groups(auth.uid())
  )
);