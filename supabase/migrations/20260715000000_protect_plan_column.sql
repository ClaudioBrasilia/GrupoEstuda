-- Impede que usuários alterem o próprio plano diretamente pela API.
-- Upgrades de plano só podem ser feitos pelo servidor (service_role),
-- que é quem processará a confirmação de pagamento no futuro.
-- Downgrade voluntário para 'free' (cancelamento) continua permitido.

CREATE OR REPLACE FUNCTION public.protect_profile_plan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.plan IS DISTINCT FROM OLD.plan
     AND NEW.plan <> 'free'
     AND COALESCE(auth.jwt() ->> 'role', '') IN ('anon', 'authenticated') THEN
    RAISE EXCEPTION 'Alteração de plano só pode ser feita pelo servidor após confirmação de pagamento'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_plan_trigger ON public.profiles;

CREATE TRIGGER protect_profile_plan_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_plan();
