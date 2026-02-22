-- Migration: 010_database_security_fixes
-- Description: Fix Supabase database linter security warnings
-- - Function search_path mutable (15 functions)
-- - Extensions in public schema (vector, pg_trgm, unaccent)
-- - RLS policies with overly permissive WITH CHECK (true) / USING (true)
-- Date: 2026-02-22

-- ============================================================
-- 1. MOVE EXTENSIONS FROM PUBLIC TO EXTENSIONS SCHEMA
-- https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public
-- ============================================================
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move extensions (only if they exist in public)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension e JOIN pg_namespace n ON e.extnamespace = n.oid WHERE e.extname = 'vector' AND n.nspname = 'public') THEN
        ALTER EXTENSION vector SET SCHEMA extensions;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_extension e JOIN pg_namespace n ON e.extnamespace = n.oid WHERE e.extname = 'pg_trgm' AND n.nspname = 'public') THEN
        ALTER EXTENSION pg_trgm SET SCHEMA extensions;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_extension e JOIN pg_namespace n ON e.extnamespace = n.oid WHERE e.extname = 'unaccent' AND n.nspname = 'public') THEN
        ALTER EXTENSION unaccent SET SCHEMA extensions;
    END IF;
END $$;

-- ============================================================
-- 2. FIX FUNCTION SEARCH_PATH (SET search_path = 'public')
-- https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
-- ============================================================

-- search_wire_news
CREATE OR REPLACE FUNCTION public.search_wire_news(query TEXT)
RETURNS TABLE (id UUID, title TEXT, summary TEXT, genre TEXT, rank REAL)
LANGUAGE sql STABLE
SET search_path = 'public'
AS $$
    SELECT id, title, summary, genre,
        ts_rank(search_vector, plainto_tsquery('english', query))::real AS rank
    FROM wire_news
    WHERE is_live = TRUE
      AND search_vector @@ plainto_tsquery('english', query)
    ORDER BY rank DESC
    LIMIT 20;
$$;

-- get_capacity_used
CREATE OR REPLACE FUNCTION public.get_capacity_used(
    p_start_date DATE DEFAULT CURRENT_DATE,
    p_end_date   DATE DEFAULT CURRENT_DATE + 28
)
RETURNS TABLE (
    mux_type            TEXT,
    campaign_count      BIGINT,
    capacity_units_used  BIGINT,
    capacity_remaining   INTEGER
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
    WITH active AS (
        SELECT mux_type, COUNT(*)::bigint AS campaign_count, SUM(mux_weight)::bigint AS weight_used
        FROM campaigns
        WHERE status IN ('approved','active')
          AND start_date <= p_end_date AND end_date >= p_start_date
        GROUP BY mux_type
    ),
    totals AS (SELECT SUM(weight_used) AS total_weight_used FROM active)
    SELECT a.mux_type, a.campaign_count, a.weight_used AS capacity_units_used,
           120 - t.total_weight_used::integer AS capacity_remaining
    FROM active a, totals t
    ORDER BY a.mux_type;
$$;

-- match_advertisers (uses vector type - search_path includes extensions if moved)
CREATE OR REPLACE FUNCTION public.match_advertisers(
    query_embedding vector(128),
    match_threshold FLOAT DEFAULT 0.7,
    match_count     INT  DEFAULT 5
)
RETURNS TABLE (id UUID, company TEXT, similarity FLOAT)
LANGUAGE sql STABLE
SET search_path = 'public', 'extensions'
AS $$
    SELECT p.id, p.company_name,
        1 - (p.embedding <=> query_embedding)::float AS similarity
    FROM user_profiles p
    WHERE p.embedding IS NOT NULL
      AND 1 - (p.embedding <=> query_embedding) > match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
$$;

-- purge_old_wire_news
CREATE OR REPLACE FUNCTION public.purge_old_wire_news()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    DELETE FROM wire_news WHERE created_at < NOW() - INTERVAL '30 days';
    RETURN NULL;
END;
$$;

-- validate_discount (approved_at check; ROCKSCOT schema adds expires_at, max_uses via app logic)
CREATE OR REPLACE FUNCTION public.validate_discount(p_code TEXT)
RETURNS TABLE (id UUID, code TEXT, amount_pence BIGINT, percent_off NUMERIC, is_valid BOOLEAN)
LANGUAGE sql SECURITY DEFINER
SET search_path = 'public'
AS $$
    SELECT d.id, d.code, d.amount_pence, d.percent_off,
        (d.approved_at IS NOT NULL) AS is_valid
    FROM discounts d
    WHERE UPPER(d.code) = UPPER(p_code);
$$;

-- create_discount_code
CREATE OR REPLACE FUNCTION public.create_discount_code(
    p_code TEXT, p_amount_pence BIGINT DEFAULT NULL, p_percent_off INTEGER DEFAULT NULL,
    p_created_by UUID DEFAULT NULL, p_note TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE v_id UUID;
BEGIN
    INSERT INTO discounts (code, amount_pence, percent_off, created_by, note)
    VALUES (UPPER(p_code), p_amount_pence, p_percent_off, p_created_by, p_note)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

-- generate_invoice_number (format: INV-YY-NNNNN)
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE yr TEXT; nxt INTEGER;
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        yr := TO_CHAR(CURRENT_DATE, 'YY');
        SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 8) AS INTEGER)), 0) + 1 INTO nxt
        FROM invoices WHERE invoice_number LIKE 'INV-' || yr || '%';
        NEW.invoice_number := 'INV-' || yr || '-' || LPAD(nxt::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$;

-- log_activity
CREATE OR REPLACE FUNCTION public.log_activity(
    p_action TEXT, p_entity_type TEXT DEFAULT NULL, p_entity_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT NULL, p_metadata JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    INSERT INTO activity_log (user_id, action, entity_type, entity_id, description, metadata)
    VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_description, p_metadata);
END;
$$;

-- capacity_summary
CREATE OR REPLACE FUNCTION public.capacity_summary()
RETURNS JSON
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE result JSON;
BEGIN
    SELECT json_build_object(
        'max_capacity', 120,
        'active_weight_used', (SELECT COALESCE(SUM(mux_weight), 0) FROM campaigns WHERE status = 'active' AND CURRENT_DATE BETWEEN start_date AND end_date),
        'active_campaigns', (SELECT COUNT(*) FROM campaigns WHERE status = 'active' AND CURRENT_DATE BETWEEN start_date AND end_date),
        'active_multi', (SELECT COUNT(*) FROM campaigns WHERE status='active' AND mux_type='multi' AND CURRENT_DATE BETWEEN start_date AND end_date),
        'active_single', (SELECT COUNT(*) FROM campaigns WHERE status='active' AND mux_type='single' AND CURRENT_DATE BETWEEN start_date AND end_date),
        'active_toh', (SELECT COUNT(*) FROM campaigns WHERE status='active' AND mux_type='toh' AND CURRENT_DATE BETWEEN start_date AND end_date),
        'toh_sold', (SELECT EXISTS (SELECT 1 FROM campaigns WHERE status IN ('approved','active') AND mux_type='toh' AND CURRENT_DATE BETWEEN start_date AND end_date)),
        'capacity_remaining', 120 - (SELECT COALESCE(SUM(mux_weight),0) FROM campaigns WHERE status IN ('approved','active') AND CURRENT_DATE BETWEEN start_date AND end_date),
        'max_additional_multi', (120 - (SELECT COALESCE(SUM(mux_weight),0) FROM campaigns WHERE status IN ('approved','active') AND CURRENT_DATE BETWEEN start_date AND end_date)) / 3,
        'max_additional_single', (120 - (SELECT COALESCE(SUM(mux_weight),0) FROM campaigns WHERE status IN ('approved','active') AND CURRENT_DATE BETWEEN start_date AND end_date))
    ) INTO result;
    RETURN result;
END;
$$;

-- check_capacity
CREATE OR REPLACE FUNCTION public.check_capacity(p_mux_type TEXT, p_start_date DATE, p_end_date DATE)
RETURNS JSON
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE v_weight INT; v_used INT; v_remaining INT; v_toh_sold BOOLEAN; v_max INT := 120;
BEGIN
    v_weight := CASE p_mux_type WHEN 'single' THEN 1 WHEN 'multi' THEN 3 WHEN 'toh' THEN 3 END;
    SELECT COALESCE(SUM(mux_weight), 0) INTO v_used FROM campaigns
    WHERE status IN ('approved','active') AND start_date <= p_end_date AND end_date >= p_start_date;
    v_remaining := v_max - v_used;
    SELECT EXISTS (SELECT 1 FROM campaigns WHERE mux_type='toh' AND status IN ('approved','active') AND start_date <= p_end_date AND end_date >= p_start_date) INTO v_toh_sold;
    RETURN json_build_object('proposed_type', p_mux_type, 'proposed_weight', v_weight, 'capacity_used', v_used, 'capacity_remaining', v_remaining, 'max_capacity', v_max,
        'toh_already_sold', v_toh_sold, 'can_approve', (v_remaining >= v_weight AND (p_mux_type != 'toh' OR NOT v_toh_sold)),
        'reason', CASE WHEN p_mux_type = 'toh' AND v_toh_sold THEN 'Top of Hour already sold for this period'
            WHEN v_remaining < v_weight THEN 'Insufficient capacity: need ' || v_weight || ' units, only ' || v_remaining || ' remaining' ELSE 'OK' END);
END;
$$;

-- approve_discount (supports both 001 and ROCKSCOT discount_approvals schema)
CREATE OR REPLACE FUNCTION public.approve_discount(p_discount_id UUID, p_approved_by UUID, p_note TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    UPDATE discounts SET approved_by = p_approved_by, approved_at = now(), note = COALESCE(note, '') || COALESCE(p_note, '')
    WHERE id = p_discount_id;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='discount_approvals' AND column_name='action') THEN
        INSERT INTO discount_approvals(discount_id, approved_by, action, note)
        VALUES (p_discount_id, p_approved_by, 'approved', p_note);
    ELSE
        INSERT INTO discount_approvals(discount_id, approved_by, approved_at, note)
        VALUES (p_discount_id, p_approved_by, now(), p_note);
    END IF;
END;
$$;

-- get_pending_discounts
CREATE OR REPLACE FUNCTION public.get_pending_discounts()
RETURNS TABLE (id UUID, code TEXT, amount_pence BIGINT, percent_off NUMERIC, created_at TIMESTAMPTZ, note TEXT)
LANGUAGE sql SECURITY DEFINER
SET search_path = 'public'
AS $$
    SELECT d.id, d.code, d.amount_pence, d.percent_off, d.created_at, d.note
    FROM discounts d WHERE d.approved_at IS NULL ORDER BY d.created_at DESC;
$$;

-- get_customer_dashboard_stats
CREATE OR REPLACE FUNCTION public.get_customer_dashboard_stats(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE result JSON;
BEGIN
    SELECT json_build_object(
        'total_bookings', (SELECT COUNT(*) FROM advertising_leads WHERE user_id = p_user_id),
        'active_campaigns', (SELECT COUNT(*) FROM campaigns WHERE user_id = p_user_id AND status = 'active'),
        'total_spent_pence', (SELECT COALESCE(SUM(total_pence), 0) FROM invoices WHERE user_id = p_user_id AND status = 'paid'),
        'pending_invoices', (SELECT COUNT(*) FROM invoices WHERE user_id = p_user_id AND status IN ('sent','overdue')),
        'last_booking', (SELECT created_at FROM advertising_leads WHERE user_id = p_user_id ORDER BY created_at DESC LIMIT 1)
    ) INTO result;
    RETURN result;
END;
$$;

-- create_discount (from 003)
CREATE OR REPLACE FUNCTION public.create_discount(
    p_code text, p_amount_pence bigint DEFAULT NULL, p_percent_off numeric DEFAULT NULL,
    p_created_by uuid, p_note text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE v_id uuid := gen_random_uuid();
BEGIN
    INSERT INTO discounts(id, code, amount_pence, percent_off, created_by, note)
    VALUES (v_id, p_code, p_amount_pence, p_percent_off, p_created_by, p_note);
    RETURN v_id;
END;
$$;

-- list_pending_discounts (from 003)
CREATE OR REPLACE FUNCTION public.list_pending_discounts()
RETURNS SETOF discounts
LANGUAGE sql SECURITY DEFINER
SET search_path = 'public'
AS $$
    SELECT * FROM discounts WHERE approved_at IS NULL;
$$;

-- ============================================================
-- 3. FIX RLS POLICIES (replace permissive WITH CHECK (true))
-- https://supabase.com/docs/guides/database/database-linter?lint=0024_permissive_rls_policy
-- ============================================================

-- advertising_leads: public_insert_leads - require valid lead data
DROP POLICY IF EXISTS "public_insert_leads" ON public.advertising_leads;
CREATE POLICY "public_insert_leads" ON public.advertising_leads
    FOR INSERT TO anon, authenticated
    WITH CHECK (
        email IS NOT NULL AND length(trim(email)) > 0
        AND first_name IS NOT NULL AND length(trim(first_name)) > 0
        AND last_name IS NOT NULL AND length(trim(last_name)) > 0
        AND product_id IS NOT NULL AND length(trim(product_id)) > 0
    );

-- page_views: public_insert_pageviews - require valid page_path
DROP POLICY IF EXISTS "public_insert_pageviews" ON public.page_views;
CREATE POLICY "public_insert_pageviews" ON public.page_views
    FOR INSERT TO anon, authenticated
    WITH CHECK (page_path IS NOT NULL AND length(trim(page_path)) > 0);

-- sessions: public_insert_sessions - require valid session structure
DROP POLICY IF EXISTS "public_insert_sessions" ON public.sessions;
CREATE POLICY "public_insert_sessions" ON public.sessions
    FOR INSERT TO anon, authenticated
    WITH CHECK (started_at IS NOT NULL);

-- sessions: public_update_sessions - restrict to own sessions (anon: user_id IS NULL, auth: user_id = auth.uid())
DROP POLICY IF EXISTS "public_update_sessions" ON public.sessions;
CREATE POLICY "public_update_sessions" ON public.sessions
    FOR UPDATE TO anon, authenticated
    USING ((user_id IS NULL AND auth.uid() IS NULL) OR (user_id = auth.uid()))
    WITH CHECK ((user_id IS NULL AND auth.uid() IS NULL) OR (user_id = auth.uid()));

-- wire_news: authenticated_insert_wire, authenticated_update_wire - restrict to admins only
DROP POLICY IF EXISTS "authenticated_insert_wire" ON public.wire_news;
CREATE POLICY "authenticated_insert_wire" ON public.wire_news
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

DROP POLICY IF EXISTS "authenticated_update_wire" ON public.wire_news;
CREATE POLICY "authenticated_update_wire" ON public.wire_news
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')))
    WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Handle alternate policy names from migration 005 (allow_insert_pageviews, allow_insert_sessions, allow_update_own_sessions)
DROP POLICY IF EXISTS "allow_insert_pageviews" ON public.page_views;
DROP POLICY IF EXISTS "allow_insert_sessions" ON public.sessions;
DROP POLICY IF EXISTS "allow_update_own_sessions" ON public.sessions;
DROP POLICY IF EXISTS "allow_authenticated_insert_wire" ON public.wire_news;
