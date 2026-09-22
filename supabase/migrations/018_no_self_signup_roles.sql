-- ============================================================
-- HomeServe — Public sign-up creates homeowners only
-- Migration: 018_no_self_signup_roles.sql
--
-- HomeServe is a single-provider company with one contractor. Nobody can register as a
-- contractor (or anything else) from the public sign-up: the role in the sign-up metadata is
-- ignored, and the guard trigger rejects a client-side insert of any role but 'homeowner'.
-- The contractor and admin accounts are created by an admin with the service key:
--   node scripts/set-role.mjs <email> contractor|admin
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, role, full_name, phone, email)
  VALUES (
    NEW.id,
    'homeowner'::public.user_role,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), NEW.email, 'User'),
    NEW.raw_user_meta_data->>'phone',
    NEW.email
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_user_profiles()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  IF private.is_privileged() THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.role <> 'homeowner' THEN
      RAISE EXCEPTION 'role % cannot be self-assigned', NEW.role USING ERRCODE = '42501';
    END IF;
  ELSIF NEW.role IS DISTINCT FROM OLD.role OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'role and user_id are read-only' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
