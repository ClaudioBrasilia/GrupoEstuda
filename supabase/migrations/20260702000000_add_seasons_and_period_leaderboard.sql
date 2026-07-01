-- Fase 3: Temporadas e ranking por período (semanal/mensal/temporada)

create table seasons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'active' check (status in ('active', 'finished')),
  champion_user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table seasons enable row level security;

create policy "authenticated view seasons"
  on seasons for select
  using (auth.role() = 'authenticated');

grant select on seasons to authenticated;

-- Vincula desafios a uma temporada (opcional)
alter table challenges add column if not exists season_id uuid references seasons(id);

-- Badges de temporada (mesmo padrão de challenge_badges)
create table season_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  season_id uuid references seasons(id) on delete cascade,
  kind text not null check (kind in ('champion', 'top3')),
  awarded_at timestamptz default now()
);

alter table season_badges enable row level security;

create policy "user view own season badges"
  on season_badges for select
  using (user_id = auth.uid());

create policy "authenticated view all season badges"
  on season_badges for select
  using (auth.role() = 'authenticated');

grant select on season_badges to authenticated;

-- Ranking por período (semana, mês ou temporada) ------------------------
-- Usa a mesma métrica de XP (minutos + 2*exercícios + páginas) direto das
-- study_sessions, sem precisar de tabela de progresso duplicada.

create or replace function period_leaderboard(_starts_at timestamptz, _ends_at timestamptz, _group_id uuid default null)
returns table(
  user_id uuid,
  score bigint,
  rank bigint
)
language sql stable security definer as $$
  select
    s.user_id,
    sum(coalesce(s.duration_minutes, 0) + coalesce(s.exercises, 0) * 2 + coalesce(s.pages, 0))::bigint as score,
    rank() over (
      order by sum(coalesce(s.duration_minutes, 0) + coalesce(s.exercises, 0) * 2 + coalesce(s.pages, 0)) desc
    ) as rank
  from study_sessions s
  where s.completed_at >= _starts_at
    and s.completed_at <= _ends_at
    and (_group_id is null or s.group_id = _group_id)
  group by s.user_id
  order by score desc;
$$;

grant execute on function period_leaderboard(timestamptz, timestamptz, uuid) to authenticated;

-- Encerramento de temporada: define campeão e concede badges -------------

create or replace function finish_season(_season_id uuid)
returns void
language plpgsql security definer as $$
declare
  v_season seasons%rowtype;
  v_champion_user_id uuid;
  r record;
begin
  select * into v_season from seasons where id = _season_id for update;

  if v_season.status != 'active' then
    return;
  end if;

  select user_id into v_champion_user_id
  from period_leaderboard(v_season.starts_at, v_season.ends_at)
  where rank = 1
  limit 1;

  update seasons
  set status = 'finished',
      champion_user_id = v_champion_user_id
  where id = _season_id;

  for r in (
    select user_id, rank
    from period_leaderboard(v_season.starts_at, v_season.ends_at)
    where rank <= 3 and score > 0
  ) loop
    insert into season_badges (user_id, season_id, kind)
    values (
      r.user_id,
      _season_id,
      case when r.rank = 1 then 'champion' else 'top3' end
    )
    on conflict do nothing;

    insert into notifications (user_id, type, title, message, link)
    values (
      r.user_id,
      'achievement',
      case when r.rank = 1 then '👑 Campeão da temporada!' else '🥉 Pódio da temporada!' end,
      format('Você terminou a temporada "%s" na posição %s', v_season.title, r.rank),
      '/profile'
    );
  end loop;
end;
$$;

grant execute on function finish_season(uuid) to authenticated;

-- Temporada inicial de exemplo (ajuste o título/datas conforme o mês vigente)
insert into seasons (title, starts_at, ends_at)
values ('Temporada Julho 2026', '2026-07-01T00:00:00Z', '2026-07-31T23:59:59Z');
