-- Permite notificações do tipo "convite para desafio"
alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('leaderboard', 'invitation', 'achievement', 'water_reminder', 'goal_reminder', 'challenge_invitation'));
