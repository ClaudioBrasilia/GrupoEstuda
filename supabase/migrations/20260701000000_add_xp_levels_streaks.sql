-- Fase 2: XP global, níveis e streak de estudos

-- XP -----------------------------------------------------------

create table user_xp (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_xp bigint not null default 0,
  level int not null default 1,
  updated_at timestamptz not null default now()
);

alter table user_xp enable row level security;

create policy "users view own xp"
  on user_xp for select
  using (user_id = auth.uid());

-- ranking de XP é público entre usuários autenticados (para leaderboards futuros)
create policy "authenticated view all xp"
  on user_xp for select
  using (auth.role() = 'authenticated');

grant select on user_xp to authenticated;

-- Streak ---------------------------------------------------------

create table user_streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak int not null default 0,
  best_streak int not null default 0,
  last_study_date date,
  updated_at timestamptz not null default now()
);

alter table user_streaks enable row level security;

create policy "users view own streak"
  on user_streaks for select
  using (user_id = auth.uid());

grant select on user_streaks to authenticated;

-- Badges de streak/XP reaproveitando a tabela achievements já existente ---

alter table achievements add column if not exists streak_required int;

insert into achievements (name_key, description_key, icon, category, streak_required)
values
  ('streak7',   'streak7Desc',   '🔥', 'streak', 7),
  ('streak30',  'streak30Desc',  '🔥', 'streak', 30),
  ('streak100', 'streak100Desc', '🔥', 'streak', 100)
on conflict do nothing;

-- Função de nível a partir do XP total ----------------------------

create or replace function xp_to_level(_xp bigint)
returns int
language sql immutable as $$
  select case
    when _xp < 100  then 1
    when _xp < 250  then 2
    when _xp < 500  then 3
    when _xp < 1000 then 4
    else 5 + floor(log(2, greatest(_xp, 1000)::numeric / 1000))::int
  end;
$$;

-- Trigger: atualiza XP, nível, streak e concede badges de streak --

create or replace function handle_study_session_xp_streak()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_xp_gain bigint;
  v_today date;
  v_last date;
  v_new_streak int;
  v_streak_achievement record;
begin
  -- Processa apenas quando a sessão é finalizada pela primeira vez.
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

  -- XP: 1 por minuto + 2 por exercício + 1 por página
  v_xp_gain := coalesce(NEW.duration_minutes, 0)
             + coalesce(NEW.exercises, 0) * 2
             + coalesce(NEW.pages, 0);

  if v_xp_gain > 0 then
    insert into user_xp (user_id, total_xp, level)
    values (NEW.user_id, v_xp_gain, xp_to_level(v_xp_gain))
    on conflict (user_id) do update
      set total_xp = user_xp.total_xp + v_xp_gain,
          level = xp_to_level(user_xp.total_xp + v_xp_gain),
          updated_at = now();
  end if;

  -- Streak: baseado na data (UTC) da conclusão da sessão
  v_today := (NEW.completed_at at time zone 'utc')::date;

  select last_study_date into v_last from user_streaks where user_id = NEW.user_id;

  if v_last is null then
    v_new_streak := 1;
  elsif v_last = v_today then
    return NEW; -- já contabilizado hoje, não altera streak
  elsif v_last = v_today - 1 then
    v_new_streak := (select current_streak from user_streaks where user_id = NEW.user_id) + 1;
  else
    v_new_streak := 1;
  end if;

  insert into user_streaks (user_id, current_streak, best_streak, last_study_date)
  values (NEW.user_id, v_new_streak, v_new_streak, v_today)
  on conflict (user_id) do update
    set current_streak = v_new_streak,
        best_streak = greatest(user_streaks.best_streak, v_new_streak),
        last_study_date = v_today,
        updated_at = now();

  -- Concede badges de streak automaticamente
  for v_streak_achievement in
    select id from achievements
    where streak_required is not null
      and streak_required <= v_new_streak
      and id not in (
        select achievement_id from user_achievements where user_id = NEW.user_id
      )
  loop
    insert into user_achievements (user_id, achievement_id)
    values (NEW.user_id, v_streak_achievement.id)
    on conflict do nothing;

    insert into notifications (user_id, type, title, message, link)
    values (
      NEW.user_id,
      'achievement',
      '🏆 Nova conquista desbloqueada!',
      'Você manteve uma sequência de estudos!',
      '/profile'
    );
  end loop;

  return NEW;
end;
$$;

drop trigger if exists sync_xp_streak_from_study_sessions on study_sessions;
create trigger sync_xp_streak_from_study_sessions
after insert or update on study_sessions
for each row
execute function handle_study_session_xp_streak();
