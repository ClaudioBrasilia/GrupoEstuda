-- Permite excluir a conta de um usuário (exigência da Google Play e da App Store).
--
-- Várias tabelas referenciam auth.users(id) sem ON DELETE, o que faz o
-- DELETE do usuário falhar com violação de chave estrangeira. Aqui cada
-- referência passa a declarar explicitamente o que acontece quando a conta
-- é removida:
--   * linhas que só existem por causa daquele usuário  -> CASCADE
--   * referências opcionais em registros compartilhados -> SET NULL

-- challenges.created_by: o desafio pertence ao grupo, não ao criador.
-- A coluna é NOT NULL, então precisa aceitar NULL para sobreviver à exclusão.
alter table challenges alter column created_by drop not null;

alter table challenges drop constraint if exists challenges_created_by_fkey;
alter table challenges add constraint challenges_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

alter table challenges drop constraint if exists challenges_winner_user_id_fkey;
alter table challenges add constraint challenges_winner_user_id_fkey
  foreign key (winner_user_id) references auth.users(id) on delete set null;

-- Participação e badges deixam de fazer sentido sem o usuário.
alter table challenge_participants drop constraint if exists challenge_participants_user_id_fkey;
alter table challenge_participants add constraint challenge_participants_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table challenge_badges drop constraint if exists challenge_badges_user_id_fkey;
alter table challenge_badges add constraint challenge_badges_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- Temporadas: o campeão é histórico do app, a temporada continua existindo.
alter table seasons drop constraint if exists seasons_champion_user_id_fkey;
alter table seasons add constraint seasons_champion_user_id_fkey
  foreign key (champion_user_id) references auth.users(id) on delete set null;

alter table season_badges drop constraint if exists season_badges_user_id_fkey;
alter table season_badges add constraint season_badges_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;
