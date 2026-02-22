-- Migration: 010_security_hardening
-- Description: Fix Supabase linter security warnings (search_path, extensions schema, permissive RLS)
-- Date: 2026-02-22

-- ------------------------------------------------------------
-- 1) Extensions should not live in `public`
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'extensions') THEN
    EXECUTE 'CREATE SCHEMA extensions';
  END IF;

  -- Move extensions out of public if they exist.
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    EXECUTE 'ALTER EXTENSION vector SET SCHEMA extensions';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    EXECUTE 'ALTER EXTENSION pg_trgm SET SCHEMA extensions';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'unaccent') THEN
    EXECUTE 'ALTER EXTENSION unaccent SET SCHEMA extensions';
  END IF;
END
$$;

-- ------------------------------------------------------------
-- 2) Fix role-mutable function search_path
-- ------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT
      p.oid,
      n.nspname AS schema_name,
      p.proname AS function_name
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = ANY (ARRAY[
        'search_wire_news',
        'get_capacity_used',
        'match_advertisers',
        'purge_old_wire_news',
        'get_function_definition_owner',
        'validate_discount',
        'create_discount_code',
        'generate_invoice_number',
        'log_activity',
        'get_function_definition',
        'capacity_summary',
        'check_capacity',
        'approve_discount',
        'get_pending_discounts',
        'get_customer_dashboard_stats',

        -- name variants present in repo migrations
        'create_discount',
        'list_pending_discounts'
      ])
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %I.%I(%s) SET search_path = %L',
      r.schema_name,
      r.function_name,
      pg_get_function_identity_arguments(r.oid),
      'pg_catalog, public'
    );
  END LOOP;
END
$$;

-- ------------------------------------------------------------
-- 3) Tighten permissive RLS policies that used `true`
-- ------------------------------------------------------------
DO $$
BEGIN
  -- advertising_leads: allow public inserts, but prevent forging `user_id`
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'advertising_leads' AND policyname = 'public_insert_leads'
  ) THEN
    EXECUTE 'ALTER POLICY "public_insert_leads" ON public.advertising_leads WITH CHECK (user_id IS NULL OR user_id = auth.uid())';
  END IF;

  -- page_views: allow inserts, but prevent forging `user_id`
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'page_views' AND policyname = 'public_insert_pageviews'
  ) THEN
    EXECUTE 'ALTER POLICY "public_insert_pageviews" ON public.page_views WITH CHECK (user_id IS NULL OR user_id = auth.uid())';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'page_views' AND policyname = 'allow_insert_pageviews'
  ) THEN
    EXECUTE 'ALTER POLICY "allow_insert_pageviews" ON public.page_views WITH CHECK (user_id IS NULL OR user_id = auth.uid())';
  END IF;

  -- sessions: allow inserts, but prevent forging `user_id`
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sessions' AND policyname = 'public_insert_sessions'
  ) THEN
    EXECUTE 'ALTER POLICY "public_insert_sessions" ON public.sessions WITH CHECK (user_id IS NULL OR user_id = auth.uid())';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sessions' AND policyname = 'allow_insert_sessions'
  ) THEN
    EXECUTE 'ALTER POLICY "allow_insert_sessions" ON public.sessions WITH CHECK (user_id IS NULL OR user_id = auth.uid())';
  END IF;

  -- sessions: restrict UPDATE to the authenticated owner (prevents global write access)
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sessions' AND policyname = 'public_update_sessions'
  ) THEN
    EXECUTE 'ALTER POLICY "public_update_sessions" ON public.sessions TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
  END IF;

  -- wire_news: only admins should be able to insert/update (service role bypasses RLS anyway)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_profiles'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'wire_news' AND policyname = 'authenticated_insert_wire'
    ) THEN
      EXECUTE 'ALTER POLICY "authenticated_insert_wire" ON public.wire_news WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.id = auth.uid() AND p.role IN (''admin'',''super_admin'')))';
    END IF;

    IF EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'wire_news' AND policyname = 'authenticated_update_wire'
    ) THEN
      EXECUTE 'ALTER POLICY "authenticated_update_wire" ON public.wire_news USING (EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.id = auth.uid() AND p.role IN (''admin'',''super_admin''))) WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.id = auth.uid() AND p.role IN (''admin'',''super_admin'')))';
    END IF;

    -- name variant from smaller migration
    IF EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'wire_news' AND policyname = 'allow_authenticated_insert_wire'
    ) THEN
      EXECUTE 'ALTER POLICY "allow_authenticated_insert_wire" ON public.wire_news WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.id = auth.uid() AND p.role IN (''admin'',''super_admin'')))';
    END IF;
  END IF;
END
$$;

