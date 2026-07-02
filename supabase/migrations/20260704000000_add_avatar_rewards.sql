-- Avatares desbloqueáveis / Loja de recompensas visuais

create table avatar_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text not null,
  category text not null default 'frame',
  requirement_label text not null,
  requirement_type text not null check (requirement_type in ('level', 'league', 'challenge_winner', 'season_champion')),
  requirement_value text,
  created_at timestamptz default now()
);

alter table avatar_items enable row level security;

create policy "authenticated view avatar items"
  on avatar_items for select
  using (auth.role() = 'authenticated');

grant select on avatar_items to authenticated;

create table user_avatar_items (
  user_id uuid references auth.users(id) on delete cascade,
  item_id uuid references avatar_items(id) on delete cascade,
  unlocked_at timestamptz default now(),
  primary key (user_id, item_id)
);

alter table user_avatar_items enable row level security;

create policy "authenticated view unlocked items"
  on user_avatar_items for select
  using (auth.role() = 'authenticated');

grant select on user_avatar_items to authenticated;

-- Item atualmente "equipado" pelo usuário
create table user_avatar (
  user_id uuid primary key references auth.users(id) on delete cascade,
  equipped_item_id uuid references avatar_items(id),
  updated_at timestamptz default now()
);

alter table user_avatar enable row level security;

create policy "authenticated view equipped avatar"
  on user_avatar for select
  using (auth.role() = 'authenticated');

create policy "user equips own avatar"
  on user_avatar for insert
  with check (
    user_id = auth.uid()
    and (
      equipped_item_id is null
      or exists (
        select 1 from user_avatar_items
        where user_id = auth.uid() and item_id = equipped_item_id
      )
    )
  );

create policy "user updates own avatar"
  on user_avatar for update
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (
      equipped_item_id is null
      or exists (
        select 1 from user_avatar_items
        where user_id = auth.uid() and item_id = equipped_item_id
      )
    )
  );

grant select, insert, update on user_avatar to authenticated;

-- Catálogo inicial ---------------------------------------------------------

insert into avatar_items (name, icon, category, requirement_label, requirement_type, requirement_value) values
  ('Chapéu de Formatura', '🎓', 'frame', 'Alcance o nível 5',        'level', '5'),
  ('Aura de Fogo',        '🔥', 'frame', 'Alcance o nível 10',       'level', '10'),
  ('Aura Elétrica',       '⚡', 'frame', 'Alcance o nível 20',       'level', '20'),
  ('Moldura Dourada',     '🥇', 'frame', 'Chegue à Liga Ouro',       'league', 'gold'),
  ('Moldura Diamante',    '💎', 'frame', 'Chegue à Liga Diamante',   'league', 'diamond'),
  ('Coroa de Mestre',     '👑', 'frame', 'Chegue à Liga Mestre',     'league', 'master'),
  ('Troféu de Campeão',   '🏆', 'frame', 'Vença um desafio',         'challenge_winner', null),
  ('Coroa Real',          '👑', 'frame', 'Seja campeão de temporada','season_champion', null)
on conflict do nothing;

-- Concessão automática -----------------------------------------------------

create or replace function grant_avatar_item(_user_id uuid, _requirement_type text, _requirement_value text)
returns void
language plpgsql security definer as $$
declare
  v_item record;
begin
  for v_item in
    select id from avatar_items
    where requirement_type = _requirement_type
      and (requirement_value = _requirement_value or (_requirement_value is null and requirement_value is null))
      and id not in (select item_id from user_avatar_items where user_id = _user_id)
  loop
    insert into user_avatar_items (user_id, item_id) values (_user_id, v_item.id)
    on conflict do nothing;

    insert into notifications (user_id, type, title, message, link)
    values (_user_id, 'achievement', '🎁 Novo item desbloqueado!', 'Você ganhou um novo item para seu avatar. Confira na loja!', '/profile');
  end loop;
end;
$$;

-- Desbloqueio por nível: reaproveita o trigger de XP já existente ----------

create or replace function check_level_avatar_unlocks()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'UPDATE' and NEW.level <= OLD.level then
    return NEW;
  end if;

  perform grant_avatar_item(NEW.user_id, 'level', lvl::text)
  from unnest(array[5, 10, 20]) as lvl
  where lvl <= NEW.level;

  return NEW;
end;
$$;

drop trigger if exists check_level_avatar_unlocks_trigger on user_xp;
create trigger check_level_avatar_unlocks_trigger
after insert or update on user_xp
for each row
execute function check_level_avatar_unlocks();

-- Desbloqueio por liga: reaproveita a tabela user_leagues -------------------

create or replace function check_league_avatar_unlocks()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if NEW.tier in ('gold', 'diamond', 'master') then
    perform grant_avatar_item(NEW.user_id, 'league', NEW.tier::text);
  end if;
  return NEW;
end;
$$;

drop trigger if exists check_league_avatar_unlocks_trigger on user_leagues;
create trigger check_league_avatar_unlocks_trigger
after insert or update on user_leagues
for each row
execute function check_league_avatar_unlocks();

-- Desbloqueio por vitória em desafio: estende finish_challenge --------------

create or replace function finish_challenge(_challenge_id uuid)
returns void
language plpgsql security definer as $$
declare
  v_challenge challenges%rowtype;
  v_winner_user_id uuid;
  v_winner_team_id uuid;
  r record;
begin
  select * into v_challenge from challenges where id = _challenge_id for update;

  if v_challenge.status != 'active' then
    return;
  end if;

  select user_id, team_id
  into v_winner_user_id, v_winner_team_id
  from challenge_ranking(_challenge_id)
  where rank = 1
  limit 1;

  update challenges
  set status = 'finished',
      winner_user_id = v_winner_user_id,
      winner_team_id = v_winner_team_id
  where id = _challenge_id;

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

    if r.rank = 1 then
      perform grant_avatar_item(r.user_id, 'challenge_winner', null);
    end if;
  end loop;
end;
$$;

-- Desbloqueio por campeão de temporada: estende finish_season ---------------

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

    if r.rank = 1 then
      perform grant_avatar_item(r.user_id, 'season_champion', null);
    end if;
  end loop;
end;
$$;
