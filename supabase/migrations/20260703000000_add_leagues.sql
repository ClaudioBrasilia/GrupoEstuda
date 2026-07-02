-- Fase: Ligas (Bronze → Mestre), promoção/rebaixamento semanal

create type league_tier as enum ('bronze', 'silver', 'gold', 'platinum', 'diamond', 'master');

create table user_leagues (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier league_tier not null default 'bronze',
  updated_at timestamptz not null default now()
);

alter table user_leagues enable row level security;

create policy "authenticated view leagues"
  on user_leagues for select
  using (auth.role() = 'authenticated');

grant select on user_leagues to authenticated;

-- Garante que todo usuário que estuda entra automaticamente na liga Bronze
create or replace function ensure_user_league()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    if NEW.completed_at is null then
      return NEW;
    end if;
  elsif TG_OP = 'UPDATE' then
    if NEW.completed_at is null or OLD.completed_at is not null then
      return NEW;
    end if;
  else
    return NEW;
  end if;

  insert into user_leagues (user_id)
  values (NEW.user_id)
  on conflict (user_id) do nothing;

  return NEW;
end;
$$;

drop trigger if exists ensure_user_league_from_study_sessions on study_sessions;
create trigger ensure_user_league_from_study_sessions
after insert or update on study_sessions
for each row
execute function ensure_user_league();

-- Ranking semanal dentro de uma liga (inclui usuários com 0 XP na semana) --

create or replace function league_leaderboard(_tier league_tier, _starts_at timestamptz, _ends_at timestamptz)
returns table(
  user_id uuid,
  score bigint,
  rank bigint
)
language sql stable security definer as $$
  select
    ul.user_id,
    coalesce(sum(coalesce(s.duration_minutes, 0) + coalesce(s.exercises, 0) * 2 + coalesce(s.pages, 0)), 0)::bigint as score,
    rank() over (
      order by coalesce(sum(coalesce(s.duration_minutes, 0) + coalesce(s.exercises, 0) * 2 + coalesce(s.pages, 0)), 0) desc
    ) as rank
  from user_leagues ul
  left join study_sessions s
    on s.user_id = ul.user_id
   and s.completed_at >= _starts_at
   and s.completed_at <= _ends_at
  where ul.tier = _tier
  group by ul.user_id;
$$;

grant execute on function league_leaderboard(league_tier, timestamptz, timestamptz) to authenticated;

-- Processamento semanal: top 20% sobe, últimos 20% descem ------------------
-- Rode manualmente toda segunda-feira (ou agende via pg_cron, se disponível):
--   select process_weekly_leagues(<início da semana passada>, <fim da semana passada>);

create or replace function process_weekly_leagues(_starts_at timestamptz, _ends_at timestamptz)
returns void
language plpgsql security definer as $$
declare
  v_tiers league_tier[] := array['bronze','silver','gold','platinum','diamond','master']::league_tier[];
  v_tier league_tier;
  v_next league_tier;
  v_prev league_tier;
  v_count int;
  v_cutoff int;
  r record;
  i int;
begin
  for i in 1..array_length(v_tiers, 1) loop
    v_tier := v_tiers[i];
    v_next := case when i < array_length(v_tiers, 1) then v_tiers[i + 1] else null end;
    v_prev := case when i > 1 then v_tiers[i - 1] else null end;

    select count(*) into v_count from user_leagues where tier = v_tier;
    if v_count = 0 then
      continue;
    end if;

    v_cutoff := greatest(1, ceil(v_count * 0.2));

    for r in select * from league_leaderboard(v_tier, _starts_at, _ends_at) loop
      if v_next is not null and r.rank <= v_cutoff then
        update user_leagues set tier = v_next, updated_at = now() where user_id = r.user_id;

        insert into notifications (user_id, type, title, message, link)
        values (r.user_id, 'achievement', '⬆️ Você subiu de liga!', format('Você foi promovido para a liga %s', v_next), '/leaderboard');

      elsif v_prev is not null and r.rank > (v_count - v_cutoff) then
        update user_leagues set tier = v_prev, updated_at = now() where user_id = r.user_id;

        insert into notifications (user_id, type, title, message, link)
        values (r.user_id, 'achievement', '⬇️ Você desceu de liga', format('Você foi rebaixado para a liga %s', v_prev), '/leaderboard');
      end if;
    end loop;
  end loop;
end;
$$;
