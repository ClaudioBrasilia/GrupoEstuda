-- 1. Deletar o grupo Vestibular Brasil e todos os dados relacionados
DELETE FROM group_members WHERE group_id = 'b47ac10b-58cc-4372-a567-0e02b2c3d479';
DELETE FROM messages WHERE group_id = 'b47ac10b-58cc-4372-a567-0e02b2c3d479';
DELETE FROM goals WHERE group_id = 'b47ac10b-58cc-4372-a567-0e02b2c3d479';
DELETE FROM subjects WHERE group_id = 'b47ac10b-58cc-4372-a567-0e02b2c3d479';
DELETE FROM group_files WHERE group_id = 'b47ac10b-58cc-4372-a567-0e02b2c3d479';
DELETE FROM user_points WHERE group_id = 'b47ac10b-58cc-4372-a567-0e02b2c3d479';
DELETE FROM groups WHERE id = 'b47ac10b-58cc-4372-a567-0e02b2c3d479';

-- 2. Remover policy de Premium users para grupo Vestibular
DROP POLICY IF EXISTS "Premium users can join Vestibular group" ON group_members;

-- 3. Atualizar policy de criação de goals para apenas admins
DROP POLICY IF EXISTS "Group members can create goals" ON goals;

CREATE POLICY "Group admins can create goals" 
ON goals 
FOR INSERT 
WITH CHECK (
  (auth.uid() = created_by) 
  AND 
  is_user_group_admin(auth.uid(), group_id)
);