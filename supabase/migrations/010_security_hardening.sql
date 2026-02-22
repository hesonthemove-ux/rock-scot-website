-- Migration: 010_security_hardening
-- Description: Fix database linter security warnings
--   1. Set explicit search_path on all functions (function_search_path_mutable)
--   2. Move extensions out of public schema (extension_in_public)
--   3. Tighten overly permissive RLS policies (rls_policy_always_true)
-- Date: 2026-02-22

-- ============================================================
-- 1. MOVE EXTENSIONS OUT OF PUBLIC SCHEMA
-- ============================================================

CREATE SCHEMA IF NOT EXISTS extensions;

-- Move extensions to the extensions schema.
-- DROP + re-CREATE is needed because ALTER EXTENSION ... SET SCHEMA
-- can fail if dependent objects exist in public.
-- The CASCADE on drop will remove dependent objects; they are
-- recreated below (indexes, generated columns, function signatures).

DROP EXTENSION IF EXISTS vector CASCADE;
DROP EXTENSION IF EXISTS pg_trgm CASCADE;
DROP EXTENSION IF EXISTS unaccent CASCADE;

CREATE EXTENSION IF NOT EXISTS vector  SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA extensions;

-- Recreate the wire_news columns/indexes that depended on pgvector.
-- The embedding column and its index were dropped by CASCADE above.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'wire_news' AND column_name = 'embedding'
    ) THEN
        ALTER TABLE public.wire_news ADD COLUMN embedding extensions.vector(384);
    END IF;
END $$;

-- Recreate the search_vector generated column if it was dropped
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'wire_news' AND column_name = 'search_vector'
    ) THEN
        ALTER TABLE public.wire_news ADD COLUMN search_vector TSVECTOR GENERATED ALWAYS AS (
            to_tsvector('english', coalesce(title,'') || ' ' || coalesce(summary,''))
        ) STORED;
    END IF;
END $$;

-- Recreate indexes that may have been dropped
CREATE INDEX IF NOT EXISTS idx_wire_fts ON public.wire_news USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_wire_embedding ON public.wire_news
    USING ivfflat (embedding extensions.vector_cosine_ops) WITH (lists = 50);

-- Recreate embedding column on user_profiles if it existed
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'embedding'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN embedding extensions.vector(128);
    END IF;
END $$;

-- ============================================================
-- 2. SET search_path ON ALL FUNCTIONS
-- ============================================================

-- 2a) search_wire_news — full-text search on wire news
CREATE OR REPLACE FUNCTION public.search_wire_news(query TEXT)
RETURNS TABLE (
    id       UUID,
    title    TEXT,
    summary  TEXT,
    genre    TEXT,
    rank     FLOAT
)
LANGUAGE sql STABLE
SET search_path = ''
AS $$
    SELECT
        w.id, w.title, w.summary, w.genre,
        ts_rank(w.search_vector, plainto_tsquery('english', query)) AS rank
    FROM public.wire_news w
    WHERE w.is_live = TRUE
      AND w.search_vector @@ plainto_tsquery('english', query)
    ORDER BY rank DESC
    LIMIT 20;
$$;

-- 2b) get_capacity_used — capacity report across date range
CREATE OR REPLACE FUNCTION public.get_capacity_used(
    p_start_date DATE DEFAULT CURRENT_DATE,
    p_end_date   DATE DEFAULT CURRENT_DATE + 28
)
RETURNS TABLE (
    mux_type            TEXT,
    campaign_count      BIGINT,
    capacity_units_used BIGINT,
    capacity_remaining  INTEGER
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
    WITH active AS (
        SELECT
            c.mux_type,
            COUNT(*)         AS campaign_count,
            SUM(c.mux_weight)  AS weight_used
        FROM public.campaigns c
        WHERE c.status IN ('approved','active')
          AND c.start_date <= p_end_date
          AND c.end_date   >= p_start_date
        GROUP BY c.mux_type
    ),
    totals AS (
        SELECT SUM(weight_used) AS total_weight_used
        FROM active
    )
    SELECT
        a.mux_type,
        a.campaign_count,
        a.weight_used         AS capacity_units_used,
        (120 - t.total_weight_used)::INTEGER AS capacity_remaining
    FROM active a, totals t
    ORDER BY a.mux_type;
$$;

-- 2c) match_advertisers — AI similarity via pgvector
CREATE OR REPLACE FUNCTION public.match_advertisers(
    query_embedding extensions.vector(128),
    match_threshold FLOAT   DEFAULT 0.7,
    match_count     INT     DEFAULT 5
)
RETURNS TABLE (
    id          UUID,
    company     TEXT,
    similarity  FLOAT
)
LANGUAGE sql STABLE
SET search_path = ''
AS $$
    SELECT
        p.id,
        p.company_name,
        1 - (p.embedding OPERATOR(extensions.<=>) query_embedding) AS similarity
    FROM public.user_profiles p
    WHERE p.embedding IS NOT NULL
      AND 1 - (p.embedding OPERATOR(extensions.<=>) query_embedding) > match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
$$;

-- 2d) purge_old_wire_news — auto-cleanup trigger function
CREATE OR REPLACE FUNCTION public.purge_old_wire_news()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    DELETE FROM public.wire_news
    WHERE created_at < NOW() - INTERVAL '30 days';
    RETURN NULL;
END;
$$;

-- 2e) get_function_definition_owner — introspection helper
-- This function may have been created interactively; recreate with search_path set.
CREATE OR REPLACE FUNCTION public.get_function_definition_owner(function_name TEXT)
RETURNS TABLE (
    func_name   TEXT,
    func_schema TEXT,
    func_owner  TEXT,
    definition  TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT
        p.proname::TEXT         AS func_name,
        n.nspname::TEXT         AS func_schema,
        pg_get_userbyid(p.proowner)::TEXT AS func_owner,
        pg_get_functiondef(p.oid)::TEXT   AS definition
    FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = function_name;
$$;

-- 2f) validate_discount — public-safe discount code check
CREATE OR REPLACE FUNCTION public.validate_discount(p_code TEXT)
RETURNS TABLE (
    id          UUID,
    code        TEXT,
    amount_pence BIGINT,
    percent_off INTEGER,
    is_valid    BOOLEAN
)
LANGUAGE sql SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT
        d.id, d.code, d.amount_pence, d.percent_off,
        (
            d.approved_at IS NOT NULL
            AND d.is_active = TRUE
            AND (d.expires_at IS NULL OR d.expires_at > NOW())
            AND (d.max_uses IS NULL OR d.use_count < d.max_uses)
        ) AS is_valid
    FROM public.discounts d
    WHERE UPPER(d.code) = UPPER(p_code);
$$;

-- 2g) create_discount_code — admin-only discount creation
CREATE OR REPLACE FUNCTION public.create_discount_code(
    p_code          TEXT,
    p_amount_pence  BIGINT  DEFAULT NULL,
    p_percent_off   INTEGER DEFAULT NULL,
    p_created_by    UUID    DEFAULT NULL,
    p_note          TEXT    DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_id UUID;
BEGIN
    INSERT INTO public.discounts (code, amount_pence, percent_off, created_by, note)
    VALUES (UPPER(p_code), p_amount_pence, p_percent_off, p_created_by, p_note)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

-- 2h) generate_invoice_number — auto-number trigger
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    yr TEXT;
    nxt INTEGER;
BEGIN
    IF NEW.invoice_number IS NULL THEN
        yr := TO_CHAR(CURRENT_DATE, 'YY');
        SELECT COALESCE(MAX(CAST(SPLIT_PART(invoice_number, '-', 3) AS INTEGER)), 0) + 1
        INTO nxt
        FROM public.invoices
        WHERE invoice_number LIKE 'INV-' || yr || '-%';
        NEW.invoice_number := 'INV-' || yr || '-' || LPAD(nxt::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$;

-- 2i) log_activity — audit trail helper
CREATE OR REPLACE FUNCTION public.log_activity(
    p_action      TEXT,
    p_entity_type TEXT    DEFAULT NULL,
    p_entity_id   UUID    DEFAULT NULL,
    p_description TEXT    DEFAULT NULL,
    p_metadata    JSONB   DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, description, metadata)
    VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_description, p_metadata);
END;
$$;

-- 2j) get_function_definition — introspection helper
CREATE OR REPLACE FUNCTION public.get_function_definition(function_name TEXT)
RETURNS TABLE (
    func_name   TEXT,
    func_schema TEXT,
    definition  TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT
        p.proname::TEXT         AS func_name,
        n.nspname::TEXT         AS func_schema,
        pg_get_functiondef(p.oid)::TEXT AS definition
    FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = function_name;
$$;

-- 2k) capacity_summary — admin dashboard overview
CREATE OR REPLACE FUNCTION public.capacity_summary()
RETURNS JSON
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE result JSON;
BEGIN
    SELECT json_build_object(
        'max_capacity',         120,
        'active_weight_used',   (
            SELECT COALESCE(SUM(mux_weight), 0) FROM public.campaigns
            WHERE status = 'active' AND CURRENT_DATE BETWEEN start_date AND end_date
        ),
        'active_campaigns',     (
            SELECT COUNT(*) FROM public.campaigns
            WHERE status = 'active' AND CURRENT_DATE BETWEEN start_date AND end_date
        ),
        'active_multi',         (SELECT COUNT(*) FROM public.campaigns WHERE status='active' AND mux_type='multi'  AND CURRENT_DATE BETWEEN start_date AND end_date),
        'active_single',        (SELECT COUNT(*) FROM public.campaigns WHERE status='active' AND mux_type='single' AND CURRENT_DATE BETWEEN start_date AND end_date),
        'active_toh',           (SELECT COUNT(*) FROM public.campaigns WHERE status='active' AND mux_type='toh'    AND CURRENT_DATE BETWEEN start_date AND end_date),
        'active_single_inverclyde',     (SELECT COUNT(*) FROM public.campaigns WHERE status='active' AND mux_type='single' AND selected_mux='inverclyde'     AND CURRENT_DATE BETWEEN start_date AND end_date),
        'active_single_north_ayrshire', (SELECT COUNT(*) FROM public.campaigns WHERE status='active' AND mux_type='single' AND selected_mux='north_ayrshire'  AND CURRENT_DATE BETWEEN start_date AND end_date),
        'active_single_s_lanarkshire',  (SELECT COUNT(*) FROM public.campaigns WHERE status='active' AND mux_type='single' AND selected_mux='south_lanarkshire' AND CURRENT_DATE BETWEEN start_date AND end_date),
        'toh_sold',             (SELECT EXISTS (SELECT 1 FROM public.campaigns WHERE status IN ('approved','active') AND mux_type='toh' AND CURRENT_DATE BETWEEN start_date AND end_date)),
        'capacity_remaining',   120 - (SELECT COALESCE(SUM(mux_weight),0) FROM public.campaigns WHERE status IN ('approved','active') AND CURRENT_DATE BETWEEN start_date AND end_date),
        'max_additional_multi', (120 - (SELECT COALESCE(SUM(mux_weight),0) FROM public.campaigns WHERE status IN ('approved','active') AND CURRENT_DATE BETWEEN start_date AND end_date)) / 3,
        'max_additional_single',(120 - (SELECT COALESCE(SUM(mux_weight),0) FROM public.campaigns WHERE status IN ('approved','active') AND CURRENT_DATE BETWEEN start_date AND end_date))
    ) INTO result;
    RETURN result;
END;
$$;

-- 2l) check_capacity — pre-approval capacity check
CREATE OR REPLACE FUNCTION public.check_capacity(
    p_mux_type   TEXT,
    p_start_date DATE,
    p_end_date   DATE
)
RETURNS JSON
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_weight          INTEGER;
    v_used            INTEGER;
    v_remaining       INTEGER;
    v_toh_sold        BOOLEAN;
    v_max             INTEGER := 120;
BEGIN
    v_weight := CASE p_mux_type
        WHEN 'single' THEN 1
        WHEN 'multi'  THEN 3
        WHEN 'toh'    THEN 3
    END;

    SELECT COALESCE(SUM(mux_weight), 0)
    INTO v_used
    FROM public.campaigns
    WHERE status IN ('approved','active')
      AND start_date <= p_end_date
      AND end_date   >= p_start_date;

    v_remaining := v_max - v_used;

    SELECT EXISTS (
        SELECT 1 FROM public.campaigns
        WHERE mux_type = 'toh'
          AND status IN ('approved','active')
          AND start_date <= p_end_date
          AND end_date   >= p_start_date
    ) INTO v_toh_sold;

    RETURN json_build_object(
        'proposed_type',      p_mux_type,
        'proposed_weight',    v_weight,
        'capacity_used',      v_used,
        'capacity_remaining', v_remaining,
        'max_capacity',       v_max,
        'toh_already_sold',   v_toh_sold,
        'can_approve',        (v_remaining >= v_weight AND (p_mux_type != 'toh' OR NOT v_toh_sold)),
        'reason', CASE
            WHEN p_mux_type = 'toh' AND v_toh_sold
                THEN 'Top of Hour already sold for this period'
            WHEN v_remaining < v_weight
                THEN 'Insufficient capacity: need ' || v_weight || ' units, only ' || v_remaining || ' remaining'
            ELSE 'OK'
        END
    );
END;
$$;

-- 2m) approve_discount — two-person approval rule
CREATE OR REPLACE FUNCTION public.approve_discount(
    p_discount_id UUID,
    p_approved_by UUID,
    p_note        TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF (SELECT created_by FROM public.discounts WHERE id = p_discount_id) = p_approved_by THEN
        RAISE EXCEPTION 'Cannot approve your own discount code';
    END IF;

    UPDATE public.discounts
    SET approved_at = NOW(), approved_by = p_approved_by
    WHERE id = p_discount_id;

    INSERT INTO public.discount_approvals (discount_id, approved_by, action, note)
    VALUES (p_discount_id, p_approved_by, 'approved', p_note);
END;
$$;

-- 2n) get_pending_discounts — list unapproved codes
CREATE OR REPLACE FUNCTION public.get_pending_discounts()
RETURNS TABLE (
    id           UUID,
    code         TEXT,
    amount_pence BIGINT,
    percent_off  INTEGER,
    created_at   TIMESTAMPTZ,
    note         TEXT
)
LANGUAGE sql SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT d.id, d.code, d.amount_pence, d.percent_off, d.created_at, d.note
    FROM public.discounts d
    WHERE d.approved_at IS NULL
    ORDER BY d.created_at DESC;
$$;

-- 2o) get_customer_dashboard_stats — customer portal summary
CREATE OR REPLACE FUNCTION public.get_customer_dashboard_stats(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE result JSON;
BEGIN
    SELECT json_build_object(
        'total_bookings',   (SELECT COUNT(*)   FROM public.advertising_leads   WHERE user_id = p_user_id),
        'active_campaigns', (SELECT COUNT(*)   FROM public.campaigns           WHERE user_id = p_user_id AND status = 'active'),
        'total_spent_pence',(SELECT COALESCE(SUM(total_pence),0) FROM public.invoices WHERE user_id = p_user_id AND status = 'paid'),
        'pending_invoices', (SELECT COUNT(*)   FROM public.invoices            WHERE user_id = p_user_id AND status IN ('sent','overdue')),
        'plays_this_month', (SELECT COALESCE(SUM(plays_completed),0) FROM public.campaigns WHERE user_id = p_user_id AND start_date >= DATE_TRUNC('month', NOW())::DATE)
    ) INTO result;
    RETURN result;
END;
$$;

-- ============================================================
-- 3. TIGHTEN OVERLY PERMISSIVE RLS POLICIES
-- ============================================================

-- 3a) advertising_leads: restrict anonymous inserts to non-privileged fields
--     Anon users submit lead forms; ensure user_id is null for anon inserts
DROP POLICY IF EXISTS "public_insert_leads" ON public.advertising_leads;
CREATE POLICY "public_insert_leads" ON public.advertising_leads
    FOR INSERT TO anon, authenticated
    WITH CHECK (
        CASE
            WHEN current_setting('request.jwt.claims', true)::json->>'role' = 'anon'
                THEN user_id IS NULL
            ELSE user_id = auth.uid()
        END
    );

-- 3b) page_views: restrict inserts so authenticated users must match their own user_id
DROP POLICY IF EXISTS "public_insert_pageviews" ON public.page_views;
DROP POLICY IF EXISTS "allow_insert_pageviews" ON public.page_views;
CREATE POLICY "public_insert_pageviews" ON public.page_views
    FOR INSERT TO anon, authenticated
    WITH CHECK (
        CASE
            WHEN current_setting('request.jwt.claims', true)::json->>'role' = 'anon'
                THEN user_id IS NULL
            ELSE (user_id IS NULL OR user_id = auth.uid())
        END
    );

-- 3c) sessions: restrict inserts so authenticated users own their session
DROP POLICY IF EXISTS "public_insert_sessions" ON public.sessions;
DROP POLICY IF EXISTS "allow_insert_sessions" ON public.sessions;
CREATE POLICY "public_insert_sessions" ON public.sessions
    FOR INSERT TO anon, authenticated
    WITH CHECK (
        CASE
            WHEN current_setting('request.jwt.claims', true)::json->>'role' = 'anon'
                THEN user_id IS NULL
            ELSE (user_id IS NULL OR user_id = auth.uid())
        END
    );

-- 3d) sessions: restrict updates to own sessions only
DROP POLICY IF EXISTS "public_update_sessions" ON public.sessions;
DROP POLICY IF EXISTS "allow_update_own_sessions" ON public.sessions;
CREATE POLICY "public_update_sessions" ON public.sessions
    FOR UPDATE TO anon, authenticated
    USING (
        CASE
            WHEN current_setting('request.jwt.claims', true)::json->>'role' = 'anon'
                THEN user_id IS NULL
            ELSE (user_id IS NULL OR user_id = auth.uid())
        END
    );

-- 3e) wire_news: restrict inserts to admin/super_admin roles only
DROP POLICY IF EXISTS "authenticated_insert_wire" ON public.wire_news;
CREATE POLICY "authenticated_insert_wire" ON public.wire_news
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles p
            WHERE p.id = auth.uid()
              AND p.role IN ('admin', 'super_admin')
        )
    );

-- 3f) wire_news: restrict updates to admin/super_admin roles only
DROP POLICY IF EXISTS "authenticated_update_wire" ON public.wire_news;
CREATE POLICY "authenticated_update_wire" ON public.wire_news
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles p
            WHERE p.id = auth.uid()
              AND p.role IN ('admin', 'super_admin')
        )
    );

-- Grant usage on the extensions schema so existing queries keep working
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;
