-- Eventos de produto (analytics próprio).
--
-- Sem medir retenção não dá para saber se a gamificação está funcionando.
-- Fica no próprio Supabase em vez de um SDK de terceiros: não adiciona
-- rastreador externo, não muda o que precisa ser declarado no Data Safety da
-- Google Play nem no App Privacy da Apple, e responde as perguntas que
-- importam no lançamento (D1/D7, ativação, funil de convite).

create table if not exists public.app_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  properties jsonb not null default '{}'::jsonb,
  platform text,
  created_at timestamptz not null default now()
);

create index if not exists app_events_name_created_at_idx
  on public.app_events (name, created_at desc);

create index if not exists app_events_user_created_at_idx
  on public.app_events (user_id, created_at desc);

alter table public.app_events enable row level security;

-- O cliente só escreve, e só em nome de si mesmo. Ninguém lê pelo app:
-- a análise é feita no painel do Supabase com service_role.
create policy "user inserts own events"
  on public.app_events for insert
  with check (user_id = auth.uid());

grant insert on public.app_events to authenticated;

-- Retenção D1/D7 por dia de cadastro (coorte).
create or replace view public.retention_by_signup_day
with (security_invoker = true) as
with cohort as (
  select id as user_id, created_at::date as signup_day
  from auth.users
),
activity as (
  select distinct user_id, created_at::date as active_day
  from public.app_events
  where name = 'app_open'
)
select
  c.signup_day,
  count(distinct c.user_id) as signups,
  count(distinct a1.user_id) as retained_d1,
  count(distinct a7.user_id) as retained_d7
from cohort c
left join activity a1
  on a1.user_id = c.user_id and a1.active_day = c.signup_day + 1
left join activity a7
  on a7.user_id = c.user_id and a7.active_day = c.signup_day + 7
group by c.signup_day
order by c.signup_day desc;
