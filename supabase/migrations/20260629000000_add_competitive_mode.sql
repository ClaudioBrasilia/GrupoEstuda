-- Modo Competitivo: desafios dentro de grupos

create type challenge_metric as enum ('study_minutes','exercises_solved','pages_read');
create type challenge_mode   as enum ('first_to_goal','deadline','teams');
create type challenge_status as enum ('draft','active','finished','cancelled');

create table challenges (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  title text not null,
  description text,
  metric challenge_metric not null,
  mode challenge_mode not null,
  goal_value int,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  status challenge_status not null default 'draft',
  winner_user_id uuid references auth.users(id),
  winner_team_id uuid,
  created_at timestamptz default now()
);

create table challenge_teams (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references challenges(id) on delete cascade,
  name text not null,
  color text
);

create table challenge_participants (
  challenge_id uuid references challenges(id) on delete cascade,
  user_id uuid references auth.users(id),
  team_id uuid references challenge_teams(id),
  joined_at timestamptz default now(),
  primary key (challenge_id, user_id)
);

-- badges de desafio (separado da tabela achievements geral)
create table challenge_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  challenge_id uuid references challenges(id) on delete cascade,
  kind text not null check (kind in ('winner','top3','finisher')),
  awarded_at timestamptz default now()
);

-- RLS -------------------------------------------------------------------

alter table challenges enable row level security;
alter table challenge_teams enable row level security;
alter table challenge_participants enable row level security;
alter table challenge_badges enable row level security;

-- challenges: membros do grupo podem ver, só admin pode criar/alterar
create policy "members view challenges"
  on challenges for select
  using (group_id in (select get_user_groups(auth.uid())));

create policy "admin insert challenge"
  on challenges for insert
  with check (is_user_group_admin(auth.uid(), group_id));

create policy "admin update challenge"
  on challenges for update
  using (is_user_group_admin(auth.uid(), group_id));

-- challenge_teams
create policy "members view teams"
  on challenge_teams for select
  using (challenge_id in (
    select id from challenges where group_id in (select get_user_groups(auth.uid()))
  ));

create policy "admin manage teams"
  on challenge_teams for all
  using (challenge_id in (
    select c.id from challenges c where is_user_group_admin(auth.uid(), c.group_id)
  ));

-- challenge_participants: membros do grupo podem ver e entrar
create policy "members view participants"
  on challenge_participants for select
  using (challenge_id in (
    select id from challenges where group_id in (select get_user_groups(auth.uid()))
  ));

create policy "member join challenge"
  on challenge_participants for insert
  with check (
    user_id = auth.uid()
    and challenge_id in (
      select id from challenges where group_id in (select get_user_groups(auth.uid()))
    )
  );

create policy "member leave challenge"
  on challenge_participants for delete
  using (user_id = auth.uid());

-- challenge_badges: todos os usuários autenticados podem ver os seus
create policy "user view own badges"
  on challenge_badges for select
  using (user_id = auth.uid());

create policy "members view group badges"
  on challenge_badges for select
  using (challenge_id in (
    select id from challenges where group_id in (select get_user_groups(auth.uid()))
  ));

-- insert via função security definer abaixo
create policy "system insert badge"
  on challenge_badges for insert
  with check (false); -- bloqueado para clientes, só via função

-- GRANTs
grant select, insert, update on challenges to authenticated;
grant select, insert, delete on challenge_participants to authenticated;
grant select, insert, delete on challenge_teams to authenticated;
grant select on challenge_badges to authenticated;

-- Ranking RPC -----------------------------------------------------------

create or replace function challenge_ranking(_challenge_id uuid)
returns table(
  user_id uuid,
  team_id uuid,
  progress int,
  rank bigint
)
language sql stable security definer as $$
  with c as (
    select * from challenges where id = _challenge_id
  ),
  p as (
    select * from challenge_participants where challenge_id = _challenge_id
  ),
  raw as (
    select
      s.user_id,
      case (select metric from c)
        when 'study_minutes'    then coalesce(sum(s.duration_minutes), 0)
        when 'exercises_solved' then coalesce(sum(s.exercises), 0)
        when 'pages_read'       then coalesce(sum(s.pages), 0)
      end::int as progress
    from study_sessions s
    cross join c
    where s.user_id in (select p2.user_id from p p2)
      and (s.group_id = (select group_id from c) or (select group_id from c) is null)
      and s.completed_at >= (select starts_at from c)
      and ((select ends_at from c) is null or s.completed_at <= (select ends_at from c))
    group by s.user_id
  )
  select
    p.user_id,
    p.team_id,
    coalesce(r.progress, 0) as progress,
    rank() over (order by coalesce(r.progress, 0) desc) as rank
  from p
  left join raw r on r.user_id = p.user_id;
$$;

grant execute on function challenge_ranking(uuid) to authenticated;

-- Função de encerramento (chamada pelo cliente admin ou pg_cron) ---------

create or replace function finish_challenge(_challenge_id uuid)
returns void
language plpgsql security definer as $$
declare
  v_challenge challenges%rowtype;
  v_winner_user_id uuid;
  v_winner_team_id uuid;
  r record;
  rank_counter int := 1;
begin
  select * into v_challenge from challenges where id = _challenge_id for update;

  if v_challenge.status != 'active' then
    return;
  end if;

  -- determina vencedor
  select user_id, team_id
  into v_winner_user_id, v_winner_team_id
  from challenge_ranking(_challenge_id)
  where rank = 1
  limit 1;

  -- atualiza desafio
  update challenges
  set status = 'finished',
      winner_user_id = v_winner_user_id,
      winner_team_id = v_winner_team_id
  where id = _challenge_id;

  -- concede badges
  for r in (
    select user_id, rank
    from challenge_ranking(_challenge_id)
    where progress > 0
  ) loop
    insert into challenge_badges (user_id, challenge_id, kind)
    values (
      r.user_id,
      _challenge_id,
      case
        when r.rank = 1 then 'winner'
        when r.rank <= 3 then 'top3'
        else 'finisher'
      end
    )
    on conflict do nothing;
    rank_counter := rank_counter + 1;
  end loop;
end;
$$;

grant execute on function finish_challenge(uuid) to authenticated;

-- Realtime
alter publication supabase_realtime add table challenges;
alter publication supabase_realtime add table challenge_participants;
alter publication supabase_realtime add table challenge_badges;
