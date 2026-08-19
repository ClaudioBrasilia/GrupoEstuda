-- Unifica as fontes de progresso dos desafios: além das sessões do cronômetro
-- (study_sessions), o ranking passa a contar os registros manuais de progresso
-- feitos na aba de metas (goal_progress_events). Assim, qualquer registro de
-- estudo no app conta para o desafio, independente de onde foi feito.

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
  sessions as (
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
  ),
  manual as (
    select
      e.user_id,
      coalesce(sum(e.delta), 0)::int as progress
    from goal_progress_events e
    cross join c
    where e.user_id in (select p2.user_id from p p2)
      and (e.group_id = (select group_id from c) or (select group_id from c) is null)
      and e.created_at >= (select starts_at from c)
      and ((select ends_at from c) is null or e.created_at <= (select ends_at from c))
      and e.metric = case (select metric from c)
        when 'study_minutes'    then 'time'
        when 'exercises_solved' then 'exercises'
        when 'pages_read'       then 'pages'
      end
    group by e.user_id
  )
  select
    p.user_id,
    p.team_id,
    (coalesce(s.progress, 0) + coalesce(m.progress, 0))::int as progress,
    rank() over (order by coalesce(s.progress, 0) + coalesce(m.progress, 0) desc) as rank
  from p
  left join sessions s on s.user_id = p.user_id
  left join manual m on m.user_id = p.user_id;
$$;

grant execute on function challenge_ranking(uuid) to authenticated;
