-- Impede que o próprio usuário se conceda o plano Premium.
--
-- A policy "Users can update their own profile" permite UPDATE em qualquer
-- coluna de profiles, inclusive `plan`. Como a chave anon é pública, qualquer
-- pessoa autenticada conseguia virar Premium com uma única chamada REST.
--
-- O plano passa a ser alterável apenas por contexto de servidor
-- (service_role — edge function do provedor de pagamento) ou pelo owner do
-- banco. Requisições de usuário final (roles `authenticated` e `anon`) são
-- rejeitadas.

create or replace function public.prevent_plan_self_upgrade()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.plan is distinct from old.plan
     and current_user in ('authenticated', 'anon') then
    raise exception 'O plano da conta não pode ser alterado pelo aplicativo.'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_plan on public.profiles;

create trigger protect_profile_plan
before update on public.profiles
for each row
execute function public.prevent_plan_self_upgrade();
