-- Migration: 010_harden_security_warnings
-- Description: Fix Supabase security lint warnings for extension schema, function search_path, and permissive RLS.
-- Date: 2026-02-22

-- Move relocatable extensions out of public schema.
CREATE SCHEMA IF NOT EXISTS extensions;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_extension e
        JOIN pg_namespace n ON n.oid = e.extnamespace
        WHERE e.extname = 'vector'
          AND n.nspname = 'public'
    ) THEN
        ALTER EXTENSION vector SET SCHEMA extensions;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM pg_extension e
        JOIN pg_namespace n ON n.oid = e.extnamespace
        WHERE e.extname = 'pg_trgm'
          AND n.nspname = 'public'
    ) THEN
        ALTER EXTENSION pg_trgm SET SCHEMA extensions;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM pg_extension e
        JOIN pg_namespace n ON n.oid = e.extnamespace
        WHERE e.extname = 'unaccent'
          AND n.nspname = 'public'
    ) THEN
        ALTER EXTENSION unaccent SET SCHEMA extensions;
    END IF;
END
$$;

-- Fix mutable function search_path for all flagged functions.
DO $$
DECLARE
    fn_name text;
    fn_record record;
    target_functions constant text[] := ARRAY[
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
        'get_customer_dashboard_stats'
    ];
BEGIN
    FOREACH fn_name IN ARRAY target_functions LOOP
        FOR fn_record IN
            SELECT
                n.nspname AS schema_name,
                p.proname,
                pg_get_function_identity_arguments(p.oid) AS identity_args
            FROM pg_proc p
            JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'public'
              AND p.proname = fn_name
        LOOP
            EXECUTE format(
                'ALTER FUNCTION %I.%I(%s) SET search_path = public, extensions',
                fn_record.schema_name,
                fn_record.proname,
                fn_record.identity_args
            );
        END LOOP;
    END LOOP;
END
$$;

-- Tighten permissive INSERT policy on public.advertising_leads.
DO $$
BEGIN
    IF to_regclass('public.advertising_leads') IS NOT NULL THEN
        DROP POLICY IF EXISTS "public_insert_leads" ON public.advertising_leads;
        CREATE POLICY "public_insert_leads"
            ON public.advertising_leads
            FOR INSERT
            TO anon, authenticated
            WITH CHECK (user_id IS NULL OR user_id = auth.uid());
    END IF;
END
$$;

-- Tighten permissive INSERT policy on public.page_views.
DO $$
BEGIN
    IF to_regclass('public.page_views') IS NOT NULL THEN
        DROP POLICY IF EXISTS "public_insert_pageviews" ON public.page_views;
        DROP POLICY IF EXISTS "allow_insert_pageviews" ON public.page_views;

        CREATE POLICY "public_insert_pageviews"
            ON public.page_views
            FOR INSERT
            TO anon, authenticated
            WITH CHECK (
                (
                    auth.uid() IS NOT NULL
                    AND (user_id IS NULL OR user_id = auth.uid())
                )
                OR (
                    auth.uid() IS NULL
                    AND session_id::text = COALESCE(
                        NULLIF(current_setting('request.headers', true), '')::jsonb ->> 'x-session-id',
                        ''
                    )
                )
            );
    END IF;
END
$$;

-- Tighten permissive INSERT/UPDATE policies on public.sessions.
DO $$
BEGIN
    IF to_regclass('public.sessions') IS NOT NULL THEN
        DROP POLICY IF EXISTS "public_insert_sessions" ON public.sessions;
        DROP POLICY IF EXISTS "allow_insert_sessions" ON public.sessions;
        DROP POLICY IF EXISTS "public_update_sessions" ON public.sessions;
        DROP POLICY IF EXISTS "allow_update_own_sessions" ON public.sessions;

        CREATE POLICY "public_insert_sessions"
            ON public.sessions
            FOR INSERT
            TO anon, authenticated
            WITH CHECK (
                (
                    auth.uid() IS NOT NULL
                    AND (user_id IS NULL OR user_id = auth.uid())
                )
                OR (
                    auth.uid() IS NULL
                    AND id::text = COALESCE(
                        NULLIF(current_setting('request.headers', true), '')::jsonb ->> 'x-session-id',
                        ''
                    )
                )
            );

        CREATE POLICY "public_update_sessions"
            ON public.sessions
            FOR UPDATE
            TO anon, authenticated
            USING (
                (
                    auth.uid() IS NOT NULL
                    AND user_id = auth.uid()
                )
                OR (
                    auth.uid() IS NULL
                    AND id::text = COALESCE(
                        NULLIF(current_setting('request.headers', true), '')::jsonb ->> 'x-session-id',
                        ''
                    )
                )
            )
            WITH CHECK (
                (
                    auth.uid() IS NOT NULL
                    AND user_id = auth.uid()
                )
                OR (
                    auth.uid() IS NULL
                    AND id::text = COALESCE(
                        NULLIF(current_setting('request.headers', true), '')::jsonb ->> 'x-session-id',
                        ''
                    )
                )
            );
    END IF;
END
$$;

-- Tighten permissive INSERT/UPDATE policies on public.wire_news.
DO $$
DECLARE
    admin_check text;
BEGIN
    IF to_regclass('public.wire_news') IS NOT NULL THEN
        DROP POLICY IF EXISTS "authenticated_insert_wire" ON public.wire_news;
        DROP POLICY IF EXISTS "allow_authenticated_insert_wire" ON public.wire_news;
        DROP POLICY IF EXISTS "authenticated_update_wire" ON public.wire_news;

        IF to_regclass('public.user_profiles') IS NOT NULL THEN
            admin_check := 'EXISTS (SELECT 1 FROM public.user_profiles p WHERE p.id = auth.uid() AND p.role IN (''admin'', ''super_admin''))';
        ELSE
            admin_check := 'auth.uid() IS NOT NULL';
        END IF;

        EXECUTE format(
            'CREATE POLICY "authenticated_insert_wire" ON public.wire_news FOR INSERT TO authenticated WITH CHECK (%s)',
            admin_check
        );

        EXECUTE format(
            'CREATE POLICY "authenticated_update_wire" ON public.wire_news FOR UPDATE TO authenticated USING (%1$s) WITH CHECK (%1$s)',
            admin_check
        );
    END IF;
END
$$;
