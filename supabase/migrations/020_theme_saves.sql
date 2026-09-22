-- ============================================================
-- HomeServe — Real save counts for design themes
-- Migration: 020_theme_saves.sql
--
-- The theme gallery ("saved by 4.8k people") used to show a fixed number baked into the static theme
-- data — not a real count of anything. This replaces it with an actual table of save events, so the
-- number a visitor sees is however many people have really tapped "save" on that theme.
--
-- The gallery has no login, so a "save" is tied to a random id the browser keeps in localStorage rather
-- than a user account — the same trade-off most anonymous like/bookmark features make. Nobody but the
-- service role can read or write the table directly (RLS is enabled with no policies); every save and
-- unsave goes through /api/themes/[slug]/save, which validates the slug against the real catalogue.
-- ============================================================

CREATE TABLE public.theme_saves (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  theme_slug  TEXT NOT NULL,
  device_id   UUID NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (theme_slug, device_id)
);

CREATE INDEX idx_theme_saves_slug ON public.theme_saves(theme_slug);

ALTER TABLE public.theme_saves ENABLE ROW LEVEL SECURITY;
-- No policies: this table has no direct anon/authenticated access at all, by design.

CREATE OR REPLACE FUNCTION public.theme_save_counts()
RETURNS TABLE(theme_slug TEXT, saves BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT theme_slug, COUNT(*) FROM public.theme_saves GROUP BY theme_slug;
$$;

CREATE OR REPLACE FUNCTION public.theme_save_count(p_slug TEXT)
RETURNS BIGINT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COUNT(*) FROM public.theme_saves WHERE theme_slug = p_slug;
$$;

REVOKE ALL ON FUNCTION public.theme_save_counts(), public.theme_save_count(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.theme_save_counts(), public.theme_save_count(TEXT) TO service_role;
