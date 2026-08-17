-- Lista de interesse no plano Premium.
--
-- Enquanto a compra dentro do app (Google Play Billing / StoreKit) não estiver
-- integrada, a tela de planos registra interesse em vez de conceder o plano.
-- Serve também para medir demanda antes de investir na integração de pagamento.

create table if not exists public.premium_waitlist (
  user_id uuid primary key references auth.users(id) on delete cascade,
  billing_period text not null check (billing_period in ('monthly', 'yearly')),
  created_at timestamptz not null default now()
);

alter table public.premium_waitlist enable row level security;

drop policy if exists "user views own waitlist entry" on public.premium_waitlist;
create policy "user views own waitlist entry"
  on public.premium_waitlist for select
  using (user_id = auth.uid());

drop policy if exists "user joins waitlist" on public.premium_waitlist;
create policy "user joins waitlist"
  on public.premium_waitlist for insert
  with check (user_id = auth.uid());

drop policy if exists "user updates own waitlist entry" on public.premium_waitlist;
create policy "user updates own waitlist entry"
  on public.premium_waitlist for update
  using (user_id = auth.uid());

grant select, insert, update on public.premium_waitlist to authenticated;
