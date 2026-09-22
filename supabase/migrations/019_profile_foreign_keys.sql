-- ============================================================
-- HomeServe — Foreign keys to user_profiles so PostgREST can embed profiles
-- Migration: 019_profile_foreign_keys.sql
--
-- bookings.homeowner_id, bookings.contractor_id and contractor_profiles.user_id reference
-- auth.users, so queries like `homeowner:user_profiles!bookings_homeowner_id_fkey(full_name)` in
-- the admin bookings list, admin payments, admin booking detail and the bookings API failed with
-- PGRST200 (no relationship). user_profiles.user_id is unique and 1:1 with auth.users, so a second
-- FK is safe and makes those embeds work. Application code uses the *_profile_fkey hints.
-- ============================================================

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_homeowner_profile_fkey FOREIGN KEY (homeowner_id) REFERENCES public.user_profiles(user_id),
  ADD CONSTRAINT bookings_contractor_profile_fkey FOREIGN KEY (contractor_id) REFERENCES public.user_profiles(user_id);

ALTER TABLE public.contractor_profiles
  ADD CONSTRAINT contractor_profiles_user_profile_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id);

NOTIFY pgrst, 'reload schema';
